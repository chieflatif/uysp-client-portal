# Kajabi Integration - Test Payloads
**Created**: October 17, 2025  
**For**: Day 4 testing of UYSP-Kajabi-Realtime-Ingestion workflow  
**Workflow ID**: e9s0pmmlZfrZ3qjD

---

## 📋 TEST CASES OVERVIEW

These 5 test cases cover all critical scenarios for the Kajabi integration:

1. **New Lead with All Fields** - Happy path, complete data
2. **Duplicate Email** - Tests update logic
3. **Minimal Data** - Tests error handling for incomplete submissions
4. **Multiple Tags** - Tests tag capture
5. **Invalid Email** - Tests validation

---

## TEST CASE 1: New Lead with All Fields ✅

**Purpose**: Verify complete happy path - new lead with full data gets created

**Expected Result**:
- New record created in Leads table
- All fields populated correctly
- Campaign assigned based on form ID
- Processing Status = "Queued"
- Source = "Webhook" (or "Kajabi-Webhook" after manual update)
- Audit log created in Kajabi_Sync_Audit

**cURL Command**:
```bash
curl -X POST https://rebelhq.app.n8n.cloud/webhook/kajabi-leads \
  -H "Content-Type: application/json" \
  -d '[{
    "id": "test_submission_001",
    "type": "form_submissions",
    "attributes": {
      "name": "Sarah Johnson",
      "email": "sarah.johnson@techstartup.com",
      "phone_number": "4155551234",
      "business_number": "",
      "address_line_1": "123 Market St",
      "address_city": "San Francisco",
      "address_state": "CA",
      "address_country": "United States",
      "address_zip": "94102",
      "custom_1": "https://linkedin.com/in/sarahjohnson",
      "custom_2": "Yes, very interested in coaching",
      "custom_3": "Referred by colleague"
    },
    "relationships": {
      "form": {
        "data": {
          "id": "form_jb_webinar_001",
          "type": "forms"
        }
      },
      "tags": {
        "data": [
          {"id": "tag_jb_webinar", "type": "tags"},
          {"id": "tag_b2b_saas", "type": "tags"}
        ]
      }
    }
  }]'
```

**Verification Checklist**:
- [ ] Lead record created in Airtable
- [ ] Email = "sarah.johnson@techstartup.com"
- [ ] First Name = "Sarah"
- [ ] Last Name = "Johnson"
- [ ] Phone = "+14155551234" (E.164 format)
- [ ] Kajabi Tags = JSON array with 2 tag IDs
- [ ] Campaign Assignment = "webinar_jb_2024" (or "default_nurture" if form ID not mapped)
- [ ] Lead Source Detail = form name from API
- [ ] Processing Status = "Queued"
- [ ] Linkedin URL Person = "https://linkedin.com/in/sarahjohnson"
- [ ] Audit log created with Duplicate Found = false

---

## TEST CASE 2: Duplicate Email 🔄

**Purpose**: Verify update logic - duplicate email should update existing record, not create new

**Prerequisites**: Run Test Case 1 first to create the initial record

**Expected Result**:
- Existing record UPDATED (not new record created)
- New data overwrites old data
- Processing Status updates to "Queued"
- Kajabi Last Sync timestamp updates
- Audit log shows Duplicate Found = true

**cURL Command**:
```bash
curl -X POST https://rebelhq.app.n8n.cloud/webhook/kajabi-leads \
  -H "Content-Type: application/json" \
  -d '[{
    "id": "test_submission_002",
    "type": "form_submissions",
    "attributes": {
      "name": "Sarah M. Johnson",
      "email": "sarah.johnson@techstartup.com",
      "phone_number": "4155559999",
      "custom_1": "https://linkedin.com/in/sarahmjohnson",
      "custom_2": "Already signed up, want Platinum tier",
      "custom_3": ""
    },
    "relationships": {
      "form": {
        "data": {
          "id": "form_sales_webinar_002",
          "type": "forms"
        }
      },
      "tags": {
        "data": [
          {"id": "tag_sales_webinar", "type": "tags"},
          {"id": "tag_high_intent", "type": "tags"}
        ]
      }
    }
  }]'
```

**Verification Checklist**:
- [ ] Only ONE record exists for sarah.johnson@techstartup.com
- [ ] Last Name = "M. Johnson" (updated)
- [ ] Phone = "+14155559999" (updated)
- [ ] Campaign Assignment = "webinar_sales_2024" (updated based on new form)
- [ ] LinkedIn URL updated to new value
- [ ] Kajabi Last Sync timestamp is recent
- [ ] Audit log created with Duplicate Found = true
- [ ] No duplicate records created

---

## TEST CASE 3: Minimal Data ⚠️

**Purpose**: Test handling of incomplete submissions (missing phone, custom fields)

**Expected Result**:
- Record still created (email is the only required field)
- Missing fields left blank or use defaults
- No errors thrown
- Processing continues normally

**cURL Command**:
```bash
curl -X POST https://rebelhq.app.n8n.cloud/webhook/kajabi-leads \
  -H "Content-Type: application/json" \
  -d '[{
    "id": "test_submission_003",
    "type": "form_submissions",
    "attributes": {
      "name": "MinimalUser",
      "email": "minimal@test.com",
      "phone_number": "",
      "custom_1": "",
      "custom_2": "",
      "custom_3": ""
    },
    "relationships": {
      "form": {
        "data": {
          "id": "form_unknown_123",
          "type": "forms"
        }
      },
      "tags": {
        "data": []
      }
    }
  }]'
```

