# Phase 2E Technical Specs

## Dropcontact Gate (IF node)

```javascript
// Left side:
{{ $vars.DROPCONTACT_ENABLED || 'false' }}
// Operator: String equals
// Right side:
true
```

## Dropcontact Circuit Breaker (before Dropcontact HTTP)

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
  // Update Variables via separate workflow or manually
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
    console.log(`Dropcontact circuit open: ${newErrorCount} errors since ${new Date(lastReset).toISOString()}`);
  } else {
    item.json.route = 'try_dropcontact';
  }
}

return items;
```

## Dropcontact HTTP: Batch Submit + Poll

- Credential: Predefined Credential Type → HTTP Header Auth → Select "Dropcontact API" (header `X-Access-Token`)
- Minimum inputs: email (preferred), optionally first_name, last_name, website/domain
- Batch submit:
  - Method: POST
  - URL: `https://api.dropcontact.io/batch`
  - Body (example):
```json
{
  "data": [
    { "email": "{{ $json.normalized?.email || $json.email }}",
      "first_name": "{{ $json.normalized?.first_name || $json.first_name }}",
      "last_name": "{{ $json.normalized?.last_name || $json.last_name }}",
      "website": "{{ $json.normalized?.website || $json.website || $json.domain }}" }
  ]
}
```
- Poll result:
  - Method: GET
  - URL: `https://api.dropcontact.io/batch/{{ $json.requestId }}`
- Sync reference (preferred for docs simplicity; acceptable alternative): `POST https://api.dropcontact.com/v1/enrich/all`
- Options:
  - Timeout: 10000; Retry On Fail: ON; Max Tries: 3; Wait Between Tries: 5000; On Error: Continue
  - Always capture `requestId` from submit response

## Dropcontact Response Processor

```javascript
// Node Name: Dropcontact Response Processor
const items = $input.all();

for (const item of items) {
  const response = item.json;
  const status = response.statusCode || response.status || 200;
  
  // Check for errors and update error count
  if ([429, 401, 403].includes(status)) {
    console.log(`Dropcontact API error ${status} - consider updating DROPCONTACT_ERROR_COUNT variable`);
    item.json.dropcontact_blocked = true;
    item.json.vendor_blocked = true;
  }
  
  // Process response
  // Parse Dropcontact batch poll result structure
  const dc = response || {};
  const results = Array.isArray(dc.data) ? dc.data : [];
  const first = results[0] || {};
  const emails = Array.isArray(first.email) ? first.email : [];
  const linkedin = first.linkedin || first.linkedin_url || null;
  const title = first.job || first.title || null;
  const company = first.company || first.company_name || null;
  const website = first.website || first.domain || null;
  const creditsLeft = typeof dc.credits_left === 'number' ? dc.credits_left : null;
  
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
    dropcontact_credits_left: creditsLeft,
    enrichment_attempted: true
  };
}

return items;
```

## Person Data Merger (include Dropcontact)

```javascript
// Set precedence to PDL → Dropcontact → Hunter (verifier)
const items = $input.all();

for (const item of items) {
  const d = item.json.normalized ?? item.json ?? {};
  
  // Three-vendor precedence (final)
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
  
  // If all failed
  if (!enrichmentVendor) {
    d.enrichment_failed = true;
    d.enrichment_path = 'pdl→dropcontact→hunter→failed';
    d.routing = 'human_review';
    d.routing_reason = 'all_enrichment_failed';
  }
  
  // Normalize LinkedIn URL
  if (d.linkedin_url && !String(d.linkedin_url).startsWith('http')) {
    d.linkedin_url = `https://www.linkedin.com/in/${d.linkedin_url}`;
  }
  
  // Calculate total costs
  d.total_processing_cost = 
    (d.pdl_person_cost || 0) + 
    (d.dropcontact_person_cost || 0) + 
    (d.hunter_cost || 0) + 
    (d.openai_cost || 0.001);
  
  item.json = d;
}

return items;
```

## Airtable Field Standardization (apply to all Airtable nodes)

```javascript
{
  "email": "{{ $json.normalized?.email || $json.email }}",
  "phone_primary": "{{ $json.normalized?.phone_primary || $json.phone_primary }}",
  "first_name": "{{ $json.normalized?.first_name || $json.first_name }}",
  "last_name": "{{ $json.normalized?.last_name || $json.last_name }}",
  "company_enriched": "{{ $json.company_enriched || $json.company }}",
  "title_current": "{{ $json.title_current || $json.title }}",
  "linkedin_url": "{{ $json.linkedin_url }}",
  "icp_score": "{{ $json.icp_score }}",
  "company_score": "{{ $json.company_score }}",
  "role_score": "{{ $json.role_score }}",
  "engagement_score": "{{ $json.engagement_score }}",
  "icp_tier": "{{ $json.icp_tier }}",
  "score_reasoning": "{{ $json.score_reasoning }}",
  "scoring_confidence": "{{ $json.scoring_confidence }}",
  "scoring_method": "{{ $json.scoring_method }}",
  "openai_api_used": "{{ $json.openai_api_used }}",
  "routing": "{{ $json.routing }}",
  "routing_reason": "{{ $json.routing_reason }}",
  "processing_status": "{{ $json.processing_status }}",
  "enrichment_vendor": "{{ $json.enrichment_vendor }}",
  "enrichment_path": "{{ $json.enrichment_path }}",
  "enrichment_failed": "{{ $json.enrichment_failed }}",
  "pdl_status_code": "{{ $json.pdl_status_code }}",
  "hunter_status_code": "{{ $json.hunter_status_code }}",
  "dropcontact_status_code": "{{ $json.dropcontact_status_code }}",
  "vendor_blocked": "{{ $json.vendor_blocked }}",
  "pdl_person_cost": "{{ $json.pdl_person_cost || 0 }}",
  "hunter_cost": "{{ $json.hunter_cost || 0 }}",
  "dropcontact_person_cost": "{{ $json.dropcontact_person_cost || 0 }}",
  "openai_cost": "{{ $json.openai_cost || 0 }}",
  "total_processing_cost": "{{ $json.total_processing_cost || 0 }}",
  "outcome_summary": "{{ $json.outcome_summary }}",
  "human_review_needed": "{{ $json.human_review_needed || false }}",
  "anomaly_detected": "{{ $json.anomaly_detected || false }}",
  "anomaly_reason": "{{ $json.anomaly_reason }}",
  "junk_score": "{{ $json.junk_score }}",
  "v3_aligned": "{{ true }}",
  "processing_completed": "{{ $now.toISO() }}"
}
```
