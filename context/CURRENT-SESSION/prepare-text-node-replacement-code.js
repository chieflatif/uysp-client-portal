const crypto = require('crypto');
const leads = ($items("List Due Leads", 0) || []).map(i => i.json.fields || i.json);
const settingsRows = ($items("Get Settings", 0) || []).map(i => i.json);
const pickSettings = () => {
  const candidates = settingsRows.map(r => r.fields || r);
  for (const s of candidates) {
    if (s && (s['Active Campaign'] || s['Fast Mode'] !== undefined || s['ab_ratio_a'] !== undefined || s['Test Mode'] !== undefined)) return s;
  }
  return candidates[candidates.length - 1] || {};
};
const settings = pickSettings();
const bookingUrl = String(settings['Calendly URL'] || '').trim() || 'https://calendly.com/d/cwvn-dwy-v5k/sales-coaching-strategy-call-rrl';
const aPct = Number(settings.ab_ratio_a ?? settings.ab_ratio_A ?? 50);
const fastMode = !!(settings['Fast Mode']);
const isTestMode = !!(settings['Test Mode']);
const testDigits = String(settings['Test Phone'] || '').replace(/\D/g,'').replace(/^1/, '');
const templates = ($items("List Templates", 0) || []).map(i => i.json.fields || i.json);

function pickVariant(existing){ if (existing==='A'||existing==='B') return existing; const r=Math.random()*100; return r<aPct?'A':'B'; }
function tmplFor(variant, step){ return templates.find(t => String(t.Variant)===variant && Number(t.Step)===step); }
function firstName(rec){ return rec['First Name'] || rec['Full Name']?.split(' ')[0] || (rec['Email']||'').split('@')[0] || '' }
function delayMsFor(step, t){
  if (step===1) return 0;
  if (fastMode) {
    const m = Number((t && (t['Fast Delay Minutes'] ?? t['Fast delay minutes'])) ?? 3);
    return m * 60 * 1000;
  }
  const d = Number((t && t['Delay Days']) ?? (step===2?3:7));
  return d * 24 * 60 * 60 * 1000;
}

// CRITICAL: TIME WINDOW ENFORCEMENT (9 AM - 5 PM Eastern)
const now = new Date();
const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
const currentHour = easternTime.getHours();
if (!isTestMode && (currentHour < 9 || currentHour >= 17)) {
  console.log(`BLOCKED: Outside time window. Current hour: ${currentHour} (Eastern). Allowed: 9 AM - 5 PM.`);
  return [];
}

const out=[];
const nowMs = now.getTime();
const debugLog = [];
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

if (isTestMode) debugLog.push('TEST MODE: Enabled (bypass hours, max 1 item, override phone to Test Phone)');
debugLog.push(`BATCH SIZE: Processing ${leads.length} leads passed from Airtable`);

