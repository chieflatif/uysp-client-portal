#!/bin/bash

# ===== UYSP PHASE 00: ENVIRONMENT VARIABLES SETUP =====
# Complete checklist of all 17 required n8n environment variables

SCRIPT_NAME="03-setup-environment-variables"

echo "===== ${SCRIPT_NAME}: n8n Environment Variables Checklist ====="
echo "Workspace: https://rebelhq.app.n8n.cloud/projects/H4VRaaZhd8VKQANf/"
echo "Timestamp: $(date)"
echo

cat << 'EOF'
🔧 MANUAL SETUP REQUIRED IN N8N UI

Navigate to: n8n Workspace → Settings → Environment Variables

ADD THESE 17 VARIABLES:

┌─────────────────────────────────────────────────────────────────┐
│                    CORE SYSTEM VARIABLES                       │
├─────────────────────────────────────────────────────────────────┤
│ □ AIRTABLE_BASE_ID=appuBf0fTe8tp8ZaF                           │
│ □ TEST_MODE=true                                                │
│ □ DAILY_COST_LIMIT=1                                           │
│ □ CACHE_EXPIRY_DAYS=90                                         │
│ □ MAX_RETRIES=3                                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    API CREDENTIALS                             │
├─────────────────────────────────────────────────────────────────┤
│ □ APOLLO_API_KEY=[your_apollo_key]                             │
│ □ SIMPLETEXTING_API_KEY=[your_simpletexting_key]               │
│ □ TWILIO_ACCOUNT_SID=[your_twilio_sid]                         │
│ □ TWILIO_AUTH_TOKEN=[your_twilio_token]                        │
│ □ CLAUDE_API_KEY=[your_claude_key]                             │
│ □ CALENDLY_API_KEY=[your_calendly_key]                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    WEBHOOK SECURITY                            │
├─────────────────────────────────────────────────────────────────┤
│ □ KAJABI_WEBHOOK_SECRET=[32_char_string]                       │
│ □ ZAPIER_WEBHOOK_SECRET=[32_char_string]                       │
│ □ WEBHOOK_API_KEY=[32_char_string_for_x_api_key]               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    COST & COMPLIANCE                           │
├─────────────────────────────────────────────────────────────────┤
│ □ SMS_RATE_LIMIT_PER_HOUR=50                                   │
│ □ APOLLO_RATE_LIMIT_PER_MINUTE=100                             │
│ □ TCPA_COMPLIANCE_HOURS_START=8                                │
│ □ TCPA_COMPLIANCE_HOURS_END=21                                 │
└─────────────────────────────────────────────────────────────────┘

📋 VERIFICATION CHECKLIST:

After adding all variables:
1. □ Save changes in n8n UI
2. □ Test environment access via Manual Trigger workflow  
3. □ Verify AIRTABLE_BASE_ID connects to correct base
4. □ Confirm TEST_MODE=true prevents real SMS sends
5. □ Check DAILY_COST_LIMIT prevents budget overruns

🚨 CRITICAL SECURITY NOTES:

• NEVER commit these values to git
• Use different secrets for prod vs test
• Rotate webhook secrets monthly
• Apollo API has strict rate limits (100/min)
• TEST_MODE must be true during development

📁 NEXT STEPS:

1. Set all 17 variables in n8n UI
2. Run verification workflow to test access
3. Execute 04-load-test-data.sh

EOF

echo
echo "✅ ${SCRIPT_NAME} CHECKLIST DISPLAYED"
echo "⏳ Human action required: Set variables in n8n UI"
echo "📁 Next: Run 04-load-test-data.sh after variables are set" 