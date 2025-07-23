#!/bin/bash

# ===== UYSP PHASE 00: LOAD INITIAL TEST DATA =====
# Loads critical test data for DND, Daily_Costs, Field_Mapping_Log, Workflow_IDs

set -e  # Exit on error

BASE_ID="appuBf0fTe8tp8ZaF"
SCRIPT_NAME="04-load-test-data"

echo "===== ${SCRIPT_NAME}: Loading initial test data ====="
echo "Base ID: ${BASE_ID}"
echo "Timestamp: $(date)"
echo

# Function to check command success
check_success() {
    if [ $? -eq 0 ]; then
        echo "✅ SUCCESS: $1"
    else
        echo "❌ FAILED: $1"
        exit 1
    fi
}

# Get today's date in US format
TODAY=$(date +"%m/%d/%Y")
ISO_TODAY=$(date +"%Y-%m-%d")

echo "📅 Today's date: ${TODAY} (US format)"
echo "📅 Today's date: ${ISO_TODAY} (ISO format)"
echo

echo "🚫 Loading DND_List test entries..."

# Add international test number
curl -X POST "https://api.airtable.com/v0/${BASE_ID}/DND_List" \
  -H "Authorization: Bearer ${AIRTABLE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "Name": "Test International DND",
      "phone": "+447700900123",
      "email": "test-intl@dndtest.com",
      "opt_out_date": "'${TODAY}'",
      "opt_out_source": "manual",
      "reason": "Test entry for international phone validation",
      "permanent": true
    }
  }'

check_success "International DND entry (+44 UK number)"

# Add US test number
curl -X POST "https://api.airtable.com/v0/${BASE_ID}/DND_List" \
  -H "Authorization: Bearer ${AIRTABLE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "Name": "Test US DND",
      "phone": "+15551234567",
      "email": "test-us@dndtest.com", 
      "opt_out_date": "'${TODAY}'",
      "opt_out_source": "manual",
      "reason": "Test entry for US phone validation",
      "permanent": false,
      "resubscribe_date": "'${TODAY}'"
    }
  }'

check_success "US DND entry (+1 US number)"

echo
echo "💰 Loading Daily_Costs record for today..."

curl -X POST "https://api.airtable.com/v0/${BASE_ID}/Daily_Costs" \
  -H "Authorization: Bearer ${AIRTABLE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "Name": "Daily Costs '${TODAY}'",
      "date": "'${TODAY}'",
      "apollo_org_costs": 0,
      "apollo_people_costs": 0,
      "twilio_costs": 0,
      "sms_costs": 0,
      "total_costs": 0,
      "budget_remaining": 100,
      "cost_overrun": false,
      "circuit_breaker_triggered": false,
      "created_at": "'${TODAY}'",
      "initial_total": 1,
      "last_updated": "'${TODAY}'"
    }
  }'

check_success "Today's Daily_Costs record"

echo
echo "🗺️ Loading Field_Mapping_Log initialization record..."

curl -X POST "https://api.airtable.com/v0/${BASE_ID}/Field_Mapping_Log" \
  -H "Authorization: Bearer ${AIRTABLE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "timestamp": "'${ISO_TODAY}'T12:00:00.000Z",
      "webhook_name": "system_init",
      "unknown_fields": "[]",
      "original_payload": "{\"message\": \"Field mapping system initialized\"}",
      "mapping_success_rate": 100,
      "reviewed": true
    }
  }'

check_success "Field_Mapping_Log initialization record"

echo
echo "🔧 Loading Workflow_IDs bootstrap record..."

curl -X POST "https://api.airtable.com/v0/${BASE_ID}/Workflow_IDs" \
  -H "Authorization: Bearer ${AIRTABLE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "Name": "Bootstrap Workflow",
      "id": 1,
      "created_date": "'${TODAY}'",
      "description": "Daily cost initialization workflow - runs at startup to ensure today has a Daily_Costs record"
    }
  }'

check_success "Bootstrap workflow ID record"

echo
echo "📊 Loading Daily_Metrics record for today..."

curl -X POST "https://api.airtable.com/v0/${BASE_ID}/Daily_Metrics" \
  -H "Authorization: Bearer ${AIRTABLE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "Name": "Daily Metrics '${TODAY}'",
      "date": "'${TODAY}'",
      "leads_processed": 0,
      "leads_by_source": "{}",
      "sms_sent": 0,
      "sms_clicked": 0,
      "meetings_booked": 0,
      "enrichment_costs": 0,
      "sms_costs": 0,
      "total_costs": 0,
      "duplicate_requests": 0,
      "international_leads": 0,
      "ai_scoring_fallbacks": 0,
      "alerts": "System initialized",
      "human_reviews": 0,
      "enhancement_rate": "0%",
      "avg_processing_time": "0s",
      "sms_delivery_rate": "0%",
      "compliance_check_rate": "100%"
    }
  }'

check_success "Today's Daily_Metrics record"

echo
echo "🔍 Verifying test data loaded..."
echo

echo "📋 DND_List entries:"
curl -X GET "https://api.airtable.com/v0/${BASE_ID}/DND_List?maxRecords=5" \
  -H "Authorization: Bearer ${AIRTABLE_API_KEY}" | jq -r '.records[] | "\(.fields.phone) - \(.fields.reason)"'

echo
echo "💰 Daily_Costs for today:"
curl -X GET "https://api.airtable.com/v0/${BASE_ID}/Daily_Costs?filterByFormula=IS_SAME({date},TODAY())" \
  -H "Authorization: Bearer ${AIRTABLE_API_KEY}" | jq -r '.records[] | "\(.fields.date) - Budget: $\(.fields.budget_remaining)"'

echo
echo "🗺️ Field_Mapping_Log entries:"
curl -X GET "https://api.airtable.com/v0/${BASE_ID}/Field_Mapping_Log?maxRecords=3" \
  -H "Authorization: Bearer ${AIRTABLE_API_KEY}" | jq -r '.records[] | "\(.fields.webhook_name) - \(.fields.mapping_success_rate)%"'

echo
echo "✅ ${SCRIPT_NAME} COMPLETED"
echo "📊 Test data summary:"
echo "   • DND_List: 2 test entries (US & International)"
echo "   • Daily_Costs: Today's record initialized"
echo "   • Field_Mapping_Log: System initialized"
echo "   • Workflow_IDs: Bootstrap workflow recorded"
echo "   • Daily_Metrics: Today's metrics initialized"
echo
echo "📁 Next: Run 05-final-verification.sh to validate complete setup" 