/*
 Provider Triage Runner (direct provider calls)
 - Input: tests/results/lead-buckets-latest.json (from lead_bucketer)
 - Calls PDL Person Enrich first using email. If PDL passes → pdl_pass bucket.
 - If PDL fails, calls Hunter Email Verifier using email. If deliverable → pdl_fail_hunter_pass.
 - If both fail → double_fail.
 - Stops when counts reach: pdl_pass>=10, pdl_fail_hunter_pass>=10, double_fail>=20.
 - Tries to ensure variety by round-robin sampling across initial score buckets.
 - Output: tests/results/provider-triage-latest.json (+ timestamped copy)

 Env vars required:
 - PDL_API_KEY
 - HUNTER_API_KEY
*/

const fs = require('fs');
const path = require('path');
const https = require('https');

const INPUT = path.join(__dirname, '..', 'tests', 'results', 'lead-buckets-latest.json');
const OUTDIR = path.join(__dirname, '..', 'tests', 'results');

const PDL_API_KEY = process.env.PDL_API_KEY;
const HUNTER_API_KEY = process.env.HUNTER_API_KEY;

if (!PDL_API_KEY || !HUNTER_API_KEY) {
  console.error('Missing required env vars. Set PDL_API_KEY and HUNTER_API_KEY.');
  process.exit(1);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function httpsGetJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data || '{}');
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: null, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function pdlPersonEnrich(email) {
  if (!email) return { pass: false, reason: 'no_email' };
  const base = 'https://api.peopledatalabs.com/v5/person/enrich';
  const url = `${base}?api_key=${encodeURIComponent(PDL_API_KEY)}&email=${encodeURIComponent(email)}`;
  try {
    const { statusCode, body } = await httpsGetJson(url);
    // PDL returns 200 with data if found, 404 or empty if not
    if (statusCode === 200 && body && (body.status === 'found' || body.full_name || body.id || body.data)) {
      return { pass: true, evidence: { statusCode, id: body.id || body.likelihood || null } };
    }
    return { pass: false, evidence: { statusCode, status: body && body.status } };
  } catch (e) {
    return { pass: false, reason: 'error', error: e.message };
  }
}

async function hunterVerify(email) {
  if (!email) return { pass: false, reason: 'no_email' };
  const base = 'https://api.hunter.io/v2/email-verifier';
  const url = `${base}?email=${encodeURIComponent(email)}&api_key=${encodeURIComponent(HUNTER_API_KEY)}`;
  try {
    const { statusCode, body } = await httpsGetJson(url);
    // Hunter verifier returns data.status and data.result
    const result = body && body.data && body.data.result;
    const score = body && body.data && body.data.score;
    const pass = result === 'deliverable';
    return { pass, evidence: { statusCode, result, score } };
  } catch (e) {
    return { pass: false, reason: 'error', error: e.message };
  }
}

function stratifiedIterator(buckets, order) {
  const arrays = order.map(name => buckets[name] || []);
  const indices = arrays.map(() => 0);
  return {
    next() {
      for (let i = 0; i < arrays.length; i++) {
        const idx = i;
        const arr = arrays[idx];
        if (indices[idx] < arr.length) {
          const item = arr[indices[idx]++];
          return { value: item, done: false };
        }
      }
      // second pass round-robin until exhaustion
      let progressed = false;
      for (let i = 0; i < arrays.length; i++) {
        const arr = arrays[i];
        if (indices[i] < arr.length) {
          progressed = true;
          const item = arr[indices[i]++];
          return { value: item, done: false };
        }
      }
      return { done: true };
    }
  };
}

function extractEmailDomain(lead) {
  const email = (lead['Email Address'] || lead['Email'] || '').trim();
  if (!email || !email.includes('@')) return '';
  return email.split('@')[1].toLowerCase();
}

function isFreeEmailDomain(domain) {
  if (!domain) return false;
  const free = new Set([
    'gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com','aol.com','gmx.com','gmx.de','proton.me','protonmail.com','yandex.com','mail.com','me.com','live.com','msn.com','zoho.com','pm.me','fastmail.com','hushmail.com'
  ]);
  return free.has(domain);
}

async function main() {
  const raw = fs.readFileSync(INPUT, 'utf8');
  const parsed = JSON.parse(raw);
  const buckets = parsed.buckets || {};
  const order = ['ultra','high','medium','low','very_low','archive','unclear'];
  // Improved round-robin iterator that cycles across arrays
  function* rr() {
    const arrays = order.map(name => (buckets[name] || []).slice());
    const lengths = arrays.map(a => a.length);
    const total = lengths.reduce((a,b)=>a+b,0);
    const idx = new Array(arrays.length).fill(0);
    let emitted = 0;
    let cur = 0;
    while (emitted < total) {
      if (idx[cur] < lengths[cur]) {
        yield arrays[cur][idx[cur]++];
        emitted++;
      }
      cur = (cur + 1) % arrays.length;
    }
  }
  const it = rr();

  const target = { pdl_pass: 10, pdl_fail_hunter_pass: 10, double_fail: 20, double_fail_corporate: 20 };
  const results = { pdl_pass: [], pdl_fail_hunter_pass: [], double_fail: [] };

  const seenEmails = new Set();

  while ((results.pdl_pass.length < target.pdl_pass || results.pdl_fail_hunter_pass.length < target.pdl_fail_hunter_pass || results.double_fail.length < target.double_fail || (results.double_fail.filter(df => df.meta && df.meta.is_corporate_domain).length < target.double_fail_corporate))) {
    const n = it.next();
    if (n.done) break;
    const item = n.value;
    const lead = item.lead || {};
    const email = lead['Email Address'] || lead['Email'] || '';
    if (!email || seenEmails.has(email.toLowerCase())) continue;
    seenEmails.add(email.toLowerCase());

    // Respect rate limits lightly
    await sleep(120);

    const pdl = await pdlPersonEnrich(email);
    if (pdl.pass) {
      if (results.pdl_pass.length < target.pdl_pass) {
        results.pdl_pass.push({ lead, provider: { pdl }, reason: 'PDL pass' });
      }
      continue;
    }

    await sleep(120);
    const hunter = await hunterVerify(email);
    if (hunter.pass) {
      if (results.pdl_fail_hunter_pass.length < target.pdl_fail_hunter_pass) {
        results.pdl_fail_hunter_pass.push({ lead, provider: { pdl, hunter }, reason: 'PDL fail, Hunter deliverable' });
      }
    } else {
      const domain = extractEmailDomain(lead);
      const isCorporate = !!domain && !isFreeEmailDomain(domain);
      const meta = { email_domain: domain, is_corporate_domain: isCorporate };
      results.double_fail.push({ lead, provider: { pdl, hunter }, meta, reason: 'PDL fail, Hunter fail' });
    }
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const counts = Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.length]));
  const corpDoubleFail = results.double_fail.filter(df => df.meta && df.meta.is_corporate_domain).length;
  const out = { results, target, counts, extra: { double_fail_corporate: corpDoubleFail } };
  if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });
  const tsPath = path.join(OUTDIR, `provider-triage-${stamp}.json`);
  const latestPath = path.join(OUTDIR, 'provider-triage-latest.json');
  fs.writeFileSync(tsPath, JSON.stringify(out, null, 2));
  fs.writeFileSync(latestPath, JSON.stringify(out, null, 2));
  process.stdout.write(latestPath + '\n');
}

main().catch(err => { console.error(err); process.exit(1); });


