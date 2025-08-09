[HISTORICAL]
Last Updated: 2025-08-08

# Field Normalization - MANDATORY for All Webhook Integrations

## Why This is Required

The UYSP project failed catastrophically because we assumed webhook field names would be stable. In reality:
- Kajabi sends `email`, `Email`, `EMAIL`, or `email_address` randomly
- Form builders change field names without notice
- What works today breaks tomorrow

Without field normalization, the system creates ZERO records - a total failure.

## The Solution: Smart Field Mapper

A production-grade field normalization layer that:
1. Handles all known field variations (case-insensitive)
2. Tracks unknown fields for monitoring
3. Only errors if critical fields (email) are missing
4. Enables 5-minute weekly review to catch new variations

## Implementation

### 1. Position in Workflow
```
Webhook → Validate → [FIELD MAPPER HERE] → Search → Upsert
                            ↓
                    Normalizes 6-8 core fields
                    Tracks unknowns for review
```

### 2. Core Fields Mapped
- `email` → email, Email, EMAIL, email_address, emailAddress, e-mail, contact_email
- `phone` → phone, Phone, PHONE, phone_number, phoneNumber, mobile, cell
- `first_name` → first_name, firstName, fname, given_name
- `last_name` → last_name, lastName, lname, surname
- `full_name` → name, Name, full_name, fullName
- `company` → company, Company, company_name, organization
- `title` → title, Title, job_title, role, position
- `linkedin` → linkedin, LinkedIn, linkedin_url, linkedinProfile

### 3. Monitoring Setup
- `Field_Mapping_Log` table in Airtable captures:
  - timestamp
  - webhook_name
  - unknown_fields
  - original_payload
  - mapping_success_rate
  - reviewed (checkbox)

### 4. Weekly Review Process (5 minutes)
1. Check `Field_Mapping_Log` for unreviewed entries
2. Identify new field patterns
3. Update field mappings if needed
4. Mark as reviewed

## Testing

Run the test suite to verify all field variations work:
```bash
node tests/test-field-normalization.js
```

All 10 test payloads should create records successfully.

## Files Updated

1. **Workflow**: `workflows/uysp-lead-processing-v3-with-logging.json`
   - Added production Smart Field Mapper
   - Added unmapped field logging
   - Updated all downstream nodes to use `normalized.*` fields

2. **Standards**: `@.cursor/rules/standards.mdc`
   - Added mandatory field normalization section

3. **Patterns**: `patterns/01-core-patterns.txt`
   - Added Field Normalization pattern

4. **Airtable**: Created `Field_Mapping_Log` table

## Remember

**EVERY webhook integration MUST have field normalization. No exceptions.**

This is not over-engineering. This is production reality. External systems don't care about our field names. Build for chaos, not for the happy path.

---

Filed: December 2024
Impact: System recovery from total failure