# Kajabi Integration - Manual Configuration Guide
**Created**: October 17, 2025  
**For**: Final configuration steps that must be done in the UI  
**Workflow ID**: e9s0pmmlZfrZ3qjD

---

## ✅ WHAT'S BEEN COMPLETED (Automated)

### Airtable Schema ✅
1. **Leads Table** - Added 5 new fields:
   - `Kajabi Contact ID` (Text) - Field ID: fldTTtiojQGiqRbdD
   - `Campaign Assignment` (Single Select) - Field ID: fld3itEgizyfurSOc
     - Options: webinar_jb_2024, webinar_sales_2024, webinar_ai_2024, newsletter_nurture, default_nurture
   - `Lead Source Detail` (Text) - Field ID: fldKVgfCZeZ20e4LZ
   - `Kajabi Member Status` (Single Select) - Field ID: fldjLHXIiQ1qf2Boi
     - Options: Prospect, Active, Trial, Churned
   - `Kajabi Last Sync` (DateTime) - Field ID: fldPTgYHihNPFY8zR

2. **SMS_Templates Table** - Added 1 field:
   - `Active` (Checkbox) - To enable/disable campaigns

3. **Kajabi_Sync_Audit Table** - Created new table (ID: tbl0znQdpA2DI2EcP):
   - Kajabi Contact ID (Text)
   - Lead Email (Email)
   - Sync Timestamp (DateTime)
   - Duplicate Found (Checkbox)
   - Campaign Assigned (Text)
   - Tags Captured (Long Text)
   - Error Log (Long Text)

### n8n Workflow ✅
**Workflow Name**: UYSP-Kajabi-Realtime-Ingestion  
**Workflow ID**: e9s0pmmlZfrZ3qjD  
**Project**: H4VRaaZhd8VKQANf  
**Status**: Created (inactive)

**10 Nodes Created**:
1. Kajabi Webhook (webhook receiver)
2. Extract Submission Data (code node)
3. Get Form Details from Kajabi (HTTP request)
4. Map Form to Campaign (code node)
5. Smart Field Mapper (code node)
6. Check for Duplicate Email (Airtable search)
7. Is Duplicate? (IF node)
8. Update Existing Lead (Airtable update)
9. Create New Lead (Airtable create)
10. Log to Kajabi Sync Audit (Airtable create)

---

## ⚠️ MANUAL STEPS REQUIRED

The following steps CANNOT be automated via the n8n API and MUST be done manually in the UI.

---

## STEP 1: Create Kajabi OAuth2 Credential in n8n

**Why Manual**: The n8n API does not support creating OAuth2 credentials programmatically.

**Steps**:

1. Open n8n Cloud: https://rebelhq.app.n8n.cloud
2. Navigate to: **Credentials** → **Add Credential**
3. Search for: **OAuth2 API**
4. Click **OAuth2 API**

5. **Configure the credential**:
   - **Credential Name**: `Kajabi OAuth2`
   - **Grant Type**: `Client Credentials`
   - **Authorization URL**: Leave blank (not needed for client credentials flow)
   - **Access Token URL**: `https://api.kajabi.com/v1/oauth/token`
   - **Client ID**: `dtBLENEaM6znzzLeioUzCym2` (from environment template)
   - **Client Secret**: `Hi88JTdUcFCBRBjnzjyDW79d` (from environment template)
   - **Scope**: Leave blank
   - **Auth URI Query Parameters**: Leave blank
   - **Authentication**: `Body`

6. Click **Save**
7. Click **Test Credential** to verify it works
8. Note the credential ID for next step

---

## STEP 2: Update "Get Form Details from Kajabi" Node

**Why**: The workflow was created with a placeholder credential ID.

**Steps**:

1. Open the workflow: **UYSP-Kajabi-Realtime-Ingestion** (ID: e9s0pmmlZfrZ3qjD)
2. Click on node: **"Get Form Details from Kajabi"** (the HTTP Request node)
3. In the **Credentials** section:
   - Remove the placeholder credential
   - Select the **Kajabi OAuth2** credential you just created
4. Click **Save** (bottom right of workflow editor)

---

## STEP 3: Configure Airtable Field Mappings

**Why**: The Update and Create nodes need explicit field mappings configured in the UI.

### 3A: Configure "Update Existing Lead" Node

1. In the workflow, click on: **"Update Existing Lead"** node
2. Scroll down to **Fields to Send** section
3. Click **"Add Field"** and map each field:

