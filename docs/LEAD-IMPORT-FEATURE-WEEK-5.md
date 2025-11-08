# Lead Import Feature - Week 5 Enhancement

**Timeline:** Post-Mini-CRM (Week 5)  
**Estimated:** 6-8 hours  
**Priority:** High (user-requested feature)

---

## 📋 Feature Overview

**What:** Bulk lead import via CSV upload from leads page  
**Why:** Allow manual lead list uploads without Kajabi forms  
**How:** CSV → Airtable (with source tag) → Clay enrichment → PostgreSQL sync → Campaign targeting

---

## 🎯 User Flow

1. User clicks **"Import Leads"** button on leads page
2. Modal opens with:
   - CSV file upload (drag-drop)
   - Required field: "Campaign/Source" name (creates new tag identifier)
   - Column mapping UI (their CSV columns → your required fields)
3. Validate CSV (email format, phone format, duplicates)
4. Show preview (first 5 rows)
5. User confirms → Batch write to Airtable with source tag
6. Progress bar shows: X/Y leads processed
7. Success summary: "145 leads imported, 12 duplicates skipped, 3 errors"
8. Error report downloadable if issues

---

## 🏗️ Technical Design

### UI Component
**Location:** Leads page (`/leads`)  
**Component:** `<ImportLeadsModal>` (new)  
**Trigger:** "Import Leads" button in page header

### Backend API
**Endpoint:** `POST /api/leads/import`  
**Handler:** Parse CSV → Validate → Write to Airtable → Return results

### Flow
```
CSV Upload → Parse/Validate → Write to Airtable (with source tag)
                                        ↓
                                Clay enrichment (automatic)
                                        ↓
                                PostgreSQL sync (5 min)
                                        ↓
                          Source tag selectable in campaign creation
```

### Activity Logging
**Event Type:** `BULK_IMPORT` (add to EVENT_TYPES)  
**Log:** Number imported, source name, errors, user who imported

---

## 📊 Required Fields

**Minimum CSV columns:**
- email (required)
- firstName (required)
- lastName (required)
- phone (optional)
- company (optional)

**Auto-generated:**
- source tag (from user input)
- clientId (from session)
- timestamp
- Airtable recordId

---

## 🎯 Deliverables

1. Import modal component (2 hours)
2. CSV parser + validator (2 hours)
3. Airtable batch write API (2 hours)
4. Progress tracking + error reporting (1 hour)
5. Activity logging integration (30 min)
6. Tests (1 hour)

**Total: 8.5 hours**

---

## ✅ Success Criteria

- [ ] Can upload CSV with 100+ leads
- [ ] Column mapping works (flexible CSV formats)
- [ ] Duplicates detected (by email + phone)
- [ ] Source tag created and applied
- [ ] Airtable receives all valid leads
- [ ] Clay enrichment triggers automatically
- [ ] PostgreSQL sync populates leads
- [ ] Source tag appears in campaign creation dropdown
- [ ] Errors reported clearly
- [ ] BULK_IMPORT event logged

---

**Build this in Week 5 after Mini-CRM complete.**

