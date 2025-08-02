# MANDATORY PATTERN - Field Normalization Layer (Simplified Architecture)
# This MUST be the first node after EVERY webhook

## CRITICAL: This MUST be implemented before ANY webhook integration

### The Problem We're Solving
Webhook fields are NEVER stable. We discovered:
- Kajabi sends 15+ variations of core fields
- Case sensitivity varies randomly
- Field names change without notice
- Missing this = 100% failure rate

### Implementation Requirements

#### 1. Smart Field Mapper Node (REQUIRED)
Position: Immediately after webhook node
Type: Code node
Language: JavaScript

#### 2. Production Code (DO NOT MODIFY WITHOUT TESTING)

```javascript
const input = $input.first().json;
const normalized = {};
const mappedFields = new Set();

// Core field mappings - UPDATE WEEKLY from Field_Mapping_Log
const fieldMappings = {
  email: ['email', 'Email', 'EMAIL', 'email_address', 'emailAddress', 'e-mail', 'contact_email', 'email_address_1', 'user_email', 'primary_email'],
  phone: ['phone', 'Phone', 'PHONE', 'phone_number', 'phoneNumber', 'mobile', 'cellphone', 'telephone', 'phone_intl', 'mobile_intl'],
  name: ['name', 'Name', 'NAME', 'full_name', 'fullName', 'contact_name', 'display_name'],
  first_name: ['first_name', 'firstName', 'fname', 'given_name', 'forename'],
  last_name: ['last_name', 'lastName', 'lname', 'surname', 'family_name'],
  company: ['company', 'Company', 'COMPANY', 'company_name', 'companyName', 'organization', 'org', 'business'],
  title: ['title', 'Title', 'job_title', 'jobTitle', 'position', 'role'],
  source_form: ['source_form', 'form_name', 'formName', 'source', 'form_id'],
  interested_in_coaching: ['interested_in_coaching', 'coaching_interest', 'wants_coaching'],
  linkedin_url: ['linkedin_url', 'linkedin', 'linkedinUrl', 'linkedin_profile'],
  request_id: ['request_id', 'requestId', 'request', 'id', 'tracking_id', 'unique_id']
};

// Case-insensitive field finder
function findField(aliases) {
  for (const key of Object.keys(input)) {
    if (aliases.some(alias => alias.toLowerCase() === key.toLowerCase())) {
      mappedFields.add(key);
      return input[key];
    }
  }
  return null;
}

// Map all fields
Object.entries(fieldMappings).forEach(([normalizedName, aliases]) => {
  const value = findField(aliases);
  if (value !== null && value !== undefined && value !== '') {
    normalized[normalizedName] = value;
  }
});

// Auto-split full name if first/last names not provided
if (normalized.name && !normalized.first_name) {
  const parts = normalized.name.trim().split(/\s+/);
  normalized.first_name = parts[0] || '';
  normalized.last_name = parts.slice(1).join(' ') || '';
}

// Boolean conversions for business logic fields
['interested_in_coaching', 'qualified_lead', 'contacted'].forEach(field => {
  if (normalized[field] !== undefined) {
    const val = String(normalized[field]).toLowerCase();
    // Enhanced true detection for business fields
    const isTruthy = ['true', 'yes', '1', 'on', 'y', 'checked', 'enabled'].includes(val);
    // Convert to proper boolean for Airtable
    normalized[field] = isTruthy ? true : null;
  }
});

// Track unknown fields for weekly review
const unknownFields = Object.keys(input).filter(k => !mappedFields.has(k));

// Log to monitoring table if unknowns found
if (unknownFields.length > 0) {
  // Will be handled by separate Airtable logging node
}

return {
  normalized,
  original: input,
  unknownFields,
  mappingSuccess: Object.keys(normalized).length > 0,
  timestamp: new Date().toISOString(),
  fieldsCaptured: Object.keys(normalized).length,
  fieldsTotal: Object.keys(input).length
};
```

### Key Changes for Simplified Architecture

#### Removed Fields:
- All DND-related field mappings
- Custom compliance field variations
- Time window related fields

#### Updated Boolean Handling:
- Focus on business logic fields only
- `interested_in_coaching` - Business intent
- `qualified_lead` - Lead qualification status
- `contacted` - Previous contact tracking

#### Preserved Core Functionality:
- Email variations (15+ formats)
- Phone number variations (including international)
- Name/company field mapping
- Unknown field tracking

### Testing Requirements

