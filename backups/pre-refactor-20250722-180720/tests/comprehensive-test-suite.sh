#!/bin/bash

# UYSP Lead Processing - Comprehensive Test Suite
# 10 contacts with varied scenarios and field mappings
echo "=========================================="
echo "UYSP COMPREHENSIVE TEST SUITE - 10 CONTACTS"
echo "=========================================="
echo "Timestamp: $(date)"
echo ""

WEBHOOK_URL="https://rebelhq.app.n8n.cloud/webhook/kajabi-leads"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyOWQwYWM3Ni0xYjBlLTRmMGItYTlkZC1iNzEwZDI0NzZlZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUyMDYzNTE4LCJleHAiOjE3NTk3ODgwMDB9.IRZEs36NXR6WHcZb1PiC109S70tGKsmzP86zWpun3qg"

# Generate unique timestamp for this test run
TIMESTAMP=$(date +%s)

# Test 1: Standard format with all fields
echo "Test 1: Standard format (all fields)"
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "email": "john.smith.'$TIMESTAMP'@example.com",
    "name": "John Smith",
    "phone": "415-555-0001",
    "company": "Tech Corp",
    "source_form": "webinar-signup",
    "interested_in_coaching": "yes",
    "request_id": "test-1-'$TIMESTAMP'"
  }'
echo -e "\n"

# Test 2: Different field names (Email, Phone, etc.)
echo "Test 2: Different field name variations"
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "Email": "sarah.johnson.'$TIMESTAMP'@company.com",
    "full_name": "Sarah Johnson",
    "Phone": "555-123-4567",
    "Company": "Marketing Inc",
    "source": "blog-download",
    "interested_in_coaching": "true",
    "request_id": "test-2-'$TIMESTAMP'"
  }'
echo -e "\n"

# Test 3: Separated first/last names
echo "Test 3: Separated first/last names"
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "email": "mike.wilson.'$TIMESTAMP'@startup.io",
    "first_name": "Mike",
    "last_name": "Wilson",
    "phone_number": "9876543210",
    "company_name": "Startup Ventures",
    "source_form": "contact-form",
    "coaching_interest": "1",
    "request_id": "test-3-'$TIMESTAMP'"
  }'
echo -e "\n"

# Test 4: Minimal required fields only
echo "Test 4: Minimal fields (email only + coaching)"
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "email": "minimal.test.'$TIMESTAMP'@gmail.com",
    "interested_in_coaching": "yes",
    "request_id": "test-4-'$TIMESTAMP'"
  }'
echo -e "\n"

# Test 5: LinkedIn and title fields
echo "Test 5: Professional fields (LinkedIn, title)"
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "email": "executive.leader.'$TIMESTAMP'@fortune500.com",
    "name": "Executive Leader",
    "mobile": "+1-800-555-9999",
    "organization": "Fortune 500 Corp",
    "job_title": "VP of Sales",
    "linkedin": "https://linkedin.com/in/executive-leader",
    "utm_source": "linkedin-ad",
    "interested_in_coaching": "true",
    "request_id": "test-5-'$TIMESTAMP'"
  }'
echo -e "\n"

# Test 6: International format
echo "Test 6: International contact"
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "email": "international.contact.'$TIMESTAMP'@global.co.uk",
    "name": "Isabella García",
    "phone": "+44 20 7123 4567",
    "company": "Global Solutions Ltd",
    "source_form": "european-webinar",
    "interested_in_coaching": "yes",
    "request_id": "test-6-'$TIMESTAMP'"
  }'
echo -e "\n"

# Test 7: Not interested in coaching
echo "Test 7: Not interested in coaching"
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "email": "not.interested.'$TIMESTAMP'@example.org",
    "name": "Not Interested",
    "phone": "555-000-1111",
    "company": "Research Institute",
    "source_form": "research-download",
    "interested_in_coaching": "no",
    "request_id": "test-7-'$TIMESTAMP'"
  }'
echo -e "\n"

# Test 8: Edge case field names
echo "Test 8: Edge case field names"
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "EMAIL": "uppercase.fields.'$TIMESTAMP'@test.com",
    "fullName": "CamelCase Name",
    "phoneNumber": "123.456.7890",
    "company_input": "Direct Company Field",
    "form_name": "edge-case-form",
    "coaching_interest": "yes",
    "request_id": "test-8-'$TIMESTAMP'"
  }'
echo -e "\n"

# Test 9: Duplicate email test (should trigger upsert)
echo "Test 9: Duplicate email (should update existing)"
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "email": "john.smith.'$TIMESTAMP'@example.com",
    "name": "John Smith Updated",
    "phone": "415-555-0001",
    "company": "Tech Corp Updated",
    "source_form": "follow-up-form",
    "interested_in_coaching": "true",
    "request_id": "test-9-'$TIMESTAMP'"
  }'
echo -e "\n"

# Test 10: Complex business contact
echo "Test 10: Complex business contact"
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "email": "complex.business.'$TIMESTAMP'@enterprise.com",
    "name": "Dr. Alexandra Thompson-Martinez",
    "phone": "+1 (555) 987-6543 ext. 1234",
    "company": "Enterprise Solutions & Consulting LLC",
    "title": "Chief Technology Officer",
    "linkedin": "https://www.linkedin.com/in/alexandra-thompson-martinez-cto",
    "source_form": "enterprise-consultation-request",
    "interested_in_coaching": "yes",
    "request_id": "test-10-'$TIMESTAMP'"
  }'
echo -e "\n"

echo "=========================================="
echo "TEST SUITE COMPLETED"
echo "=========================================="
echo "Total tests: 10"
echo "Timestamp: $TIMESTAMP"
echo "Check n8n executions and Airtable for results"
echo ""
echo "Expected results:"
echo "- 9 new records created (tests 1-8, 10)"
echo "- 1 duplicate update (test 9 updating test 1)"
echo "- Various field mapping scenarios tested"
echo "- Boolean coaching interest variations tested"
echo "" 