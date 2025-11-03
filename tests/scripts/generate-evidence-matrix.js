#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function parseBody(bodyStr) {
  try { return JSON.parse(bodyStr); } catch { return null; }
}

function detectTable(fields) {
  if (!fields || typeof fields !== 'object') return '';
  if (fields.email) return 'People';
  if (fields.person_email) return 'Human_Review_Queue';
  return '';
}

function extractVendor(fields) {
  const notes = fields && fields.review_notes ? String(fields.review_notes) : '';
  const m = notes.match(/vendor=([^|\s]+)/i);
  return m ? m[1] : '';
}

function toCsvValue(v) {
  if (v === null || v === undefined) return '';
  const s = String(v).replace(/"/g, '""');
  return `"${s}` + `"`;
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: node generate-evidence-matrix.js <results-json-path>');
    process.exit(1);
  }
  const raw = fs.readFileSync(inputPath, 'utf8');
  const data = JSON.parse(raw);
  const sections = data.results || {};

  const rows = [];
  const pushRow = (section, r) => {
    const obj = parseBody(r.body || '{}');
    if (!obj || !obj.id) {
      rows.push({ payload: r.file, section, table: '', record_id: '', email: '', title_current: '', company_enriched: '', linkedin_url: '', icp_score: '', processing_status: '', duplicate_count: '', vendor: '', statusCode: r.statusCode || '', error: r.error || '' });
      return;
    }
    const fields = obj.fields || {};
    rows.push({
      payload: r.file,
      section,
      table: detectTable(fields),
      record_id: obj.id || '',
      email: fields.email || fields.person_email || '',
      title_current: fields.title_current || '',
      company_enriched: fields.company_enriched || '',
      linkedin_url: fields.linkedin_url || '',
      icp_score: fields.icp_score != null ? fields.icp_score : '',
      processing_status: fields.processing_status || '',
      duplicate_count: fields.duplicate_count != null ? fields.duplicate_count : '',
      vendor: extractVendor(fields),
      statusCode: r.statusCode || '',
      error: r.error || ''
    });
  };

  Object.entries(sections).forEach(([section, list]) => {
    (list || []).forEach(r => pushRow(section, r));
  });

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.resolve(__dirname, '..', 'results');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const csvPath = path.join(outDir, `phase-2c-evidence-matrix-${ts}.csv`);
  const mdPath = path.join(outDir, `phase-2c-evidence-matrix-${ts}.md`);

  const headers = ['payload','section','table','record_id','email','title_current','company_enriched','linkedin_url','icp_score','processing_status','duplicate_count','vendor','statusCode','error'];
  const csv = [headers.join(',')].concat(rows.map(row => headers.map(h => toCsvValue(row[h])).join(','))).join('\n');
  fs.writeFileSync(csvPath, csv, 'utf8');

  const mdHeader = `| ${headers.join(' | ')} |\n| ${headers.map(()=>'-').join(' | ')} |\n`;
  const mdRows = rows.map(row => `| ${headers.map(h => String(row[h] ?? '')).join(' | ')} |`).join('\n');
  fs.writeFileSync(mdPath, mdHeader + mdRows, 'utf8');

  console.log('Matrix written:');
  console.log('CSV:', csvPath);
  console.log('MD :', mdPath);
}

main();
