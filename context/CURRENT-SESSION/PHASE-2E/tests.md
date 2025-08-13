# Phase 2E Tests

## Steps
1. Enable `$vars.DROPCONTACT_ENABLED=true`
2. Execute workflow and send a normal payload → expect enriched fields + costs populated
3. Send simulated 429/401/403 payload → expect circuit behavior and vendor_blocked flags
4. Verify precedence (PDL > Dropcontact > Hunter) applied in merger
5. Export workflow JSON; collect execution IDs and Airtable record IDs
