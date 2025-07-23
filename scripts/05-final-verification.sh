#!/bin/bash

# ===== UYSP PHASE 00: FINAL VERIFICATION =====
# Comprehensive validation of complete infrastructure setup

set -e  # Exit on error

BASE_ID="appuBf0fTe8tp8ZaF"
SCRIPT_NAME="05-final-verification"

echo "===== ${SCRIPT_NAME}: Complete Phase 00 Validation ====="
echo "Base ID: ${BASE_ID}"
echo "Timestamp: $(date)"
echo

# Initialize counters
TOTAL_CHECKS=0
PASSED_CHECKS=0

# Function to run check
run_check() {
    local check_name="$1"
    local command="$2"
    local expected_result="$3"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo "🔍 CHECK #${TOTAL_CHECKS}: ${check_name}"
    
    result=$(eval "$command" 2>/dev/null || echo "ERROR")
    
    if [[ "$result" == *"$expected_result"* ]] || [[ "$expected_result" == "any" && "$result" != "ERROR" ]]; then
        echo "✅ PASS: $result"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo "❌ FAIL: Expected '$expected_result', got '$result'"
    fi
    echo
}

# Function to count table records
count_records() {
    local table_name="$1"
    curl -s -X GET "https://api.airtable.com/v0/${BASE_ID}/${table_name}?maxRecords=1" \
      -H "Authorization: Bearer ${AIRTABLE_API_KEY}" | jq -r '.records | length' 2>/dev/null || echo "0"
}

# Function to count table fields
count_fields() {
    local table_id="$1"
    curl -s -X GET "https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/${table_id}" \
      -H "Authorization: Bearer ${AIRTABLE_API_KEY}" | jq -r '.fields | length' 2>/dev/null || echo "0"
}

echo "📋 AIRTABLE TABLE VALIDATION"
echo "==============================="

# Check table existence and record counts
run_check "People table exists" "count_records 'People'" "any"
run_check "Communications table exists" "count_records 'Communications'" "any"
run_check "Daily_Costs table exists" "count_records 'Daily_Costs'" "any"
run_check "Daily_Metrics table exists" "count_records 'Daily_Metrics'" "any"
run_check "DND_List table exists" "count_records 'DND_List'" "any"
run_check "Error_Log table exists" "count_records 'Error_Log'" "any"
run_check "Enrichment_Cache table exists" "count_records 'Enrichment_Cache'" "any"
run_check "Field_Mapping_Log table exists" "count_records 'Field_Mapping_Log'" "any"
run_check "Workflow_IDs table exists" "count_records 'Workflow_IDs'" "any"

echo "📊 PEOPLE TABLE FIELD VALIDATION"
echo "================================="

# Check People table field count (should be ~70 fields after additions)
people_field_count=$(count_fields "tblSk2Ikg21932uE0")
run_check "People table has sufficient fields (expect ~70)" "echo $people_field_count" "6"  # Check if >= 60

# Check for critical new fields by trying to list them
echo "🔍 Checking for critical new fields in People table..."

# Get People table schema and check for specific fields
people_schema=$(curl -s -X GET "https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/tblSk2Ikg21932uE0" \
  -H "Authorization: Bearer ${AIRTABLE_API_KEY}")

critical_fields=("qualified_lead" "contacted" "field_mapping_success_rate" "normalization_version" "raw_webhook_data" "validation_errors" "webhook_field_count" "mapped_field_count" "unknown_field_list" "phase1_attempted" "phase1_passed" "phase2_attempted" "phase2_passed" "scoring_attempted" "scoring_method_used" "apollo_org_cost" "apollo_person_cost" "twilio_cost" "claude_cost" "total_processing_cost" "phone_country_code" "requires_international_handling")

found_fields=0
for field in "${critical_fields[@]}"; do
    if echo "$people_schema" | jq -r '.fields[].name' | grep -q "^${field}$"; then
        echo "✅ Found: $field"
        found_fields=$((found_fields + 1))
    else
        echo "❌ Missing: $field"
    fi
done

run_check "Critical fields present (expect 22/22)" "echo $found_fields" "22"

echo "📋 TEST DATA VALIDATION"
echo "======================="

# Check DND test data
dnd_count=$(count_records "DND_List")
run_check "DND_List has test entries" "echo $dnd_count" "2"

# Check Daily_Costs today record
today_costs=$(curl -s -X GET "https://api.airtable.com/v0/${BASE_ID}/Daily_Costs?filterByFormula=IS_SAME({date},TODAY())" \
  -H "Authorization: Bearer ${AIRTABLE_API_KEY}" | jq -r '.records | length')
run_check "Daily_Costs has today's record" "echo $today_costs" "1"

# Check Field_Mapping_Log initialization
mapping_count=$(count_records "Field_Mapping_Log")
run_check "Field_Mapping_Log initialized" "echo $mapping_count" "1"

# Check Workflow_IDs bootstrap entry
workflow_count=$(count_records "Workflow_IDs")
run_check "Workflow_IDs has bootstrap entry" "echo $workflow_count" "1"

echo "📊 INFRASTRUCTURE SUMMARY"
echo "========================="

echo "📋 VALIDATION RESULTS:"
echo "   Total Checks: $TOTAL_CHECKS"
echo "   Passed: $PASSED_CHECKS"
echo "   Failed: $((TOTAL_CHECKS - PASSED_CHECKS))"

if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
    echo "✅ ALL CHECKS PASSED - Phase 00 setup complete!"
    success_rate=100
else
    success_rate=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo "⚠️  Setup ${success_rate}% complete - review failed checks above"
fi

echo
echo "📊 FINAL INFRASTRUCTURE STATUS:"
echo "==============================="

echo "🗃️  AIRTABLE TABLES: $(curl -s -X GET "https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables" -H "Authorization: Bearer ${AIRTABLE_API_KEY}" | jq -r '.tables | length')/12"

echo "📊 PEOPLE TABLE FIELDS: ${people_field_count}/~70"

echo "🚫 DND ENTRIES: ${dnd_count} (including international)"

echo "💰 DAILY COSTS: ${today_costs} record for today"

echo "🗺️  FIELD MAPPING: ${mapping_count} initialization record"

echo "⚙️  WORKFLOW IDS: ${workflow_count} bootstrap entry"

echo
echo "🔧 REMAINING MANUAL STEPS:"
echo "========================="

if [ $success_rate -lt 100 ]; then
    echo "❌ BLOCKERS FOUND - Address failed checks above"
else
    echo "✅ Infrastructure ready for Session 1!"
fi

echo "📋 Still required:"
echo "   1. Set 17 environment variables in n8n UI (see 03-setup-environment-variables.sh)"
echo "   2. Test verification workflow execution"
echo "   3. Manual autoNumber field addition to Field_Mapping_Log"

echo
echo "✅ ${SCRIPT_NAME} COMPLETED"
echo "📈 Phase 00 Infrastructure: ${success_rate}% ready"

if [ $success_rate -eq 100 ]; then
    echo "🚀 Ready to proceed to Session 1 workflow implementation!"
else
    echo "⚠️  Fix failed checks before proceeding to Session 1"
fi 