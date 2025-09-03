# SMS + Clay Enrichment - Final Decisions and Open Questions

## Final Decisions (approved)
- Click tracking: Launch with clean Calendly link in SMS (no rewrite). Optional: Cloudflare Worker redirect on client domain with HMAC verification → 302 to Calendly. Defer n8n GET proxy until registration issue is resolved.
- Delivery tracking: Use SimpleTexting delivery/non-delivery webhooks.
- Unsubscribes: Use SimpleTexting unsubscribe webhook; store per-lead and per-communication.
- Templates: Stored in Airtable `SMS_Templates`, selectable per campaign and A/B variant.
- Campaign/batch: Track `lead_source` ("Name – Type") and `campaign_batch_id` on Leads and Communications.
- Scheduler: Hourly cron on weekdays (UTC `0 14-21 * * 1-5`) mapping to 10–17 ET; skip weekends; adjust at DST.
- Initial behavior: One-way SMS; message ends with "Do not reply. Text STOP to opt out." Replies ignored (Phase 1).
- Calendly: Meeting booked via Calendly webhook is primary success signal; direct Calendly link in SMS.
- Clay: Run enrichment pre-SMS; log enrichment cost; gate SMS by eligibility.
- Branching: Implement on `feature/clay-sms-integration` with sessions plan.

## Implementation Notes
- If/when Worker is used: destination URL resolved from template/variant; HMAC payload includes `{leadId,campaignId,ts,targetUrl}` with 7‑day max age.
- A/B routing: Random 50/50 split by default; configurable at Campaign.
- Holiday list maintained in Airtable `Holidays` (date,sms_blocked,name).
- Metrics: Click rate, booking rate (click→meeting), unsubscribe rate by variant, delivery rate.
- Payload storage: Only if zero hassle—toggle via config `STORE_WEBHOOK_PAYLOADS=true` (default: false).
- Slack routing: Use user-provided channels; default to `#sms-alerts` if unspecified.

## Open Questions (none pending)
All critical items approved; any future tweaks can be added as change requests.

## Nice-to-Haves (later phases)
- Template performance dashboard in Airtable.
- Weekly export of SimpleTexting campaign metrics for archive.
- Sequence upgrade (3 touches) after Phase 1 success.
- Reply handler v1 (keywords) and v2 (LLM assist).

## Sign-off Checklist
- [ ] Decisions above approved
- [ ] Open questions answered
- [ ] Session plan dates agreed
- [ ] Branch created and protected
