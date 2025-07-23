# Session 0: Field Normalization Implementation

## What You're Building
A Smart Field Mapper that normalizes all webhook field variations into a consistent schema. This component processes 15+ variations of field names (email/Email/EMAIL/email_address) and ensures 95%+ field capture rate.

## Why This Matters
**CRITICAL**: Without field normalization, the system has a 100% FAILURE RATE. Webhooks send unpredictable field variations, and missing this component means zero records will be created in Airtable. This discovery came from 50+ hours of catastrophic failures.

## Prerequisites
- [ ] Pattern 00 loaded from patterns/00-field-normalization-mandatory.txt
- [ ] Test payloads ready (10 variations minimum)
- [ ] Field_Mapping_Log table exists in Airtable
- [ ] Understanding that this MUST be first node after webhook

## Deliverables
1. Smart Field Mapper implementation (Code node)
2. Test results showing 95%+ field capture rate
3. Unknown field tracking to Field_Mapping_Log
4. Exported component as reusable workflow

## Critical Requirements
1. MUST handle case-insensitive field matching
2. MUST track unknown fields for weekly review
3. MUST auto-split full names into first/last
4. MUST handle boolean conversions (yes/true/1 → true)
5. MUST be positioned IMMEDIATELY after webhook

## Success Metrics
- Field capture rate: 95%+ across all test payloads
- Zero workflow errors on missing fields
- All unknown fields logged for review
- Component exported and reusable
