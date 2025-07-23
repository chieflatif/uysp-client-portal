#!/bin/bash

# ===== UYSP PHASE 00: ADD MISSING PEOPLE FIELDS =====
# Adds 22+ critical fields required for Session 0-6 workflows

set -e  # Exit on error

BASE_ID="appuBf0fTe8tp8ZaF"
PEOPLE_TABLE_ID="tblSk2Ikg21932uE0"
SCRIPT_NAME="02-add-missing-people-fields"

echo "===== ${SCRIPT_NAME}: Adding critical fields to People table ====="
echo "Base ID: ${BASE_ID}"
echo "People Table ID: ${PEOPLE_TABLE_ID}"
echo "Timestamp: $(date)"
echo

# Function to check command success
check_success() {
    if [ $? -eq 0 ]; then
        echo "✅ SUCCESS: $1"
    else
        echo "❌ FAILED: $1"
        echo "   Continuing with next field..."
    fi
}

# Function to add field to table
add_field() {
    local field_name="$1"
    local field_config="$2"
    
    echo "🔧 Adding field: ${field_name}..."
    
    curl -X POST "https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/${PEOPLE_TABLE_ID}/fields" \
      -H "Authorization: Bearer ${AIRTABLE_API_KEY}" \
      -H "Content-Type: application/json" \
      -d "${field_config}"
    
    check_success "Field ${field_name}"
    echo
}

echo "📋 Adding 22 critical missing fields..."
echo

# 1. Boolean webhook fields
add_field "qualified_lead" '{
  "name": "qualified_lead",
  "type": "checkbox",
  "options": {"icon": "check", "color": "greenBright"}
}'

add_field "contacted" '{
  "name": "contacted", 
  "type": "checkbox",
  "options": {"icon": "check", "color": "greenBright"}
}'

# 2. Field normalization tracking (Session 0)
add_field "field_mapping_success_rate" '{
  "name": "field_mapping_success_rate",
  "type": "percent",
  "options": {"precision": 0}
}'

add_field "normalization_version" '{
  "name": "normalization_version",
  "type": "singleLineText"
}'

add_field "raw_webhook_data" '{
  "name": "raw_webhook_data",
  "type": "multilineText"
}'

add_field "validation_errors" '{
  "name": "validation_errors",
  "type": "multilineText"
}'

add_field "webhook_field_count" '{
  "name": "webhook_field_count",
  "type": "number",
  "options": {"precision": 0}
}'

add_field "mapped_field_count" '{
  "name": "mapped_field_count",
  "type": "number", 
  "options": {"precision": 0}
}'

add_field "unknown_field_list" '{
  "name": "unknown_field_list",
  "type": "multilineText"
}'

# 3. Processing phase tracking (Session 3)
add_field "phase1_attempted" '{
  "name": "phase1_attempted",
  "type": "checkbox",
  "options": {"icon": "check", "color": "greenBright"}
}'

add_field "phase1_passed" '{
  "name": "phase1_passed",
  "type": "checkbox",
  "options": {"icon": "check", "color": "greenBright"}
}'

add_field "phase2_attempted" '{
  "name": "phase2_attempted",
  "type": "checkbox",
  "options": {"icon": "check", "color": "greenBright"}
}'

add_field "phase2_passed" '{
  "name": "phase2_passed",
  "type": "checkbox",
  "options": {"icon": "check", "color": "greenBright"}
}'

add_field "scoring_attempted" '{
  "name": "scoring_attempted",
  "type": "checkbox",
  "options": {"icon": "check", "color": "greenBright"}
}'

add_field "scoring_method_used" '{
  "name": "scoring_method_used",
  "type": "singleSelect",
  "options": {
    "choices": [
      {"name": "claude_ai"},
      {"name": "domain_fallback"},
      {"name": "manual"}
    ]
  }
}'

# 4. Cost tracking per lead
add_field "apollo_org_cost" '{
  "name": "apollo_org_cost",
  "type": "currency",
  "options": {"precision": 3, "symbol": "$"}
}'

add_field "apollo_person_cost" '{
  "name": "apollo_person_cost",
  "type": "currency",
  "options": {"precision": 3, "symbol": "$"}
}'

add_field "twilio_cost" '{
  "name": "twilio_cost",
  "type": "currency",
  "options": {"precision": 3, "symbol": "$"}
}'

add_field "claude_cost" '{
  "name": "claude_cost",
  "type": "currency",
  "options": {"precision": 3, "symbol": "$"}
}'

add_field "total_processing_cost" '{
  "name": "total_processing_cost",
  "type": "currency",
  "options": {"precision": 3, "symbol": "$"}
}'

# 5. International handling
add_field "phone_country_code" '{
  "name": "phone_country_code",
  "type": "singleLineText"
}'

add_field "requires_international_handling" '{
  "name": "requires_international_handling",
  "type": "checkbox",
  "options": {"icon": "check", "color": "greenBright"}
}'

echo "🔍 Verifying field additions..."
echo "Current People table field count:"

curl -X GET "https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/${PEOPLE_TABLE_ID}" \
  -H "Authorization: Bearer ${AIRTABLE_API_KEY}" | jq -r '.fields | length'

echo
echo "✅ ${SCRIPT_NAME} COMPLETED"
echo "📊 Added 22 critical fields to People table"
echo "🔍 Expected total fields: ~70"
echo
echo "📁 Next: Run 03-setup-environment-variables.sh" 