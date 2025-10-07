// BATCH CREATE AUDIT - Optimized Audit Sent Node  
// Replaces: "Audit Sent" node
// Performance: 10x faster using batch API (10 records per request)

const items = $items('Parse SMS Response', 0) || [];
const BATCH_SIZE = 10;
const BASE_ID = 'app4wIsBfpJTg7pWS';
const TABLE_ID = 'tbl5TOGNGdWXTjhzP';
const AIRTABLE_TOKEN = '{{ $credentials.airtableTokenApi.accessToken }}'; // n8n will inject credential

// Build audit records payload
const now = new Date().toISOString();
const records = items.map(it => {
  const j = it.json || {};
  return {
    fields: {
      'Event': j.is_test ? 'Test Send' : 'Send Attempt',
      'Campaign ID': j.campaign_id || '',
      'Phone': j.phone_digits || '',
      'Status': j.sms_status || '',
      'Lead Record ID': j.id || '',
      'Text': j.text || '',
      'Sent At': now,
      'Email': j.email || '',
      'First Name': j.first_name || '',
      'Last Name': j.last_name || '',
      'Company Domain': j.company_domain || '',
      'Total Messages To Phone': j.next_count || 1
    }
  };
});

// Split into batches of 10
const batches = [];
for (let i = 0; i < records.length; i += BATCH_SIZE) {
  batches.push(records.slice(i, i + BATCH_SIZE));
}

// Execute batch creates
const results = [];
for (const batch of batches) {
  const response = await $http.request({
    method: 'POST',
    url: `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: {
      records: batch,
      typecast: true
    }
  });
  
  if (response && response.records) {
    results.push(...response.records);
  }
}

// Return created records in same format as original node
return results.map(r => ({ json: r }));





