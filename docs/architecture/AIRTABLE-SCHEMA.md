# Airtable Schema – Companies & Leads

## Companies (Authoritative cache mirrored from Clay)
- Domain (Primary) – Single line text (unique key; equals `company_domain`)
- Company Name – Single line text
- Company Type – Single select: [B2B SaaS, B2B Tech Services, Other B2B, B2C/Unknown]
- Company Score Component – Number (25, 18, 10, or 2 based on type)
- Industry Final – Single line text (2-3 words, improved from Apollo)
- Industry (Apollo) – Single line text (raw from Apollo)
- Description Final – Long text (10-15 word summary from GPT)
- Description (Apollo) – Long text (raw from Apollo)
- Company LinkedIn URL – URL
- Employee Count – Number
- Last Enriched – Date/time
- Enrichment Provider – Single select: [Apollo, Clay GPT, Mixed]
- Enrichment Timestamp – Date/time
- Enrichment Cost – Currency
- Used Website – Checkbox (if GPT visited site)

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
- Company – Link to Companies (by Domain)
- Company Name – Text (from enrichment)
- Company Type – Single select: [B2B SaaS, B2B Tech Services, Other B2B, B2C/Unknown]
- Company Industry – Text (Industry Final from Clay)
- Company Description – Long text (Description Final from Clay)
- Company LinkedIn URL – URL
- Person LinkedIn URL – URL
- Batch ID – Text (batch orchestration)

Enrichment:
- Person Industry – Text
- Job Level – Single select: [Entry, Mid, Senior, Executive, C-Level]
- Location Country – Text
- Location Confidence – Number (0–1)
- Enrichment Provider Used – Text
- Enrichment Timestamp – Date/time
- Raw Enrichment Data – Long text

Scoring:
- ICP Score – Number (Formula: sum of components + Prime Fit Bonus)
- Company Score Component – Number (0–25; from Clay or formula)
- Role Score Component – Number (0–45)
- Location Score Component – Number (0–20)
- Dynamic Signals Score – Number (0–10)
- Prime Fit Bonus – Checkbox
- Score Reasoning – Long text
- SMS Eligible (calc) – Formula (Boolean):
  AND(
    {Phone Valid},
    {ICP Score} >= 70,
    LOWER({Location Country}) = "united states",
    OR({SMS Status}="Not Sent", {SMS Status}=""),
    {HRQ Status} != "Archive"
  )

SMS & Outreach:
- SMS Status – Single select: [Not Sent, Queued, Sent, Delivered, Clicked, Replied, Meeting Booked]
- SMS Campaign ID – Text
- SMS Sequence Position – Number
- SMS Sent Count – Number
- SMS Cost – Currency
- Last SMS Sent – Date/time

HRQ & Quality:
- HRQ Status – Single select: [None, Archive, Qualified, Manual Process]
- HRQ Reason – Text (e.g., "Personal email")
- Phone Valid – Checkbox (from Clay normalization)
- Data Quality Score – Number (1–5)
- Validation Errors – Long text

Observability:
- Total Processing Cost – Currency
- Error Log – Long text
- Processing Duration – Number (seconds)
- Last Updated – Date/time
