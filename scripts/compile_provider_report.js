/*
 Compile provider comparison report (ICP-first quality + hit rates)
 Inputs:
  - tests/results/dropcontact-quality-latest.json
  - tests/results/pdl-hunter-100-latest.json
 Outputs:
  - tests/results/provider-report-latest.json (+ timestamped)
 Report includes:
  - PDL: title/company/linkedin rates
  - Dropcontact: title/company/linkedin + domain consistency, emails breakdown
  - Hunter: deliverable/undeliverable/risky breakdown
  - Deltas (Dropcontact vs PDL) for LinkedIn, title, company
*/

const fs = require('fs');
const path = require('path');

const OUTDIR = path.join(__dirname, '..', 'tests', 'results');
const DCQ = path.join(OUTDIR, 'dropcontact-quality-latest.json');
const PH = path.join(OUTDIR, 'pdl-hunter-100-latest.json');

function loadJson(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }

function hunterBreakdown(results){
  const counts = { deliverable: 0, undeliverable: 0, risky: 0, unknown: 0 };
  for (const r of results||[]){
    const v = (r.hunter && r.hunter.result || '').toLowerCase();
    if (v === 'deliverable') counts.deliverable++;
    else if (v === 'undeliverable') counts.undeliverable++;
    else if (v === 'risky') counts.risky++;
    else counts.unknown++;
  }
  const total = (results||[]).length || 1;
  const rate = (n)=> +(n*100/total).toFixed(1);
  return { counts, rates: { deliverable: rate(counts.deliverable), undeliverable: rate(counts.undeliverable), risky: rate(counts.risky), unknown: rate(counts.unknown) }, total };
}

function main(){
  const dc = loadJson(DCQ);
  const ph = loadJson(PH);

  const pdl = ph.summary && ph.summary.pdl || { title_rate: 0, company_rate: 0, linkedin_rate: 0 };
  const hunter = hunterBreakdown(ph.results || []);
  const dcOverall = dc.summary && dc.summary.overall || { rates: {}, emails: {}, count: 0 };

  const deltas = {
    linkedin_diff_dc_minus_pdl: +( (dcOverall.rates.linkedin||0) - (pdl.linkedin_rate||0) ).toFixed(1),
    title_diff_dc_minus_pdl: +( (dcOverall.rates.title||0) - (pdl.title_rate||0) ).toFixed(1),
    company_diff_dc_minus_pdl: +( (dcOverall.rates.company||0) - (pdl.company_rate||0) ).toFixed(1)
  };

  const report = {
    dataset_sizes: {
      dropcontact: dc.summary && dc.summary.overall && dc.summary.overall.count || 0,
      pdl_hunter: ph.summary && ph.summary.total || 0
    },
    providers: {
      PDL: { title_rate: pdl.title_rate, company_rate: pdl.company_rate, linkedin_rate: pdl.linkedin_rate },
      Dropcontact: {
        linkedin_rate: dcOverall.rates.linkedin || 0,
        title_rate: dcOverall.rates.title || 0,
        company_rate: dcOverall.rates.company || 0,
        domain_consistent_rate: dcOverall.rates.domain_consistent || 0,
        email_quality: dcOverall.emails || {}
      },
      Hunter: hunter
    },
    deltas
  };

  if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g,'-');
  const latest = path.join(OUTDIR, 'provider-report-latest.json');
  const tsPath = path.join(OUTDIR, `provider-report-${ts}.json`);
  fs.writeFileSync(tsPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(latest, JSON.stringify(report, null, 2));
  process.stdout.write(latest + '\n');
}

main();


