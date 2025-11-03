const inputItems = $input.all() || [];

function sanitizeEmail(v){ if(!v) return ''; return String(v).trim().toLowerCase().replace(/[\s]+/g,'').replace(/[\\.,;:]+$/, ''); }
function isValidEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e||'')); }
function normalizePhone(v){ if(!v) return ''; let s=String(v).trim(); if(s.startsWith('+')) s='+'+s.slice(1).replace(/[^0-9]/g,''); else s=s.replace(/[^0-9]/g,''); if(s.startsWith('+')) return s; if(s.length===11 && s.startsWith('1')) return '+1'+s.slice(1); if(s.length===10) return '+1'+s; return s; }
function deriveDomain(email){ const at=String(email||'').split('@')[1]; return at||''; }
function toBool(v){ const s=String(v||'').trim().toLowerCase().replace(/[.!\s]+$/g,''); return /^(yes|y|true|1|yeah|yep|yup)$/i.test(s); }

const out = [];
for (const it of inputItems) {
  const x = it?.json ?? {};
  if (x.__isDuplicate) continue;

  const email = sanitizeEmail(x.email || x.Email);
  const phone = normalizePhone(x.phone || x.Phone);
  const first = x.first_name || x.firstName || x.first || '';
  const last = x.last_name || x.lastName || x.last || '';
  const company = String(x.company || x.Company || '');
  const title = String(x.title || x.job_title || x.Title || '');
  const domain = deriveDomain(email);

  const invalidEmail = !isValidEmail(email);
  const phoneDigits = phone.replace(/\D/g,'').replace(/^1/,'');
  const invalidPhone = phoneDigits.length!==10 || /^(.)\\1+$/.test(phoneDigits) || phoneDigits==='0000000000';

  const tagsRaw = String(x.tags || x['Kajabi Tags'] || '');
  const tagsLower = tagsRaw.toLowerCase();
  const alumni = /\balumni\b/.test(tagsLower);

  // === SURGICAL FIX: CURRENT COACHING CLIENT DETECTION ===
  // Check for active membership tags (Annual/Monthly/Payment Plans) + Deposit + Lifetime Access (case-insensitive, exclude alumni)
  const currentCoaching = !alumni && /\b(bronze annual|bronze split pay|bronze deposit|bronze lifetime access|silver \(.*3 payment plan\)|silver \(.*2 payment plan\)|silver annual|silver monthly|silver deposit|silver lifetime access|gold \(.*3 payment plan\)|gold annual|gold monthly|gold deposit|gold lifetime access|platinum \(.*3 payment plan\)|platinum annual|platinum monthly|platinum deposit|platinum lifetime access)\b/.test(tagsLower);
  // === END SURGICAL FIX ===

  // Derive Coaching Tier (separate from current client status - for reporting purposes)
  function tierFromTags(){
    if (alumni) return 'None';
    const m = tagsLower.match(/\b(platinum|gold|silver|bronze)\b/);
    if (!m) return 'None';
    const tier = m[1];
    if (/\b(gold|silver|bronze|platinum)\s*coach\b/.test(tagsLower) || /\b(coach|annual|lifetime|member|membership)\b/.test(tagsLower)) {
      return tier.charAt(0).toUpperCase()+tier.slice(1);
    }
    return 'None';
  }
  const tier = tierFromTags();
  const coachingTier = currentCoaching ? tier : 'None';
  const interested = toBool(x.interested_a) || toBool(x.interested_b) || false;

  let hrqStatus='None', hrqReason='', processing='Queued';
  if(invalidEmail){ hrqStatus='Archive'; hrqReason='Invalid email format'; processing='Complete'; }
  else if(invalidPhone){ hrqStatus='Archive'; hrqReason='Invalid phone'; processing='Complete'; }

  out.push({ json: {
    Email: email,
    Phone: phone,
    'First Name': first,
    'Last Name': last,
    Company: company,
    Title: title,
    'Company Domain': domain,
    Source: 'Backlog',
    'Processing Status': processing,
    'HRQ Status': hrqStatus,
    'HRQ Reason': hrqReason,
    'Coaching Tier': coachingTier,
    'Current Coaching Client': currentCoaching,
    'Interested in Coaching': interested,
    'Linkedin URL - Person': String(x.linkedin_url||x['Linkedin URL - Person']||''),
    'Kajabi Tags': tagsRaw,
    'SMS Campaign ID': String(x.campaign_id||x['SMS Campaign ID']||'')
  }});
}

return out;


