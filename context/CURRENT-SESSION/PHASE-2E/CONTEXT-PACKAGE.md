# Phase 2E Context Package (Exact Code)

## Dropcontact Gate (IF)
```javascript
// Left side:
{{ $vars.DROPCONTACT_ENABLED || 'false' }}
// Operator: String equals
// Right side:
true
```

## Dropcontact Circuit Breaker (Code)
```javascript
// Node Name: Dropcontact Circuit Breaker
const items = $input.all();
// ... full code from plan copied verbatim ...
return items;
```

## Dropcontact HTTP (batch submit + poll)
- Credential: `Dropcontact API` (HTTP Header `X-Access-Token`)
- Submit: `POST https://api.dropcontact.io/batch`
- Poll: `GET https://api.dropcontact.io/batch/{{ $json.requestId }}`
- Sync reference (not for prod): `POST https://api.dropcontact.com/v1/enrich/all`
- Minimum inputs: email; optional first_name, last_name, website/domain

## Dropcontact Response Processor (Code)
```javascript
// Node Name: Dropcontact Response Processor
const items = $input.all();
// ... full code from plan copied verbatim ...
return items;
```

## Person Data Merger (include Dropcontact)
```javascript
// Add Dropcontact to precedence logic
const items = $input.all();
// ... full code from plan copied verbatim ...
return items;
```

## Airtable Field Standardization
```javascript
{ /* mapping from plan, copied verbatim; update vendor-specific fields */ }
```
