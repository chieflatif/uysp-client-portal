# Session 1: Foundation - Webhook & Data Flow

## What You're Building
The foundational data flow: webhook reception with authentication, test mode enforcement, identity resolution via Airtable, and duplicate prevention with create/update logic.

## Why This Matters
This establishes the core pipeline that all other components depend on. Without proper webhook handling and duplicate prevention, the system will create multiple records for the same person, corrupting data integrity.

## Prerequisites
- Session 0 complete (Field Mapper ready)
- Pattern 01 loaded (core patterns)
- Airtable People table has required fields
- Environment variables set (TEST_MODE=true)
- Webhook authentication key created

## Deliverables
- Authenticated webhook receiver
- Test mode enforcement logic
- Airtable identity resolution (search by email/phone)
- Create/Update branching logic
- Complete data flow test

## Critical Requirements
- Smart Field Mapper MUST be imported from Session 0
- Use table IDs not names: tblXXXXXXXXXXXXXX
- Enable "Always Output Data" on IF nodes (UI setting)
- Expression spacing: {{ $json.field }} not {{$json.field}}
- Test with duplicate scenarios

## Success Metrics
- Webhook returns 200 OK for valid requests
- Test mode properly enforced
- No duplicate records created
- Updates work for existing records
- Field normalization integrated correctly 