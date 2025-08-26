# Airtable Schema – Companies & Leads

## Companies (Authoritative)
- Domain (Primary) – Single line text
- Company Name – Single line text
- Industry – Single select
- Company Type – Single select: [B2B SaaS, B2B Tech Services, Other B2B, B2C/Unknown]
- Employee Count – Number
- Company Score Component – Number (0–25)
- Last Enriched – Date
- Enrichment Provider – Single select: [Apollo, Clearbit, PDL]
- Enrichment Cost – Currency

Views:
- All Companies (sorted by Domain)
- Needs Refresh (>90 days)
- High Value (Score ≥20)

## Leads (Processing Hub)
Core:
- Processing Status – Single select: [Backlog, Queued, Processing, Ready for SMS, Complete, Failed]
- Source – Single select: [Backlog, Webhook, Manual]
- Email – Email
- Phone – Phone
- First Name – Text
- Last Name – Text
- Job Title – Text
- Company Domain – Text
- Company – Link to Companies
 - Company Industry – Text
 - Company Description – Long text

Enrichment:
- Person Industry – Text
- Job Level – Single select: [Entry, Mid, Senior, Executive, C-Level]
- Location Country – Text
- Location Confidence – Number (0–1)
- Enrichment Provider Used – Text
- Enrichment Timestamp – Date/time
- Raw Enrichment Data – Long text

Scoring:
- ICP Score – Number
- Company Score Component – Number (0–25)
- Role Score Component – Number (0–45)
- Location Score Component – Number (0–20)
- Dynamic Signals Score – Number (0–10)
- Prime Fit Bonus – Checkbox
- Score Reasoning – Long text
- SMS Eligible – Checkbox

SMS & Outreach:
- SMS Status – Single select: [Not Sent, Queued, Sent, Delivered, Clicked, Replied, Meeting Booked]
- SMS Campaign ID – Text
- SMS Sequence Position – Number
- SMS Sent Count – Number
- SMS Cost – Currency
- Last SMS Sent – Date/time

HRQ & Quality:
- HRQ Status – Single select: [None, Archive, Qualified, Manual Process]
- HRQ Reason – Text
- Data Quality Score – Number (1–5)
- Validation Errors – Long text

Observability:
- Total Processing Cost – Currency
- Error Log – Long text
- Processing Duration – Number (seconds)
- Last Updated – Date/time
