# Human Review Queue (HRQ) Workflow SOP

**Date**: 2025-08-30  
**Status**: Finalized v1 (no new workflows)  
**Purpose**: Define complete HRQ routing logic, reasons, and human reviewer actions

---

## 🎯 **HRQ OVERVIEW**

**Purpose**: Route leads that require human review before SMS campaigns or enrichment processing.

**Core Principle**: Prevent wasted costs on personal emails and low-quality leads while allowing human override for edge cases.

---

## 📥 **ROUTING TO HRQ (2 Paths)**

### **Path 1: Personal Email Detection** ✅ IMPLEMENTED
- **Trigger**: Personal email domains (gmail.com, yahoo.com, hotmail.com, outlook.com, icloud.com, etc.)
- **When**: During initial ingestion (Bulk Import & Real-time)
- **Action**: 
  - `HRQ Status = "Archive"`
  - `HRQ Reason = "Personal email"`
  - `Processing Status = "Complete"` (skip all enrichment)

### **Path 2: Post-Enrichment (No Person Data) — View-Only Detection** ✅ IMPLEMENTED (no node changes)
- **Trigger (view filter only, no field writes)**: After enrichment attempt, both person-only fields are still empty:
  - `Job Title` is empty
  - `Linkedin URL - Person` is empty
- **When**: After Clay writeback occurs (use `Enrichment Timestamp` not empty to ensure it ran)
- **Action**: None written to fields. A dedicated Airtable view surfaces these for reviewers. Reviewers decide the next step.

---

## 📤 **HRQ ACTIONS (Human Reviewer Options)**

### **1. Archive**
- **Purpose**: Dead end, no further processing
- **System Action**: No automated action, lead remains archived
- **Use Cases**: Confirmed personal emails, invalid leads, competitors

### **2. Manual Process** 
- **Purpose**: Route to manual outreach (not SMS)
- **System Action**: Move to manual outreach view for human-driven contact
- **Use Cases**: High-value prospects not meeting SMS criteria, special handling needed

### **3. Qualified**
- **Purpose**: Approve for SMS processing (covers enrichment retry)
- **Reviewer Action**:
  - Set `HRQ Status = "Qualified"` AND set `Processing Status = "Queued"`
- **System Behavior**:
  - Scheduler picks it up automatically (no new workflow). Entry still governed by `SMS Eligible` formula and existing scheduler filters.
- **Use Cases**: Human override for edge cases or to resume a lead after enrichment gaps

---

## 🔄 **HRQ REASON TAXONOMY**

### **Inbound Reasons** (During Ingestion)
- **"Personal email"** - gmail.com, yahoo.com, etc. detected at ingestion
- **"Data quality error"** - missing phone, invalid email, incomplete data

### **Post-Enrichment Indicators** (After Clay Processing)
- We avoid storing free-text reasons for enrichment outcomes. Instead, use view-only detection based on missing person fields after `Enrichment Timestamp` is set (see Views section).

### **Re-Entry Prevention**
- If lead was previously "Qualified" and returns to HRQ → Use "Enrichment failed" reason
- Prevents infinite enrichment loops

---

## 🛠️ **TECHNICAL IMPLEMENTATION**

### **Required Airtable Updates**
**HRQ Status Field Options:**
- None (default)
- Archive  
- Manual Process
- Qualified ← (Covers both approval and enrichment retry)

### **Workflow Interactions (No New Workflows)**
- Do not add new workflows or IF nodes. The existing scheduler handles pickup.
- Reviewer changing `HRQ Status = "Qualified"` AND `Processing Status = "Queued"` is sufficient for the scheduler to process on the next run window.

---

## 📊 **HRQ VIEWS & REPORTING**

### **Airtable Views**
- Already present: **"HRQ Personal email (n8n auto find)"**
- Add: **"HRQ — Manual Process"**  
  Filter: `HRQ Status` is "Manual Process" AND `Booked` is unchecked
- Add: **"HRQ — Enrichment Failed (No Person Data)"**  
  Filters:
  - `Enrichment Timestamp` is not empty
  - `Job Title` is empty
  - `Linkedin URL - Person` is empty
  - `HRQ Status` is not "Archive"

### **Monitoring Metrics**
- Daily HRQ inbound count by reason
- HRQ processing time (human review speed)
- HRQ action distribution (Archive vs Manual vs Qualified vs Enrich)
- HRQ → SMS conversion rate (Qualified actions that become SMS sends)

---

## 🚨 **SAFETY PROTOCOLS**

### **Prevent Infinite Loops**
- Avoid automatic re-enrichment loops. Use views to surface gaps; human reviewers decide whether to resume (Qualified + Queued) or Archive.

### **Data Quality Gates**
- Validate email format before any processing
- Ensure phone normalization before SMS eligibility check
- Log all HRQ routing decisions for audit trail

---

## 📈 **SUCCESS METRICS**

### **Cost Efficiency**
- Personal emails skipped (Clay cost savings)
- Enrichment attempts vs success rate
- HRQ processing time vs manual review value

### **Quality Gates**
- HRQ → SMS conversion rate
- False positive rate (good leads marked as Archive)
- Human reviewer decision consistency

---

## 🔄 **IMPLEMENTATION PRIORITY (v1 Final)**

1. Create Airtable views: "HRQ — Manual Process" and "HRQ — Enrichment Failed (No Person Data)"
2. Reviewer SOP: To resume, set `HRQ Status = Qualified` AND `Processing Status = Queued`
3. Validate pickup: Confirm Slack send + audit row on next scheduler window

---

**Next Steps**: Implement workflows and test HRQ routing with real data.
