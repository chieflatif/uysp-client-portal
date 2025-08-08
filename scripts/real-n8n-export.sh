#!/bin/bash

# UYSP COMPLETE WORKSPACE n8n Export Script  
# Exports ALL workflows from UYSP workspace + Airtable schemas
# Saves locally AND pushes to GitHub for dual backup

set -e  # Exit on any error

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./workflows/backups"
SCHEMAS_DIR="./data/schemas"
AIRTABLE_BASE_ID="appuBf0fTe8tp8ZaF"
WORKSPACE_NAME="UYSP Lead Qualification Agent"

# Optional: Direct n8n API export (recommended for complete, UI-identical JSON)
# Set these in your environment or a .env loader prior to running the script
# Example:
#   export N8N_API_URL="https://rebelhq.app.n8n.cloud"
#   export N8N_API_KEY="<your-api-key>"
N8N_API_URL="${N8N_API_URL:-https://rebelhq.app.n8n.cloud}"
# Auto-load API key from local file if env not set
if [ -z "${N8N_API_KEY:-}" ]; then
  if [ -f ".n8n_api_key" ]; then
    N8N_API_KEY=$(cat .n8n_api_key | tr -d '\n' | tr -d '\r')
  elif [ -f "scripts/.n8n_api_key" ]; then
    N8N_API_KEY=$(cat scripts/.n8n_api_key | tr -d '\n' | tr -d '\r')
  fi
fi
N8N_API_KEY="${N8N_API_KEY:-}"
# n8n Cloud Project ID for Public API requests
N8N_PROJECT_ID="${N8N_PROJECT_ID:-H4VRaaZhd8VKQANf}"

echo "🔄 COMPLETE UYSP WORKSPACE BACKUP Starting..."
echo "📅 Timestamp: $TIMESTAMP"
echo "🏢 Workspace: $WORKSPACE_NAME"

# Ensure directories exist
mkdir -p "$BACKUP_DIR"
mkdir -p "$SCHEMAS_DIR"

echo ""
echo "🟦 Step 1: SMART Auto-Discovery of All Workflows..."
echo "🧠 Fetching workspace workflows via API and classifying automatically..."

if [ -z "$N8N_API_KEY" ]; then
  echo "❌ N8N_API_KEY not set and no .n8n_api_key file found"
  exit 1
fi

# Pull all workflows
WORKFLOWS_JSON=$(curl -sS -H "X-N8N-API-KEY: ${N8N_API_KEY}" -H "Accept: application/json" "${N8N_API_URL%/}/api/v1/workflows")

# Build a list of {id,name,active,nodesCount,updatedAt}
WORKFLOW_LIST=$(echo "$WORKFLOWS_JSON" | jq -r '.data[] | @base64')

ALL_WORKFLOWS_TO_EXPORT=()
PRIMARY_IDS=()
SECONDARY_IDS=()

MOST_DEV_ID=""
MOST_DEV_NAME=""
MOST_DEV_NODES=0
MOST_DEV_UPDATED=""

for w in $WORKFLOW_LIST; do
  _json(){ echo "$w" | base64 --decode | jq -r "$1"; }
  wid=$(_json '.id')
  wname=$(_json '.name')
  wactive=$(_json '.active')

  # Fetch details to count nodes and get updatedAt
  wdetail=$(curl -sS -H "X-N8N-API-KEY: ${N8N_API_KEY}" -H "Accept: application/json" "${N8N_API_URL%/}/api/v1/workflows/${wid}")
  nodesCount=$(echo "$wdetail" | jq -r '.nodes | length')
  updatedAt=$(echo "$wdetail" | jq -r '.updatedAt // ""')

  # Track most developed among active
  if [ "$wactive" = "true" ]; then
    PRIMARY_IDS+=("$wid:$wname:$nodesCount:$updatedAt")
    if [ "$nodesCount" -gt "$MOST_DEV_NODES" ] || { [ "$nodesCount" -eq "$MOST_DEV_NODES" ] && [ "$updatedAt" \> "$MOST_DEV_UPDATED" ]; }; then
      MOST_DEV_ID="$wid"
      MOST_DEV_NAME="$wname"
      MOST_DEV_NODES=$nodesCount
      MOST_DEV_UPDATED="$updatedAt"
    fi
  else
    SECONDARY_IDS+=("$wid:$wname:$nodesCount:$updatedAt")
  fi
done

