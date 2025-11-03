memory_bank/tech_context.md
# UYSP Technical Context

## Stack
- Orchestration: n8n (>=1.0.0).
- Database: Airtable (Team plan).
- APIs: PDL, Hunter (fallback), SimpleTexting (10DLC), OpenAI.
- Testing: TestSprite MCP.
- Development: Cursor; MCP servers (n8n-mcp, airtable-mcp, context7, testsprite, openai-mcp).

## Environment Variables
From config/env-vars.json placeholders:
- CACHE_EXPIRY_DAYS=90
- BATCH_SIZE=50
- DAILY_COST_LIMIT=50
- TEST_MODE=true
- Etc. (full in blueprint).

## Credentials
Placeholders in config/credentials.json:
- apolloApiKey, twilioAccountSid, etc.
Store in n8n credentials.

## MCP Setup
- Install: npm install -g [mcp-packages].
- Config: JSON for each (API keys, timeouts).
- Test: List workflows/tables, examples, POSTs.
- Fallback: Diagnose, alternative (JSON), manual steps.

## Patterns Reference
- Core: Bootstrap, webhook, upsert (01-core-patterns.txt).
- Compliance: DND, pre-flight (02-compliance-patterns.txt).
- Enrichment: Qualification, scoring (03-enrichment-patterns.txt).
- SMS: Sending, delivery (04-sms-patterns.txt).
- Utilities: Metrics, errors (05-utility-patterns.txt).

## Webhook Endpoints (current)
- SimpleTexting Delivery: POST `/webhook/simpletexting-delivery`
- SimpleTexting Inbound STOP: POST `/webhook/simpletexting-inbound`
- Calendly Booked: POST `/webhook/calendly`
- Click Redirect (planned): GET `/webhook/simpletexting-inbound` (currently unregistered at edge; defer or use Worker)

## Calendly
- Booking link (SMS display): `https://calendly.com/d/cwvn-dwy-v5k/sales-coaching-strategy-call-rrl`
- Webhook: `invitee.created` → POST to our Calendly endpoint; enable signing secret.

Reference via @patterns/ in prompts.