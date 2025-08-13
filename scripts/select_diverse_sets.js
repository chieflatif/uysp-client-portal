/*
 Select Diverse Sets from triage outputs
 - Inputs:
   - tests/results/lead-buckets-latest.json
   - tests/results/provider-triage-latest.json
   - tests/results/apollo-triage-latest.json
 - Targets (can be tuned):
   - pdl_pass: 10
   - pdl_fail_hunter_pass: 10
   - double_fail_corporate: 20
   - apollo_pass_corporate: 10 (prefer corporate; allow free if short)
 - Diversity: round-robin across score buckets and domain types (corp/free)
 - Output: tests/results/diverse-selection-latest.json
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const bucketsPath = path.join(ROOT, 'tests', 'results', 'lead-buckets-latest.json');
const providerPath = path.join(ROOT, 'tests', 'results', 'provider-triage-latest.json');
const apolloPath = path.join(ROOT, 'tests', 'results', 'apollo-triage-latest.json');
const OUTDIR = path.join(ROOT, 'tests', 'results');

function keyEmail(lead){
  return (lead['Email Address'] || lead['Email'] || '').toLowerCase();
}

function isFreeDomain(email){
  const domain = (email.split('@')[1]||'').toLowerCase();
  const free = new Set(['gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com','aol.com','gmx.com','gmx.de','proton.me','protonmail.com','yandex.com','mail.com','me.com','live.com','msn.com','zoho.com','pm.me','fastmail.com','hushmail.com']);
  return free.has(domain);
}

function buildBucketIndex(bucketsJson){
  const idx = new Map();
  for (const bucketName of Object.keys(bucketsJson.buckets||{})){
    for (const entry of bucketsJson.buckets[bucketName]){
      const email = keyEmail(entry.lead||{});
      if (!email) continue;
      idx.set(email, { bucket: bucketName, score: entry.score, lead: entry.lead });
    }
  }
  return idx;
}

function rrSelect(candidates, quota, stratifyBy){
  // stratifyBy returns key for grouping
  const groups = new Map();
  for (const c of candidates){
    const key = stratifyBy(c);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }
  const keys = Array.from(groups.keys());
  const indices = Object.fromEntries(keys.map(k => [k, 0]));
  const sel = [];
  while (sel.length < quota) {
    let progressed = false;
    for (const k of keys){
      const arr = groups.get(k);
      const i = indices[k];
      if (i < arr.length){ sel.push(arr[i]); indices[k] = i+1; progressed = true; if (sel.length>=quota) break; }
    }
    if (!progressed) break;
  }
  return sel;
}

function main(){
  const buckets = JSON.parse(fs.readFileSync(bucketsPath,'utf8'));
  const provider = JSON.parse(fs.readFileSync(providerPath,'utf8'));
  const apollo = fs.existsSync(apolloPath) ? JSON.parse(fs.readFileSync(apolloPath,'utf8')) : { results: { apollo_pass: [], triple_fail: [] }};
  const idx = buildBucketIndex(buckets);

  const targets = { pdl_pass: 10, pdl_fail_hunter_pass: 10, double_fail_corporate: 20, apollo_pass_corporate: 10 };
  const orderBuckets = ['ultra','high','medium','low','very_low'];

  const enrich = (arr) => arr.map(e => {
    const email = keyEmail(e.lead||{});
    const meta = idx.get(email) || { bucket: 'unclear', score: null };
    const free = isFreeDomain(email);
    return { email, bucket: meta.bucket, score: meta.score, free, lead: e.lead, provider: e.provider, reason: e.reason, meta: e.meta };
  });

  const pdlPass = enrich(provider.results.pdl_pass||[]);
  const pdlFailHunterPass = enrich(provider.results.pdl_fail_hunter_pass||[]);
  const doubleFail = enrich(provider.results.double_fail||[]);
  const apolloPass = enrich((apollo.results && apollo.results.apollo_pass)||[]);
  const tripleFail = enrich((apollo.results && apollo.results.triple_fail)||[]);

  // Selections with diversity across score buckets and domain type
  const byBucketKey = e => orderBuckets.includes(e.bucket) ? e.bucket : 'other';
  const byDomainKey = e => e.free ? 'free' : 'corporate';
  const byBucketDomain = e => byBucketKey(e) + '|' + byDomainKey(e);

  const pick = (arr, quota) => rrSelect(arr.sort((a,b)=> (orderBuckets.indexOf(a.bucket)-orderBuckets.indexOf(b.bucket))), quota, byBucketDomain);

  const sel_pdl_pass = pick(pdlPass, targets.pdl_pass);
  const sel_pdl_fail_hunter_pass = pick(pdlFailHunterPass, targets.pdl_fail_hunter_pass);
  const df_corp = doubleFail.filter(e => !e.free);
  const sel_double_fail_corporate = pick(df_corp, targets.double_fail_corporate);
  const ap_corp = apolloPass.filter(e => !e.free);
  let sel_apollo_pass_corporate = pick(ap_corp, targets.apollo_pass_corporate);
  if (sel_apollo_pass_corporate.length < targets.apollo_pass_corporate){
    const need = targets.apollo_pass_corporate - sel_apollo_pass_corporate.length;
    const ap_free = apolloPass.filter(e => e.free);
    const add = pick(ap_free, need);
    sel_apollo_pass_corporate = sel_apollo_pass_corporate.concat(add);
  }

  const out = {
    targets,
    counts: {
      pdl_pass_available: pdlPass.length,
      pdl_fail_hunter_pass_available: pdlFailHunterPass.length,
      double_fail_available: doubleFail.length,
      apollo_pass_available: apolloPass.length,
      triple_fail_available: tripleFail.length
    },
    selected: {
      pdl_pass: sel_pdl_pass,
      pdl_fail_hunter_pass: sel_pdl_fail_hunter_pass,
      double_fail_corporate: sel_double_fail_corporate,
      apollo_pass_corporate: sel_apollo_pass_corporate
    },
    summary: {
      pdl_pass: sel_pdl_pass.length,
      pdl_fail_hunter_pass: sel_pdl_fail_hunter_pass.length,
      double_fail_corporate: sel_double_fail_corporate.length,
      apollo_pass_corporate: sel_apollo_pass_corporate.length
    }
  };

  if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g,'-');
  const tsPath = path.join(OUTDIR, `diverse-selection-${ts}.json`);
  const latest = path.join(OUTDIR, 'diverse-selection-latest.json');
  fs.writeFileSync(tsPath, JSON.stringify(out, null, 2));
  fs.writeFileSync(latest, JSON.stringify(out, null, 2));
  process.stdout.write(latest + '\n');
}

main();


