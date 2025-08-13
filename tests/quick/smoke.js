#!/usr/bin/env node
/**
 * Smoke Test - NO API TOOLS
 * Minimal fast check using Test-matrix first email
 */
const https = require('https');
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
  const email = (testMatrix && testMatrix.buckets && testMatrix.buckets.pdl_success && testMatrix.buckets.pdl_success[0] && testMatrix.buckets.pdl_success[0].email) || 'test@example.com';
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
