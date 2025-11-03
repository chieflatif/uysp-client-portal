#!/bin/bash

# ===== UYSP PHASE 00: CREATE MISSING TABLES =====
# Creates Field_Mapping_Log and Human_Review_Queue tables

set -e  # Exit on error

BASE_ID="appuBf0fTe8tp8ZaF"
SCRIPT_NAME="01-create-missing-tables"

echo "===== ${SCRIPT_NAME}: Starting table creation ====="
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

echo "🔧 Creating Field_Mapping_Log table..."
# Note: autoNumber field will be added manually in Airtable UI after creation
curl -X POST "https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables" \
  -H "Authorization: Bearer ${AIRTABLE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Field_Mapping_Log",
    "description": "CRITICAL: Tracks unknown webhook field variations for weekly review",
    "fields": [
      {
        "name": "Name",
        "type": "singleLineText"
      },
      {
        "name": "timestamp",
        "type": "dateTime",
        "options": {
          "dateFormat": {"name": "iso", "format": "YYYY-MM-DD"},
          "timeFormat": {"name": "24hour", "format": "HH:mm"},
          "timeZone": "utc"
        }
      },
      {
        "name": "unknown_field",
        "type": "singleLineText"
      },
      {
        "name": "webhook_source",
        "type": "singleLineText"
      },
      {
        "name": "raw_value",
        "type": "singleLineText"
      },
      {
        "name": "occurrence_count",
        "type": "number",
        "options": {"precision": 0}
      },
      {
        "name": "first_seen",
        "type": "dateTime",
        "options": {
          "dateFormat": {"name": "iso", "format": "YYYY-MM-DD"},
          "timeFormat": {"name": "24hour", "format": "HH:mm"},
          "timeZone": "utc"
        }
      },
      {
        "name": "last_seen",
        "type": "dateTime",
        "options": {
          "dateFormat": {"name": "iso", "format": "YYYY-MM-DD"},
          "timeFormat": {"name": "24hour", "format": "HH:mm"},
          "timeZone": "utc"
        }
      },
      {
        "name": "added_to_mapper",
        "type": "checkbox",
        "options": {"icon": "check", "color": "greenBright"}
      },
      {
        "name": "review_status",
        "type": "singleSelect",
        "options": {
          "choices": [
            {"name": "New"},
            {"name": "Reviewing"},
            {"name": "Added"},
            {"name": "Ignored"}
          ]
        }
      }
    ]
  }'

check_success "Field_Mapping_Log table creation"
echo

echo "🔧 Creating Human_Review_Queue table..."
curl -X POST "https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables" \
  -H "Authorization: Bearer ${AIRTABLE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Human_Review_Queue",
    "description": "Queue for leads requiring human review before SMS sending",
    "fields": [
      {
        "name": "Name",
        "type": "singleLineText"
      },
      {
        "name": "person_email",
        "type": "email"
      },
      {
        "name": "review_reason",
        "type": "singleSelect",
        "options": {
          "choices": [
            {"name": "low_confidence_score"},
            {"name": "missing_key_data"},
            {"name": "unusual_domain"},
            {"name": "international_phone"},
            {"name": "duplicate_concern"},
            {"name": "manual_flag"}
          ]
        }
      },
      {
        "name": "queued_date",
        "type": "dateTime",
        "options": {
          "dateFormat": {"name": "us", "format": "M/D/YYYY"},
          "timeFormat": {"name": "12hour", "format": "h:mma"}
        }
      },
      {
        "name": "priority",
        "type": "singleSelect",
        "options": {
          "choices": [
            {"name": "High"},
            {"name": "Medium"},
            {"name": "Low"}
          ]
        }
      },
      {
        "name": "review_notes",
        "type": "multilineText"
      },
      {
        "name": "decision",
        "type": "singleSelect",
        "options": {
          "choices": [
            {"name": "Approve"},
            {"name": "Reject"},
            {"name": "Modify"},
            {"name": "Research_Needed"}
          ]
        }
      },
      {
        "name": "reviewed_by",
        "type": "singleLineText"
      },
      {
        "name": "reviewed_date",
        "type": "dateTime",
        "options": {
          "dateFormat": {"name": "us", "format": "M/D/YYYY"},
          "timeFormat": {"name": "12hour", "format": "h:mma"}
        }
      },
      {
        "name": "completed",
        "type": "checkbox",
        "options": {"icon": "check", "color": "greenBright"}
      }
    ]
  }'

check_success "Human_Review_Queue table creation"
echo

echo "🔍 Verifying table creation..."
echo "Listing all tables in base..."

curl -X GET "https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables" \
  -H "Authorization: Bearer ${AIRTABLE_API_KEY}" | jq -r '.tables[] | .name' | sort

echo
echo "✅ ${SCRIPT_NAME} COMPLETED"
echo "📋 MANUAL STEPS REQUIRED:"
echo "   1. Add autoNumber field 'id' to Field_Mapping_Log table via Airtable UI"
echo "   2. Set 'id' field as primary field in Field_Mapping_Log"
echo "   3. Verify all fields created correctly in both tables"
echo
echo "📁 Next: Run 02-add-missing-people-fields.sh" 