for (const rec of leads){ // THIS LINE IS MODIFIED
  const phoneOriginal = String(rec['Phone'] || '');
  const phoneDigits = phoneOriginal.replace(/\D/g,'').replace(/^1/, '');
  const sendDigits = (isTestMode && testDigits) ? testDigits : phoneDigits;
  const countryRaw = String(rec['Location Country'] || '').toLowerCase();
  const isUSCA = countryRaw.includes('united states') || countryRaw.includes('canada');
  if (!isUSCA || phoneDigits.length !== 10) {
    debugLog.push(`SKIP: ${rec['First Name']} - Invalid phone/country`);
    continue;
  }

  let pos = Number(rec['SMS Sequence Position'] || 0);
  let last = rec['SMS Last Sent At'] || rec['Last SMS Sent'] || null;
  if (pos > 0 && !last) { pos = 0; last = null; }
  const processing = rec['Processing Status'] || '';
  const nextStep = pos + 1;
  if (nextStep > 3) {
    debugLog.push(`SKIP: ${rec['First Name']} - Sequence complete (step ${nextStep})`);
    continue;
  }

  // --- SURGICAL FIX ---
  // The 24-hour check ONLY applies to leads who have ALREADY been sent a message.
  if (pos > 0 && last) {
    const lastMs = new Date(last).getTime();
    if (!Number.isNaN(lastMs)) {
      const msSinceLastSend = nowMs - lastMs;
      if (msSinceLastSend < TWENTY_FOUR_HOURS) {
        const hoursRemaining = Math.ceil((TWENTY_FOUR_HOURS - msSinceLastSend) / (1000 * 60 * 60));
        debugLog.push(`BLOCKED: ${rec['First Name']} sent within 24h. ${hoursRemaining}h remaining.`);
        continue;
      }
    }
  }
  // --- END FIX ---

  const variant = pickVariant(rec['SMS Variant']);
  const t = tmplFor(variant, nextStep);
  if (!t || !t.Body) {
    debugLog.push(`SKIP: ${rec['First Name']} - No template for variant ${variant} step ${nextStep}`);
    continue;
  }

  // ENHANCED DELAY VALIDATION (for sequence progression)
  // This check now ONLY applies to leads progressing in the sequence.
  if (pos > 0 && last){
    const lastMs = new Date(last).getTime();
    if (Number.isNaN(lastMs)) {
      debugLog.push(`SKIP: ${rec['First Name']} - Invalid timestamp`);
      continue;
    }
    const msSince = nowMs - lastMs;
    const needMs = delayMsFor(nextStep, t);
    const hoursSince = Math.round(msSince / (1000 * 60 * 60) * 10) / 10;
    const hoursNeeded = Math.round(needMs / (1000 * 60 * 60) * 10) / 10;
    if (msSince < needMs) {
      debugLog.push(`SKIP: ${rec['First Name']} - Too soon (${hoursSince}h < ${hoursNeeded}h needed)`);
      continue;
    }
  }

  let text = String(t.Body).replaceAll('{Name}', firstName(rec));
  text = text.replaceAll('https://hi.switchy.io/UYSP', bookingUrl);
  text = text.replaceAll('{BookingURL}', bookingUrl);
  const leadCampaignId = String(rec['SMS Campaign ID'] || '').trim();
  const templateCampaign = String(t.Campaign || t['Campaign'] || '').trim();
  const settingsCampaign = String(settings['Active Campaign'] || '').trim();
  const campaignId = leadCampaignId || templateCampaign || settingsCampaign || '';

  const shortLinkId = rec['Short Link ID'] || '';
  const shortLinkUrl = rec['Short Link URL'] || '';

  debugLog.push(`INCLUDE: ${rec['First Name']} ready for step ${nextStep}`);
  
  out.push({ json: {
    id: rec.id || rec['Record ID'], text, variant, campaign_id: campaignId,
    prev_pos: pos, prev_sent_count: Number(rec['SMS Sent Count'] || 0),
    first_name: rec['First Name'] || '', last_name: rec['Last Name'] || '', email: rec['Email'] || '',
    company_domain: rec['Company Domain'] || '', phone_original: phoneOriginal, phone_digits: sendDigits,
    last_sent_at: last || '', processing_status: processing || '',
    short_link_id: shortLinkId, short_link_url: shortLinkUrl,
    debug_info: `Step ${nextStep}, Last: ${last}, Hours since: ${last ? Math.round((nowMs - new Date(last).getTime()) / (1000 * 60 * 60) * 10) / 10 : 'N/A'}`
  }});
}

// COMPREHENSIVE DEBUG LOGGING
console.log('=== SMS SCHEDULER DEBUG REPORT ===');
console.log(`Time Window Check: ${currentHour}:00 Eastern (Allowed: 9-17) | Test Mode: ${isTestMode}`);
console.log(`Total Leads from Airtable: ${leads.length}`);
console.log(`Final Output Count: ${out.length}`);
console.log('Processing Details:');
console.log(debugLog.join('\\n'));
console.log('=== END DEBUG REPORT ===');

return out;
