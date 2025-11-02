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
# Updated: ALL 20 non-archived workflows (10 ACTIVE + 10 INACTIVE)
# Project: UYSP Lead Qualification Agent (H4VRaaZhd8VKQANf)
# Excludes: ~17 archived workflows
UYSP_WORKFLOWS=(
  # ═══════════════════════════════════════════════════════════
  # ACTIVE PRODUCTION WORKFLOWS (10)
  # ═══════════════════════════════════════════════════════════
  "3aOAIMbsSZYoeOpW:safety-check-module-v2:ACTIVE"
  "3nA0asUTWdgYuCMf:UYSP-Engagement-Score-Calculator-v1:ACTIVE"
  "5xW2QG8x2RFQP8kx:UYSP-Daily-Monitoring:ACTIVE"
  "CmaISo2tBtYRqNs0:UYSP-SimpleTexting-Reply-Handler:ACTIVE"
  "IzWhzHKBdA6JZWAH:UYSP-AI-Reply-Sentiment-v2:ACTIVE"
  "LiVE3BlxsFkHhG83:UYSP-Calendly-Booked:ACTIVE"
  "MLnKXQYtfJDk9HXI:UYSP-Workflow-Health-Monitor-v2:ACTIVE"
  "kJMMZ10anu4NqYUL:UYSP-Kajabi-SMS-Scheduler:ACTIVE"
  "pQhwZYwBXbcARUzp:UYSP-SMS-Inbound-STOP:ACTIVE"
  "vA0Gkp2BrxKppuSu:UYSP-ST-Delivery V2:ACTIVE"
  
  # ═══════════════════════════════════════════════════════════
  # INACTIVE WORKFLOWS (10) - NOT ARCHIVED, STILL CRITICAL
  # ═══════════════════════════════════════════════════════════
  "0scB7vqk8QHp8s5b:UYSP-Kajabi-API-Polling:INACTIVE"
  "2cdgp1qr9tXlONVL:UYSP-Realtime-Ingestion_Gabriel:INACTIVE"
  "39yskqJT3V6enem2:UYSP-Twilio-Status-Callback:INACTIVE"
  "A8L1TbEsqHY6d4dH:UYSP Backlog Ingestion - Hardened:INACTIVE"
  "AlOblqD8q1G7Iuq8:UYSP-AI-Inbound-Handler:INACTIVE"
  "AvawSqsjApV43lAr:UYSP-Twilio-Click-Tracker:INACTIVE"
  "UAZWVFzMrJaVbvGM:UYSP-Message-Scheduler-v2:INACTIVE"
  "e9s0pmmlZfrZ3qjD:UYSP-Kajabi-Realtime-Ingestion:INACTIVE"
  "ujkG0KbTYBIubxgK:UYSP-Twilio-Inbound-Messages:INACTIVE"
  "wNvsJojWTr0U2ypz:UYSP-Health-Monitor:INACTIVE"
)

export_workflow() {
  local workflow_id="$1"
  local workflow_info="$2"
  
  IFS=':' read -r workflow_name priority <<< "$workflow_info"
  
  local output_file="${BACKUP_DIR}/${priority}-${workflow_name}-${TIMESTAMP}.json"
  
  echo "🔄 Exporting: $workflow_name ($workflow_id)"
  echo "   📋 Status: $priority"
  
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
  git commit -m "backup: UYSP Complete Workflow Export - ALL Non-Archived Workflows

🎯 COMPLETE UYSP BACKUP (All 20 Non-Archived Workflows)
📦 Workflows: $SUCCESS_COUNT/$TOTAL_COUNT exported successfully
📅 Timestamp: $TIMESTAMP

🟢 ACTIVE PRODUCTION WORKFLOWS (10):
- safety-check-module-v2
- UYSP-Engagement-Score-Calculator-v1
- UYSP-Daily-Monitoring
- UYSP-SimpleTexting-Reply-Handler
- UYSP-AI-Reply-Sentiment-v2
- UYSP-Calendly-Booked
- UYSP-Workflow-Health-Monitor-v2
- UYSP-Kajabi-SMS-Scheduler
- UYSP-SMS-Inbound-STOP
- UYSP-ST-Delivery V2

⚪ INACTIVE WORKFLOWS (10) - NOT ARCHIVED, STILL CRITICAL:
- UYSP-Kajabi-API-Polling (Critical: intentionally inactive)
- UYSP-Realtime-Ingestion_Gabriel
- UYSP-Twilio-Status-Callback
- UYSP Backlog Ingestion - Hardened
- UYSP-AI-Inbound-Handler (Two-way SMS: Twilio)
- UYSP-Twilio-Click-Tracker
- UYSP-Message-Scheduler-v2 (Batch control: intentionally inactive)
- UYSP-Kajabi-Realtime-Ingestion
- UYSP-Twilio-Inbound-Messages
- UYSP-Health-Monitor (Old version)

📍 Scope: Project H4VRaaZhd8VKQANf (UYSP Lead Qualification Agent)
🚫 Excludes: ~17 archived/historical workflows
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
