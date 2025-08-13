# Cursor Prompt: Phase 2E Implementation (Dropcontact as Third Provider)

## Implement the following components EXACTLY:

### 1) Dropcontact Waterfall Gate (IF node)
```javascript
// Left side:
{{ $vars.DROPCONTACT_ENABLED || 'false' }}
// Operator: String equals
// Right side:
true
```

### 2) Dropcontact Circuit Breaker (Code node before HTTP)
```javascript
// Node Name: Dropcontact Circuit Breaker
// CRITICAL: Use Variables for persistence in cloud (static data resets on deactivate)
const items = $input.all();
const now = Date.now();

// Get persistent error count from Variables (survives workflow restarts)
const errorCount = Number($vars.DROPCONTACT_ERROR_COUNT || 0);
const lastReset = Number($vars.DROPCONTACT_LAST_RESET || now);

// Reset counter every hour
let newErrorCount = errorCount;
if (now - lastReset > 3600000) {
  newErrorCount = 0;
  console.log('Dropcontact error counter should be reset - update DROPCONTACT_ERROR_COUNT to 0');
}

// Check circuit state
const circuitOpen = newErrorCount >= 3;

for (const item of items) {
  const dropcontactEnabled = $vars.DROPCONTACT_ENABLED === 'true';
  
  if (!dropcontactEnabled) {
    item.json.dropcontact_skipped = true;
    item.json.dropcontact_skip_reason = 'feature_disabled';
    item.json.route = 'skip_dropcontact';
  } else if (circuitOpen) {
    item.json.dropcontact_skipped = true;
    item.json.vendor_blocked = true;
    item.json.dropcontact_skip_reason = 'circuit_open';
    item.json.route = 'skip_dropcontact';
  } else {
    item.json.route = 'try_dropcontact';
  }
}

return items;
```

### 3) Dropcontact HTTP (Batch Submit + Poll)
- Credential: Predefined Credential Type → HTTP Header Auth → Select "Dropcontact API" (header `X-Access-Token`)
- Batch Submit: `POST https://api.dropcontact.io/batch`
- Poll: `GET https://api.dropcontact.io/batch/{{ $json.requestId }}`
- Sync reference (not recommended for production): `POST https://api.dropcontact.com/v1/enrich/all`
- Minimum inputs: email; optional first_name, last_name, website/domain
- Options:
  - Timeout: 10000; Retry On Fail: ON; Max Tries: 3; Wait Between Tries: 5000; On Error: Continue
  - Always capture `requestId` from submit response
 - UI Settings: Enable "Always Output Data" in the node Settings tab

#### Exact HTTP Sync Spec (docs-only)
Headers:

```http
X-Access-Token: <YOUR_DROPCONTACT_API_KEY>
Content-Type: application/json
```

Request:

```http
POST https://api.dropcontact.com/v1/enrich/all
```

Body (minimal):

```json
{
  "email": "{{ $json.normalized?.email || $json.email }}",
  "first_name": "{{ $json.normalized?.first_name || $json.first_name }}",
  "last_name": "{{ $json.normalized?.last_name || $json.last_name }}",
  "website": "{{ $json.normalized?.website || $json.website || $json.domain }}"
}
```

### 4) Dropcontact Response Processor
```javascript
// Node Name: Dropcontact Response Processor
const items = $input.all();

for (const item of items) {
  const response = item.json;
  const status = response.statusCode || response.status || 200;
  
  if ([429, 401, 403].includes(status)) {
    console.log(`Dropcontact API error ${status} - consider updating DROPCONTACT_ERROR_COUNT variable`);
    item.json.dropcontact_blocked = true;
    item.json.vendor_blocked = true;
  }
  
  // Parse Dropcontact batch poll result structure
  const dc = response || {};
  const results = Array.isArray(dc.data) ? dc.data : [];
  const first = results[0] || {};
  const emails = Array.isArray(first.email) ? first.email : [];
  const linkedin = first.linkedin || first.linkedin_url || null;
  const title = first.job || first.title || null;
  const company = first.company || first.company_name || null;
  const website = first.website || first.domain || null;
  
  item.json = {
    ...item.json,
    dropcontact_person_success: !!(linkedin || title || company),
    dropcontact_status_code: status,
    dropcontact_emails: emails,
    linkedin_url: linkedin || item.json.linkedin_url,
    title_current: title || item.json.title_current,
    company_enriched: company || item.json.company_enriched,
    website: website || item.json.website,
    dropcontact_requestId: item.json.requestId || dc.request_id || item.json.dropcontact_requestId,
    enrichment_attempted: true
  };
}

return items;
```

### 5) Person Data Merger (update precedence)
```javascript
// Set precedence to PDL → Dropcontact → Hunter (verifier)
const items = $input.all();

for (const item of items) {
  const d = item.json.normalized ?? item.json ?? {};
  const precedence = ['pdl', 'dropcontact', 'hunter'];
  let enrichmentVendor = null;
  for (const vendor of precedence) {
    if (d[`${vendor}_person_success`] === true) {
      enrichmentVendor = vendor;
      d.enrichment_vendor = vendor;
      d.enrichment_path = precedence.slice(0, precedence.indexOf(vendor) + 1).join('→');
      d.enrichment_failed = false;
      break;
    }
  }
  if (!enrichmentVendor) {
    d.enrichment_failed = true;
      d.enrichment_path = 'pdl→dropcontact→hunter→failed';
    d.routing = 'human_review';
    d.routing_reason = 'all_enrichment_failed';
  }
  if (d.linkedin_url && !String(d.linkedin_url).startsWith('http')) {
    d.linkedin_url = `https://www.linkedin.com/in/${d.linkedin_url}`;
  }
  d.total_processing_cost = 
    (d.pdl_person_cost || 0) + 
      (d.dropcontact_person_cost || 0) + 
      (d.hunter_cost || 0) + 
    (d.openai_cost || 0.001);
  item.json = d;
}

return items;
```

### 6) Airtable Field Standardization
Apply the standardized mapping to all Airtable nodes (use exact mapping from plan).

## EVIDENCE REQUIRED
- Show Dropcontact API credential selected (screenshot)
- Show 429/401/403 handling and circuit behavior
- tests/results/dropcontact-probe-latest.json (16/LinkedIn 7)
- tests/results/dropcontact-batch-latest.json (34/LinkedIn 21)
- Placeholders for 100‑lead report outputs