**Field Mappings**:
```
Email → {{ $('Smart Field Mapper').item.json.email }}
First Name → {{ $('Smart Field Mapper').item.json.first_name }}
Last Name → {{ $('Smart Field Mapper').item.json.last_name }}
Phone → {{ $('Smart Field Mapper').item.json.phone }}
Kajabi Contact ID → {{ $('Smart Field Mapper').item.json.kajabi_contact_id }}
Kajabi Tags → {{ $('Smart Field Mapper').item.json.kajabi_tags }}
Campaign Assignment → {{ $('Smart Field Mapper').item.json.campaign_assignment }}
Lead Source Detail → {{ $('Smart Field Mapper').item.json.lead_source_detail }}
Kajabi Member Status → {{ $('Smart Field Mapper').item.json.kajabi_member_status }}
Kajabi Last Sync → {{ $('Smart Field Mapper').item.json.kajabi_last_sync }}
Source → {{ $('Smart Field Mapper').item.json.source }}
Processing Status → {{ $('Smart Field Mapper').item.json.processing_status }}
Linkedin URL - Person → {{ $('Smart Field Mapper').item.json.linkedin_url_person }}
```

4. Click **Save**

### 3B: Configure "Create New Lead" Node

1. Click on: **"Create New Lead"** node
2. Use **exactly the same field mappings** as Update Existing Lead (see above)
3. Click **Save**

### 3C: Configure "Log to Kajabi Sync Audit" Node

1. Click on: **"Log to Kajabi Sync Audit"** node
2. Click **"Add Field"** and map each field:

**Field Mappings**:
```
Kajabi Contact ID → {{ $('Smart Field Mapper').item.json.kajabi_contact_id }}
Lead Email → {{ $('Smart Field Mapper').item.json.email }}
Sync Timestamp → {{ $now }}
Duplicate Found → {{ $('Is Duplicate?').item.json.id ? true : false }}
Campaign Assigned → {{ $('Smart Field Mapper').item.json.campaign_assignment }}
Tags Captured → {{ $('Smart Field Mapper').item.json.kajabi_tags }}
Error Log → (leave empty for now - will be populated if errors occur)
```

3. Click **Save**

---

## STEP 4: Add "Kajabi-Webhook" Option to Source Field

**Why**: The workflow populates `source` field with "Webhook" but ideally it should be "Kajabi-Webhook" to distinguish from other webhook sources.

**Steps**:

1. Open Airtable: https://airtable.com/app4wIsBfpJTg7pWS
2. Navigate to: **Leads** table (tblYUvhGADerbD8EO)
3. Click on the **Source** field header
4. Click **Customize field type**
5. Add a new choice: `Kajabi-Webhook` (color: green recommended)
6. Click **Save**

**Then update the workflow**:
1. Go back to n8n workflow
2. Open the **"Smart Field Mapper"** node
3. Find the line: `source: 'Webhook',`
4. Change it to: `source: 'Kajabi-Webhook',`
5. Click **Save**

---

## STEP 5: Get Form IDs from Ian's Kajabi

**Why**: The workflow needs to map form IDs to campaigns, but we don't know Ian's actual form IDs yet.

**Steps**:

### Option A: Ask Ian to Provide Form List (Manual)
1. Ask Ian to go to: Kajabi → Forms
2. Ask him to screenshot the list showing:
   - Form names
   - Form purposes (which webinar/campaign each form is for)
3. Manually note the form IDs if visible in the UI

### Option B: Use Kajabi API to Get Forms (Automated - Recommended)
1. Open n8n workflow: **UYSP-Kajabi-Realtime-Ingestion**
2. Add a temporary **HTTP Request** node:
   - **Method**: GET
   - **URL**: `https://api.kajabi.com/v1/forms`
   - **Authentication**: Select the `Kajabi OAuth2` credential
3. Click **"Test step"** to execute
4. Review the response - it will show all forms with their IDs and names
5. Document the form ID → campaign mappings in a table:

```
Example:
form_abc123 → webinar_jb_2024
form_xyz789 → webinar_sales_2024
form_def456 → webinar_ai_2024
```

### Update the Workflow with Form Mappings
1. Open the **"Map Form to Campaign"** node
2. Find this section in the code:
```javascript
const formToCampaign = {
  // Add real form IDs here once obtained from Ian
  // Example: 'form_abc123': 'webinar_jb_2024',
};
```

3. Replace it with actual mappings:
```javascript
const formToCampaign = {
  'form_abc123': 'webinar_jb_2024',
  'form_xyz789': 'webinar_sales_2024',
  'form_def456': 'webinar_ai_2024',
  'form_newsletter_001': 'newsletter_nurture'
  // Add more as needed
};
```

