/*
 Apollo Triage (on double failures)
 - Input: tests/results/provider-triage-latest.json
 - For each double_fail, call Apollo People Match by email.
 - Classify: apollo_pass (found) until 10; else triple_fail.
 - Output: tests/results/apollo-triage-latest.json (+ timestamped)

 Env:
 - APOLLO_API_KEY
*/

const fs = require('fs');
const path = require('path');
const https = require('https');

const INPUT = path.join(__dirname, '..', 'tests', 'results', 'provider-triage-latest.json');
const OUTDIR = path.join(__dirname, '..', 'tests', 'results');

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
if (!APOLLO_API_KEY) {
  console.error('Missing APOLLO_API_KEY');
  process.exit(1);
}

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

function httpsPostJson(hostname, path, headers, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload || {});
    const req = https.request({ hostname, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers } }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(body || '{}'), headers: res.headers, raw: body });
        } catch {
          resolve({ statusCode: res.statusCode, raw: body, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function httpsPostQuery(hostname, path, headers, params) {
  return new Promise((resolve, reject) => {
    const qs = new URLSearchParams(params || {}).toString();
    const fullPath = qs ? `${path}?${qs}` : path;
    const req = https.request({ hostname, path: fullPath, method: 'POST', headers: { ...headers } }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(body || '{}'), headers: res.headers, raw: body });
        } catch {
          resolve({ statusCode: res.statusCode, raw: body, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function apolloPeopleMatch(params) {
  const hostname = 'api.apollo.io';
  const p = '/api/v1/people/match';
  // Per docs: fields are Query Params. Send only name/email (no LinkedIn) per user instruction.
  const headers = { 'X-Api-Key': APOLLO_API_KEY };
  const queryParams = {
    api_key: APOLLO_API_KEY,
    email: params.email || undefined,
    name: params.name || undefined,
    first_name: params.first_name || undefined,
    last_name: params.last_name || undefined
  };
  try {
    const { statusCode, body, raw } = await httpsPostQuery(hostname, p, headers, queryParams);
    const person = body && (body.person || body.contact || body.data || null);
    const found = !!person;
    return { pass: found, evidence: { statusCode, id: person && (person.id || person.apollo_id || null), body } };
  } catch (e) {
    return { pass: false, reason: 'error', error: e.message };
  }
}

async function main() {
  const raw = fs.readFileSync(INPUT, 'utf8');
  const triage = JSON.parse(raw);
  const doubles = (triage.results && triage.results.double_fail) || [];

  const results = { apollo_pass: [], triple_fail: [] };
  const targetPass = 10;

  // Optional debug log
  const DEBUG = process.env.APOLLO_DEBUG;
  const logPath = path.join(OUTDIR, `apollo-raw-${new Date().toISOString().replace(/[:.]/g,'-')}.ndjson`);
  let logStream = null;
  if (DEBUG) {
    try { logStream = fs.createWriteStream(logPath, { flags: 'a' }); } catch {}
  }

  for (const item of doubles) {
    const lead = item.lead || {};
    const email = lead['Email Address'] || lead['Email'] || '';
    const name = lead['User Name'] || '';
    const rawDomain = (lead['Job Company Website'] || '').trim();
    const domainFromWebsite = rawDomain.replace(/^https?:\/\//i,'').replace(/^www\./i,'');
    const emailDomain = (email.includes('@') ? email.split('@')[1] : '').trim();
    const domain = domainFromWebsite || emailDomain || undefined;
    let first_name, last_name;
    if (name && name.includes(' ')) {
      const parts = name.split(/\s+/);
      first_name = parts[0];
      last_name = parts.slice(1).join(' ');
    }
    if (!email) { results.triple_fail.push({ lead, reason: 'no_email' }); continue; }
    await sleep(400);
    const res = await apolloPeopleMatch({ email, name, first_name, last_name });
    if (logStream) {
      const logLine = {
        t: new Date().toISOString(), email, domain, first_name, last_name,
        pass: res.pass, status: res.evidence && res.evidence.statusCode, body_keys: res.evidence && res.evidence.body ? Object.keys(res.evidence.body) : null,
        err: res.error || null
      };
      try { logStream.write(JSON.stringify(logLine) + '\n'); } catch {}
    }
    if (res.pass && results.apollo_pass.length < targetPass) {
      results.apollo_pass.push({ lead, provider: { apollo: res }, reason: 'Apollo found' });
    } else {
      results.triple_fail.push({ lead, provider: { apollo: res }, reason: res.pass ? 'excess_apollo_pass' : 'Apollo not found' });
    }
  }

  if (logStream) { try { logStream.end(); } catch {} }

  const out = { counts: { apollo_pass: results.apollo_pass.length, triple_fail: results.triple_fail.length }, target: { apollo_pass: targetPass }, results };
  if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g,'-');
  const tsPath = path.join(OUTDIR, `apollo-triage-${ts}.json`);
  const latest = path.join(OUTDIR, 'apollo-triage-latest.json');
  fs.writeFileSync(tsPath, JSON.stringify(out, null, 2));
  fs.writeFileSync(latest, JSON.stringify(out, null, 2));
  process.stdout.write(latest + '\n');
}

main().catch(err => { console.error(err); process.exit(1); });


