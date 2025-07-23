#!/bin/bash

# Final test after fixing lead_source mapping
echo "Testing UYSP Lead Processing Workflow - Final Fix"
echo "================================================="

# Test with a new lead
curl -X POST https://rebelhq.app.n8n.cloud/webhook/kajabi-leads \
  -H "Content-Type: application/json" \
  -H "x-api-key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyOWQwYWM3Ni0xYjBlLTRmMGItYTlkZC1iNzEwZDI0NzZlZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUyMDYzNTE4LCJleHAiOjE3NTk3ODgwMDB9.IRZEs36NXR6WHcZb1PiC109S70tGKsmzP86zWpun3qg" \
  -d '{
    "Email": "success-test-'$(date +%s)'@example.com",
    "phone_number": "415-555-1234",
    "full_name": "Success Test User",
    "Company": "Mission Critical Corp",
    "source": "lead-source-fix-test",
    "interested_in_coaching": "true",
    "request_id": "final-test-'$(date +%s)'"
  }'

echo -e "\n\nWorkflow should now create the record successfully!"
echo "Check Airtable to verify the record was created with:"
echo "- lead_source field populated with 'lead-source-fix-test'"
echo "- All other fields correctly mapped" 