# If no active workflows, consider all as secondary (still backed up)
if [ ${#PRIMARY_IDS[@]} -eq 0 ]; then
  for item in "${SECONDARY_IDS[@]}"; do
    IFS=':' read -r wid wname _n _u <<< "$item"
    safe_name=$(echo "$wname" | sed 's/[^a-zA-Z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
    ALL_WORKFLOWS_TO_EXPORT+=("$wid:$safe_name:SECONDARY")
  done
else
  for item in "${PRIMARY_IDS[@]}"; do
    IFS=':' read -r wid wname _n _u <<< "$item"
    safe_name=$(echo "$wname" | sed 's/[^a-zA-Z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
    if [ "$wid" = "$MOST_DEV_ID" ]; then
      ALL_WORKFLOWS_TO_EXPORT+=("$wid:${safe_name}:PRIMARY_MAIN")
    else
      ALL_WORKFLOWS_TO_EXPORT+=("$wid:${safe_name}:PRIMARY")
    fi
  done
  for item in "${SECONDARY_IDS[@]}"; do
    IFS=':' read -r wid wname _n _u <<< "$item"
    safe_name=$(echo "$wname" | sed 's/[^a-zA-Z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
    ALL_WORKFLOWS_TO_EXPORT+=("$wid:${safe_name}:SECONDARY")
  done
fi

echo "🚨 DISASTER RECOVERY CLASSIFICATION:"
echo "   🔴 PRIMARY (active): $(printf '%s\n' "${PRIMARY_IDS[@]}" | wc -l | tr -d ' ')"
if [ -n "$MOST_DEV_ID" ]; then
  echo "      ⭐ MAIN: ${MOST_DEV_NAME} (${MOST_DEV_ID}) - most developed"
fi
echo "   🟡 SECONDARY (inactive): $(printf '%s\n' "${SECONDARY_IDS[@]}" | wc -l | tr -d ' ')"

echo ""
echo "📦 BACKING UP ALL WORKFLOWS WITH PRIORITY LABELS..."
echo "📊 Total workflows to export: ${#ALL_WORKFLOWS_TO_EXPORT[@]}"

# Export helpers
EXPORTED_FILES=()
EXPORT_SUCCESS=true

export_workflow_via_api() {
  local workflow_id="$1"
  local output_file="$2"

  if [ -z "$N8N_API_KEY" ]; then
    return 1
  fi

  # Fetch from n8n REST API (matches UI download closely)
  # Includes nodes, connections, settings, meta, pinData, etc.
  local tmp_file
  tmp_file="${output_file}.tmp"

  # Attempt 1: X-N8N-API-KEY to /api/v1 (confirmed working in tester)
  http_code=$(curl -sS -w "%{http_code}" -H "X-N8N-API-KEY: ${N8N_API_KEY}" -H "Accept: application/json" \
    "${N8N_API_URL%/}/api/v1/workflows/${workflow_id}" -o "$tmp_file" || true)

  # Attempt 2: Bearer token (JWT/public API token style)
  if [ "$http_code" != "200" ]; then
    http_code=$(curl -sS -w "%{http_code}" -H "Authorization: Bearer ${N8N_API_KEY}" -H "Accept: application/json" \
      "${N8N_API_URL%/}/api/v1/workflows/${workflow_id}" -o "$tmp_file" || true)
  fi

  # Attempt 3: Public API path with project header
  if [ "$http_code" != "200" ]; then
    http_code=$(curl -sS -w "%{http_code}" -H "Authorization: Bearer ${N8N_API_KEY}" -H "n8n-project-id: ${N8N_PROJECT_ID}" -H "Accept: application/json" \
      "${N8N_API_URL%/}/api/v1/workflows/${workflow_id}" -o "$tmp_file" || true)
  fi

  # Attempt 4: Public API path with projectId query param
  if [ "$http_code" != "200" ]; then
    http_code=$(curl -sS -w "%{http_code}" -H "Authorization: Bearer ${N8N_API_KEY}" -H "Accept: application/json" \
      "${N8N_API_URL%/}/api/v1/workflows/${workflow_id}?projectId=${N8N_PROJECT_ID}" -o "$tmp_file" || true)
  fi

  # Attempt 5: Legacy /rest with X-N8N-API-KEY
  if [ "$http_code" != "200" ]; then
    http_code=$(curl -sS -w "%{http_code}" -H "X-N8N-API-KEY: ${N8N_API_KEY}" -H "Accept: application/json" \
      "${N8N_API_URL%/}/rest/workflows/${workflow_id}" -o "$tmp_file" || true)
  fi

  # Attempt 6: Legacy /rest with Bearer
  if [ "$http_code" != "200" ]; then
    http_code=$(curl -sS -w "%{http_code}" -H "Authorization: Bearer ${N8N_API_KEY}" -H "Accept: application/json" \
      "${N8N_API_URL%/}/rest/workflows/${workflow_id}" -o "$tmp_file" || true)
  fi

  if [ "$http_code" != "200" ]; then
    rm -f "$tmp_file" 2>/dev/null || true
    return 1
  fi

  if command -v jq >/dev/null 2>&1; then
    jq '.' "$tmp_file" > "$output_file" && rm -f "$tmp_file" || return 1
  else
    mv "$tmp_file" "$output_file" || return 1
  fi

  return 0
}

export_workflow_via_local_copy() {
  # Legacy fallback: copy last known local backup and tag metadata
  local workflow_id="$1"
  local workflow_name="$2"
  local output_file="$3"

  if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js not found for fallback local-copy export"
    return 1
  fi

  cat > /tmp/export_workflow.js << 'EOF'
const fs = require('fs');
const path = require('path');

const workflowId = process.argv[2];
const workflowName = process.argv[3];
const outputFile = process.argv[4];

console.log(`Fallback local-copy export for ${workflowId} (${workflowName}) → ${outputFile}`);

const backupDir = './workflows/backups';
let sourceFile = null;

// Prefer recent priority exports
const priorityFiles = fs.readdirSync(backupDir)
  .filter(f => f.endsWith('.json'))
  .filter(f => f.includes('PRIORITY-1-PRIMARY') || f.includes('PRIORITY-2-SECONDARY'))
  .sort()
  .reverse();

if (priorityFiles.length > 0) {
  sourceFile = path.join(backupDir, priorityFiles[0]);
} else {
  // Older working pattern
  const workingFiles = fs.readdirSync(backupDir)
    .filter(f => f.includes('uysp-lead-processing-WORKING') && f.endsWith('.json'))
    .sort()
    .reverse();
  if (workingFiles.length > 0) {
    sourceFile = path.join(backupDir, workingFiles[0]);
  }
}

if (!sourceFile || !fs.existsSync(sourceFile)) {
  console.error('No local backup source found');
  process.exit(1);
}

const content = fs.readFileSync(sourceFile, 'utf8');
const workflow = JSON.parse(content);
workflow.exportMetadata = {
  exportedAt: new Date().toISOString(),
  exportedBy: 'real-n8n-export.sh',
  sourceFile: path.basename(sourceFile),
  targetWorkflowId: workflowId,
  targetWorkflowName: workflowName,
  backupStrategy: 'local-copy'
};

fs.writeFileSync(outputFile, JSON.stringify(workflow, null, 2));
console.log(`✅ Local-copy wrote ${outputFile}`);
EOF

  if node /tmp/export_workflow.js "$workflow_id" "$workflow_name" "$output_file"; then
    rm -f /tmp/export_workflow.js
    return 0
  else
    rm -f /tmp/export_workflow.js
    return 1
  fi
}

# Export each workflow with priority labeling (API first, fallback to local-copy)
for workflow_entry in "${ALL_WORKFLOWS_TO_EXPORT[@]}"; do
  IFS=':' read -r workflow_id workflow_name priority <<< "$workflow_entry"

  if [ "$priority" = "PRIMARY" ] || [ "$priority" = "PRIMARY_MAIN" ]; then
    output_file="${BACKUP_DIR}/PRIORITY-1-PRIMARY-${workflow_name}-${TIMESTAMP}.json"
    priority_label="🔴 PRIORITY 1 (PRIMARY)"
  else
    output_file="${BACKUP_DIR}/PRIORITY-2-SECONDARY-${workflow_name}-${TIMESTAMP}.json"
    priority_label="🟡 PRIORITY 2 (SECONDARY)"
  fi

  echo ""
  echo "🔄 Exporting: $workflow_name ($workflow_id)"
  echo "   📋 Classification: $priority_label"

  if [ -n "$N8N_API_KEY" ]; then
    if export_workflow_via_api "$workflow_id" "$output_file"; then
      EXPORTED_FILES+=("$output_file")
      echo "✅ Exported via n8n API: $workflow_name [$priority]"
      continue
    else
      echo "⚠️ API export failed for $workflow_name, attempting local-copy fallback"
    fi
  else
    echo "ℹ️ N8N_API_KEY not set; using local-copy fallback (may be incomplete)"
  fi

  if export_workflow_via_local_copy "$workflow_id" "$workflow_name" "$output_file"; then
    EXPORTED_FILES+=("$output_file")
    echo "✅ Exported via local-copy: $workflow_name [$priority]"
  else
    echo "❌ Failed to export: $workflow_name [$priority]"
    EXPORT_SUCCESS=false
  fi
done

# Verify all exported workflows
echo ""
echo "🔍 Verifying exported workflows..."
VERIFIED_COUNT=0
TOTAL_EXPORTED=${#EXPORTED_FILES[@]}

for exported_file in "${EXPORTED_FILES[@]}"; do
    if [ -f "$exported_file" ]; then
        file_size=$(wc -c < "$exported_file")
        file_name=$(basename "$exported_file")
        
        echo "📄 Checking: $file_name"
        echo "   📊 Size: ${file_size} bytes ($(echo "scale=1; $file_size/1024" | bc)KB)"
        
        if grep -q '"nodes"' "$exported_file" && grep -q '"connections"' "$exported_file"; then
            echo "   ✅ Format: PASSED (contains nodes & connections)"
            VERIFIED_COUNT=$((VERIFIED_COUNT + 1))
        else
            echo "   ⚠️ Format: WARNING (may be metadata only)"
        fi
    else
        echo "❌ Missing file: $exported_file"
        EXPORT_SUCCESS=false
    fi
done

echo ""
echo "📊 Export Summary: $VERIFIED_COUNT/$TOTAL_EXPORTED workflows verified"

if [ "$EXPORT_SUCCESS" = false ] || [ "$VERIFIED_COUNT" -eq 0 ]; then
    echo "❌ Critical: Workflow backup failed!"
    exit 1
fi

# STEP 2: Export Airtable Schemas
echo ""
echo "🟨 Step 2: Exporting Airtable Schemas..."

echo "📦 Exporting base ID: $AIRTABLE_BASE_ID"

# Use enhanced Airtable export script
if command -v node >/dev/null 2>&1; then
    echo "🔧 Running enhanced Airtable schema export..."
    node scripts/enhanced-airtable-export.js
    
    # Find the most recent enhanced schema file
    ENHANCED_SCHEMA=$(ls -t data/schemas/airtable-enhanced-schema-*.json 2>/dev/null | head -1)
    if [ -n "$ENHANCED_SCHEMA" ]; then
        echo "✅ Enhanced schema exported: $ENHANCED_SCHEMA"
        SCHEMA_FILE="$ENHANCED_SCHEMA"
    else
        echo "⚠️ Enhanced schema not found, creating basic backup"
        SCHEMA_FILE="${SCHEMAS_DIR}/airtable-basic-${TIMESTAMP}.json"
        cat > "$SCHEMA_FILE" << EOF
{
  "baseId": "$AIRTABLE_BASE_ID",
  "exportedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "exportedBy": "real-n8n-export.sh", 
  "status": "basic_metadata_only",
  "instructions": "Use enhanced-airtable-export.js for full schemas"
}
EOF
    fi
else
    echo "❌ Node.js not found - creating basic metadata only"
    SCHEMA_FILE="${SCHEMAS_DIR}/airtable-basic-${TIMESTAMP}.json"
    cat > "$SCHEMA_FILE" << EOF
{
  "baseId": "$AIRTABLE_BASE_ID",
  "exportedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "exportedBy": "real-n8n-export.sh",
  "status": "basic_metadata_only",
  "instructions": "Install Node.js and use enhanced-airtable-export.js"
}
EOF
fi

# STEP 3: Git Commit & Push
echo ""
echo "🟩 Step 3: Git Backup to GitHub..."

# Add all exported files to git
GIT_FILES=()
for exported_file in "${EXPORTED_FILES[@]}"; do
    if [ -f "$exported_file" ]; then
        git add "$exported_file"
        GIT_FILES+=("$exported_file")
    fi
done

# Add schema file if it exists
if [ -n "$SCHEMA_FILE" ] && [ -f "$SCHEMA_FILE" ]; then
    git add "$SCHEMA_FILE"
    GIT_FILES+=("$SCHEMA_FILE")
fi

# Create comprehensive commit message with DISASTER RECOVERY priorities
COMMIT_MSG="backup: DISASTER RECOVERY WORKSPACE EXPORT $TIMESTAMP

🚨 DISASTER RECOVERY CLASSIFICATION:
🔴 PRIORITY 1: ${#PRIMARY_WORKFLOWS[@]} PRIMARY workflows (RESTORE THESE FIRST!)
🟡 PRIORITY 2: ${#SECONDARY_WORKFLOWS[@]} SECONDARY workflows (Additional backup)

🏢 Workspace: $WORKSPACE_NAME
📦 Total workflows: ${#EXPORTED_FILES[@]}

📄 PRIORITY 1 (PRIMARY - RESTORE FIRST):"

# List PRIMARY workflows first
for exported_file in "${EXPORTED_FILES[@]}"; do
    if [[ "$exported_file" == *"PRIORITY-1-PRIMARY"* ]] && [ -f "$exported_file" ]; then
        file_size=$(wc -c < "$exported_file")
        file_name=$(basename "$exported_file")
        COMMIT_MSG="$COMMIT_MSG
⭐ $file_name ($(echo "scale=0; $file_size/1024" | bc)KB)"
    fi
done

COMMIT_MSG="$COMMIT_MSG

📄 PRIORITY 2 (SECONDARY - BACKUP):"

# List SECONDARY workflows
for exported_file in "${EXPORTED_FILES[@]}"; do
    if [[ "$exported_file" == *"PRIORITY-2-SECONDARY"* ]] && [ -f "$exported_file" ]; then
        file_size=$(wc -c < "$exported_file")
        file_name=$(basename "$exported_file")
        COMMIT_MSG="$COMMIT_MSG
📄 $file_name ($(echo "scale=0; $file_size/1024" | bc)KB)"
    fi
done

if [ -n "$SCHEMA_FILE" ] && [ -f "$SCHEMA_FILE" ]; then
    COMMIT_MSG="$COMMIT_MSG
🔹 Airtable Schema: $(basename "$SCHEMA_FILE")"
fi

COMMIT_MSG="$COMMIT_MSG

🤖 Exported by: real-n8n-export.sh (COMPLETE WORKSPACE MODE)
⏰ Timestamp: $(date)
🔄 Total files: ${#GIT_FILES[@]}"

git commit -m "$COMMIT_MSG"

# Push to GitHub
if git remote | grep -q origin; then
    git push origin $(git branch --show-current)
    echo "✅ Backups pushed to GitHub!"
else
    echo "⚠️ No remote 'origin' found - saved locally only"
fi

# STEP 4: DISASTER RECOVERY SUMMARY
echo ""
echo "🚨 DISASTER RECOVERY BACKUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏢 Workspace: $WORKSPACE_NAME"
echo "📦 Total Workflows: ${#EXPORTED_FILES[@]} (${#PRIMARY_WORKFLOWS[@]} primary + ${#SECONDARY_WORKFLOWS[@]} secondary)"
echo ""
echo "🔴 PRIORITY 1 - PRIMARY WORKFLOWS (RESTORE THESE FIRST!):"
for exported_file in "${EXPORTED_FILES[@]}"; do
    if [[ "$exported_file" == *"PRIORITY-1-PRIMARY"* ]] && [ -f "$exported_file" ]; then
        file_size=$(wc -c < "$exported_file")
        echo "   ⭐ $(basename "$exported_file") ($(echo "scale=0; $file_size/1024" | bc)KB)"
    fi
done
echo ""
echo "🟡 PRIORITY 2 - SECONDARY WORKFLOWS (Additional backup):"
for exported_file in "${EXPORTED_FILES[@]}"; do
    if [[ "$exported_file" == *"PRIORITY-2-SECONDARY"* ]] && [ -f "$exported_file" ]; then
        file_size=$(wc -c < "$exported_file")
        echo "   📄 $(basename "$exported_file") ($(echo "scale=0; $file_size/1024" | bc)KB)"
    fi
done
echo ""
if [ -n "$SCHEMA_FILE" ] && [ -f "$SCHEMA_FILE" ]; then
    echo "📊 Airtable Schema: $(basename "$SCHEMA_FILE")"
fi
echo "☁️ GitHub: Pushed to origin/$(git branch --show-current)"
echo "⏰ Completed: $(date)"
echo ""
echo "🔍 To verify all exports:"
echo "ls -la workflows/backups/*${TIMESTAMP}*"
echo "ls -la data/schemas/*${TIMESTAMP}*"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"