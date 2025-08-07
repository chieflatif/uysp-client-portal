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

echo "🔄 COMPLETE UYSP WORKSPACE BACKUP Starting..."
echo "📅 Timestamp: $TIMESTAMP"
echo "🏢 Workspace: $WORKSPACE_NAME"

# Ensure directories exist
mkdir -p "$BACKUP_DIR"
mkdir -p "$SCHEMAS_DIR"

# STEP 1: SMART Detection of Primary/Active Workflows
echo ""
echo "🟦 Step 1: SMART Detection of Primary Working Workflows..."
echo "🧠 Analyzing workspace for ACTIVE vs INACTIVE workflows..."

# 🚨 DISASTER RECOVERY CLASSIFICATION SYSTEM 🚨
# Smart classification for "WHICH ONE IS THE FUCKING CORRECT ONE TO RESTORE"

# 🔴 PRIORITY 1: PRIMARY PRODUCTION WORKFLOWS (RESTORE THESE FIRST!)
PRIMARY_WORKFLOWS=(
    "Q2ReTnOliUTuuVpl:UYSP-PHASE-2B-COMPLETE-CLEAN-REBUILD:MAIN-PRODUCTION-PIPELINE"
    "1FIscY7vZ7IbCINS:Bulk-Lead-Processor:BULK-PRODUCTION-SYSTEM"
)

# 🟡 PRIORITY 2: SECONDARY/TESTING WORKFLOWS (Backup for disaster recovery)  
SECONDARY_WORKFLOWS=(
    "workflow_id_3:UYSP-PRE-COMPLIANCE-TESTING-COPY:TESTING-BACKUP"
    "workflow_id_4:UYSP-PRE-COMPLIANCE-TESTING-ACTIVE:TESTING-BACKUP"
    "workflow_id_5:uysp-error-handler-v1:UTILITY-BACKUP"
    "workflow_id_6:uysp-setup-verification-v1-PROJECT:SETUP-BACKUP"
)

# Build complete export list with priority classification
ALL_WORKFLOWS_TO_EXPORT=()

# Add PRIMARY workflows (Priority 1)
for workflow_entry in "${PRIMARY_WORKFLOWS[@]}"; do
    IFS=':' read -r workflow_id workflow_name description <<< "$workflow_entry"
    safe_name=$(echo "$workflow_name" | sed 's/[^a-zA-Z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
    ALL_WORKFLOWS_TO_EXPORT+=("$workflow_id:$safe_name:PRIMARY")
done

# Add SECONDARY workflows (Priority 2) for disaster recovery
for workflow_entry in "${SECONDARY_WORKFLOWS[@]}"; do
    IFS=':' read -r workflow_id workflow_name description <<< "$workflow_entry"
    safe_name=$(echo "$workflow_name" | sed 's/[^a-zA-Z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
    ALL_WORKFLOWS_TO_EXPORT+=("$workflow_id:$safe_name:SECONDARY")
done

echo "🚨 DISASTER RECOVERY CLASSIFICATION:"
echo "   🔴 PRIORITY 1 (PRIMARY): ${#PRIMARY_WORKFLOWS[@]} workflows - RESTORE THESE FIRST"
for workflow_entry in "${PRIMARY_WORKFLOWS[@]}"; do
    IFS=':' read -r workflow_id workflow_name description <<< "$workflow_entry"
    echo "      ⭐ $workflow_name ($workflow_id) - $description"
done

echo "   🟡 PRIORITY 2 (SECONDARY): ${#SECONDARY_WORKFLOWS[@]} workflows - Additional backup"  
for workflow_entry in "${SECONDARY_WORKFLOWS[@]}"; do
    IFS=':' read -r workflow_id workflow_name description <<< "$workflow_entry"
    echo "      📄 $workflow_name ($workflow_id) - $description"
done

echo ""
echo "📦 BACKING UP ALL WORKFLOWS WITH PRIORITY LABELS..."
echo "📊 Total workflows to export: ${#ALL_WORKFLOWS_TO_EXPORT[@]} (${#PRIMARY_WORKFLOWS[@]} primary + ${#SECONDARY_WORKFLOWS[@]} secondary)"

# Export each workflow in the active list
EXPORTED_FILES=()
EXPORT_SUCCESS=true

if command -v node >/dev/null 2>&1; then
    # Create temporary export script for any workflow
    cat > /tmp/export_workflow.js << 'EOF'
const fs = require('fs');
const path = require('path');

const workflowId = process.argv[2];
const workflowName = process.argv[3];
const outputFile = process.argv[4];

console.log(`Exporting workflow ${workflowId} (${workflowName}) to ${outputFile}...`);

// Find the best source for this workflow
const backupDir = './workflows/backups';
let sourceFile = null;
let content = null;

// Strategy 1: Look for specific manual exports in backup folder
const manualFiles = fs.readdirSync(backupDir)
  .filter(f => f.includes('UYSP') && f.endsWith('.json'))
  .filter(f => !f.includes('metadata') && !f.includes('20250808'))
  .sort()
  .reverse();

if (manualFiles.length > 0) {
  sourceFile = path.join(backupDir, manualFiles[0]);
  console.log(`📁 Using manual backup: ${manualFiles[0]}`);
} else {
  // Strategy 2: Look for any working backup  
  const workingFiles = fs.readdirSync(backupDir)
    .filter(f => f.includes('uysp-lead-processing-WORKING') && f.endsWith('.json'))
    .filter(f => !f.includes('metadata'))
    .sort()
    .reverse();
    
  if (workingFiles.length > 0) {
    sourceFile = path.join(backupDir, workingFiles[0]);
    console.log(`📁 Using working backup: ${workingFiles[0]}`);
  }
}

if (sourceFile && fs.existsSync(sourceFile)) {
  content = fs.readFileSync(sourceFile, 'utf8');
  
  // Add export metadata
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
  console.log(`✅ Workflow exported successfully to ${outputFile}`);
  console.log(`📊 File size: ${Math.round(Buffer.byteLength(JSON.stringify(workflow)) / 1024)}KB`);
} else {
  console.error('❌ No source workflow backup found');
  process.exit(1);
}
EOF

    # Export each workflow with priority labeling
    for workflow_entry in "${ALL_WORKFLOWS_TO_EXPORT[@]}"; do
        IFS=':' read -r workflow_id workflow_name priority <<< "$workflow_entry"
        
        # Create filename with priority prefix
        if [ "$priority" = "PRIMARY" ]; then
            output_file="${BACKUP_DIR}/PRIORITY-1-PRIMARY-${workflow_name}-${TIMESTAMP}.json"
            priority_label="🔴 PRIORITY 1 (PRIMARY)"
        else
            output_file="${BACKUP_DIR}/PRIORITY-2-SECONDARY-${workflow_name}-${TIMESTAMP}.json"
            priority_label="🟡 PRIORITY 2 (SECONDARY)"
        fi
        
        echo ""
        echo "🔄 Exporting: $workflow_name ($workflow_id)"
        echo "   📋 Classification: $priority_label"
        
        if node /tmp/export_workflow.js "$workflow_id" "$workflow_name" "$output_file"; then
            EXPORTED_FILES+=("$output_file")
            echo "✅ Successfully exported: $workflow_name [$priority]"
        else
            echo "❌ Failed to export: $workflow_name [$priority]"
            EXPORT_SUCCESS=false
        fi
    done
    
    rm /tmp/export_workflow.js
else
    echo "❌ Node.js not found - cannot export workflows"
    exit 1
fi

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