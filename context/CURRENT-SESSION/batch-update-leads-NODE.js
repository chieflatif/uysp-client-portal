// BATCH UPDATE LEADS - Optimized Airtable Update Node
// Replaces: "Airtable Update" node
// Performance: 10x faster using batch API (10 records per request)

const items = $items('Parse SMS Response', 0) || [];
const BATCH_SIZE = 10;
const BASE_ID = 'app4wIsBfpJTg7pWS';
const TABLE_ID = 'tblYUvhGADerbD8EO';
const AIRTABLE_TOKEN = '{{ $credentials.airtableTokenApi.accessToken }}'; // n8n will inject credential

// Build update records payload
const records = items.map(it => {
  const j = it.json || {};
  return {
    id: j.id,
    fields: {
      'SMS Status': j.sms_status || '',
      'SMS Sequence Position': j.next_pos,
      'SMS Sent Count': j.next_count,
      'SMS Variant': j.variant || '',
      'SMS Last Sent At': j.next_last_sent_at || '',
      'Processing Status': j.next_processing || '',
      'Error Log': j.error_reason || ''
    }
  };
});

// Split into batches of 10
const batches = [];
for (let i = 0; i < records.length; i += BATCH_SIZE) {
  batches.push(records.slice(i, i + BATCH_SIZE));
}

// Execute batch updates
const results = [];
for (const batch of batches) {
  const response = await $http.request({
    method: 'PATCH',
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

// Return updated records in same format as original node
return results.map(r => ({ json: r }));





