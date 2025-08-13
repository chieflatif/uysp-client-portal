/*
 Snov.io probe on the latest 100-email set (same as Dropcontact batch)
 - Auth: OAuth2 client_credentials → access_token
 - Enrichment: POST to a configurable endpoint that enriches a person by email
   Env SNOV_ENRICH_PATH defaults to '/v1/get-profile-by-email'
 - Metrics: title/company/linkedin hit rates; save raw per-email outcomes
 - Inputs: tests/results/dropcontact-batch-latest.json
 - Env: SNOV_CLIENT_ID, SNOV_CLIENT_SECRET
 - Output: tests/results/snov-100-latest.json (+timestamped)
 NOTE: Snov docs: Authentication and endpoints per API docs (see docs/CURRENT/snov-configuration.md)
*/

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTDIR = path.join(__dirname, '..', 'tests', 'results');
const DC_PATH = path.join(OUTDIR, 'dropcontact-batch-latest.json');

const CLIENT_ID = process.env.SNOV_CLIENT_ID;
const CLIENT_SECRET = process.env.SNOV_CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing SNOV_CLIENT_ID or SNOV_CLIENT_SECRET');
  process.exit(1);
}

const ENRICH_PATH = process.env.SNOV_ENRICH_PATH || '/v1/get-profile-by-email';

function readEmailsFromDropcontact() {
  const dc = JSON.parse(fs.readFileSync(DC_PATH, 'utf8'));
  const rows = dc.results || [];
  const emails = new Set();
  for (const r of rows) {
    if (Array.isArray(r.email)) {
      for (const e of r.email) {
        if (e && e.email) emails.add(e.email.toLowerCase());
      }
    }
  }
  return Array.from(emails).slice(0, 100);
}

function httpsPostForm(hostname, path, form) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(form).toString();
    const req = https.request({ hostname, path, method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }}, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data||'{}')); } catch { resolve({ raw: data }); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function httpsPostJson(hostname, path, token, json) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(json||{});
    const req = https.request({ hostname, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Content-Length': Buffer.byteLength(body) }}, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(data||'{}') }); } catch { resolve({ status: res.statusCode, raw: data }); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function getAccessToken() {
  const res = await httpsPostForm('api.snov.io', '/v1/oauth/access_token', {
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  });
  if (!res || !res.access_token) throw new Error('Failed to obtain Snov access token');
  return res.access_token;
}

function extractFields(resp) {
  const p = resp || {};
  const title = p.job || p.position || p.title || (p.experience && p.experience[0] && p.experience[0].position) || null;
  const company = p.company || p.currentCompany || (p.experience && p.experience[0] && p.experience[0].company) || null;
  const linkedin = p.linkedin || p.linkedinUrl || p.linkedin_url || null;
  return { title: !!title, company: !!company, linkedin: !!linkedin };
}

async function main() {
  const emails = readEmailsFromDropcontact();
  const token = await getAccessToken();

  if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });
  const log = fs.createWriteStream(path.join(OUTDIR, 'snov-call-log.ndjson'), { flags: 'a' });

  const results = [];
  let tHit=0, cHit=0, lHit=0;
  for (const email of emails) {
    // Snov docs: some accounts expect { email }, others accept { emails: [email] }
    const payload = process.env.SNOV_USE_ARRAY === '1' ? { emails: [email] } : { email };
    log.write(JSON.stringify({ t: new Date().toISOString(), url: `https://api.snov.io${ENRICH_PATH}`, email }) + '\n');
    const res = await httpsPostJson('api.snov.io', ENRICH_PATH, token, payload);
    let fields = { title:false, company:false, linkedin:false };
    if (res && res.body) {
      // Try: body.data (object) or body.data[0]
      const b = res.body.data || res.body;
      const obj = Array.isArray(b) ? b[0] : b;
      fields = extractFields(obj);
    }
    if (fields.title) tHit++;
    if (fields.company) cHit++;
    if (fields.linkedin) lHit++;
    results.push({ email, status: res.status, fields });
    await new Promise(r => setTimeout(r, 150));
  }
  log.end();

  const total = emails.length || 1;
  const summary = {
    total,
    title_rate: +(tHit*100/total).toFixed(1),
    company_rate: +(cHit*100/total).toFixed(1),
    linkedin_rate: +(lHit*100/total).toFixed(1)
  };

  const ts = new Date().toISOString().replace(/[:.]/g,'-');
  const latest = path.join(OUTDIR, 'snov-100-latest.json');
  const tsPath = path.join(OUTDIR, `snov-100-${ts}.json`);
  fs.writeFileSync(tsPath, JSON.stringify({ summary, results }, null, 2));
  fs.writeFileSync(latest, JSON.stringify({ summary, results }, null, 2));
  process.stdout.write(latest + '\n');
}

main().catch(e => { console.error(e); process.exit(1); });