#### Minimum Test Payload Variations (10):
```javascript
const testPayloads = [
  // Standard Kajabi format
  { email: 'test1@example.com', name: 'John Doe', phone: '555-0001' },
  
  // Case variations
  { Email: 'test2@example.com', Name: 'Jane Doe', Phone: '555-0002' },
  
  // Field name variations
  { email_address: 'test3@example.com', full_name: 'Bob Smith', phone_number: '555-0003' },
  
  // Boolean variations - business logic
  { email: 'test4@example.com', interested_in_coaching: 'yes' },
  { email: 'test5@example.com', interested_in_coaching: true },
  { email: 'test6@example.com', qualified_lead: '1' },
  
  // Missing fields
  { email: 'test7@example.com' }, // No name/phone
  
  // Duplicate testing
  { email: 'test1@example.com', name: 'John Duplicate' },
  
  // International format
  { email: 'test8@example.com', phone: '+44 7700 900123' },
  
  // Company variations
  { email: 'test9@example.com', company: 'Acme Corp', Company: 'Should be ignored' }
];
```

#### Success Criteria:
- [ ] 95%+ field capture rate across all tests
- [ ] Boolean conversions working for business fields
- [ ] Name splitting functional
- [ ] International phone numbers captured
- [ ] Unknown fields logged to Field_Mapping_Log
- [ ] No errors on missing fields

#### Verification Protocol:
1. **Send each test payload**
2. **Check normalized output shows captured fields**
3. **Verify Field_Mapping_Log entries for unknowns**
4. **Confirm boolean conversions work**
5. **Test duplicate field handling (takes first match)**

### Integration Rules

#### Mandatory Usage:
- **ALL downstream nodes must reference**: `$node["Smart Field Mapper"].json.normalized`
- **NEVER reference webhook data directly** after this node
- **If mapping fails** (mappingSuccess = false), route to human review queue

#### Expression Format:
```javascript
// Correct way to access normalized data
{{ $node["Smart Field Mapper"].json.normalized.email }}
{{ $node["Smart Field Mapper"].json.normalized.first_name }}
{{ $node["Smart Field Mapper"].json.normalized.interested_in_coaching }}

// Check mapping success
{{ $node["Smart Field Mapper"].json.mappingSuccess }}

// Access unknown fields for logging
{{ $node["Smart Field Mapper"].json.unknownFields }}
```

### Field_Mapping_Log Table Structure

Required Airtable table for monitoring:
```json
{
  "name": "Field_Mapping_Log",
  "fields": [
    {"name": "timestamp", "type": "dateTime"},
    {"name": "unknown_field", "type": "singleLineText"},
    {"name": "webhook_source", "type": "singleLineText"},
    {"name": "raw_value", "type": "singleLineText"},
    {"name": "occurrence_count", "type": "number"},
    {"name": "added_to_mapper", "type": "checkbox"},
    {"name": "review_status", "type": "singleSelect", 
     "options": ["New", "Reviewing", "Added", "Ignored"]}
  ]
}
```

### Weekly Maintenance

#### Review Unknown Fields:
1. **Query Field_Mapping_Log** for new unknown fields
2. **Evaluate legitimacy** of new field variations
3. **Add valid variations** to fieldMappings object
4. **Update Smart Field Mapper** code
5. **Test with updated mappings**

#### Performance Monitoring:
- **Field capture rate** should stay >95%
- **Unknown field count** should decrease over time
- **Mapping failures** should be <5% of total

### Platform Integration Notes

#### n8n Specific Requirements:
- **Expression spacing**: `{{ $json.field }}` (spaces required)
- **Node naming**: Use "Smart Field Mapper" exactly
- **Error handling**: Return success even with partial mapping
- **Data types**: Ensure boolean conversion for Airtable compatibility

#### Airtable Integration:
- **Checkbox fields**: Use true/null (never false)
- **Text fields**: Handle empty strings vs null
- **Phone fields**: Store as text, format validation later

### Error Handling

#### Graceful Degradation:
```javascript
// Handle edge cases gracefully
try {
  // Main mapping logic
  return normalizedData;
} catch (error) {
  console.error('Field mapping error:', error);
  return {
    normalized: { email: input.email || input.Email || 'unknown@example.com' },
    original: input,
    unknownFields: Object.keys(input),
    mappingSuccess: false,
    error: error.message,
    timestamp: new Date().toISOString()
  };
}
```

### Success Metrics

#### Quality Indicators:
- **Field Capture Rate**: >95% across all webhook sources
- **Unknown Field Trend**: Decreasing over time
- **Boolean Conversion Rate**: 100% for business fields
- **Name Splitting Success**: >90% when full_name provided
- **Error Rate**: <1% of total processing

*Updated: July 26, 2025 - Simplified architecture focusing on business logic, SMS service handles compliance*