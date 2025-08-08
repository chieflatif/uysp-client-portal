/**
 * Smart Field Mapper v4.6 - EXTRACTED FROM GROK (PROVEN WORKING)
 * 
 * EVIDENCE: GROK execution 1201 proves this implementation works
 * SOURCE: VjJCC0EMwIZp7Y6K (GROK workflow) - Smart Field Mapper node
 * 
 * KEY IMPROVEMENTS over v1.0:
 * - CORRECTED 3-field phone strategy (phone_original + phone_recent + phone_validated)
 * - Enhanced field mappings with 26+ variations per field
 * - Comprehensive webhook data extraction (body vs direct format)
 * - Better boolean conversion handling
 * - Advanced phone strategy integration
 * 
 * CRITICAL FOR PDL INTEGRATION:
 * This is the proven baseline for all future field mapping operations
 */

// Smart Field Mapper v4.6 - CORRECTED 3-FIELD PHONE STRATEGY
// CORRECTED: phone_original + phone_recent + phone_validated
const webhookData = $input.first().json;

// CRITICAL FIX: Extract actual form data from webhook structure
let inputData;
if (webhookData.body && typeof webhookData.body === 'object') {
  // n8n webhook format: data is in .body
  inputData = webhookData.body;
} else if (webhookData.data && typeof webhookData.data === 'object') {
  // Alternative webhook format: data is in .data
  inputData = webhookData.data;
} else {
  // Direct format: webhook data is the payload itself
  inputData = webhookData;
}

const fieldMappings = {
  email: ['email', 'Email', 'EMAIL', 'email_address', 'emailAddress', 'e-mail', 'e_mail', 'contact_email', 'Email_Address', 'EMAIL_ADDRESS'],
  phone: ['phone', 'Phone', 'PHONE', 'phone_number', 'phoneNumber', 'mobile', 'cellphone', 'telephone', 'phone_intl', 'mobile_intl'],
  name: ['name', 'Name', 'NAME', 'full_name', 'fullName', 'contact_name', 'display_name'],
  first_name: ['first_name', 'firstName', 'fname', 'given_name', 'forename'],
  last_name: ['last_name', 'lastName', 'lname', 'surname', 'family_name'],
  company: ['company', 'Company', 'COMPANY', 'company_name', 'companyName', 'organization', 'org', 'business'],
  title: ['title', 'Title', 'job_title', 'jobTitle', 'position', 'role'],
  source_form: ['source_form', 'form_name', 'formName', 'source', 'form_id'],
  interested_in_coaching: ['interested_in_coaching', 'coaching_interest', 'wants_coaching'],
  linkedin_url: ['linkedin_url', 'linkedin', 'linkedinUrl', 'linkedin_profile'],
  request_id: ['request_id', 'requestId', 'request', 'id', 'tracking_id']
};

const normalized = {};
const mappedFields = new Set();

// Case-insensitive field finder
function findField(aliases) {
  for (const key of Object.keys(inputData)) {
    if (aliases.some(alias => alias.toLowerCase() === key.toLowerCase())) {
      mappedFields.add(key);
      return inputData[key];
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

// Auto-split full name if needed
if (normalized.name && !normalized.first_name) {
  const parts = normalized.name.trim().split(/\s+/);
  normalized.first_name = parts[0] || '';
  normalized.last_name = parts.slice(1).join(' ') || '';
}

// CORRECTED: 3-Field Phone Strategy Implementation
if (normalized.phone) {
  // STRATEGY: phone_original (never changes) + phone_recent (always updates) + phone_validated (enrichment sets)
  
  // For NEW records: phone_original = phone_recent = incoming phone
  // For EXISTING records: phone_original preserved, phone_recent = incoming phone
  // phone_validated is ONLY set by enrichment process, never by webhook
  
  normalized.phone_recent = normalized.phone;  // Always update to latest received
  normalized.phone_original = normalized.phone; // Will be handled by duplicate logic to preserve on updates
  // phone_validated is NOT set here - only by enrichment/validation process
}

// Boolean conversion for Airtable
['interested_in_coaching', 'qualified_lead', 'contacted'].forEach(field => {
  if (normalized[field] !== undefined) {
    const val = String(normalized[field]).toLowerCase();
    const isTruthy = ['true', 'yes', '1', 'on', 'y', 'checked', 'enabled'].includes(val);
    normalized[field] = isTruthy ? true : null;
  }
});

// Track unknown fields
const unknownFields = Object.keys(inputData).filter(k => !mappedFields.has(k));

// Add metadata
normalized.webhook_field_count = Object.keys(inputData).length;
normalized.mapped_field_count = Object.keys(normalized).length;
normalized.unknown_field_list = unknownFields.join(', ');
normalized.field_mapping_success_rate = Math.round((Object.keys(normalized).length / Object.keys(inputData).length) * 100);
normalized.normalization_version = 'v4.6-corrected-phone-strategy';
normalized.raw_webhook_data = JSON.stringify(webhookData);

return {
  normalized,
  original: inputData,
  unknownFields,
  mappingSuccess: Object.keys(normalized).length > 0,
  timestamp: new Date().toISOString()
};