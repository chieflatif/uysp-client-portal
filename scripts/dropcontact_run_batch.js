/*
 Dropcontact batch runner to utilize remaining credits
 - Endpoint: POST https://api.dropcontact.com/v1/enrich/all
 - Input selection: corporate-domain leads across diverse buckets
 - Env: DROPCONTACT_API_KEY, LIMIT (default 34)
 - Output: tests/results/dropcontact-batch-latest.json (+ timestamped) with summary
*/

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTDIR = path.join(__dirname, '..', 'tests', 'results');
const BUCKETS = path.join(OUTDIR, 'lead-buckets-latest.json');
const PROVIDER = path.join(OUTDIR, 'provider-triage-latest.json');

const API_KEY = process.env.DROPCONTACT_API_KEY;
if (!API_KEY) { console.error('Missing DROPCONTACT_API_KEY'); process.exit(1); }
const LIMIT = parseInt(process.env.LIMIT || '34', 10);

function isFreeEmailDomain(domain) {
  const free = new Set(['gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com','aol.com','gmx.com','gmx.de','proton.me','protonmail.com','yandex.com','mail.com','me.com','live.com','msn.com','zoho.com','pm.me','fastmail.com','hushmail.com']);
  return free.has(domain);
}

function loadCandidates() {
  const buckets = JSON.parse(fs.readFileSync(BUCKETS,'utf8'));
  const provider = fs.existsSync(PROVIDER) ? JSON.parse(fs.readFileSync(PROVIDER,'utf8')) : { results: {} };
  const order = ['ultra','high','medium','low','very_low'];
  const seen = new Set();
  const picks = [];

  function pushIfValid(lead) {
    if (!lead) return;
    const email = (lead['Email Address'] || lead['Email'] || '').toLowerCase().trim();
    if (!email || !email.includes('@')) return;
    if (seen.has(email)) return;
    const domain = email.split('@')[1];
    if (!domain || isFreeEmailDomain(domain)) return;
    seen.add(email);
    picks.push(lead);
  }

  // Priority 1: provider double_fail corporate
  const df = (provider.results && provider.results.double_fail) || [];
  for (const item of df) { if (item.meta && item.meta.is_corporate_domain) pushIfValid(item.lead); if (picks.length>=LIMIT) return picks; }

  // Priority 2: pdl_fail_hunter_pass corporate
  const pfhp = (provider.results && provider.results.pdl_fail_hunter_pass) || [];
  for (const item of pfhp) { pushIfValid(item.lead); if (picks.length>=LIMIT) return picks; }

  // Priority 3: high→low buckets corporate
  for (const b of order) {
    for (const entry of (buckets.buckets[b] || [])) { pushIfValid(entry.lead); if (picks.length>=LIMIT) return picks; }
  }

  return picks.slice(0, LIMIT);
}

function splitName(name) {
  if (!name) return {};
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { first_name: parts[0] };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

function deriveCompany(lead) {
  const websiteRaw = (lead['Job Company Website'] || '').trim();
  const website = websiteRaw ? websiteRaw.replace(/^https?:\/\//i,'').replace(/^www\./i,'') : undefined;
  const email = (lead['Email Address'] || lead['Email'] || '').toLowerCase();
  const domain = email.includes('@') ? email.split('@')[1] : undefined;
  return { website: website || domain };
}

function httpRequest(options, bodyObj){
  return new Promise((resolve, reject) => {
    const body = bodyObj ? JSON.stringify(bodyObj) : null;
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        let json = null; try { json = JSON.parse(data || '{}'); } catch {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: json, raw: data });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function run() {
  const leads = loadCandidates();
  if (!leads.length) { console.error('No suitable leads found'); process.exit(1); }
  const data = leads.map(lead => {
    const email = (lead['Email Address'] || lead['Email'] || '').trim();
    const name = splitName(lead['User Name'] || '');
    const comp = deriveCompany(lead);
    return { email, ...name, ...comp };
  });

  // Use batch flow (submit + poll) to ensure results
  const submitOpts = {
    hostname: 'api.dropcontact.io',
    path: '/batch',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Access-Token': API_KEY }
  };
  const submit = await httpRequest(submitOpts, { data: data.map(d => ({ ...d })) });
  if (submit.statusCode !== 200 && submit.statusCode !== 202) {
    console.error('Submit failed', submit.statusCode, submit.body || submit.raw);
    process.exit(1);
  }
  const requestId = (submit.body && (submit.body.requestId || submit.body.request_id)) || null;
  if (!requestId) {
    console.error('No requestId from Dropcontact', submit.body || submit.raw);
    process.exit(1);
  }

  // Poll
  let attempts = 0; let final = null;
  while (attempts < 30) {
    await new Promise(r=>setTimeout(r, 3000));
    const poll = await httpRequest({ hostname: 'api.dropcontact.io', path: `/batch/${encodeURIComponent(requestId)}`, method: 'GET', headers: { 'X-Access-Token': API_KEY } }, null);
    if (poll.statusCode !== 200) { attempts++; continue; }
    if (poll.body && (poll.body.status === 'done' || poll.body.success === true)) { final = poll.body; break; }
    attempts++;
  }

  const results = (final && (final.data || final.results || final.enriched || [])) || [];
  const summary = summarize(results);
  const stamp = new Date().toISOString().replace(/[:.]/g,'-');
  if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });
  const latest = path.join(OUTDIR, 'dropcontact-batch-latest.json');
  const tsPath = path.join(OUTDIR, `dropcontact-batch-${stamp}.json`);
  const out = { submitted: data.length, requestId, summary, results };
  fs.writeFileSync(tsPath, JSON.stringify(out, null, 2));
  fs.writeFileSync(latest, JSON.stringify(out, null, 2));
  process.stdout.write(latest + '\n');
}

function summarize(results){
  const arr = Array.isArray(results) ? results : [];
  const s = { total: arr.length, with_linkedin: 0, with_title: 0, with_company: 0 };
  for (const r of arr){
    const ln = r.linkedin || r.linkedin_url || r.socials?.linkedin;
    const title = r.job || r.title || r.job_title;
    const company = r.company || r.organization;
    if (ln) s.with_linkedin++;
    if (title) s.with_title++;
    if (company) s.with_company++;
  }
  return s;
}

run();


