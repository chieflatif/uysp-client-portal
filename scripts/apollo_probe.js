const fs = require('fs');
const path = require('path');
const https = require('https');

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
if (!APOLLO_API_KEY) { console.error('Missing APOLLO_API_KEY'); process.exit(1); }

const providerPath = path.join(__dirname, '..', 'tests', 'results', 'provider-triage-latest.json');
const provider = JSON.parse(fs.readFileSync(providerPath,'utf8'));
const doubles = (provider.results && provider.results.double_fail) || [];
if (!doubles.length) { console.error('No double_fail found'); process.exit(1); }

function httpsPostJson(hostname, p, headers, body){
  return new Promise((resolve,reject)=>{
    const data = JSON.stringify(body||{});
    const req = https.request({ hostname, path: p, method: 'POST', headers: { 'Content-Type':'application/json', 'Content-Length': Buffer.byteLength(data), ...headers } }, res=>{
      let raw='';
      res.on('data',c=>raw+=c);
      res.on('end',()=>{
        let parsed=null; try{ parsed = JSON.parse(raw); }catch{}
        resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw });
      });
    });
    req.on('error',reject);
    req.write(data);
    req.end();
  });
}

function httpsPostQuery(hostname, p, headers, q){
  return new Promise((resolve,reject)=>{
    const qs = new URLSearchParams(q||{}).toString();
    const pathFull = qs ? `${p}?${qs}` : p;
    const req = https.request({ hostname, path: pathFull, method: 'POST', headers }, res=>{
      let raw='';
      res.on('data',c=>raw+=c);
      res.on('end',()=>{
        let parsed=null; try{ parsed = JSON.parse(raw); }catch{}
        resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw });
      });
    });
    req.on('error',reject);
    req.end();
  });
}

async function run(){
  const lead = doubles.find(d => (d.lead && (d.lead['Email Address']||d.lead['Email']||'').includes('@')))?.lead || doubles[0].lead;
  const email = lead['Email Address'] || lead['Email'];
  const name = lead['User Name'] || '';
  const first_name = name.split(/\s+/)[0] || undefined;
  const last_name = name.split(/\s+/).slice(1).join(' ') || undefined;

  const host = 'api.apollo.io';
  const pathApi = '/api/v1/people/match';
  const pathNoApi = '/v1/people/match';

  const tests = [
    { label: 'Query+X-Api-Key /api', fn: ()=> httpsPostQuery(host, pathApi, { 'X-Api-Key': APOLLO_API_KEY }, { email, name, first_name, last_name }) },
    { label: 'Query+Bearer /api', fn: ()=> httpsPostQuery(host, pathApi, { 'Authorization': `Bearer ${APOLLO_API_KEY}` }, { email, name, first_name, last_name }) },
    { label: 'Body+X-Api-Key /api', fn: ()=> httpsPostJson(host, pathApi, { 'X-Api-Key': APOLLO_API_KEY }, { api_key: APOLLO_API_KEY, email, name, first_name, last_name }) },
    { label: 'Body+Bearer /api', fn: ()=> httpsPostJson(host, pathApi, { 'Authorization': `Bearer ${APOLLO_API_KEY}` }, { api_key: APOLLO_API_KEY, email, name, first_name, last_name }) },
    { label: 'Query+X-Api-Key /noapi', fn: ()=> httpsPostQuery(host, pathNoApi, { 'X-Api-Key': APOLLO_API_KEY }, { email, name, first_name, last_name }) },
    { label: 'Query+Bearer /noapi', fn: ()=> httpsPostQuery(host, pathNoApi, { 'Authorization': `Bearer ${APOLLO_API_KEY}` }, { email, name, first_name, last_name }) },
    { label: 'Body+X-Api-Key /noapi', fn: ()=> httpsPostJson(host, pathNoApi, { 'X-Api-Key': APOLLO_API_KEY }, { api_key: APOLLO_API_KEY, email, name, first_name, last_name }) },
    { label: 'Body+Bearer /noapi', fn: ()=> httpsPostJson(host, pathNoApi, { 'Authorization': `Bearer ${APOLLO_API_KEY}` }, { api_key: APOLLO_API_KEY, email, name, first_name, last_name }) },
  ];

  for (const t of tests){
    try{
      const r = await t.fn();
      console.log(JSON.stringify({ test: t.label, status: r.status, body_keys: r.body && Object.keys(r.body), body: r.body || r.raw }));
    }catch(e){
      console.log(JSON.stringify({ test: t.label, error: e.message }));
    }
  }
}

run();



