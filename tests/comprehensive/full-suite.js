#!/usr/bin/env node
/**
 * Comprehensive HTTP-only runner (no API tools)
 * Iterates all payload sets in tests/data and posts to webhook sequentially
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const WEBHOOK_PATH = '/webhook/kajabi-leads-complete-clean';

function sendWebhook(payload){
  return new Promise((resolve,reject)=>{
    const data = JSON.stringify(payload);
    const req = https.request({
      hostname: 'rebelhq.app.n8n.cloud',
      path: WEBHOOK_PATH,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res)=>{ let body=''; res.on('data',c=> body+=c); res.on('end',()=> resolve({statusCode: res.statusCode, body}));});
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runDir(dir){
  const entries = fs.readdirSync(dir).filter(f=>f.endsWith('.json'));
  const out = [];
  for (const f of entries){
    const filePath = path.join(dir, f);
    const raw = JSON.parse(fs.readFileSync(filePath,'utf8'));
    const payloads = Array.isArray(raw) ? raw : (raw.scenarios || raw.test_cases || [raw]);
    for (const p of payloads){
      try{
        const res = await sendWebhook(p);
        out.push({ file: path.relative(process.cwd(), filePath), statusCode: res.statusCode, body: res.body.slice(0,200) });
        console.log(`[OK] ${f} -> ${res.statusCode}`);
      }catch(e){
        out.push({ file: path.relative(process.cwd(), filePath), error: e.message });
        console.error(`[ERR] ${f}: ${e.message}`);
      }
    }
  }
  return out;
}

(async () => {
  const root = path.join(__dirname, '..', 'data');
  const sets = ['shared', 'phase-2D', 'phase-2C', 'phase-2E'];
  const results = {};
  for (const s of sets){
    const dir = path.join(root, s);
    if (!fs.existsSync(dir)) continue;
    console.log(`\n=== Running set: ${s} ===`);
    results[s] = await runDir(dir);
  }
  const outPath = path.join(__dirname, '..', 'results', `full-suite-${new Date().toISOString()}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
  console.log(`\nSaved results: ${outPath}`);
  process.exit(0);
})();