4. Click **Save**

---

## STEP 6: Test the Webhook URL

**Steps**:

1. In the n8n workflow, click on the **"Kajabi Webhook"** node
2. Copy the **Production URL** (it will look like):
   ```
   https://rebelhq.app.n8n.cloud/webhook/kajabi-leads
   ```

3. Test with a sample payload using curl:
```bash
curl -X POST https://rebelhq.app.n8n.cloud/webhook/kajabi-leads \
  -H "Content-Type: application/json" \
  -d '[{
    "id": "test_submission_123",
    "type": "form_submissions",
    "attributes": {
      "name": "John Test",
      "email": "john.test@example.com",
      "phone_number": "5555551234",
      "custom_1": "https://linkedin.com/in/johntest",
      "custom_2": "Yes, interested in coaching",
      "custom_3": ""
    },
    "relationships": {
      "form": {
        "data": {
          "id": "form_test_123",
          "type": "forms"
        }
      },
      "tags": {
        "data": [
          {"id": "tag_1", "type": "tags"}
        ]
      }
    }
  }]'
```

4. Check the workflow execution in n8n
5. Verify a record was created in Airtable → Leads table
6. Verify an audit log was created in Kajabi_Sync_Audit table

---

## STEP 7: Activate the Workflow

**Only after all above steps are complete and tested!**

1. Open the workflow in n8n
2. Click the toggle in the top-right corner to **Activate**
3. The workflow is now listening for live Kajabi webhooks

---

## 📋 CONFIGURATION CHECKLIST

Use this checklist to track your progress:

- [ ] Step 1: Created Kajabi OAuth2 credential in n8n
- [ ] Step 2: Updated "Get Form Details" node with real credential
- [ ] Step 3A: Configured "Update Existing Lead" field mappings (13 fields)
- [ ] Step 3B: Configured "Create New Lead" field mappings (13 fields)
- [ ] Step 3C: Configured "Log to Kajabi Sync Audit" field mappings (6 fields)
- [ ] Step 4: Added "Kajabi-Webhook" option to Source field in Airtable
- [ ] Step 4: Updated Smart Field Mapper to use "Kajabi-Webhook"
- [ ] Step 5: Got form IDs from Ian (via API or manual)
- [ ] Step 5: Updated "Map Form to Campaign" node with real form IDs
- [ ] Step 6: Tested webhook with sample payload
- [ ] Step 6: Verified Airtable record created successfully
- [ ] Step 6: Verified audit log created successfully
- [ ] Step 7: Activated the workflow (set to live)

---

## 🔗 QUICK LINKS

**n8n Workflow**:
https://rebelhq.app.n8n.cloud/workflow/e9s0pmmlZfrZ3qjD

**Airtable Base**:
https://airtable.com/app4wIsBfpJTg7pWS

**Kajabi API Docs**:
https://developers.kajabi.com

**Webhook URL** (to configure in Kajabi):
```
https://rebelhq.app.n8n.cloud/webhook/kajabi-leads
```

---

## 🚨 TROUBLESHOOTING

### OAuth Credential Test Fails
**Problem**: "Authentication failed" when testing credential  
**Solution**: 
- Verify client_id and client_secret are correct
- Ensure Authentication is set to "Body" (not "Header")
- Check that Access Token URL is exactly: `https://api.kajabi.com/v1/oauth/token`

### Workflow Test Shows "Missing Required Field"
**Problem**: Airtable node fails with "Missing required field"  
**Solution**:
- Verify all field mappings are configured in Step 3
- Check that field names exactly match Airtable (case-sensitive)
- Ensure expressions use correct node name references

### Form ID Not Mapping to Campaign
**Problem**: All leads get "default_nurture" campaign  
**Solution**:
- Verify form IDs in "Map Form to Campaign" node match real form IDs from Kajabi
- Test by logging `formId` variable in that node
- Check that form IDs are exact string matches (case-sensitive)

---

## 📞 NEXT STEPS AFTER MANUAL CONFIGURATION

Once all manual steps are complete:

1. **Week 1, Day 4**: Run comprehensive tests (5 test cases)
2. **Week 1, Day 5**: Validate end-to-end with Clay integration
3. **Week 2**: Add campaign-specific SMS templates
4. **Week 3**: Soft launch with one form, then full rollout

---

**Last Updated**: October 17, 2025  
**Workflow Version**: v1.0  
**Status**: ⚠️ Requires manual configuration before activation




