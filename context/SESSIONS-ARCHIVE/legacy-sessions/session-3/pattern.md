# Implementation Pattern: Two-Phase Qualification

## Cost Check Before APIs

```javascript
// Node: Get Today's Costs
Type: n8n-nodes-base.airtable
Operation: Search
Base ID: appuBf0fTe8tp8ZaF
Table ID: [Daily_Costs table ID]
Options:
  Filter By Formula: {date} = '{{ $now.toFormat('yyyy-MM-dd') }}'
  Return All: false
  Limit: 1
```

```javascript
// Node: Check Cost Limit
Type: n8n-nodes-base.code
const currentCosts = $json[0]?.fields?.total_costs || 0;
const nextCost = 0.01; // Apollo Org API
const dailyLimit = parseFloat($env.DAILY_COST_LIMIT || '50');

if (currentCosts + nextCost > dailyLimit) {
  throw new Error(`Daily cost limit exceeded: ${currentCosts} + ${nextCost} > ${dailyLimit}`);
}

return {
  ...$input.item.json,
  costs_checked: true,
  current_daily_spend: currentCosts,
  cost_headroom: dailyLimit - currentCosts
};
```

## Phase 1: Company Qualification

```javascript
// Node: Check Known B2B Domains First
Type: n8n-nodes-base.code
const knownB2B = [
  'salesforce.com', 'hubspot.com', 'microsoft.com', 'oracle.com',
  'adobe.com', 'slack.com', 'zoom.us', 'atlassian.com'
];

const email = $json.normalized.email;
const domain = email.split('@')[1]?.toLowerCase();

const isKnownB2B = knownB2B.includes(domain);

return {
  ...$json,
  domain,
  known_b2b: isKnownB2B,
  skip_apollo_org: isKnownB2B
};
```

```javascript
// Node: Apollo Organization API
Type: n8n-nodes-base.httpRequest
Method: GET
URL: https://api.apollo.io/v1/organizations/enrich
Authentication: Generic
Generic Auth Type: Header
Header Name: X-Api-Key
Header Value: {{ $credentials.apolloApiKey }}
Query Parameters:
  domain: {{ $json.domain }}
  
// Only runs if NOT known B2B
```

```javascript
// Node: Process Phase 1 Result
Type: n8n-nodes-base.code
const apolloResult = $json;
const company = apolloResult.organization || {};

// B2B Tech indicators
const b2bKeywords = ['software', 'saas', 'technology', 'cloud', 'data', 'ai', 'platform'];
const industry = (company.industry || '').toLowerCase();
const description = (company.description || '').toLowerCase();

const isB2BTech = 
  company.is_public === false && // Not consumer brand
  (b2bKeywords.some(kw => industry.includes(kw)) ||
   b2bKeywords.some(kw => description.includes(kw)));

return {
  ...$input.item.json,
  company_enriched: company.name || $json.company,
  company_size: company.estimated_num_employees,
  industry: company.industry,
  phase1_passed: isB2BTech,
  phase1_reason: isB2BTech ? 'B2B Tech confirmed' : 'Not B2B Tech',
  apollo_org_cost: 0.01
};
```

## Phase 2: Person Enrichment (Only if Phase 1 Passes)

```javascript
// Node: Apollo People API
Type: n8n-nodes-base.httpRequest
Method: GET
URL: https://api.apollo.io/v1/people/enrich
Authentication: Generic
Query Parameters:
  email: {{ $json.normalized.email }}
  
// Add cost check before this node
```

```javascript
// Node: Process Phase 2 Result
Type: n8n-nodes-base.code
const person = $json.person || {};
const title = (person.title || '').toLowerCase();

// Sales role indicators
const salesKeywords = ['sales', 'account executive', 'business development', 'revenue'];
const nonSalesKeywords = ['engineer', 'support', 'marketing', 'success', 'analyst'];

const isSalesRole = 
  salesKeywords.some(kw => title.includes(kw)) &&
  !nonSalesKeywords.some(kw => title.includes(kw));

return {
  ...$input.item.json,
  title_current: person.title,
  linkedin_url: person.linkedin_url,
  phone_enriched: person.phone,
  phase2_passed: isSalesRole,
  phase2_reason: isSalesRole ? 'Sales role confirmed' : 'Non-sales role',
  apollo_person_cost: 0.025
};
```

## ICP Scoring

```javascript
// Node: ICP Score with Claude
Type: n8n-nodes-base.httpRequest
Method: POST
URL: https://api.anthropic.com/v1/messages
Headers:
  x-api-key: {{ $credentials.claudeApiKey }}
  anthropic-version: 2023-06-01
Body:
{
  "model": "claude-4-opus-20250514",
  "max_tokens": 10,
  "messages": [{
    "role": "user",
    "content": "Score this sales professional 0-100:\nTitle: {{ $json.title_current }}\nCompany: {{ $json.company_enriched }}\nCompany Size: {{ $json.company_size }}\n\nReturn ONLY the number."
  }]
}
```

## Human Review Routing

```javascript
// Node: Determine Routing
Type: n8n-nodes-base.code
const score = parseInt($json.icp_score) || 0;
const hasPhone = !!($json.phone_primary || $json.phone_enriched);
const isInternational = $json.phone && !$json.phone.startsWith('+1');

let routing;
if (isInternational) routing = 'human_review';
else if (score >= 70 && hasPhone) routing = 'auto_qualify';
else if (score >= 70 && !hasPhone) routing = 'needs_phone';
else if (score < 70) routing = 'archive';
else routing = 'human_review';

return {
  ...$json,
  routing,
  routing_reason: `Score: ${score}, Phone: ${hasPhone}, Intl: ${isInternational}`
};
``` 