# Critical Assumptions & Risks - Review Before Day 2

**Date**: October 26, 2025  
**Purpose**: Flag potential issues that could bite us later  
**Action**: Review and verify before proceeding

---

## 🚨 CRITICAL: PRD vs Reality Mismatch

### Issue: PRD Says SimpleTexting, You're Using Twilio

**PRD states** (PRD-TWO-WAY-AI-MESSAGING-SYSTEM.md):
- Line 57: "SimpleTexting account with webhook access"
- Line 1332: Lists SimpleTexting as required service
- References SimpleTexting throughout

**Reality** (Verified in n8n):
- ✅ Migrated to Twilio (October 17, 2025)
- ✅ Active workflows: UYSP-Twilio-Inbound-Messages, UYSP-Twilio-Status-Callback
- ✅ All my specs use Twilio (correct)

**Risk**: **MEDIUM**
- PRD is outdated
- Anyone following PRD will be confused
- SimpleTexting != Twilio (different APIs, features, pricing)

**Action Required**:
1. **Update PRD**: Replace all "SimpleTexting" with "Twilio"
2. **Or**: Add note at top: "Note: Migrated to Twilio Oct 2025, PRD reflects original plan"

**My Work**: ✅ All correct (used Twilio throughout)

---

## ⚠️ ASSUMPTION 1: Follow-up Date Can Change Type

**What I told you**: Manually change `Follow-up Date/Time` from Date → DateTime

**Assumption**: Field is empty or Airtable allows type change with data

**Reality Check**: 
- Field exists: fldnGRfk7qRrADP7x
- Checked 5 sample records: Field NOT populated in those records
- Likely sparse or empty

**Risk**: **LOW**
- If field has data, type change might fail
- Airtable might require creating new field instead

**Fallback**: 
- If type change fails, create new field `Follow-up DateTime` (separate field)
- Use that for AI scheduling
- Keep old `Follow-up Date` for manual notes

**Verification**: Try the type change, if it fails, create new field

---

## ⚠️ ASSUMPTION 2: Twilio Messaging Service Doesn't Exist Yet

**I assumed**: Need to create Messaging Service on Day 2

**Possible Reality**: Might already exist from Oct 17 migration

**Risk**: **LOW**
- Might create duplicate service
- Or might already be configured

**Action Before Day 2**:
1. Check Twilio Console for existing Messaging Services
2. If exists: Use existing MessagingServiceSid
3. If not: Create new one

**Verification**: Check Twilio Console → Messaging → Services

---

## ⚠️ ASSUMPTION 3: Link Shortening Costs Are Acceptable

**I said**: Engagement Suite costs $0.005/message (~$3/day for 600 messages)

**Assumption**: User is okay with this additional cost

**Reality**: Not confirmed yet

**Risk**: **LOW-MEDIUM**
- Adds $90/month to bill
- User might prefer free (long URLs, no click tracking)

**Action Before Enabling**:
- Get user approval for $3/day additional cost
- Or use long URLs (free) and skip click tracking

**Alternative**: Start without link shortening, add later if valuable

---

## ⚠️ ASSUMPTION 4: Oct 17 Inbound Handler Needs AI Integration

**I assumed**: Existing UYSP-Twilio-Inbound-Messages needs enhancement

**Oct 17 workflow** (9 nodes):
- Receives inbound SMS
- Finds lead by phone
- Logs to SMS_Audit
- Routes to Slack or auto-responds (intent classification)

**My Plan**: Integrate AI safety module with this workflow

**Risk**: **MEDIUM**
- Might conflict with existing logic
- Oct 17 has intent classification (12 categories) - might overlap with AI
- Need to understand existing workflow first before modifying

**Action Before Day 2**:
1. Export existing UYSP-Twilio-Inbound-Messages workflow
2. Understand current logic (what it does now)
3. Plan integration (not replacement)
4. Ensure no conflicts

