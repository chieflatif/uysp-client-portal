# Human Review Queue (HRQ) Workflow SOP

**Date**: 2025-08-29  
**Status**: Draft - Implementation Pending  
**Purpose**: Define complete HRQ routing logic, reasons, and human reviewer actions

---

## 🎯 **HRQ OVERVIEW**

**Purpose**: Route leads that require human review before SMS campaigns or enrichment processing.

**Core Principle**: Prevent wasted costs on personal emails and low-quality leads while allowing human override for edge cases.

---

## 📥 **INBOUND ROUTING TO HRQ (3 Paths)**

### **Path 1: Personal Email Detection** ✅ IMPLEMENTED
- **Trigger**: Personal email domains (gmail.com, yahoo.com, hotmail.com, outlook.com, icloud.com, etc.)
- **When**: During initial ingestion (Bulk Import & Real-time)
- **Action**: 
  - `HRQ Status = "Archive"`
  - `HRQ Reason = "Personal email"`
  - `Processing Status = "Complete"` (skip all enrichment)

### **Path 2: Data Quality Issues** 🔴 TO IMPLEMENT
- **Trigger**: Missing phone, invalid email, incomplete data
- **When**: During initial ingestion validation
- **Action**:
  - `HRQ Status = "Manual Process"`
  - `HRQ Reason = "Data quality error"`
  - `Processing Status = "Complete"`

### **Path 3: Post-Enrichment SMS Criteria Failure** 🔴 TO IMPLEMENT
- **Trigger**: `ICP Score < 70` OR `Location != US` OR `Phone Invalid`
- **When**: After Clay enrichment completes
- **Action**:
  - `HRQ Status = "Manual Process"`
  - `HRQ Reason = "ICP review"` OR `HRQ Reason = "Enrichment failed"`
  - `Processing Status = "Complete"`

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
- **Purpose**: Override criteria, approve for SMS campaign
- **System Action**: 
  - Set `Processing Status = "Queued"`
  - Set `HRQ Status = "None"`
  - Lead enters SMS eligibility check
- **Use Cases**: Human judgment overrides ICP score, edge cases worth pursuing

### **3. Qualified** (Simplified - Covers Enrichment)
- **Purpose**: Approve for processing (enrichment → SMS pipeline)
- **System Action**:
  - Set `Processing Status = "Queued"`
  - Set `HRQ Status = "None"`
  - Lead enters normal flow: Clay enrichment → ICP scoring → SMS eligibility
- **Use Cases**: Human override for edge cases, retry failed enrichment

---

## 🔄 **HRQ REASON TAXONOMY**

### **Inbound Reasons** (During Ingestion)
- **"Personal email"** - gmail.com, yahoo.com, etc. detected at ingestion
- **"Data quality error"** - missing phone, invalid email, incomplete data

### **Post-Enrichment Reasons** (After Clay Processing)
- **"ICP review"** - ICP Score < 70, needs human evaluation
- **"Enrichment failed"** - Clay couldn't enrich, came back from Qualified retry
- **"Location filter"** - Non-US location, may need manual evaluation
- **"Phone validation"** - Invalid phone number, may need manual correction

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

### **Required Workflows**

#### **1. HRQ Action Processor** 🔴 TO BUILD
- **Trigger**: Manual or scheduled
- **Function**: Process HRQ Status changes by human reviewers
- **Logic**:
  - If `HRQ Status = "Qualified"` → Set `Processing Status = "Queued"`, clear HRQ fields
  - If `HRQ Status = "Enrich"` → Trigger Clay enrichment, set `Processing Status = "Queued"`
  - If `HRQ Status = "Manual Process"` → Move to manual outreach view

#### **2. Post-Enrichment SMS Criteria Check** 🔴 TO BUILD
- **Trigger**: After Clay writeback (webhook or scheduled)
- **Function**: Check SMS eligibility criteria
- **Logic**: If ICP<70 OR non-US OR invalid phone → route to HRQ

---

## 📊 **HRQ VIEWS & REPORTING**

### **Airtable Views Needed**
- **"HRQ - Personal Emails"** (HRQ Status = Archive, Reason = Personal email)
- **"HRQ - Manual Review"** (HRQ Status = Manual Process)
- **"HRQ - Enrichment Failed"** (HRQ Reason = Enrichment failed)
- **"HRQ - ICP Review"** (HRQ Reason = ICP review)

### **Monitoring Metrics**
- Daily HRQ inbound count by reason
- HRQ processing time (human review speed)
- HRQ action distribution (Archive vs Manual vs Qualified vs Enrich)
- HRQ → SMS conversion rate (Qualified actions that become SMS sends)

---

## 🚨 **SAFETY PROTOCOLS**

### **Prevent Infinite Loops**
- Track enrichment attempts: If lead returns to HRQ after "Enrich" action, set `HRQ Reason = "Enrichment failed"`
- Prevent re-enrichment of failed enrichment attempts

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

## 🔄 **IMPLEMENTATION PRIORITY**

1. **Add "Enrich" option to Airtable HRQ Status field** (Manual)
2. **Build Post-Enrichment SMS Criteria Check workflow**
3. **Build HRQ Action Processor workflow**
4. **Create HRQ monitoring views**
5. **Test with sample leads through full cycle**

---

**Next Steps**: Implement workflows and test HRQ routing with real data.
