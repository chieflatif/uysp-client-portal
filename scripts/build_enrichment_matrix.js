/*
 Build enrichment testing matrix from existing evidence
 Inputs:
  - tests/results/provider-triage-latest.json (pdl_pass, pdl_fail_hunter_pass, double_fail)
  - tests/results/dropcontact-batch-latest.json (results array with emails)
 Targets (adjustable via env):
  - PDL_PASS_TARGET (default 15)
  - HUNTER_PASS_TARGET (default 15)
  - DROPCONTACT_ON_DOUBLE_FAIL_TARGET (default 12)
  - ALL_FAIL_TARGET (default 5)
 Output:
  - tests/results/enrichment-matrix-latest.json (+ timestamped)
*/

const fs = require('fs');
const path = require('path');

const OUTDIR = path.join(__dirname, '..', 'tests', 'results');
const PROVIDER = path.join(OUTDIR, 'provider-triage-latest.json');
const DROP = path.join(OUTDIR, 'dropcontact-batch-latest.json');

const PDL_PASS_TARGET = parseInt(process.env.PDL_PASS_TARGET || '15', 10);
const HUNTER_PASS_TARGET = parseInt(process.env.HUNTER_PASS_TARGET || '15', 10);
const DC_ON_DF_TARGET = parseInt(process.env.DROPCONTACT_ON_DOUBLE_FAIL_TARGET || '12', 10);
const ALL_FAIL_TARGET = parseInt(process.env.ALL_FAIL_TARGET || '5', 10);

function emailOfLead(lead){
  return (lead && (lead['Email Address'] || lead['Email'] || '')).toLowerCase();
}

function emailsFromDrop(row){
  const arr = row && row.email;
  if (Array.isArray(arr) && arr.length){
    return arr.map(e => (e && e.email || '').toLowerCase()).filter(Boolean);
  }
  return [];
}

function pick(arr, n){
  return arr.slice(0, Math.max(0,n));
}

function main(){
  const provider = JSON.parse(fs.readFileSync(PROVIDER,'utf8'));
  const drop = fs.existsSync(DROP) ? JSON.parse(fs.readFileSync(DROP,'utf8')) : { results: [] };

  const pdlPass = (provider.results && provider.results.pdl_pass) || [];
  const hunterPass = (provider.results && provider.results.pdl_fail_hunter_pass) || [];
  const doubleFail = (provider.results && provider.results.double_fail) || [];

  const dropEmails = new Set();
  for (const r of (drop.results || [])){
    for (const em of emailsFromDrop(r)) dropEmails.add(em);
  }

  const dfWithDrop = [];
  const dfAllFail = [];
  for (const d of doubleFail){
    const email = emailOfLead(d.lead);
    if (!email) continue;
    if (dropEmails.has(email)) dfWithDrop.push(d);
    else dfAllFail.push(d);
  }

  const sel = {
    pdl_pass: pick(pdlPass, PDL_PASS_TARGET),
    pdl_fail_hunter_pass: pick(hunterPass, HUNTER_PASS_TARGET),
    double_fail_dropcontact_enriched: pick(dfWithDrop, DC_ON_DF_TARGET),
    all_fail: pick(dfAllFail, ALL_FAIL_TARGET)
  };

  const counts = Object.fromEntries(Object.entries(sel).map(([k,v]) => [k, v.length]));
  const shortages = {
    pdl_pass: Math.max(0, PDL_PASS_TARGET - counts.pdl_pass),
    pdl_fail_hunter_pass: Math.max(0, HUNTER_PASS_TARGET - counts.pdl_fail_hunter_pass),
    double_fail_dropcontact_enriched: Math.max(0, DC_ON_DF_TARGET - counts.double_fail_dropcontact_enriched),
    all_fail: Math.max(0, ALL_FAIL_TARGET - counts.all_fail)
  };

  const out = { targets: { PDL_PASS_TARGET, HUNTER_PASS_TARGET, DROPCONTACT_ON_DOUBLE_FAIL_TARGET: DC_ON_DF_TARGET, ALL_FAIL_TARGET }, counts, shortages, selected: sel };
  if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g,'-');
  const tsPath = path.join(OUTDIR, `enrichment-matrix-${ts}.json`);
  const latest = path.join(OUTDIR, 'enrichment-matrix-latest.json');
  fs.writeFileSync(tsPath, JSON.stringify(out, null, 2));
  fs.writeFileSync(latest, JSON.stringify(out, null, 2));
  process.stdout.write(latest + '\n');
}

main();


