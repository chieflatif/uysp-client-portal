/*
 Dropcontact probe: submit a small batch and poll results
 - Input sources: provider-triage-latest.json → prefer corporate-domain double-fails
 - Env: DROPCONTACT_API_KEY
 - Output: tests/results/dropcontact-probe-latest.json (+ timestamped) with summary (linkedin/title/company hit rates)
*/

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTDIR = path.join(__dirname, '..', 'tests', 'results');
const TRIAGE = path.join(OUTDIR, 'provider-triage-latest.json');

const API_KEY = process.env.DROPCONTACT_API_KEY;
if (!API_KEY) {
  console.error('Missing DROPCONTACT_API_KEY');
  process.exit(1);
}

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

function httpRequest(options, bodyObj){
  return new Promise((resolve, reject) => {
    const body = bodyObj ? JSON.stringify(bodyObj) : null;
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data || '{}'); } catch {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: json, raw: data });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function extractName(lead){
  const name = (lead['User Name'] || '').trim();
  if (!name) return {};
  const parts = name.split(/\s+/);
  const first = parts[0];
  const last = parts.slice(1).join(' ');
  return { first_name: first || undefined, last_name: last || undefined };
}

function extractCompany(lead){
  const domain = (lead['Job Company Website'] || '').trim();
  if (!domain) return {};
  const website = domain.replace(/^https?:\/\//i,'').replace(/^www\./i,'');
  return { website };
}

function pickEmails(){
  const triage = JSON.parse(fs.readFileSync(TRIAGE,'utf8'));
  const doubles = (triage.results && triage.results.double_fail) || [];
  const corp = doubles.filter(x => x.meta && x.meta.is_corporate_domain);
  const chosen = [];
  const seen = new Set();
  for (const item of corp){
    const lead = item.lead || {};
    const email = (lead['Email Address'] || lead['Email'] || '').toLowerCase();
    if (!email || !email.includes('@')) continue;
    if (seen.has(email)) continue;
    seen.add(email);
    chosen.push(lead);
    if (chosen.length >= 20) break;
  }
  return chosen;
}

async function submitBatch(records){
  const options = {
    hostname: 'api.dropcontact.io',
    path: '/batch',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Access-Token': API_KEY }
  };
  const data = records.map(lead => {
    const email = (lead['Email Address'] || lead['Email'] || '').trim();
    const n = extractName(lead);
    const c = extractCompany(lead);
    return { email, ...n, ...c };
  });
  return await httpRequest(options, { data });
}

async function pollResult(requestId){
  const options = {
    hostname: 'api.dropcontact.io',
    path: `/batch/${encodeURIComponent(requestId)}`,
    method: 'GET',
    headers: { 'X-Access-Token': API_KEY }
  };
  return await httpRequest(options, null);
}

function summarize(results){
  const stats = { total: results.length, with_linkedin: 0, with_title: 0, with_company: 0 };
  for (const r of results){
    const p = r && (r.person || r) || {};
    const ln = p.linkedin || p.linkedin_url || p.linkedin_profile || p.socials?.linkedin;
    const title = p.job || p.job_title || p.title;
    const company = p.company || p.organization || p.org || p.current_employer;
    if (ln) stats.with_linkedin++;
    if (title) stats.with_title++;
    if (company) stats.with_company++;
  }
  return stats;
}

async function main(){
  const leads = pickEmails();
  if (!leads.length) { console.error('No corporate double-fail leads found to test'); process.exit(1); }

  const sub = await submitBatch(leads);
  if (sub.statusCode !== 200 && sub.statusCode !== 202) {
    console.error('Submit failed', sub.statusCode, sub.body || sub.raw);
    process.exit(1);
  }
  const reqId = (sub.body && (sub.body.requestId || sub.body.request_id)) || null;
  if (!reqId) { console.error('No requestId from Dropcontact', sub.body || sub.raw); process.exit(1); }

  let attempts = 0; let final = null;
  while (attempts < 20) {
    await sleep(3000);
    const poll = await pollResult(reqId);
    if (poll.statusCode !== 200) { attempts++; continue; }
    if (poll.body && (poll.body.status === 'done' || poll.body.success === true)) { final = poll.body; break; }
    attempts++;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g,'-');
  if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });
  const latest = path.join(OUTDIR, 'dropcontact-probe-latest.json');
  const tsPath = path.join(OUTDIR, `dropcontact-probe-${stamp}.json`);

  const results = (final && (final.data || final.results || final.enriched || [])) || [];
  const summary = summarize(results);
  const out = { requestId: reqId, attempts, summary, raw: final };
  fs.writeFileSync(tsPath, JSON.stringify(out, null, 2));
  fs.writeFileSync(latest, JSON.stringify(out, null, 2));
  process.stdout.write(latest + '\n');
}

main();


