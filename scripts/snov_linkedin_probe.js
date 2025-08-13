/*
 Snov.io LinkedIn profile enrichment on URLs we already have (Dropcontact)
 - Endpoints: POST /v2/li-profiles-by-urls/start → GET /v2/li-profiles-by-urls/result?task_hash=...
 - Auth: OAuth2 client_credentials
 - Input: tests/results/dropcontact-batch-latest.json (collect linkedin URLs)
 - Output: tests/results/snov-linkedin-latest.json (+timestamped) with title/company hit rates
*/

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTDIR = path.join(__dirname, '..', 'tests', 'results');
const DC_PATH = path.join(OUTDIR, 'dropcontact-batch-latest.json');

const CLIENT_ID = process.env.SNOV_CLIENT_ID;
const CLIENT_SECRET = process.env.SNOV_CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) { console.error('Missing SNOV_CLIENT_ID/SECRET'); process.exit(1); }

function httpsPostForm(hostname, path, form) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(form).toString();
    const req = https.request({ hostname, path, method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) } }, res => {
      let data=''; res.on('data',c=>data+=c); res.on('end',()=>{ try{ resolve(JSON.parse(data||'{}')); } catch { resolve({ raw: data }); } });
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

function httpsPostJson(hostname, path, token, json) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(json||{});
    const req = https.request({ hostname, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Content-Length': Buffer.byteLength(body) } }, res => {
      let data=''; res.on('data',c=>data+=c); res.on('end',()=>{ try{ resolve(JSON.parse(data||'{}')); } catch { resolve({ raw: data }); } });
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

function httpsGetJson(hostname, path, token) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } }, res => {
      let data=''; res.on('data',c=>data+=c); res.on('end',()=>{ try{ resolve(JSON.parse(data||'{}')); } catch { resolve({ raw: data }); } });
    });
    req.on('error', reject); req.end();
  });
}

async function getToken(){
  const r = await httpsPostForm('api.snov.io','/v1/oauth/access_token',{ grant_type:'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET });
  if (!r || !r.access_token) throw new Error('No token');
  return r.access_token;
}

function collectLinkedins(){
  const dc = JSON.parse(fs.readFileSync(DC_PATH,'utf8'));
  const rows = dc.results || [];
  const urls = [];
  for (const r of rows){
    const ln = r.linkedin || r.linkedin_url || (r.socials && r.socials.linkedin);
    if (ln) {
      let u = (''+ln).trim();
      if (!u.startsWith('http')) u = 'https://' + u.replace(/^\/\//,'');
      urls.push(u);
    }
  }
  return urls.slice(0, 100);
}

async function startBatch(token, urls){
  return await httpsPostJson('api.snov.io','/v2/li-profiles-by-urls/start', token, { urls });
}

async function getResult(token, task){
  return await httpsGetJson('api.snov.io', `/v2/li-profiles-by-urls/result?task_hash=${encodeURIComponent(task)}`, token);
}

function tally(profiles){
  let t=0,c=0,total=profiles.length;
  for (const p of profiles){
    const title = p && (p.position || p.job || p.title);
    const company = p && (p.company || (p.company_data && (p.company_data.name || p.company_data.company)));
    if (title) t++; if (company) c++;
  }
  const rate = (n)=> total? +(n*100/total).toFixed(1):0;
  return { total, title_rate: rate(t), company_rate: rate(c) };
}

async function main(){
  const urls = collectLinkedins();
  const token = await getToken();
  const batches = [];
  for (let i=0;i<urls.length;i+=10) batches.push(urls.slice(i,i+10));
  const profiles = [];
  for (const batch of batches){
    const start = await startBatch(token, batch);
    const task = start && (start.task_hash || start.taskHash);
    if (!task) continue;
    // poll
    let tries=0; let res=null;
    while (tries<20){
      await new Promise(r=>setTimeout(r, 2000));
      const r = await getResult(token, task);
      if (r && r.success && Array.isArray(r.data)) { res = r.data; break; }
      tries++;
    }
    if (res) profiles.push(...res);
  }
  const summary = tally(profiles);
  if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR,{recursive:true});
  const latest = path.join(OUTDIR,'snov-linkedin-latest.json');
  const ts = path.join(OUTDIR,`snov-linkedin-${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
  fs.writeFileSync(ts, JSON.stringify({ summary, profiles }, null, 2));
  fs.writeFileSync(latest, JSON.stringify({ summary, profiles }, null, 2));
  process.stdout.write(latest+'\n');
}

main().catch(e=>{ console.error(e); process.exit(1); });


