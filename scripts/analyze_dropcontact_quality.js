/*
 Analyze Dropcontact enrichment quality on latest batch and compare by prior provider outcome.
 Inputs:
  - tests/results/dropcontact-batch-latest.json
  - tests/results/provider-triage-latest.json (for grouping: pdl_pass, pdl_fail_hunter_pass, double_fail)
 Output:
  - tests/results/dropcontact-quality-latest.json (+ timestamped)
 Metrics per group and overall:
  - linkedin_url hit rate
  - title hit rate
  - company hit rate
  - email qualification breakdown (nominatif@pro vs generic@pro vs other)
  - domain consistency (email domain vs website domain match)
*/

const fs = require('fs');
const path = require('path');

const OUTDIR = path.join(__dirname, '..', 'tests', 'results');
const DC_PATH = path.join(OUTDIR, 'dropcontact-batch-latest.json');
const PROVIDER_PATH = path.join(OUTDIR, 'provider-triage-latest.json');

function loadJson(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }

function getEmailsFromDcRow(row){
  const list = [];
  if (Array.isArray(row.email)){
    for (const e of row.email){ if (e && e.email) list.push({ email: e.email.toLowerCase(), qual: e.qualification || null }); }
  }
  return list;
}

function emailOfLead(lead){ return (lead && (lead['Email Address']||lead['Email']||'')).toLowerCase(); }

function websiteDomain(s){
  if (!s) return '';
  return s.replace(/^https?:\/\//i,'').replace(/^www\./i,'').toLowerCase();
}

function emailDomain(s){ return (s && s.includes('@')) ? s.split('@')[1].toLowerCase() : ''; }

function classifyGroup(email, provider){
  const p = provider.results || {};
  const checks = [
    ['pdl_pass', p.pdl_pass||[]],
    ['pdl_fail_hunter_pass', p.pdl_fail_hunter_pass||[]],
    ['double_fail', p.double_fail||[]]
  ];
  for (const [name, arr] of checks){
    for (const it of arr){ if (emailOfLead(it.lead) === email) return name; }
  }
  return 'unknown';
}

function tally(arr){
  const t = { count: 0, linkedin: 0, title: 0, company: 0, emails: { nominatif_pro: 0, generic_pro: 0, other: 0 }, domain_consistent: 0 };
  for (const r of arr){
    t.count++;
    const ln = r.linkedin || r.linkedin_url || (r.socials && r.socials.linkedin);
    const title = r.job || r.title || r.job_title;
    const company = r.company || r.organization;
    if (ln) t.linkedin++;
    if (title) t.title++;
    if (company) t.company++;
    // email qualities
    const emails = getEmailsFromDcRow(r);
    let counted = false;
    for (const e of emails){
      if ((e.qual||'').includes('nominatif@pro')) { t.emails.nominatif_pro++; counted = true; break; }
      if ((e.qual||'').includes('generic@pro')) { t.emails.generic_pro++; counted = true; break; }
    }
    if (!counted) t.emails.other++;

    // domain consistency (first email vs website)
    const first = emails[0] && emails[0].email;
    const w = websiteDomain(r.website);
    const ed = emailDomain(first);
    if (first && w && (w.endsWith(ed) || ed.endsWith(w) || w === ed)) t.domain_consistent++;
  }
  // rates
  const rate = (n)=> t.count ? +(n*100/t.count).toFixed(1) : 0;
  return {
    count: t.count,
    rates: { linkedin: rate(t.linkedin), title: rate(t.title), company: rate(t.company), domain_consistent: rate(t.domain_consistent) },
    emails: t.emails
  };
}

function main(){
  const dc = loadJson(DC_PATH);
  const provider = loadJson(PROVIDER_PATH);

  const rows = dc.results || [];
  const groups = { overall: [], pdl_pass: [], pdl_fail_hunter_pass: [], double_fail: [], unknown: [] };

  for (const r of rows){
    const emails = getEmailsFromDcRow(r);
    const primary = emails[0] && emails[0].email || '';
    const g = classifyGroup(primary, provider);
    groups[g] = groups[g] || [];
    groups[g].push(r);
    groups.overall.push(r);
  }

  const report = {
    requestId: dc.requestId || null,
    submitted: dc.submitted || rows.length,
    summary: {
      overall: tally(groups.overall),
      pdl_pass: tally(groups.pdl_pass),
      pdl_fail_hunter_pass: tally(groups.pdl_fail_hunter_pass),
      double_fail: tally(groups.double_fail),
      unknown: tally(groups.unknown)
    }
  };

  if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g,'-');
  const tsPath = path.join(OUTDIR, `dropcontact-quality-${ts}.json`);
  const latest = path.join(OUTDIR, 'dropcontact-quality-latest.json');
  fs.writeFileSync(tsPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(latest, JSON.stringify(report, null, 2));
  process.stdout.write(latest + '\n');
}

main();