**Verification**: Export workflow ID ujkG0KbTYBIubxgK and review

---

## ⚠️ ASSUMPTION 5: All New Fields Start Empty

**I assumed**: Safe to add fields, they'll start empty

**Reality**: Usually true, but check for:
- Formula fields that auto-calculate
- Linked record fields that auto-populate
- Computed fields

**Current check**: All fields we added are:
- Text, Number, Checkbox, Select, DateTime = Start empty ✅
- No formulas, no auto-links = Safe ✅

**Risk**: **VERY LOW** (all our fields are simple types)

---

## ⚠️ ASSUMPTION 6: Retry_Queue Won't Get Huge

**Design**: Queue stores failed operations for retry

**Assumption**: Queue will be small (<100 records typically)

**Risk**: **LOW-MEDIUM**
- If systemic issue (Airtable down for hours), queue could grow large
- Thousands of queued operations = slow to process

**Mitigation Built In**:
- Max 3 retries then escalate to human (prevents infinite queue)
- Exponential backoff (5 min, 10 min, 20 min)
- Alert when circuit breaker triggers

**Monitor**: Queue size in dashboard, alert if >500 records

---

## ⚠️ ASSUMPTION 7: Twilio Phone Number in Environment

**My specs assume**: Twilio credentials configured in n8n

**Check needed**:
- n8n has Twilio credentials configured?
- Phone number: +1 818-699-0998 (from docs)
- Account SID and Auth Token in n8n $vars?

**Risk**: **LOW** (Oct 17 system working, so credentials exist)

**Verification**: Credentials exist if Oct 17 workflows are sending successfully

---

## ✅ NON-ISSUES (Verified Safe)

### ✅ Twilio Workflows Exist
- Verified: ujkG0KbTYBIubxgK active in n8n
- Verified: 39yskqJT3V6enem2 active in n8n

### ✅ Config Records Populated
- Verified: AI_Config has UYSP data
- Verified: fallback_responses now populated

### ✅ Field IDs Valid
- All field IDs documented
- All fields created successfully

### ✅ No Table/Field Conflicts
- New fields don't conflict with existing
- Integration with Oct 17 system is additive

---

## 🎯 ACTION ITEMS BEFORE DAY 2

### CRITICAL:
1. **[ ] Export existing UYSP-Twilio-Inbound-Messages workflow**
   - ID: ujkG0KbTYBIubxgK
   - Understand current logic before modifying
   - Ensure AI integration doesn't break existing system

2. **[ ] Verify Twilio Messaging Service status**
   - Check if already exists from Oct 17
   - Get MessagingServiceSid if exists
   - Or plan to create new one

### MEDIUM:
3. **[ ] Decide on Link Shortening**
   - Enable ($3/day extra) or skip (free)?
   - User approval needed for cost

4. **[ ] Update PRD to say Twilio** (not SimpleTexting)
   - Or add migration note
   - Prevent confusion

### LOW:
5. **[ ] Test Follow-up Date type change**
   - Try changing to DateTime
   - If fails, create new field instead

6. **[ ] Verify Twilio credentials in n8n**
   - Check $vars for TWILIO_ACCOUNT_SID
   - Check credentials configured

---

## 💡 RECOMMENDATION

**Before starting Day 2 workflows**:

1. ✅ Export existing inbound workflow (10 min)
2. ✅ Understand current logic (15 min)
3. ✅ Plan integration approach (15 min)
4. ✅ Get approval for link shortening cost (5 min)

**Total**: 45 minutes of prep prevents hours of rework

**Then**: Build safety module that integrates (not replaces) existing system

---

**Status**: Potential issues identified  
**Severity**: None critical, all manageable  
**Action**: Verify assumptions before Day 2

---

*Critical assumptions documented. Most are low-risk. Main issue: PRD outdated (says SimpleTexting, reality is Twilio). Export existing workflow before modifying.*

