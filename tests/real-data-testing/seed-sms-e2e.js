#!/usr/bin/env node

/**
 * E2E SMS pipeline seeding tool
 * - Sends synthetic leads to the public webhook to exercise the full ingest → Airtable → SMS flow
 * - Forces all leads to use a specified phone number (so you receive the test SMS)
 *
 * Usage examples:
 *   node tests/real-data-testing/seed-sms-e2e.js --phone +15551234567 --count 3 --send
 *   E2E_TEST_PHONE=+15551234567 npm run test:e2e-sms -- --count 5 --prefix e2e-
 */

/* eslint-disable no-console */

const WEBHOOK_URL = process.env.E2E_WEBHOOK_URL || 'https://rebelhq.app.n8n.cloud/webhook/kajabi-leads';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const next = argv[i + 1];
    if (key.startsWith('--')) {
      const k = key.replace(/^--/, '');
      if (next && !next.startsWith('--')) {
        args[k] = next;
        i += 1;
      } else {
        args[k] = true;
      }
    }
  }
  return args;
}

function usageAndExit(msg) {
  if (msg) console.error(`Error: ${msg}`);
  console.log('\nE2E SMS pipeline seeding tool');
  console.log('Required: --phone +E164');
  console.log('Optional: --count <n=3> --prefix <email-prefix=e2e> --source <label=e2e-test> --send');
  console.log('\nExamples:');
  console.log('  node tests/real-data-testing/seed-sms-e2e.js --phone +15551234567 --count 3 --send');
  console.log('  E2E_TEST_PHONE=+15551234567 npm run test:e2e-sms -- --count 5 --prefix e2e-');
  process.exit(msg ? 1 : 0);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildPayload({ email, fullName, company, phone, source }) {
  // Provide both the legacy keys and normalized keys to satisfy different intake mappers
  return {
    // Intake expected by UYSP-Realtime-Ingestion (Normalize node)
    email,
    phone,
    first_name: fullName.split(' ')[0] || fullName,
    last_name: fullName.split(' ').slice(1).join(' ') || '',
    company,

    // Legacy Kajabi-style keys for other test endpoints
    'Email Address': email,
    'Full Name': fullName,
    'Company Name': company,
    'Phone Number': phone,

    interested_in_coaching: 'Yes',
    landing_page_id: 'e2e-test',
    landing_page_title: 'E2E SMS Pipeline Test',
    created_at: new Date().toISOString(),
    source_form: source || 'e2e-test',
    request_id: `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
}

async function postToWebhook(payload) {
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const ok = res.ok;
  let bodyText = '';
  try {
    bodyText = await res.text();
  } catch {}
  return { ok, status: res.status, statusText: res.statusText, bodyText };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const phone = args.phone || process.env.E2E_TEST_PHONE;
  const count = Number(args.count || 3);
  const prefix = (args.prefix || 'e2e').replace(/[^a-zA-Z0-9_-]/g, '');
  const source = args.source || 'e2e-test';
  const doSend = Boolean(args.send);

  if (!phone) usageAndExit('Missing --phone (or set E2E_TEST_PHONE)');
  if (!/^\+\d{8,15}$/.test(phone)) usageAndExit('Phone must be E.164 format, e.g., +15551234567');
  if (!Number.isFinite(count) || count < 1 || count > 20) usageAndExit('--count must be 1..20');

  console.log('🚀 E2E SMS Seed starting');
  console.log(`Webhook: ${WEBHOOK_URL}`);
  console.log(`Phone:   ${phone}`);
  console.log(`Count:   ${count}`);
  console.log(`Prefix:  ${prefix}`);
  console.log(`Source:  ${source}`);
  console.log(`Mode:    ${doSend ? 'SEND' : 'DRY-RUN'}`);

  const created = [];
  for (let i = 0; i < count; i += 1) {
    const ts = Date.now();
    const email = `${prefix}.${ts}.${i}@example.com`;
    const fullName = `E2E Test ${i + 1}`;
    const company = `E2E Company ${i + 1}`;
    const payload = buildPayload({ email, fullName, company, phone, source });

    console.log(`\n#${i + 1} ${email}`);
    console.log(JSON.stringify(payload, null, 2));

    if (doSend) {
      const { ok, status, statusText, bodyText } = await postToWebhook(payload);
      console.log(ok ? `✅ ${status}` : `❌ ${status} ${statusText}`);
      if (bodyText) console.log(bodyText.slice(0, 400));
      created.push({ email, phone, ts });
      // Gentle pacing to avoid rate limits / batching confusion
      await sleep(1500);
    }
  }

  if (doSend) {
    const fs = await import('node:fs');
    const outPath = 'tests/real-data-testing/e2e-seed.json';
    fs.writeFileSync(outPath, JSON.stringify({ created, phone, at: new Date().toISOString() }, null, 2));
    console.log(`\n📄 Wrote seed manifest: ${outPath}`);
    console.log('⏳ The n8n Airtable Trigger polls roughly every minute; watch for a new execution.');
  } else {
    console.log('\nDry run complete. Re-run with --send to actually post to the webhook.');
  }
}

main().catch((err) => {
  console.error('Fatal:', err?.stack || err?.message || String(err));
  process.exit(1);
});


