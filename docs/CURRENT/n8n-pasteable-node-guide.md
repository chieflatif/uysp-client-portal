[AUTHORITATIVE]
Last Updated: 2025-08-11

### n8n pasteable node JSON — definitive rules and templates

This guide defines the exact JSON you can paste directly into the n8n canvas to create nodes that work immediately. It encodes all pasteability requirements observed in production.

Key rules (must follow)
- Use a top-level object with one key: "nodes": an array of node objects. No connections in the same paste.
- Do not include credentials sections when pasting; keep authentication as predefinedCredentialType and pick credentials in UI if needed.
- For Airtable nodes, set `base` and `table` as Resource Locator objects (RL) exactly like the UI stores them:
  - `{"__rl": true, "mode": "id", "value": "<baseId>"}`
  - `{"__rl": true, "mode": "id", "value": "<tableId>"}`
- Expressions must start with a single leading equals sign: `={{ ... }}`. Never use `=={{ ... }}`.
- For HTTP Request JSON bodies: if the field accepts JSON, you may paste a JSON string. If UI rendering breaks or adds escapes, switch that field to expression (fx ON) and return an object via `={{ ({ ... }) }}`.
- Keep node `type` and `typeVersion` identical to live nodes to avoid schema rejections.
- Positions (`position: [x,y]`) can be arbitrary; they only affect where the node appears.

Pasteable templates (ready to use)

1) Airtable Upsert (update) — People table

```json
{
  "nodes": [
    {
      "name": "Airtable Upsert (Dynamic)",
      "type": "n8n-nodes-base.airtable",
      "typeVersion": 2.1,
      "position": [2240, -180],
      "parameters": {
        "operation": "update",
        "base": { "__rl": true, "mode": "id", "value": "appuBf0fTe8tp8ZaF" },
        "table": { "__rl": true, "mode": "id", "value": "tblSk2Ikg21932uE0" },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "id": "={{$json.recordId}}",
            "duplicate_count": "={{$json.duplicateCount}}",
            "first_name": "={{$json.normalized.first_name}}",
            "last_name": "={{$json.normalized.last_name}}",
            "title_current": "={{$json.normalized.title_current || $json.normalized.pdl_job_title || $json.normalized.title}}",
            "company_enriched": "={{$json.normalized.company_enriched || $json.normalized.pdl_company_name || $json.normalized.company}}",
            "linkedin_url": "={{$json.normalized.linkedin_url || $json.normalized.pdl_linkedin_url}}",
            "phone_primary": "={{$json.normalized.phone_primary}}",
            "icp_score": "={{$json.normalized.icp_score}}",
            "icp_tier": "={{$json.normalized.icp_tier || 'Archive'}}",
            "score_breakdown": "={{$json.normalized.score_reasoning}}",
            "scoring_date": "={{DateTime.now().toFormat('M/d/yyyy')}}",
            "scoring_method_used": "={{$json.normalized.scoring_method_used}}",
            "field_mapping_success_rate": "={{$json.normalized.field_mapping_success_rate}}",
            "created_date": "={{DateTime.now().toFormat('M/d/yyyy')}}",
            "lead_status": "New"
          },
          "matchingColumns": ["id"],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        },
        "options": {}
      }
    }
  ]
}
```

2) Airtable Create — People table

```json
{
  "nodes": [
    {
      "name": "Airtable Create (Dynamic)",
      "type": "n8n-nodes-base.airtable",
      "typeVersion": 2.1,
      "position": [2240, 20],
      "parameters": {
        "operation": "create",
        "base": { "__rl": true, "mode": "id", "value": "appuBf0fTe8tp8ZaF" },
        "table": { "__rl": true, "mode": "id", "value": "tblSk2Ikg21932uE0" },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "email": "={{$json.normalized.email}}",
            "first_name": "={{$json.normalized.first_name}}",
            "last_name": "={{$json.normalized.last_name}}",
            "company_input": "={{$json.normalized.company}}",
            "title_current": "={{$json.normalized.title_current || $json.normalized.pdl_job_title || $json.normalized.title}}",
            "company_enriched": "={{$json.normalized.company_enriched || $json.normalized.pdl_company_name || $json.normalized.company}}",
            "phone_primary": "={{$json.normalized.phone}}",
            "linkedin_url": "={{$json.normalized.linkedin_url || $json.normalized.pdl_linkedin_url}}",
            "interested_in_coaching": "={{$json.normalized.interested_in_coaching}}",
            "qualified_lead": "={{$json.normalized.qualified_lead}}",
            "lead_status": "New",
            "created_date": "={{DateTime.now().toFormat('M/d/yyyy')}}",
            "icp_score": "={{$json.normalized.icp_score || 0}}",
            "icp_tier": "={{$json.normalized.icp_tier || 'Archive'}}",
            "field_mapping_success_rate": "={{$json.normalized.field_mapping_success_rate}}",
            "reengagement_count": 0,
            "duplicate_count": 0,
            "webhook_field_count": 0,
            "mapped_field_count": 0,
            "apollo_org_cost": 0,
            "apollo_person_cost": 0,
            "twilio_cost": 0,
            "claude_cost": 0,
            "total_processing_cost": 0,
            "scoring_method_used": "={{$json.normalized.scoring_method_used}}"
          },
          "matchingColumns": [],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        },
        "options": {}
      }
    }
  ]
}
```

