/*
 Run PDL Person + Hunter Email Verifier on the same 100 emails used in latest Dropcontact batch.
 - Inputs: tests/results/dropcontact-batch-latest.json
 - Env: PDL_API_KEY, HUNTER_API_KEY
 - Strictly uses Hunter VERIFY endpoint (NOT finder). Logs every request URL.
 - Outputs:
   - tests/results/pdl-hunter-100-latest.json (+timestamped)
   - tests/results/hunter-call-log.ndjson (append)
   - tests/results/pdl-call-log.ndjson (append)
*/

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTDIR = path.join(__dirname, '..', 'tests', 'results');
const DC_PATH = path.join(OUTDIR, 'dropcontact-batch-latest.json');

const PDL_KEY = process.env.PDL_API_KEY;
const HUNTER_KEY = process.env.HUNTER_API_KEY;
if (!PDL_KEY || !HUNTER_KEY) {
  console.error('Missing PDL_API_KEY or HUNTER_API_KEY');
  process.exit(1);
}

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

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data||'{}') }); }
        catch { resolve({ status: res.statusCode, raw: data }); }
      });
    });
    req.on('error', reject);
  });
}

function httpsGetJson(hostname, path) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, method: 'GET' }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data||'{}') }); }
        catch { resolve({ status: res.statusCode, raw: data }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function pdlEnrich(email, logStream) {
  const url = `/v5/person/enrich?api_key=${encodeURIComponent(PDL_KEY)}&email=${encodeURIComponent(email)}`;
  logStream && logStream.write(JSON.stringify({ t: new Date().toISOString(), provider: 'PDL', url }) + '\n');
  const res = await httpsGetJson('api.peopledatalabs.com', url);
  const b = res.body || {};
  const person = b.data || b;
  const title = person.job_title || person.job_title_role || person.title || null;
  const company = (person.work_email || '').split('@')[1] || person.employer || person.company || null;
  const linkedin = person.linkedin_url || person.linkedin || null;
  return { status: res.status, title: !!title, company: !!company, linkedin: !!linkedin };
}

async function hunterVerify(email, logStream) {
  const url = `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${encodeURIComponent(HUNTER_KEY)}`;
  logStream && logStream.write(JSON.stringify({ t: new Date().toISOString(), provider: 'HUNTER', url }) + '\n');
  const res = await httpsGet(url);
  const data = res.body && res.body.data || {};
  const result = data.result || data.status || null; // deliverable/undeliverable/risky
  return { status: res.status, result };
}

async function main() {
  const emails = readEmailsFromDropcontact();
  if (!emails.length) { console.error('No emails found from Dropcontact results'); process.exit(1); }

  if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });
  const hunterLog = fs.createWriteStream(path.join(OUTDIR, 'hunter-call-log.ndjson'), { flags: 'a' });
  const pdlLog = fs.createWriteStream(path.join(OUTDIR, 'pdl-call-log.ndjson'), { flags: 'a' });

  const results = [];
  let pdlTitle = 0, pdlCompany = 0, pdlLinkedin = 0, hunterDeliverable = 0;

  for (const email of emails) {
    // PDL
    const pdl = await pdlEnrich(email, pdlLog);
    if (pdl.title) pdlTitle++;
    if (pdl.company) pdlCompany++;
    if (pdl.linkedin) pdlLinkedin++;

    // Hunter (verify only)
    const hv = await hunterVerify(email, hunterLog);
    if ((hv.result||'').toLowerCase() === 'deliverable') hunterDeliverable++;

    results.push({ email, pdl, hunter: hv });
    await new Promise(r => setTimeout(r, 150));
  }

  pdlLog.end();
  hunterLog.end();

  const summary = {
    total: emails.length,
    pdl: { title_rate: +(pdlTitle*100/emails.length).toFixed(1), company_rate: +(pdlCompany*100/emails.length).toFixed(1), linkedin_rate: +(pdlLinkedin*100/emails.length).toFixed(1) },
    hunter: { deliverable_rate: +(hunterDeliverable*100/emails.length).toFixed(1) }
  };

  const ts = new Date().toISOString().replace(/[:.]/g,'-');
  const out = { summary, results };
  const latest = path.join(OUTDIR, 'pdl-hunter-100-latest.json');
  const tsPath = path.join(OUTDIR, `pdl-hunter-100-${ts}.json`);
  fs.writeFileSync(tsPath, JSON.stringify(out, null, 2));
  fs.writeFileSync(latest, JSON.stringify(out, null, 2));
  process.stdout.write(latest + '\n');
}

main().catch(e => { console.error(e); process.exit(1); });


