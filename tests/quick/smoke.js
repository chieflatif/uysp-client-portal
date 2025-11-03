#!/usr/bin/env node
/**
 * Smoke Test - NO API TOOLS
 * Minimal fast check using Test-matrix first email
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const testMatrix = require('../data/shared/Test-matrix.json');

function sendWebhook(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = https.request({
      hostname: 'rebelhq.app.n8n.cloud',
      path: '/webhook/kajabi-leads-complete-clean',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body='';
      res.on('data', c=> body+=c);
      res.on('end', ()=> resolve({statusCode: res.statusCode, body}));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  // Optional deterministic selection via selected-emails.json or CLI args
  const args = process.argv.slice(2);
  const cli = { bucket: 'pdl_success', offset: 0 };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--bucket') cli.bucket = args[++i] || cli.bucket;
    else if (args[i] === '--offset') cli.offset = parseInt(args[++i] || '0', 10) || 0;
  }
  const selPath = path.join(__dirname, '..', 'data', 'selected-emails.json');
  let email = null;
  if (fs.existsSync(selPath)) {
    try {
      const sel = JSON.parse(fs.readFileSync(selPath, 'utf8'));
      email = (sel.emails && sel.emails[0] && sel.emails[0].email) || null;
    } catch {}
  }
  if (!email) {
    const list = (((testMatrix||{}).buckets||{})[cli.bucket]) || [];
    email = (list[cli.offset] && list[cli.offset].email) || 'test@example.com';
  }
  const payload = { email, first_name: 'Smoke', last_name: 'Test' };
  try {
    const res = await sendWebhook(payload);
    console.log(JSON.stringify({ name: 'smoke', statusCode: res.statusCode, body: res.body.slice(0,200) }, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(JSON.stringify({ name: 'smoke', error: e.message }, null, 2));
    process.exit(1);
  }
})();
