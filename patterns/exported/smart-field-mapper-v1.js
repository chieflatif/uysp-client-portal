/**
 * UYSP Smart Field Mapper v1.0
 * Phase 00 Complete Implementation
 * 
 * Extracts and normalizes webhook field data with:
 * - Field variation mapping (15+ variations per field)
 * - Boolean conversions for Airtable checkboxes  
 * - International phone detection
 * - Session 0 metrics tracking
 * - Unknown field logging support
 * 
 * Node ID: b8d9c432-2f9f-455e-a0f4-06863abfa10f
 * Workflow: wpg9K9s8wlfofv1u
 * Version: v4.6-boolean-null-fix
 */

// Smart Field Mapper with request_id support
const fieldMappings = {
  email: ['email', 'Email', 'EMAIL', 'email_address', 'emailAddress', 'e-mail', 'contact_email'],
  phone: ['phone', 'Phone', 'PHONE', 'phone_number', 'phoneNumber', 'mobile', 'cell'],
  first_name: ['first_name', 'firstName', 'fname', 'given_name'],
  last_name: ['last_name', 'lastName', 'lname', 'surname'],
  full_name: ['name', 'Name', 'full_name', 'fullName'],
  company: ['company', 'Company', 'company_name', 'organization'],
  title: ['title', 'Title', 'job_title', 'role', 'position'],
  linkedin: ['linkedin', 'LinkedIn', 'linkedin_url', 'linkedinProfile']
};

const otherFields = {
  source_form: ['source_form', 'source', 'form_name', 'utm_source'],
  interested_in_coaching: ['interested_in_coaching', 'coaching_interest'],
  qualified_lead: ['qualified_lead', 'qualifiedLead', 'qualified', 'is_qualified'],
  contacted: ['contacted', 'wasContacted', 'has_been_contacted', 'contact_made'],
  request_id: ['request_id', 'requestId', 'request_ID']
};

const normalized = {};
const unmappedFields = [];
const mappingLog = [];

const webhookData = $input.item.json;
const input = webhookData.body || webhookData;

// Map standard fields
Object.keys(fieldMappings).forEach(targetField => {
  const variations = fieldMappings[targetField];
  let found = false;
  
  for (const variation of variations) {
    const inputKey = Object.keys(input).find(key => 
      key.toLowerCase() === variation.toLowerCase()
    );
    
    if (inputKey && input[inputKey] !== undefined && input[inputKey] !== '') {
      normalized[targetField] = input[inputKey];
      mappingLog.push(`Mapped ${inputKey} → ${targetField}`);
      found = true;
      break;
    }
  }
  
  if (!found) {
    normalized[targetField] = null;
    mappingLog.push(`No mapping found for ${targetField}, set to null`);
  }
});

// Map other fields
Object.keys(otherFields).forEach(targetField => {
  const variations = otherFields[targetField];
  
  for (const variation of variations) {
    const inputKey = Object.keys(input).find(key => 
      key.toLowerCase() === variation.toLowerCase()
    );
    
    if (inputKey && input[inputKey] !== undefined && input[inputKey] !== '') {
      normalized[targetField] = input[inputKey];
      mappingLog.push(`Mapped ${inputKey} → ${targetField}`);
      break;
    }
  }
});

// Handle name splitting
if (normalized.full_name && !normalized.first_name) {
  const parts = normalized.full_name.split(' ');
  normalized.first_name = parts[0] || null;
  normalized.last_name = parts.slice(1).join(' ') || null;
  mappingLog.push(`Split full_name into first/last`);
}

// Boolean conversions for Airtable checkboxes
['interested_in_coaching', 'qualified_lead', 'contacted'].forEach(field => {
  if (normalized[field] !== undefined) {
    const val = String(normalized[field]).toLowerCase();
    normalized[field] = ['true', 'yes', '1', 'on', 'y', 'checked'].includes(val);
  }
});

// International phone detection and country code extraction
if (normalized.phone) {
  const isInternational = !normalized.phone.match(/^(\+1|1)?[2-9]/);
  normalized.international_phone = isInternational;
  normalized.phone_country_code = isInternational ? 
    normalized.phone.match(/^\+\d{1,3}/)?.[0] || 'unknown' : '+1';
}

// Find unmapped fields
Object.keys(input).forEach(key => {
  const wasMapped = mappingLog.some(log => log.includes(key));
  if (!wasMapped) {
    unmappedFields.push(key);
  }
});

// Session 0 metrics for field mapping analysis
normalized.field_mapping_success_rate = 
  (Object.keys(normalized).length / Object.keys(input).length * 100).toFixed(1);
normalized.webhook_field_count = Object.keys(input).length;
normalized.mapped_field_count = Object.keys(normalized).length;
normalized.normalization_version = 'v4.6-boolean-null-fix';
normalized.raw_webhook_data = JSON.stringify(input);
normalized.unknown_field_list = JSON.stringify(unmappedFields);

// Add metadata
normalized._mapping_metadata = {
  original_field_count: Object.keys(input).length,
  mapped_field_count: Object.keys(normalized).length - 1,
  unmapped_fields: unmappedFields,
  mapping_timestamp: new Date().toISOString(),
  success_rate: ((Object.keys(normalized).length - 1) / Object.keys(input).length * 100).toFixed(2) + '%'
};

if (unmappedFields.length > 0) {
  console.log('Unknown fields detected:', unmappedFields);
}

if (!normalized.email) {
  throw new Error('CRITICAL: No email field found in payload. Cannot process lead.');
}

return { 
  ...webhookData,
  normalized,
  unmappedFields,
  mappingLog
}; 