**Verification Checklist**:
- [ ] Lead record created
- [ ] Email = "minimal@test.com"
- [ ] First Name = "MinimalUser"
- [ ] Last Name = "" (blank)
- [ ] Phone = "" (blank)
- [ ] Kajabi Tags = "[]" (empty array)
- [ ] Campaign Assignment = "default_nurture" (unknown form ID)
- [ ] LinkedIn URL = "" (blank)
- [ ] No errors in workflow execution
- [ ] Audit log created with no errors

---

## TEST CASE 4: Multiple Tags 🏷️

**Purpose**: Verify JSON serialization of multiple Kajabi tags

**Expected Result**:
- Tags properly serialized as JSON array
- All tag IDs captured
- No data loss

**cURL Command**:
```bash
curl -X POST https://rebelhq.app.n8n.cloud/webhook/kajabi-leads \
  -H "Content-Type: application/json" \
  -d '[{
    "id": "test_submission_004",
    "type": "form_submissions",
    "attributes": {
      "name": "Multi Tag Person",
      "email": "multitag@example.com",
      "phone_number": "5105551111",
      "custom_1": "",
      "custom_2": "",
      "custom_3": ""
    },
    "relationships": {
      "form": {
        "data": {
          "id": "form_ai_webinar_003",
          "type": "forms"
        }
      },
      "tags": {
        "data": [
          {"id": "tag_ai_webinar", "type": "tags"},
          {"id": "tag_b2b_saas", "type": "tags"},
          {"id": "tag_enterprise", "type": "tags"},
          {"id": "tag_high_value", "type": "tags"},
          {"id": "tag_decision_maker", "type": "tags"}
        ]
      }
    }
  }]'
```

**Verification Checklist**:
- [ ] Lead record created
- [ ] Email = "multitag@example.com"
- [ ] Kajabi Tags = JSON array with 5 tag objects
- [ ] Campaign Assignment = "webinar_ai_2024" (or default if not mapped)
- [ ] All 5 tag IDs present in Kajabi Tags field
- [ ] Audit log Tags Captured shows all 5 tags
- [ ] No tag data lost

---

## TEST CASE 5: Invalid/Edge Case Data ❌

**Purpose**: Test resilience to malformed or unusual data

**Expected Result**:
- Workflow handles gracefully without breaking
- Invalid data either skipped or defaults used
- Error logged but execution continues

**cURL Command**:
```bash
curl -X POST https://rebelhq.app.n8n.cloud/webhook/kajabi-leads \
  -H "Content-Type: application/json" \
  -d '[{
    "id": "test_submission_005",
    "type": "form_submissions",
    "attributes": {
      "name": "      ",
      "email": "notreally@email@oops.com",
      "phone_number": "abc-not-a-phone",
      "custom_1": null,
      "custom_2": null,
      "custom_3": null
    },
    "relationships": {
      "form": {
        "data": {
          "id": "",
          "type": "forms"
        }
      },
      "tags": {
        "data": null
      }
    }
  }]'
```

**Verification Checklist**:
- [ ] Workflow executes without crashing
- [ ] Record created (even with bad data)
- [ ] Email = "notreally@email@oops.com" (preserved as-is)
- [ ] First Name = "" (blank after trim)
- [ ] Phone = "" or sanitized value
- [ ] Null values handled gracefully
- [ ] Campaign = "default_nurture" (empty form ID)
- [ ] Error log in audit record (if any errors occurred)
- [ ] Workflow completes execution

---

## 🧪 TESTING PROCEDURE

### Before Testing
1. ✅ Complete all manual configuration steps (see MANUAL-CONFIGURATION-GUIDE.md)
2. ✅ Verify OAuth2 credential is working (test in n8n)
3. ✅ Verify Airtable field mappings are configured
4. ✅ Activate the workflow in n8n

### During Testing
1. Run each test case in order (1 → 2 → 3 → 4 → 5)
2. After each test:
   - Check n8n workflow execution log
   - Verify Airtable Leads table
   - Verify Kajabi_Sync_Audit table
   - Check for errors in workflow

### After Testing
1. Document results in this file (check off verification checklists)
2. Take screenshots of:
   - Successful workflow executions
   - Airtable records created
   - Audit logs
3. Fix any issues found
4. Re-run failed tests until all pass

---

## 📊 TEST RESULTS SUMMARY

**Date Tested**: ________________  
**Tested By**: ________________

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1. New Lead with All Fields | ⬜ Pass / ⬜ Fail | |
| 2. Duplicate Email | ⬜ Pass / ⬜ Fail | |
| 3. Minimal Data | ⬜ Pass / ⬜ Fail | |
| 4. Multiple Tags | ⬜ Pass / ⬜ Fail | |
| 5. Invalid/Edge Case | ⬜ Pass / ⬜ Fail | |

**Overall Result**: ⬜ All Pass | ⬜ Some Failures | ⬜ Not Tested

**Issues Found**:
- 

**Next Steps**:
- 

---

## 🔗 QUICK LINKS

**Workflow**: https://rebelhq.app.n8n.cloud/workflow/e9s0pmmlZfrZ3qjD  
**Airtable Base**: https://airtable.com/app4wIsBfpJTg7pWS  
**Leads Table**: https://airtable.com/app4wIsBfpJTg7pWS/tblYUvhGADerbD8EO  
**Audit Table**: https://airtable.com/app4wIsBfpJTg7pWS/tbl0znQdpA2DI2EcP  

---

**Last Updated**: October 17, 2025  
**Status**: Ready for testing once manual configuration complete

