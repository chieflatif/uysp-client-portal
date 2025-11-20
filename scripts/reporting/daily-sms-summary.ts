import { config } from 'dotenv';
import { resolve } from 'path';

type RangeOption = 'day' | 'week' | 'twoweeks' | 'threeweeks';
type RangeArgs = {
  rangeArg: RangeOption;
  daysOverride?: number;
  hoursOverride?: number;
};
const FALLBACK_RICH_MEDIA_TEXT = 'you were sent a message that contains rich media';
const PRIMARY_RICH_MEDIA_TEXT = 'rich media not supported';

type AirtableRecord = {
  id: string;
  fields: Record<string, any>;
};

type FetchOptions = {
  filter?: string;
  fields?: string[];
};

config({ path: resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const LEADS_TABLE = process.env.AIRTABLE_LEADS_TABLE_ID ?? 'tblYUvhGADerbD8EO';
const SMS_AUDIT_TABLE = process.env.AIRTABLE_SMS_AUDIT_TABLE_ID ?? 'tbl5TOGNGdWXTjhzP';

if (!API_KEY || !BASE_ID) {
  console.error('❌ Missing Airtable credentials (AIRTABLE_API_KEY / AIRTABLE_BASE_ID).');
  process.exit(1);
}

const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}`;
const EU_COUNTRIES = new Set([
  'Austria','Belgium','Bulgaria','Croatia','Cyprus','Czech Republic','Denmark','Estonia','Finland','France','Germany','Greece','Hungary','Iceland','Ireland','Italy','Latvia','Lithuania','Luxembourg','Malta','Netherlands','Norway','Poland','Portugal','Romania','Slovakia','Slovenia','Spain','Sweden','Switzerland','United Kingdom'
]);
const US_NAMES = new Set(['United States','United States of America','USA','US','America']);
const APPROVED_SOURCE_TYPES = new Set(['standard form', 'webinar', 'apply now form']);

function isPositiveNumber(value?: number) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function formatLabel(value: number, unit: 'hours' | 'days') {
  const formatted = Number.isInteger(value) ? value.toString() : value.toString();
  return `Last ${formatted} ${unit}`;
}

export function parseRange(option: RangeOption, daysOverride?: number, hoursOverride?: number) {
  const now = new Date();
  const useHours = isPositiveNumber(hoursOverride);
  let days = isPositiveNumber(daysOverride) ? (daysOverride as number) : 1;
  let label = isPositiveNumber(daysOverride) ? formatLabel(days, 'days') : 'Last 24 hours';

  if (useHours && hoursOverride) {
    const start = new Date(now.getTime() - hoursOverride * 60 * 60 * 1000);
    return {
      start,
      end: now,
      label: formatLabel(hoursOverride, 'hours'),
    };
  }

  if (!daysOverride) {
    if (option === 'week') {
      days = 7;
      label = 'Last 7 days';
    } else if (option === 'twoweeks') {
      days = 14;
      label = 'Last 14 days';
    } else if (option === 'threeweeks') {
      days = 21;
      label = 'Last 21 days';
    }
  }

  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    start,
    end: now,
    label,
  };
}

export function resolveRangeWindow({ rangeArg, daysOverride, hoursOverride }: RangeArgs) {
  const cleanDays = isPositiveNumber(daysOverride) ? daysOverride : undefined;
  const cleanHours = isPositiveNumber(hoursOverride) ? hoursOverride : undefined;
  return parseRange(rangeArg, cleanDays, cleanHours);
}

async function fetchRecords(tableId: string, options: FetchOptions = {}) {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: '100' });
    if (options.filter) params.set('filterByFormula', options.filter);
    if (options.fields) options.fields.forEach(field => params.append('fields[]', field));
    if (offset) params.set('offset', offset);

    const res = await fetch(`${BASE_URL}/${tableId}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Airtable request failed (${res.status}): ${body}`);
    }

    const data = await res.json() as { records: AirtableRecord[]; offset?: string };
    records.push(...data.records);
    offset = data.offset;

    if (offset) {
      await new Promise(resolve => setTimeout(resolve, 220));
    }
  } while (offset);

  return records;
}

const EU_COUNTRIES_LOWER = new Set(Array.from(EU_COUNTRIES).map(c => c.toLowerCase()));
const NORTH_AMERICA_HINTS = ['united states', 'usa', 'us', 'america', 'canada', 'united states or canada - auto'];

function normalizeDigits(raw: string) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1);
  }
  return digits;
}

export function classifyPhone(record: AirtableRecord) {
  const fields = record.fields;
  const locationRaw = String(fields['Location Country'] ?? '').trim();
  const location = locationRaw.toLowerCase();
  const phoneTenDigit = String(fields['Phone (10d)'] ?? '');
  const digits = phoneTenDigit.replace(/\D/g, '') || normalizeDigits(String(fields['Phone'] ?? ''));
  const phoneValidField = fields['Phone Valid'];
  const isValid = typeof phoneValidField === 'boolean' ? phoneValidField : digits.length >= 10;

  if (!isValid) {
    return 'invalid';
  }

  const looksNorthAmerican = !location || NORTH_AMERICA_HINTS.some(hint => location.includes(hint));
  if (looksNorthAmerican && digits.length === 10) {
    return 'us';
  }

  if (EU_COUNTRIES_LOWER.has(location)) {
    return 'eu';
  }

  return 'invalid';
}

export function isApprovedLead(record: AirtableRecord) {
  const fields = record.fields;
  const source = String(fields['Lead Source'] ?? '').toLowerCase();
  const detail = String(fields['Lead Source Detail'] ?? '').toLowerCase();
  const smsSentCount = Number(fields['SMS Sent Count'] ?? 0);
  const approvedSource = APPROVED_SOURCE_TYPES.has(source);
  const looksLikeForm = approvedSource || (detail.length > 0 && !detail.includes('manual'));
  return smsSentCount > 0 && looksLikeForm;
}

export function toIso(date: Date) {
  return date.toISOString();
}

export function buildLeadsFilter(startIso: string, endIso: string) {
  return `AND(IS_AFTER({Imported At}, '${startIso}'), IS_BEFORE({Imported At}, '${endIso}'))`;
}

export function buildBookingsFilter(startIso: string, endIso: string) {
  return `AND({Booked}, {Booked At}, IS_AFTER({Booked At}, '${startIso}'), IS_BEFORE({Booked At}, '${endIso}'))`;
}

export function buildSmsFilter(startIso: string, endIso: string) {
  return `AND(IS_AFTER({Sent At}, '${startIso}'), IS_BEFORE({Sent At}, '${endIso}'))`;
}

function extractNumber(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseWindowArg(raw?: string) {
  if (!raw) return {};
  const [, numberPart, unit] = raw.match(/^([\d.]+)([hd])$/i) ?? [];
  if (!numberPart || !unit) return {};
  const value = Number(numberPart);
  if (!Number.isFinite(value) || value <= 0) return {};
  if (unit.toLowerCase() === 'h') {
    return { hours: value };
  }
  return { days: value };
}

export async function main() {
  const rangeArg = (process.argv.find(arg => arg.startsWith('--range='))?.split('=')[1] ?? 'day') as RangeOption;
  const daysArg = process.argv.find(arg => arg.startsWith('--days='));
  const hoursArg = process.argv.find(arg => arg.startsWith('--hours='));
  const windowArg = process.argv.find(arg => arg.startsWith('--window='));

  let daysOverride = extractNumber(daysArg?.split('=')[1]);
  let hoursOverride = extractNumber(hoursArg?.split('=')[1]);

  if (windowArg) {
    const parsedWindow = parseWindowArg(windowArg.split('=')[1]);
    if (parsedWindow.hours) {
      hoursOverride = parsedWindow.hours;
      daysOverride = undefined;
    } else if (parsedWindow.days) {
      daysOverride = parsedWindow.days;
    }
  }

  const range = resolveRangeWindow({
    rangeArg,
    daysOverride,
    hoursOverride,
  });
  const startIso = toIso(range.start);
  const endIso = toIso(range.end);

  console.log('📊 SMS Performance Summary');
  console.log(`⏱️  Window: ${range.label} (${startIso} → ${endIso})`);

  const leadsFilter = buildLeadsFilter(startIso, endIso);
  const leadFields = ['Phone','Phone Valid','Location Country','Booked','Booked At','First Name','Last Name','Lead Source','Lead Source Detail','SMS Sent Count'];
  const leadRecords = await fetchRecords(LEADS_TABLE, { filter: leadsFilter, fields: leadFields });

  const smsFilter = buildSmsFilter(startIso, endIso);
  const smsFields = ['Event','Status','Text','Error Details','Webhook Raw'];
  const smsRecords = await fetchRecords(SMS_AUDIT_TABLE, { filter: smsFilter, fields: smsFields });

  const bookingsFilter = buildBookingsFilter(startIso, endIso);
  const bookingFields = ['Booked','Booked At','Lead Source','Lead Source Detail','SMS Sent Count'];
  const bookingRecords = await fetchRecords(LEADS_TABLE, { filter: bookingsFilter, fields: bookingFields });

  const metrics = {
    window: range.label,
    start: startIso,
    end: endIso,
    leads: {
      total: leadRecords.length,
      usValid: 0,
      euValid: 0,
      invalid: 0,
    },
    sms: {
      totalEvents: smsRecords.length,
      sent: 0,
      delivered: 0,
      failed: 0,
      failedRichMedia: 0,
    },
    meetings: {
      total: 0,
      qualified: 0,
      disqualified: 0,
    },
  };

  for (const record of leadRecords) {
    const bucket = classifyPhone(record);
    if (bucket === 'us') {
      metrics.leads.usValid++;
    } else if (bucket === 'eu') {
      metrics.leads.euValid++;
    } else {
      metrics.leads.invalid++;
    }

  }

  for (const booking of bookingRecords) {
    const record: AirtableRecord = { id: booking.id, fields: booking.fields };
    metrics.meetings.total++;
    if (isApprovedLead(record)) {
      metrics.meetings.qualified++;
    } else {
      metrics.meetings.disqualified++;
    }
  }

  for (const event of smsRecords) {
    const eventName = String(event.fields['Event'] ?? '').toLowerCase();
    const status = String(event.fields['Status'] ?? '').toLowerCase();
    const combined = status || eventName;
    const text = String(event.fields['Text'] ?? '').toLowerCase();
    const errorDetails = String(event.fields['Error Details'] ?? '').toLowerCase();
    const webhookRaw = String(event.fields['Webhook Raw'] ?? '').toLowerCase();
    const richMediaSource = `${text} ${errorDetails} ${webhookRaw}`;

    if (eventName === 'sent' || status === 'sent') {
      metrics.sms.sent++;
    }

    if (eventName === 'delivered' || status === 'delivered') {
      metrics.sms.delivered++;
    }

    const failed = combined.includes('fail') || combined.includes('undelivered');
    let countedFailure = false;
    if (failed) {
      metrics.sms.failed++;
      countedFailure = true;
      if (richMediaSource.includes(PRIMARY_RICH_MEDIA_TEXT)) {
        metrics.sms.failedRichMedia++;
      }
    }

    const fallbackRichMedia = richMediaSource.includes(FALLBACK_RICH_MEDIA_TEXT);
    if (fallbackRichMedia) {
      if (!countedFailure) {
        metrics.sms.failed++;
      }
      metrics.sms.failedRichMedia++;
    }
  }

  const deliveryRate = metrics.sms.sent > 0
    ? ((metrics.sms.delivered / metrics.sms.sent) * 100).toFixed(1)
    : '0.0';

  console.log('\n🧲 New Leads');
  console.log(`  • Total: ${metrics.leads.total}`);
  console.log(`  • US Valid: ${metrics.leads.usValid}`);
  console.log(`  • EU Valid: ${metrics.leads.euValid}`);
  console.log(`  • Invalid/Other: ${metrics.leads.invalid}`);

  console.log('\n📨 SMS Activity');
  console.log(`  • Sent: ${metrics.sms.sent}`);
  console.log(`  • Delivered: ${metrics.sms.delivered} (${deliveryRate}% of sent)`);
  console.log(`  • Failed/Undelivered: ${metrics.sms.failed}`);
  console.log(`    • of which carrier blocked rich media: ${metrics.sms.failedRichMedia}`);

  console.log('\n📅 Meetings Booked');
  console.log(`  • Total: ${metrics.meetings.total}`);
  console.log(`  • Qualified (approved form + SMS sent): ${metrics.meetings.qualified}`);
  console.log(`  • Flagged (missing form evidence or SMS send): ${metrics.meetings.disqualified}`);

  console.log('\n📝 JSON Payload');
  console.log(JSON.stringify(metrics, null, 2));
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Reporting script failed:', error);
    process.exit(1);
  });
}