3) HTTP Request — OpenAI chat.completions with JSON body

Paste the raw JSON body into the `jsonBody` field if the UI accepts it. If the UI escapes or collapses it, use the expression version (fx ON) returning an object.

Raw JSON body variant (paste into `jsonBody`):

```json
{
  "model": "gpt-4o-mini",
  "response_format": { "type": "json_object" },
  "temperature": 0.1,
  "top_p": 0.9,
  "max_tokens": 500,
  "messages": [
    { "role": "system", "content": "You are an ICP scoring system. Output ONLY a valid JSON object with EXACTLY these keys: company_score (number 0-50), role_score (number 0-30), engagement_score (number 0-20), total_score (number 0-100 sum of above), recommendation (string: high_priority|medium_priority|low_priority), reasoning (string). No extra text, no markdown, no wrappers." },
    { "role": "user", "content": "Lead Data:\n{{ JSON.stringify($json, null, 2) }}\n\nKey Points:\n- Company: {{ $json.pdl_company_name || $json.company_enriched || $json.company || 'Unknown' }}\n- Title: {{ $json.pdl_job_title || $json.title_current || $json.title || 'Unknown' }}\n- Seniority: {{ $json.pdl_seniority || 'Unknown' }}\n- Is Sales Role: {{ ($json.pdl_is_sales_role || false) ? 'true' : 'false' }}\n- Industry: {{ $json.pdl_industry || 'Unknown' }}\n- LinkedIn: {{ ($json.pdl_linkedin_url || $json.linkedin_url) ? 'Yes' : 'No' }}" }
  ]
}
```

Expression body variant (fx ON):

```jinja
={{ ({
  model: 'gpt-4o-mini',
  response_format: { type: 'json_object' },
  temperature: 0.1,
  top_p: 0.9,
  max_tokens: 500,
  messages: [
    { role: 'system', content: 'You are an ICP scoring system. Output ONLY a valid JSON object with EXACTLY these keys: company_score (number 0-50), role_score (number 0-30), engagement_score (number 0-20), total_score (number 0-100 sum of above), recommendation (string: high_priority|medium_priority|low_priority), reasoning (string). No extra text, no markdown, no wrappers.' },
    { role: 'user', content: 'Lead Data:\n' + JSON.stringify($json, null, 2) + '\n\nKey Points:\n- Company: ' + ($json.pdl_company_name || $json.company_enriched || $json.company || 'Unknown') + '\n- Title: ' + ($json.pdl_job_title || $json.title_current || $json.title || 'Unknown') + '\n- Seniority: ' + ($json.pdl_seniority || 'Unknown') + '\n- Is Sales Role: ' + (($json.pdl_is_sales_role || false) ? 'true' : 'false') + '\n- Industry: ' + ($json.pdl_industry || 'Unknown') + '\n- LinkedIn: ' + (($json.pdl_linkedin_url || $json.linkedin_url) ? 'Yes' : 'No') }
  ]
}) }}
```

Troubleshooting checklist
- Paste rejected: ensure the top-level wrapper is exactly `{ "nodes": [ ... ] }` and only contains node objects.
- Expression not evaluated: confirm a single `=` precedes `{{ ... }}`. Remove any extra `=`.
- Credentials missing: after paste, open node and select the appropriate predefined credential in the UI.
- Airtable type mismatch: verify field names exist; if a field is Single Select, ensure option values exist (e.g., add `ai_openai` if required).


