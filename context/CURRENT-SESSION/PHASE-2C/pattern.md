[AUTHORITATIVE]
Last Updated: 2025-08-08

# Implementation Pattern: Hunter Waterfall Integration

## Node 1: Feature Gate Configuration

```javascript
// Node: Waterfall Enabled Check
// Type: n8n-nodes-base.if
{
  "parameters": {
    "conditions": {
      "conditions": [{
        "leftValue": "={{$vars.PERSON_WATERFALL_ENABLED}}",
        "rightValue": "true",
        "operator": {
          "type": "string",
          "operation": "equals"
        }
      }]
    }
  },
  "alwaysOutputData": true
}
// Routing: TRUE (index 0) → PDL Person, FALSE (index 1) → Bypass to ICP Scoring
```

## Node 2: PDL Success Router Configuration

```javascript
// Node: PDL Person Success Check
// Type: n8n-nodes-base.if
{
  "parameters": {
    "conditions": {
      "conditions": [{
        "leftValue": "={{$json.pdl_person_success}}",
        "rightValue": true,
        "operator": {
          "type": "boolean",
          "operation": "true"
        }
      }]
    }
  },
  "alwaysOutputData": true
}
// CRITICAL: Use "operation": "true" for proper boolean routing (memory:5371063)
// Routing: TRUE (index 0) → ICP Scoring, FALSE (index 1) → Hunter Enrichment
```

## Node 3: Hunter HTTP Request Configuration

```javascript
// Node: Hunter Email Enrichment
// Type: n8n-nodes-base.httpRequest
{
  "parameters": {
    "method": "GET",
    "url": "https://api.hunter.io/v2/people/find",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "httpHeaderAuth",
    "sendHeaders": false,
    "qs": {
      "email": "={{$json.email}}"
    },
    "options": {
      "timeout": 30000,
      "retry": {
        "enabled": true,
        "maxTries": 3
      }
    }
  }
}
// CRITICAL: Use predefinedCredentialType pattern, NEVER manual headers (memory:5457160)
// Credential: httpHeaderAuth with X-API-KEY header
```

## Node 4: Hunter Response Processor

```javascript
// Node: Hunter Response Normalization
// Type: n8n-nodes-base.code
const hunterData = $input.first().json;
const hunterPerson = hunterData.data || {};

// Normalize to canonical format with PDL precedence
const canonicalPerson = {
  // Preserve existing data
  ...$json,
  
  // Hunter enrichment (only if not already present from PDL)
  linkedin_url: $json.linkedin_url || 
    (hunterPerson.linkedin?.handle ? 
      `https://www.linkedin.com/in/${hunterPerson.linkedin.handle}` : null),
  title_current: $json.title_current || hunterPerson.employment?.title || null,
  company_enriched: $json.company_enriched || hunterPerson.employment?.name || null,
  
  // Name fallback (Smart Field Mapper precedence)
  first_name: $json.first_name || hunterPerson.name?.givenName || null,
  last_name: $json.last_name || hunterPerson.name?.familyName || null,
  
  // Enrichment metadata
  enrichment_vendor: $json.pdl_person_success ? 'pdl' : 'hunter',
  enrichment_attempted: true,
  enrichment_failed: false,
  last_enriched: new Date().toISOString(),
  
  // Cost tracking
  hunter_cost: $json.pdl_person_success ? 0 : 0.049,
  total_processing_cost: ($json.total_processing_cost || 0) + 
    ($json.pdl_person_success ? 0 : 0.049),
  
  // Success flags
  hunter_person_success: !!(hunterPerson.linkedin?.handle || 
    hunterPerson.employment?.title || hunterPerson.employment?.name)
};

return canonicalPerson;
```

## Node 5: Person Data Merger

```javascript
// Node: Person Data Merger
// Type: n8n-nodes-base.code
const inputData = $input.first().json;

// Determine enrichment success and set routing
const hasPDLData = inputData.pdl_person_success === true;
const hasHunterData = inputData.hunter_person_success === true;

let mergedPerson = { ...inputData };

if (hasPDLData) {
  // PDL success - preserve PDL data, mark vendor
  mergedPerson.enrichment_vendor = 'pdl';
  mergedPerson.enrichment_method_primary = 'pdl';
  mergedPerson.enrichment_failed = false;
  
} else if (hasHunterData) {
  // Hunter fallback success
  mergedPerson.enrichment_vendor = 'hunter';
  mergedPerson.enrichment_method_primary = 'hunter';
  mergedPerson.enrichment_failed = false;
  
} else {
  // Both failed - route to human review
  mergedPerson.enrichment_failed = true;
  mergedPerson.routing_decision = 'human_review';
  mergedPerson.routing_reason = 'person_enrichment_failed_both_providers';
}

// Ensure LinkedIn URL format consistency
if (mergedPerson.linkedin_url && !mergedPerson.linkedin_url.startsWith('http')) {
  mergedPerson.linkedin_url = `https://www.linkedin.com/in/${mergedPerson.linkedin_url}`;
}

return mergedPerson;
```

## Node 6: Daily Cost Updater

```javascript
// Node: Daily Cost Updater  
// Type: n8n-nodes-base.code
const personData = $input.first().json;
const today = new Date().toISOString().split('T')[0];

// Calculate vendor-specific costs
const pdlCost = personData.enrichment_vendor === 'pdl' ? 0.03 : 0;
const hunterCost = personData.enrichment_vendor === 'hunter' ? 0.049 : 0;

// Prepare cost update for Daily_Costs table
const costUpdate = {
  date: today,
  pdl_person_costs: pdlCost,
  hunter_costs: hunterCost,
  enrichment_costs: pdlCost + hunterCost,
  total_costs: pdlCost + hunterCost,
  person_email: personData.email,
  enrichment_vendor: personData.enrichment_vendor,
  timestamp: new Date().toISOString()
};

return {
  ...personData,
  cost_update: costUpdate
};
```

## Integration Points
- **MUST connect**: After existing PDL Person Enrichment node
- **MUST preserve**: All existing PDL success path routing
- **MUST merge**: Both PDL and Hunter paths before ICP Scoring
- **MUST track**: Separate costs for PDL vs Hunter usage
- **MUST handle**: Environment variable toggle for feature gate

## Field Mapping Precedence
| Canonical Field | PDL Source | Hunter Source | Rule |
|----------------|------------|---------------|------|
| linkedin_url | linkedin_url | linkedin.handle→URL | PDL > Hunter |
| title_current | job_title | employment.title | PDL > Hunter |
| company_enriched | employment.name | employment.name | PDL > Hunter |
| enrichment_vendor | 'pdl' | 'hunter' | Source attribution |

## Environment Variables Required
```bash
PERSON_WATERFALL_ENABLED=true    # Feature toggle
HUNTER_API_KEY=your_key_here     # API authentication
HUNTER_COST_PER_LOOKUP=0.049     # Cost tracking
```

**CRITICAL**: Test feature gate rollback before implementing Hunter nodes.
