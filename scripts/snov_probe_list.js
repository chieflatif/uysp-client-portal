/*
 Probe Snov on a fixed email list (from dashboard) and dump raw results
*/
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTDIR = path.join(__dirname, '..', 'tests', 'results');
const CLIENT_ID = process.env.SNOV_CLIENT_ID;
const CLIENT_SECRET = process.env.SNOV_CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) { console.error('Missing SNOV_CLIENT_ID/SECRET'); process.exit(1); }

const emails = [
  'kschmidt@babelstreet.com',
  'kendallm@purdue.edu',
  'ron@seismic.com',
  'pete.carlson@virtuous.org',
  'brock.burton@radix.com'
];

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
    const req = https.request({ hostname, path, method: 'POST', headers: { 'Content-Type':'application/json','Authorization':`Bearer ${token}`,'Content-Length': Buffer.byteLength(body)}}, res=>{
      let data=''; res.on('data',c=>data+=c); res.on('end',()=>{ try{ resolve(JSON.parse(data||'{}')); } catch { resolve({ raw: data }); } });
    });
    req.on('error', reject); req.write(body); req.end();
  });
}
async function getToken(){
  const res = await httpsPostForm('api.snov.io','/v1/oauth/access_token',{ grant_type:'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET });
  if (!res || !res.access_token) throw new Error('No token');
  return res.access_token;
}

function hasField(obj, keys){ for (const k of keys){ if (obj && obj[k]) return true; } return false; }

async function main(){
  const token = await getToken();
  const rawLog = fs.createWriteStream(path.join(OUTDIR,'snov-raw-sample.ndjson'), { flags:'a' });
  let t=0,c=0,l=0,ok=0;
  for (const email of emails){
    const res = await httpsPostJson('api.snov.io','/v1/get-profile-by-email', token, { email });
    rawLog.write(JSON.stringify({ email, res })+'\n');
    const data = (res && res.data) || (res && res.body && res.body.data) || res;
    const obj = (data && Array.isArray(data)) ? data[0] : data;
    const title = hasField(obj, ['job','position','title']) || (obj && obj.experience && obj.experience[0] && obj.experience[0].position);
    const company = hasField(obj, ['company','currentCompany']) || (obj && obj.experience && obj.experience[0] && (obj.experience[0].company||obj.experience[0].companyName));
    const linkedin = hasField(obj, ['linkedin','linkedinUrl','linkedin_url']);
    if (title) t++; if (company) c++; if (linkedin) l++; if (obj) ok++;
  }
  rawLog.end();
  const summary = { total: emails.length, ok, title_rate: +(t*100/emails.length).toFixed(1), company_rate: +(c*100/emails.length).toFixed(1), linkedin_rate: +(l*100/emails.length).toFixed(1) };
  const latest = path.join(OUTDIR,'snov-sample-summary.json');
  fs.writeFileSync(latest, JSON.stringify(summary,null,2));
  process.stdout.write(latest+'\n');
}
main().catch(e=>{ console.error(e); process.exit(1); });


