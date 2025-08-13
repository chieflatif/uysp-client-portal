#!/usr/bin/env node
/**
 * Phase 2D Runner - NO API TOOLS
 * Iterates over Phase 2D payloads and posts each to the webhook
 */
const fs = require('fs');
const https = require('https');
const path = require('path');

const phaseDir = path.join(__dirname);

function sendWebhook(payload){
  return new Promise((resolve, reject)=>{
    const data = JSON.stringify(payload);
    const req = https.request({
      hostname: 'rebelhq.app.n8n.cloud',
      path: '/webhook/kajabi-leads-complete-clean',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res)=>{
      let body='';
      res.on('data', c=> body+=c);
      res.on('end', ()=> resolve({ statusCode: res.statusCode, body }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async ()=>{
  const files = ['PDL001-sales-executive.json','PDL002-tech-professional.json','PDL003-non-sales.json'];
  const results = [];
  for (const f of files){
    const payload = JSON.parse(fs.readFileSync(path.join(phaseDir,f),'utf8'));
    try {
      const res = await sendWebhook(payload);
      results.push({ file: f, statusCode: res.statusCode, body: res.body.slice(0,200) });
      console.log(`[${f}] -> ${res.statusCode}`);
    } catch(e){
      results.push({ file: f, error: e.message });
      console.error(`[${f}] ERROR: ${e.message}`);
    }
  }
  console.log(JSON.stringify({ phase: '2D', results }, null, 2));
})();
