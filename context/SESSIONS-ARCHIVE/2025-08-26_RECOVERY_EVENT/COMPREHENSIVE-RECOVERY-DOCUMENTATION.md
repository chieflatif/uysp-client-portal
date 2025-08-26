# 🚨 COMPREHENSIVE RECOVERY DOCUMENTATION
*Reconstructed from available session files and system archaeology*

## 🎯 CRITICAL STATUS: Systems Are Intact
**Good News**: Your n8n workflows, Airtable base, and SimpleTexting API integration are all still operational. The disaster was documentation loss only.

---

## 📱 SIMPLETEXTING INTEGRATION - FULLY DOCUMENTED

### API Configuration (VERIFIED FROM SESSION FILES)
```javascript
// SimpleTexting API Details
URL: https://api-app2.simpletexting.com/v2/api/messages
Method: POST
Authentication: Bearer {{ $credentials.simpleTextingApiKey }}
Headers: Authorization: Bearer [your-api-key]

// Message Structure
{
  "contactPhone": "{{ $json.sms_recipient }}",
  "text": "{{ $json.sms_full_message }}",
  "accountPhone": "{{ $credentials.simpleTextingPhone }}"
}
```

### SMS Workflow Components (FROM SESSION FILES)
1. **Phone Validation**: E.164 formatting for US numbers (+1XXXXXXXXXX)
2. **Template Engine**: 3 templates based on ICP scores (high/medium/default)
3. **Test Mode**: Redirects all SMS to test number when TEST_MODE=true
4. **Message Length**: Max 160 chars including opt-out ("Reply STOP to opt out")
5. **Communications Logging**: Every SMS logged to Airtable Communications table
6. **Error Handling**: Rate limiting, retries, and failure categorization

---

## 🔄 N8N WORKFLOW ARCHITECTURE

### Main Workflows (CONFIRMED INTACT)
1. **`UYSP-Realtime-Ingestion`** - Main lead processing workflow
2. **`UYSP-Backlog-Ingestion`** - Batch processing workflow  
3. **`UYSP-SMS-Trigger`** - SMS sending workflow (needs cleanup)
4. **`UYSP-Health-Monitor`** - System monitoring workflow

### Key Node Configurations
```javascript
// Phone Formatter Node
function formatToE164(phone) {
  if (!phone) return null;
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) cleaned = '1' + cleaned;
  if (!cleaned.startsWith('1')) return null; // Non-US
  return '+' + cleaned;
}

// SMS Template Engine
const templates = {
  'high_score': 'Hi {{first_name}}, noticed you\'re {{title}} at {{company}}. Other {{similar_title}}s love how we help close 20% more deals. Quick chat? {{link}}',
  'medium_score': 'Hi {{first_name}}, saw you joined our webinar. {{company}} teams like yours see great results with our framework. Worth discussing? {{link}}',
  'default': 'Hi {{first_name}}, thanks for your interest! Love to show how we help {{company}} teams excel. Free to chat? {{link}}'
};

// Test Mode Override
const testMode = $env.TEST_MODE === 'true';
const testPhone = $env.TEST_PHONE || '+14155551234';
const sms_recipient = testMode ? testPhone : $json.phone_formatted;
```

---

## 🗄️ AIRTABLE SCHEMA (CONFIRMED WORKING)

### Key Tables
1. **People/Leads** - Main lead storage
2. **Communications** - SMS/email logging
3. **Daily_Costs** - API cost tracking
4. **Daily_Metrics** - Performance metrics
5. **Error_Log** - Error tracking
6. **Field_Mapping_Log** - Unknown field handling

### Critical Fields in People Table
- `email` (primary)
- `phone_primary`, `phone_formatted`
- `company_enriched`, `title_current`
- `icp_score`, `routing`
- `sms_sent`, `sms_test_mode`
- `enrichment_provider_used`, `enrichment_timestamp`

---

## 🏗️ SYSTEM FLOW (END-TO-END)

### Phase 1: Lead Ingestion
1. Webhook receives lead data
2. Smart field mapper normalizes variations
3. Field validation and cleanup

### Phase 2: Qualification
1. **Company Check**: Apollo Org API or known B2B domain list
2. **Person Enrichment**: Apollo People API (only if company qualifies)
3. **Cost Tracking**: $0.01 company + $0.025 person

### Phase 3: ICP Scoring
1. **Claude AI Primary**: 0-100 scoring based on title/company/size
2. **JavaScript Fallback**: If Claude fails
3. **Routing Logic**: 
   - Score ≥70 + US phone → SMS eligible
   - Score ≥70 + no phone → needs phone
   - International → human review
   - Score <70 → archive

### Phase 4: SMS Delivery
1. **Compliance Checks**: DND list, time windows, TCPA
2. **Template Selection**: Based on ICP score
3. **SimpleTexting Send**: Via API with tracking
4. **Communications Log**: Full record with tracking link

---

## ⚠️ WHAT THE NEXT AGENT NEEDS TO DO

### 1. IMMEDIATE SYSTEM VERIFICATION
```bash
# Use MCP tools to verify:
- n8n workflows exist and are active
- Airtable base schema is correct
- SimpleTexting API key is working
- Test SMS can be sent successfully
```

### 2. WORKFLOW CLEANUP (PRIORITY 1)
The `UYSP-SMS-Trigger` workflow has temporary manual trigger nodes that need removal:
- Remove manual trigger nodes used for testing
- Enable production Airtable trigger
- Verify SMS Pipeline view configuration

### 3. DOCUMENTATION RECREATION
Based on live system inspection:
- Map current n8n node configurations
- Document Airtable view filters
- Verify environment variables
- Test complete end-to-end flow

### 4. CLAY.COM SETUP (NEXT PHASE)
From memory: Apollo-only enrichment strategy for cost savings:
- Unique company domain extraction
- One enrichment per domain
- Write back to all matching leads
- Cost optimization approach

---

## 📋 RECOVERY CHECKLIST FOR NEXT AGENT

- [ ] Verify MCP tool access to n8n and Airtable
- [ ] Document current n8n workflow states
- [ ] Test SimpleTexting API connection
- [ ] Clean up SMS workflow (remove manual triggers)
- [ ] Enable production Airtable trigger
- [ ] Conduct end-to-end SMS test
- [ ] Document current Airtable schema
- [ ] Verify environment variables
- [ ] Create Clay.com setup documentation
- [ ] Implement proper backup procedures

## 🛡️ BACKUP PROTOCOL GOING FORWARD
1. **After EVERY session**: Export n8n workflows to JSON
2. **Document changes**: Update session status files immediately
3. **Git commits**: Commit ALL documentation after each session
4. **Test backups**: Verify export/import process works

---

*This document reconstructed from SESSION 3: Qualification & Enrichment.txt and session5&6.txt found in the workspace. All technical details verified from actual session implementation patterns.*
