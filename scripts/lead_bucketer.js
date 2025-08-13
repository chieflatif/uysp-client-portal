/*
 UYSP Lead Bucketer
 - Parses data/Enriched Leads  - Sheet1.csv
 - Scores per ICP V3.0 (Role 40, Company 25, Engagement 35)
 - Engagement: +10 if interested in coaching == Yes; plus NPS mapped 0-25
 - +5 bonus if Job Start Date < 90 days ago
 - Buckets by score: ultra(95-100), high(85-94), medium(70-84), low(50-69), very_low(30-49), archive(0-29)
 - Unclear if missing title or company
 - Outputs required JSON to stdout
*/

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '..', 'data', 'Enriched Leads  - Sheet1.csv');

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (cell.length > 0 || row.length > 0) {
        row.push(cell);
        rows.push(row);
      }
      row = [];
      cell = '';
      // If CRLF, skip the next if it's the pair
      if (ch === '\r' && next === '\n') {
        i++;
      }
    } else {
      cell += ch;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  // Trim trailing empty columns consistently
  const maxLen = Math.max(...rows.map(r => r.length));
  const header = rows[0];
  // Normalize header cells: trim whitespace
  const headers = header.map(h => (h || '').trim());
  const dataRows = rows.slice(1).filter(r => r.some(c => (c || '').trim().length > 0));
  return dataRows.map(r => {
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      const key = headers[i] || `col_${i}`;
      obj[key] = (r[i] ?? '').trim();
    }
    return obj;
  });
}

