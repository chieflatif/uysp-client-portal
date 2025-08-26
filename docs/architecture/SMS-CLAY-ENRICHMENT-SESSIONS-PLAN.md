# Development Sessions Plan - SMS + Clay Enrichment

## Session 1: Foundation (4 hours)
- Create branch: `feature/clay-sms-integration`
- Add Airtable fields to `Leads` and `Communications`
- Create `SMS_Templates` table with variants A/B
- Create `Holidays` table and business-hours variables
- Validate credentials for Clay and SimpleTexting

Deliverables:
- Schema updated, doc updated, branch pushed

## Session 2: Clay Integration (3 hours)
- Build `UYSP-Clay-Enrichment` workflow
- Map enrichment fields; track cost
- Implement ICP scoring and eligibility flag
- Test on 20 sample leads

Deliverables:
- Enrichment working, eligibility gating set

## Session 3: SMS Infrastructure (4 hours)
- Build `UYSP-Click-Tracker` (`/c/:token`) redirect webhook
- Build `UYSP-SMS-Single-Daily` (10am EST) sender
- Configure SimpleTexting webhooks: delivery, unsubscribe
- Implement business hours + holiday checks
- Log per-send Communications with template/variant/campaign

Deliverables:
- Single-message sending with tracking and webhooks

## Session 4: Testing (2 hours)
- End-to-end with 5 internal numbers
- Verify delivery updates and unsubscribe handling
- Verify click redirect and Calendly navigation
- Validate metrics fields populated correctly

Deliverables:
- Evidence and fixes applied

## Session 5: Production Prep (2 hours)
- Create Airtable views: queues, A/B performance, click-but-no-book
- Add Slack alerts for failures/spikes
- Run a 50-lead pilot; monitor for 24–48h

Deliverables:
- Pilot live, monitoring in place

## Acceptance Criteria
- Single-message flow runs daily during business hours
- Clay-enriched and ICP-qualified leads only
- Delivery and unsubscribe tracked via webhooks
- Clicks tracked via redirect; bookings via Calendly webhook
- A/B variant recorded with metrics

## Post-Pilot
- Evaluate template performance and unsubscribe rates
- Decide on sequence upgrade (3-touch)
- Plan reply handling (Phase 2)
