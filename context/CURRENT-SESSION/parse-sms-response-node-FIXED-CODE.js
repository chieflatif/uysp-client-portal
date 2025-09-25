const stItems = $items('SimpleTexting HTTP', 0) || [];
const prepItems = $items('Prepare Text (A/B)', 0) || [];
const settingsItems = $items('Get Settings', 0) || [];
const settings = (settingsItems.map(i => i.json.fields || i.json).find(s => s['Active Campaign']) || settingsItems[settingsItems.length-1]?.json || {});
const fallbackCampaign = settings['Active Campaign'] || '';
const isTestMode = !!(settings['Test Mode']);
const nowIso = new Date().toISOString();
const out = [];

function isPermanentFailure(reason) {
  const s = String(reason || '').toLowerCase();
  if (!s) return false;
  return s.includes('invalid contact') || s.includes('local unsubscribe') || s.includes('not a valid phone number');
}

for (let i = 0; i < stItems.length; i++) {
  const resp = stItems[i]?.json || {};
  const prepared = prepItems[i]?.json || {};
  const httpId = resp.id || '';
  const sent = Boolean(httpId);
  const effectiveSent = isTestMode ? false : sent;
  const sms_status = isTestMode ? 'Test' : (effectiveSent ? 'Sent' : 'Failed');
  const error_reason = effectiveSent ? '' : (resp.message || resp.error || 'No response id');
  const prev_pos = Number(prepared.prev_pos || 0);
  const prev_count = Number(prepared.prev_sent_count || 0);
  const next_pos = effectiveSent ? prev_pos + 1 : prev_pos;
  const next_count = effectiveSent ? prev_count + 1 : prev_count;
  const next_last_sent_at = effectiveSent ? nowIso : (prepared.last_sent_at || '');
  
  let next_processing = effectiveSent ? (next_pos >= 3 ? 'Complete' : 'In Sequence') : (prepared.processing_status || '');
  if (!effectiveSent && isPermanentFailure(error_reason)) {
    next_processing = 'Complete';
  }
  
  const campaign_id = prepared.campaign_id || fallbackCampaign || httpId || '';

  out.push({ json: { ...prepared, is_test: isTestMode, sms_status, error_reason, next_pos, next_count, next_last_sent_at, next_processing, campaign_id } });
}
return out;
