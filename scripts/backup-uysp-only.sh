#!/bin/bash

# UYSP Targeted Backup Script - Only UYSP Workflows
# Exports specific workflows we know are part of the UYSP system

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./workflows/backups/uysp-targeted-${TIMESTAMP}"

# Load API key
if [ -f ".n8n_api_key" ]; then
  N8N_API_KEY=$(cat .n8n_api_key | tr -d '\n' | tr -d '\r')
elif [ -f "scripts/.n8n_api_key" ]; then
  N8N_API_KEY=$(cat scripts/.n8n_api_key | tr -d '\n' | tr -d '\r')
fi

if [ -z "$N8N_API_KEY" ]; then
  echo "❌ N8N_API_KEY not found"
  exit 1
fi

N8N_API_URL="https://rebelhq.app.n8n.cloud"

echo "🎯 UYSP TARGETED BACKUP Starting..."
echo "📅 Timestamp: $TIMESTAMP"
echo "📁 Backup Dir: $BACKUP_DIR"

mkdir -p "$BACKUP_DIR"

# Define ONLY the UYSP workflows we need to backup
UYSP_WORKFLOWS=(
  "UAZWVFzMrJaVbvGM:UYSP-SMS-Scheduler-v2:PRIMARY"
  "bA3vEZvfokE84AGY:UYSP-Switchy-Click-Tracker:PRIMARY" 
  "LiVE3BlxsFkHhG83:UYSP-Calendly-Booked:PRIMARY"
  "pQhwZYwBXbcARUzp:UYSP-SMS-Inbound-STOP:SECONDARY"
  "vA0Gkp2BrxKppuSu:UYSP-ST-Delivery-V2:SECONDARY"
  "qMXmmw4NUCh1qu8r:UYSP-Backlog-Ingestion:SECONDARY"
)

export_workflow() {
  local workflow_id="$1"
  local workflow_info="$2"
  
  IFS=':' read -r workflow_name priority <<< "$workflow_info"
  
  local output_file="${BACKUP_DIR}/${priority}-${workflow_name}-${TIMESTAMP}.json"
  
  echo "🔄 Exporting: $workflow_name ($workflow_id)"
  echo "   📋 Priority: $priority"
  
  # Export via n8n API
  http_code=$(curl -sS -w "%{http_code}" \
    -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
    -H "Accept: application/json" \
    "${N8N_API_URL}/api/v1/workflows/${workflow_id}" \
    -o "$output_file" || echo "000")
  
  if [ "$http_code" = "200" ]; then
    # Verify JSON format
    if jq '.' "$output_file" >/dev/null 2>&1; then
      file_size=$(wc -c < "$output_file")
      echo "   ✅ Exported: $(echo "scale=1; $file_size/1024" | bc)KB"
      return 0
    else
      echo "   ❌ Invalid JSON format"
      rm -f "$output_file"
      return 1
    fi
  else
    echo "   ❌ HTTP Error: $http_code"
    rm -f "$output_file"
    return 1
  fi
}

# Export each UYSP workflow
SUCCESS_COUNT=0
TOTAL_COUNT=${#UYSP_WORKFLOWS[@]}

for workflow_entry in "${UYSP_WORKFLOWS[@]}"; do
  IFS=':' read -r workflow_id workflow_name priority <<< "$workflow_entry"
  if export_workflow "$workflow_id" "${workflow_name}:${priority}"; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  fi
done

echo ""
echo "📊 Export Results: $SUCCESS_COUNT/$TOTAL_COUNT workflows exported"

if [ "$SUCCESS_COUNT" -eq "$TOTAL_COUNT" ]; then
  echo "✅ ALL UYSP WORKFLOWS BACKED UP SUCCESSFULLY!"
  
  # Add to git
  git add "$BACKUP_DIR"/*
  
  # Create commit
  git commit -m "backup: UYSP Core Workflows - Targeted Export $TIMESTAMP

🎯 UYSP TARGETED BACKUP (Core Workflows Only)
📦 Workflows: $SUCCESS_COUNT/$TOTAL_COUNT exported successfully
📅 Timestamp: $TIMESTAMP

🔴 PRIMARY WORKFLOWS (Production Critical):
$(ls "$BACKUP_DIR"/PRIMARY-* 2>/dev/null | xargs -I {} basename {} | sed 's/^/   ⭐ /')

🟡 SECONDARY WORKFLOWS (Supporting):
$(ls "$BACKUP_DIR"/SECONDARY-* 2>/dev/null | xargs -I {} basename {} | sed 's/^/   📄 /')

🤖 Exported by: backup-uysp-only.sh
⏰ Completed: $(date)"
  
  # Push to GitHub
  if git remote | grep -q origin; then
    git push origin $(git branch --show-current)
    echo "☁️ Pushed to GitHub!"
  fi
  
  echo ""
  echo "🎯 UYSP BACKUP COMPLETE!"
  echo "📁 Location: $BACKUP_DIR"
  echo "☁️ GitHub: Committed and pushed"
  
else
  echo "❌ BACKUP INCOMPLETE: Only $SUCCESS_COUNT/$TOTAL_COUNT workflows exported"
  exit 1
fi
