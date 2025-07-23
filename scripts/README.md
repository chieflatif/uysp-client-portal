# 🚀 UYSP Phase 00 Infrastructure Scripts

**CRITICAL**: Execute these scripts in order to set up complete infrastructure for Session 1+

## ✅ AIRTABLE-MCP CONFIRMED WORKING
- Base: `appuBf0fTe8tp8ZaF` 
- Connection: ✅ Verified
- Tables: 10/12 exist (2 missing)
- People Fields: 47/~70 (22+ critical fields missing)

---

## 📋 EXECUTION ORDER

### 1️⃣ **01-create-missing-tables.sh**
**Creates 2 missing critical tables**

```bash
./scripts/01-create-missing-tables.sh
```

**Creates:**
- `Field_Mapping_Log` - CRITICAL for Session 0 field normalization
- `Human_Review_Queue` - For unclear leads requiring manual review

**Manual Steps After:**
- Add autoNumber `id` field to Field_Mapping_Log via Airtable UI
- Set `id` as primary field

---

### 2️⃣ **02-add-missing-people-fields.sh**
**Adds 22 critical fields to People table**

```bash
./scripts/02-add-missing-people-fields.sh
```

**Adds These CRITICAL Fields:**
- `qualified_lead`, `contacted` (boolean webhook variants)
- `field_mapping_success_rate`, `normalization_version` (Session 0)
- `raw_webhook_data`, `validation_errors` (debugging)
- `webhook_field_count`, `mapped_field_count`, `unknown_field_list` (Session 0)
- `phase1_attempted`, `phase1_passed`, `phase2_attempted`, `phase2_passed` (Session 3)
- `scoring_attempted`, `scoring_method_used` (Session 3)
- `apollo_org_cost`, `apollo_person_cost`, `twilio_cost`, `claude_cost`, `total_processing_cost` (cost tracking)
- `phone_country_code`, `requires_international_handling` (international routing)

---

### 3️⃣ **03-setup-environment-variables.sh**
**Displays checklist of 17 required n8n environment variables**

```bash
./scripts/03-setup-environment-variables.sh
```

**⚠️ MANUAL ACTION REQUIRED:**
- Copy all 17 variables into n8n UI manually
- Workspace: https://rebelhq.app.n8n.cloud/projects/H4VRaaZhd8VKQANf/
- Navigate: Settings → Environment Variables

---

### 4️⃣ **04-load-test-data.sh**
**Loads initial test data into all tables**

```bash
./scripts/04-load-test-data.sh
```

**Loads:**
- DND_List: 2 test entries (US +1 & UK +44 numbers)
- Daily_Costs: Today's record
- Field_Mapping_Log: System initialization record
- Workflow_IDs: Bootstrap workflow entry
- Daily_Metrics: Today's metrics baseline

---

### 5️⃣ **05-final-verification.sh**
**Comprehensive validation of complete setup**

```bash
./scripts/05-final-verification.sh
```

**Validates:**
- All 12 tables exist
- People table has ~70 fields
- All 22 critical fields present
- Test data loaded correctly
- Reports overall readiness percentage

---

## 🎯 EXPECTED FINAL STATE

After running all 5 scripts:

### ✅ INFRASTRUCTURE READY (100%):
- **Tables**: 12/12 ✅
- **People Fields**: ~70/70 ✅  
- **Critical Fields**: 22/22 ✅
- **Test Data**: All loaded ✅
- **Environment Variables**: 17/17 (manual setup)

### 🚀 READY FOR SESSION 1:
- Field normalization (Session 0) ✅
- Webhook receiver (Session 1) ✅
- Cost tracking ✅
- Error handling ✅
- International routing ✅

---

## 🔧 REQUIREMENTS

### Prerequisites:
- `AIRTABLE_API_KEY` environment variable set
- `curl` and `jq` installed
- Airtable-MCP working (✅ confirmed)

### API Requirements:
```bash
export AIRTABLE_API_KEY="your_key_here"
```

---

## 🚨 CRITICAL NOTES

1. **Execute in order** - dependencies exist between scripts
2. **Manual steps required** - Some Airtable limitations require UI actions
3. **Environment variables** - Must be set manually in n8n UI (script 3)
4. **Verification essential** - Run script 5 to confirm 100% ready
5. **Session 0 dependency** - Field normalization requires all new fields

---

## 📊 SUCCESS CRITERIA

**Phase 00 Complete When:**
- Script 5 reports 100% infrastructure ready
- All 22 critical fields added to People table
- 17 environment variables set in n8n UI
- Verification workflow executes successfully

**Then ready for Session 1 workflow implementation! 🚀** 