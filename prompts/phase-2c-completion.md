# Cursor Prompt: Phase 2C Bug Fixes

## CRITICAL FIXES REQUIRED
You have THREE critical bugs to fix before Phase 2C is complete:

### Bug #1: Duplicate Handler Data Flow
Location: Code node `a8ab252a-395a-418a-8e3a-c543d9d13a7c`
Problem: Pulling data from wrong node (after search instead of before)
Solution (complete code replacement):

```javascript
// COMPLETE REPLACEMENT - Fixes data flow
const search = $input.first()?.json || {};

// Get the lead data that triggered the search (BEFORE search, not after)
const leadFromRouting = $node['Score-Based Routing V3.0']?.json?.normalized || 
                        $node['Score-Based Routing V3.0']?.json || {};

// Check if duplicate found
const hasDup = !!(search.id || (Array.isArray(search.records) && search.records.length > 0));
const existingRecord = hasDup ? (search.records?.[0] || search) : null;
const recordId = existingRecord?.id || null;

// Get existing duplicate count and increment
const existingDupCount = existingRecord?.fields?.duplicate_count || 0;
const newDupCount = hasDup ? existingDupCount + 1 : 0;

return [{
  json: {
    duplicate: hasDup,
    duplicateCount: newDupCount,
    recordId,
    normalized: leadFromRouting, // Use data from BEFORE search
    // Include all fields for downstream
    email: leadFromRouting.email || null,
    first_name: leadFromRouting.first_name || null,
    last_name: leadFromRouting.last_name || null,
    company: leadFromRouting.company_enriched || leadFromRouting.company || null,
    title: leadFromRouting.title_current || leadFromRouting.title || null,
    icp_score: leadFromRouting.icp_score || 0,
    icp_tier: leadFromRouting.icp_tier || 'Archive'
  }
}];
```

### Bug #2: Airtable Upsert Field Mapping
Node: `e270b8de-2c11-4cf9-a439-2110dd0d1f80`
Field to fix:

```javascript
"duplicate_count": "={{ $json.duplicateCount || 0 }}"
```

### Bug #3: Data Integrity Validator (NEW NODE)
Create after Duplicate Handler, before Route by Duplicate. Use EXACT code:

```javascript
// Node Name: Data Integrity Validator
const item = $input.first();
const data = item.json;

// Validate critical fields exist
const criticalFields = ['email', 'normalized'];
const missing = criticalFields.filter(f => !data[f]);

if (missing.length > 0) {
  throw new Error(`Missing critical fields: ${missing.join(', ')}`);
}

// Validate normalized data structure
const normalized = data.normalized;
if (!normalized.email) {
  throw new Error('Normalized data missing email');
}

// Log for debugging
console.log('Validating lead:', {
  email: normalized.email,
  duplicate: data.duplicate,
  duplicateCount: data.duplicateCount,
  hasScore: !!normalized.icp_score
});

return [item];
```

## EVIDENCE REQUIRED
- Show `duplicate_count` incrementing in Airtable
- Test with 5 payloads showing data preservation
- Export workflow JSON after fixes
