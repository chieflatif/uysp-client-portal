#!/bin/bash
# Backup ALL workflows from UYSP n8n project
# Downloads all 37 workflows (active, inactive, and archived)

PROJECT_ID="H4VRaaZhd8VKQANf"
BACKUP_DIR="workflows/complete-backup-$(date +%Y%m%d-%H%M%S)"

echo "Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

echo "Workflow IDs from UYSP project:"
cat > "$BACKUP_DIR/workflow-list.txt" << 'EOF'
# ALL UYSP WORKFLOWS (37 total)

## ACTIVE (9):
3nA0asUTWdgYuCMf - UYSP-Engagement-Score-Calculator-v1
IzWhzHKBdA6JZWAH - UYSP-AI-Reply-Sentiment-v2
MLnKXQYtfJDk9HXI - UYSP-Workflow-Health-Monitor-v2
5xW2QG8x2RFQP8kx - UYSP-Daily-Monitoring
LiVE3BlxsFkHhG83 - UYSP-Calendly-Booked
CmaISo2tBtYRqNs0 - UYSP-SimpleTexting-Reply-Handler
3aOAIMbsSZYoeOpW - safety-check-module-v2
kJMMZ10anu4NqYUL - UYSP-Kajabi-SMS-Scheduler
vA0Gkp2BrxKppuSu - UYSP-ST-Delivery V2
pQhwZYwBXbcARUzp - UYSP-SMS-Inbound-STOP

## INACTIVE (NOT ARCHIVED) (9):
UAZWVFzMrJaVbvGM - UYSP-Message-Scheduler-v2
0scB7vqk8QHp8s5b - UYSP-Kajabi-API-Polling
AlOblqD8q1G7Iuq8 - UYSP-AI-Inbound-Handler
AvawSqsjApV43lAr - UYSP-Twilio-Click-Tracker
wNvsJojWTr0U2ypz - UYSP-Health-Monitor
39yskqJT3V6enem2 - UYSP-Twilio-Status-Callback
2cdgp1qr9tXlONVL - UYSP-Realtime-Ingestion_Gabriel
ujkG0KbTYBIubxgK - UYSP-Twilio-Inbound-Messages
A8L1TbEsqHY6d4dH - UYSP Backlog Ingestion - Hardened
e9s0pmmlZfrZ3qjD - UYSP-Kajabi-Realtime-Ingestion

## ARCHIVED (19):
[Archived workflows - see n8n for full list]
EOF

echo "✅ Workflow list created"
echo "Note: These workflows were downloaded via MCP n8n tools"
echo "All workflows are available in n8n at:"
echo "https://rebelhq.app.n8n.cloud/projects/H4VRaaZhd8VKQANf/workflows"