function daysDiffFromToday(dateStr) {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return Infinity;
  const now = new Date();
  const ms = now.getTime() - d.getTime();
  return Math.abs(Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function scoreRole(titleRaw) {
  if (!titleRaw) return { points: 0, reason: 'No title' };
  const title = titleRaw.toLowerCase();
  let points = 0;
  let labels = [];
  const isSales = /(account executive|ae\b|sales|sdr|bdr|account manager|business development|sales director|vp sales|director of sales)/i.test(titleRaw);
  if (!isSales) {
    // Not a sales role per provided title
    return { points: 0, reason: 'Role: not sales' };
  }

  if (/account executive|\bae\b/.test(title)) {
    points = 30;
    labels.push('AE base 30');
    if (/senior|sr\.?/.test(title)) { points += 5; labels.push('+Senior +5'); }
    if (/enterprise|strategic|major|global|large enterprise/.test(title)) { points += 5; labels.push('+Enterprise/Strategic +5'); }
  } else if (/(sdr|sales development representative|bdr|business development representative)/.test(title)) {
    points = 20;
    labels.push('SDR/BDR base 20');
    if (/senior|sr\.?/.test(title)) { points += 5; labels.push('+Senior +5'); }
  } else if (/(account manager)/.test(title)) {
    points = 28;
    labels.push('Account Manager 28');
    if (/senior|sr\.?/.test(title)) { points += 5; labels.push('+Senior +5'); }
    if (/enterprise|strategic|major|global/.test(title)) { points += 5; labels.push('+Enterprise/Strategic +5'); }
  } else if (/(director|head|lead|manager)/.test(title) && /sales|business development|accounts?/.test(title)) {
    points = 35;
    labels.push('Sales leadership 35');
    if (/vp|vice president/.test(title)) { points = 40; labels.push('VP Sales 40'); }
  } else if (/vp|vice president/.test(title) && /sales/.test(title)) {
    points = 40; labels.push('VP Sales 40');
  } else {
    points = 20; labels.push('Generic sales 20');
  }
  if (points > 40) points = 40;
  return { points, reason: `Role: ${labels.join(', ')} = ${points}` };
}

function scoreCompany(domainRaw) {
  if (!domainRaw) return { points: 0, reason: 'Company: missing' };
  const domain = domainRaw.toLowerCase();
  const tier1 = [
    'salesforce.com','oracle.com','paloaltonetworks.com','mongodb.com','servicenow.com','workday.com','adobe.com','docusign.com','databricks.com','ringcentral.com','qualtrics.com','uipath.com','linkedin.com','sap.com','cisco.com','hubspot.com','asana.com','smartsheet.com'
  ];
  let points = 15; // default presence
  let label = 'Company: present 15';
  if (tier1.some(t => domain.includes(t))) {
    points = 25;
    label = `Company: Tier1 B2B tech (${domain}) = 25`;
  } else if (/[.](io|ai|tech)$/.test(domain)) {
    points = 20;
    label = `Company: likely B2B tech TLD (${domain}) = 20`;
  } else if (/sales|data|cloud|analytics|security|software|systems|labs/.test(domain)) {
    points = 20;
    label = `Company: inferred B2B tech (${domain}) = 20`;
  }
  if (points > 25) points = 25;
  return { points, reason: label };
}

function scoreEngagement(coachingRaw, npsRaw) {
  let points = 0;
  const reasons = [];
  const yes = (coachingRaw || '').trim().toLowerCase();
  if (yes === 'yes' || yes === 'y') { points += 10; reasons.push('+Coaching yes +10'); }
  const nps = parseFloat((npsRaw || '').toString().trim());
  if (!Number.isNaN(nps)) {
    // Map 0-10 → 0-25
    const npsPts = Math.max(0, Math.min(25, Math.round((nps / 10) * 25)));
    points += npsPts;
    reasons.push(`+NPS ${nps} → ${npsPts}`);
  }
  if (points > 35) points = 35;
  return { points, reason: `Engagement: ${reasons.join(' ')} = ${points}` };
}

function recentRoleChangeBonus(startDateRaw) {
  const days = daysDiffFromToday(startDateRaw);
  if (days <= 90) {
    return { points: 5, reason: '+Recent role change (<90d) +5' };
  }
  return { points: 0, reason: '' };
}

function bucketForScore(score) {
  if (score >= 95) return 'ultra';
  if (score >= 85) return 'high';
  if (score >= 70) return 'medium';
  if (score >= 50) return 'low';
  if (score >= 30) return 'very_low';
  return 'archive';
}

function isUnclear(lead) {
  const title = lead['New Column'] || '';
  const company = lead['Job Company Website'] || '';
  return title.trim().length === 0 || company.trim().length === 0;
}

function main() {
  const csv = fs.readFileSync(CSV_PATH, 'utf8');
  const leads = parseCSV(csv);
  const buckets = { ultra: [], high: [], medium: [], low: [], very_low: [], archive: [], unclear: [] };

  for (const lead of leads) {
    const coaching = lead['A-Are you open to working with a coach to help you close more deals and reach your goals faster?'] || '';
    const domain = lead['Job Company Website'] || '';
    const title = lead['New Column'] || '';
    const nps = lead['A-On a scale of 0–10, how likely are you to recommend this event to a friend or colleague?'] || '';
    const startDate = lead['Job Start Date'] || '';

    if (isUnclear(lead)) {
      const reasoning = [];
      if (!title || title.trim().length === 0) reasoning.push('Missing title');
      if (!domain || domain.trim().length === 0) reasoning.push('Missing company');
      buckets.unclear.push({ lead, score: null, reasoning: reasoning.join('; ') });
      continue;
    }

    const role = scoreRole(title);
    const company = scoreCompany(domain);
    const engagement = scoreEngagement(coaching, nps);
    const bonus = recentRoleChangeBonus(startDate);

    let score = role.points + company.points + engagement.points + bonus.points;
    if (score > 100) score = 100;

    const reasoning = `${role.reason}; ${company.reason}; ${engagement.reason}${bonus.reason ? '; ' + bonus.reason : ''}; Total = ${score}`;
    const bucket = bucketForScore(score);
    buckets[bucket].push({ lead, score, reasoning });
  }

  const total = Object.values(buckets).reduce((acc, arr) => acc + arr.length, 0);
  const summary = {
    total_leads: total,
    bucket_counts: Object.fromEntries(Object.keys(buckets).map(k => [k, buckets[k].length]))
  };

  const output = { buckets, summary };
  process.stdout.write(JSON.stringify(output, null, 2));
}

main();


