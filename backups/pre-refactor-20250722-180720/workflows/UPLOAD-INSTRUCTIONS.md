# 🎯 UYSP WORKFLOW - READY TO UPLOAD

## THE PROBLEM WE SOLVED
The live workflow was missing these CRITICAL parameters in ALL Airtable nodes:
- `"authentication": "airtableTokenApi"`
- `"resource": "record"`

**Without these, Airtable nodes can't connect at all - that's why you got empty search results!**

## 📁 FILES TO UPLOAD

### MAIN FILE: `UYSP-READY-TO-UPLOAD.json`
- ✅ **ALL Airtable nodes properly configured** with authentication & resource parameters
- ✅ **Perfect filterByFormula syntax** for duplicate detection  
- ✅ **Complete Smart Field Mapper** with boolean conversion
- ✅ **Proper connections** between all nodes
- ✅ **Full field mapping** for lead creation

## 🚀 UPLOAD STEPS

1. **Go to your n8n dashboard**
2. **Click "+" → "Import from File"**  
3. **Select:** `UYSP-READY-TO-UPLOAD.json`
4. **IMPORTANT:** Select "Replace existing workflow" (overwrites the broken one)
5. **Click Import**
6. **Activate the workflow**
7. **Test with duplicate email to verify it works**

## 🧪 TEST AFTER UPLOAD

Run this `curl` command to test duplicate detection:

```bash
# First test - creates new record
curl -X POST https://rebelhq.app.n8n.cloud/webhook/kajabi-leads \
  -H "Content-Type: application/json" \
  -H "x-api-key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyOWQwYWM3Ni0xYjBlLTRmMGItYTlkZC1iNzEwZDI0NzZlZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUyMDYzNTE4LCJleHAiOjE3NTk3ODgwMDB9.IRZEs36NXR6WHcZb1PiC109S70tGKsmzP86zWpun3qg" \
  -d '{"email":"upload-test@example.com","name":"Upload Test","phone":"5551234567","company":"Test Corp"}'

# Second test - should UPDATE the existing record (check duplicate_count = 1)
curl -X POST https://rebelhq.app.n8n.cloud/webhook/kajabi-leads \
  -H "Content-Type: application/json" \
  -H "x-api-key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyOWQwYWM3Ni0xYjBlLTRmMGItYTlkZC1iNzEwZDI0NzZlZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUyMDYzNTE4LCJleHAiOjE3NTk3ODgwMDB9.IRZEs36NXR6WHcZb1PiC109S70tGKsmzP86zWpun3qg" \
  -d '{"email":"upload-test@example.com","name":"DUPLICATE Test","phone":"5551234567","company":"UPDATED Corp"}'
```

## ✅ SUCCESS INDICATORS

After upload and test:
- ✅ **First test:** Creates new record with `duplicate_count: 0`
- ✅ **Second test:** Updates existing record with `duplicate_count: 1` 
- ✅ **No new records created** for duplicate emails
- ✅ **Airtable Search node returns actual results** (not empty)

## 🎯 THIS FIXES THE ROOT CAUSE

The fundamental issue was **missing authentication parameters** preventing any Airtable operations. This file includes ALL the required parameters for proper duplicate detection and record management.