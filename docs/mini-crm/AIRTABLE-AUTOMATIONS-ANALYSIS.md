# Airtable Automations in Mini-CRM Architecture

**Date:** November 7, 2025  
**Status:** Analysis & Recommendation  
**Decision:** Keep for now, migrate later (optional)

---

## 📊 Current Airtable Automations

### 1. Move to HRQ on Enrichment Fail
**Trigger:** Enrichment field changes  
**Action:** Set status = "HRQ" (Human Review Queue)  
**Frequency:** Per enrichment attempt

### 2. Move to Ready for SMS
**Trigger:** Enrichment completes successfully  
**Action:** Set status = "Ready for SMS"  
**Frequency:** Per successful enrichment

### 3. Backfill Country (US/Canada Detection)
**Trigger:** Phone has value, country is blank  
**Action:** If phone starts with +1 → Set country = "US or Canada"  
**Purpose:** Determine SMS vs WhatsApp routing  
**Frequency:** Continuous (view-based)

### 4. Deactivate Complete Leads
**Trigger:** Lead status = "Complete"  
**Action:** Set is_active = false  
**Frequency:** Continuous

### 5. Deactivate Stopped Leads  
**Trigger:** Lead opted out or stopped  
**Action:** Set is_active = false  
**Frequency:** Continuous

---

## 🏗️ How They Fit in Mini-CRM Architecture

**Current flow:**
```
Kajabi → Airtable Leads
  ↓
Clay enrichment
  ↓
Airtable automations (status changes)
  ↓
Airtable → PostgreSQL sync (every 5 min)
  ↓
UI reads from PostgreSQL
```

**With Mini-CRM:**
```
Kajabi → Airtable Leads
  ↓
Clay enrichment
  ↓
Airtable automations (UNCHANGED - still work)
  ↓
Airtable → PostgreSQL sync (UNCHANGED - every 5 min)
  ↓
n8n workflows log activities → PostgreSQL activity_log (NEW)
  ↓
UI reads from PostgreSQL (leads + activity_log)
```

**Answer:** Automations are **completely unaffected** by Mini-CRM. They run in Airtable, sync to PostgreSQL via existing process.

---

## 💡 Opportunity for Improvement

**Problem with current Airtable automations:**
- ❌ No visibility (can't see when they run)
- ❌ No error handling (fail silently)
- ❌ No audit trail (can't troubleshoot)
- ❌ Limited logic (Airtable formulas only)
- ❌ Can't easily add activity logging

**Better approach: Migrate to n8n + Activity Logging**

### Example: Country Backfill Automation

**Current (Airtable):**
```
Trigger: View "Leads Missing Country"
Action: Set country = "US or Canada"
```

**Improved (n8n + Mini-CRM):**
```
Node 1: PostgreSQL Trigger (poll for leads.phone NOT NULL AND leads.country IS NULL)
Node 2: Code - Detect country from phone prefix
Node 3: Update PostgreSQL leads table
Node 4: Sync to Airtable (via airtableSyncQueue)
Node 5: Log activity (SYSTEM_EVENT: COUNTRY_BACKFILLED)
```

**Benefits:**
- ✅ Visible in n8n execution logs
- ✅ Retry logic (3 attempts)
- ✅ Error handling → Retry_Queue
- ✅ Activity logged for audit trail
- ✅ Can add complex logic (not just formulas)

---

## 📋 Migration Strategy (POST-LAUNCH)

**Recommendation:** Keep Airtable automations for Week 1-4, migrate later

**Why wait:**
- They work fine (don't break what's working)
- Mini-CRM foundation needs to be stable first
- Migration is LOW priority vs core features

**When to migrate:** After Mini-CRM proven stable (30+ days post-launch)

**How to migrate (one at a time):**

### Step 1: Pick One Automation
Start with simplest: **Country Backfill**

### Step 2: Build n8n Equivalent
- Schedule trigger (every 15 min)
- Query PostgreSQL for missing countries
- Detect country from phone prefix
- Update PostgreSQL
- Sync to Airtable
- Log activity

### Step 3: Run in Parallel (Dual-Write)
- Keep Airtable automation active
- Run n8n workflow in parallel
- Verify both produce same results

### Step 4: Cutover
- Disable Airtable automation
- Monitor n8n workflow for 7 days
- If stable, delete Airtable automation

### Step 5: Repeat for Others
- HRQ on enrichment fail
- Ready for SMS status
- Deactivate complete/stopped

**Timeline:** 2 hours per automation × 5 = 10 hours total

---

## 🎯 Immediate Recommendation

**For Week 1-4 (Mini-CRM Build):**

✅ **KEEP Airtable automations as-is**
- They don't interfere with activity logging
- Migration is separate concern
- Don't add scope creep to Mini-CRM project

**Post-Launch (Optional Enhancement):**

⚠️ **MIGRATE to n8n workflows later**
- Adds visibility and error handling
- Enables activity logging for automation actions
- Reduces "hidden magic" in Airtable
- Estimated: 10 hours total

**Decision needed:** Migrate automations now OR later?

**My recommendation:** LATER (after Mini-CRM stable)

---

## 📊 If Migrating Now (Not Recommended)

**Add to timeline:**
- Week 5: Migrate automations (10 hours)
- Test in parallel with existing automations
- Cutover one at a time

**Adds scope:** 10 hours to project (total becomes 78 hours)

**Benefits:** 
- Unified workflow management (all in n8n)
- Activity logging for automation actions
- Better error handling

**Risks:**
- Scope creep
- Delays Mini-CRM completion
- Automation bugs during migration

---

## ✅ Final Recommendation

**Keep automations unchanged for Mini-CRM project.**

They're orthogonal to activity logging—Mini-CRM logs what happens to leads (messages, bookings, enrollments), automations manage lead statuses (HRQ, ready for SMS, deactivation).

**Post-launch:** Revisit automation migration as separate project if desired.

---

**Decision needed from strategic agent:** Keep automations as-is OR add migration to scope?

