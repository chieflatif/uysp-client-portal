# Airtable Recovery Instructions
Generated: 2025-08-08T11:53:20.970Z

## Critical Recovery Order
1. People table (primary data)
2. DND_List (compliance)
3. Communications (audit trail)
4. Error_Log (debugging)
5. All other tables

## Table Recreation Commands
```bash
# Use these MCP commands to recreate tables:
# People: Main contact storage with normalized fields - Session 0 & 1 complete
mcp_airtable_create_table baseId="appuBf0fTe8tp8ZaF" name="People"
# DND_List: Do Not Disturb registry - Session 2 compliance checking
mcp_airtable_create_table baseId="appuBf0fTe8tp8ZaF" name="DND_List"
# Communications: SMS and communication audit trail - Session 2+ compliance logging
mcp_airtable_create_table baseId="appuBf0fTe8tp8ZaF" name="Communications"
# Error_Log: Error tracking and debugging - Session 1+ comprehensive logging
mcp_airtable_create_table baseId="appuBf0fTe8tp8ZaF" name="Error_Log"
# Daily_Costs: Cost tracking and budget monitoring
mcp_airtable_create_table baseId="appuBf0fTe8tp8ZaF" name="Daily_Costs"
# Enrichment_Cache: Apollo API response caching for cost optimization
mcp_airtable_create_table baseId="appuBf0fTe8tp8ZaF" name="Enrichment_Cache"
# Daily_Metrics: Performance metrics and KPI tracking
mcp_airtable_create_table baseId="appuBf0fTe8tp8ZaF" name="Daily_Metrics"
# Field_Mapping_Log: Unknown webhook field tracking for mapping updates
mcp_airtable_create_table baseId="appuBf0fTe8tp8ZaF" name="Field_Mapping_Log"
# Human_Review_Queue: Manual review queue for edge cases
mcp_airtable_create_table baseId="appuBf0fTe8tp8ZaF" name="Human_Review_Queue"
# Workflow_IDs: n8n workflow ID tracking and versioning
mcp_airtable_create_table baseId="appuBf0fTe8tp8ZaF" name="Workflow_IDs"
```

## Field Mapping References
### People
- email: fldY5wcpct2BQy26k
- phone_primary: fldXxhI9PdGQH3w9q
- phone_original: fld1ME4syQIbYSmuF
- phone_recent: fldbcwWvQ5QQk5TWD
- phone_validated: fld0tRS5mpe81t3RA
- first_name: flda2t5DDhL2ORBFd
- last_name: fldLm8S2r7avlrcJU
- company_input: fldXTRlB9WxePpI3t
- icp_score: fldV855gixrnXM1MD
- processing_status: fld2iK05BoWTkZ57h

### DND_List
- phone: flduAiX2sbMB1ij8D
- email: fld0Vk393SRIlvXfc
- opt_out_date: fldBQQtg4enEGWaEq
- permanent: fldEj4QXfMGDwHuYs

### Communications
- person_id: fldSbmZHkRIczUyCz
- message_type: fldIHAP3AIl2RJaJ9
- sent_time: fldjHRD2qrgNGysd0
- dnd_checked: fldPaAvF3U6X01LpJ
- time_window_checked: fldZDC7GZCCCscmIk

### Error_Log
- workflow_name: fld1Vkb0mcBVC4nxx
- execution_id: fld9TbcIe8nnqohoU
- error_type: fldBd480e6ajjGC5n
- timestamp: fld9bSTIzvPjBIdjV

### Daily_Costs
- date: fld3Pr3hFg1K0dcL3
- total_costs: fldxULNskVSsHVGLy
- circuit_breaker_triggered: flddv5Ygma72Xl7c3

### Enrichment_Cache
- No key fields defined

### Daily_Metrics
- No key fields defined

### Field_Mapping_Log
- No key fields defined

### Human_Review_Queue
- No key fields defined

### Workflow_IDs
- No key fields defined

## Workflow Dependencies
- Primary Workflow: CefJB1Op3OySG8nb
- Webhook Endpoints: {
  "kajabi_leads": "/webhook/kajabi-leads",
  "sms_responses": "/webhook/sms-responses"
}
