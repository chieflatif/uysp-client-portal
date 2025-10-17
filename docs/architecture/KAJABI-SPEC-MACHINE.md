# Kajabi Integration - Machine-Readable Specification
**For**: AI Agent (Claude) reference during build  
**Format**: Structured data for code generation  
**Version**: 1.0

---

## API ENDPOINTS

```json
{
  "base_url": "https://api.kajabi.com",
  "version": "v1",
  "auth": {
    "method": "oauth2",
    "token_url": "https://api.kajabi.com/v1/oauth/token",
    "grant_type": "client_credentials",
    "credentials_required": ["client_id", "client_secret"],
    "token_expiry": 7200,
    "token_type": "Bearer"
  },
  "endpoints": {
    "get_form_submission": {
      "method": "GET",
      "path": "/v1/form_submissions/{id}",
      "query_params": {"include": "form"},
      "purpose": "Get form ID from submission"
    },
    "get_contact": {
      "method": "GET",
      "path": "/v1/contacts/{id}",
      "query_params": {"include": "tags"},
      "purpose": "Get full contact data"
    },
    "search_contact_by_email": {
      "method": "GET",
      "path": "/v1/contacts",
      "query_params": {"filter[email]": "{email}"},
      "purpose": "Find contact by email"
    },
    "list_forms": {
      "method": "GET",
      "path": "/v1/forms",
      "purpose": "Get all forms for mapping"
    },
    "add_tag": {
      "method": "POST",
      "path": "/v1/contacts/{id}/tags",
      "body": {"tag": {"name": "string"}},
      "purpose": "Phase 2 write-back"
    }
  }
}
```

---

## WEBHOOK PAYLOAD STRUCTURE

```json
{
  "form_submission_webhook": {
    "type": "array",
    "items": {
      "id": "string (submission_id)",
      "type": "form_submissions",
      "attributes": {
        "name": "string",
        "email": "string",
        "phone_number": "string",
        "business_number": "string",
        "address_line_1": "string",
        "address_city": "string",
        "custom_1": "string",
        "custom_2": "string",
        "custom_3": "string"
      },
      "relationships": {
        "form": {
          "data": {
            "id": "string (form_id)",
            "type": "forms"
          }
        },
        "tags": {
          "data": [
            {"id": "string", "type": "tags"}
          ]
        }
      }
    }
  }
}
```

---

## N8N WORKFLOW NODES

```json
{
  "workflow_name": "UYSP-Kajabi-Realtime-Ingestion",
  "nodes": [
    {
      "id": "webhook-receiver",
      "type": "n8n-nodes-base.webhook",
      "config": {
        "httpMethod": "POST",
        "path": "kajabi-leads",
        "responseMode": "onReceived"
      }
    },
    {
      "id": "extract-submission",
      "type": "n8n-nodes-base.code",
      "code_template": "const payload = $input.first().json;\nconst submission = Array.isArray(payload) ? payload[0] : payload;\nreturn [{json: {submission_id: submission.id, email: submission.attributes.email, form_id: submission.relationships?.form?.data?.id}}];"
    },
    {
      "id": "get-form-details",
      "type": "n8n-nodes-base.httpRequest",
      "config": {
        "method": "GET",
        "url": "https://api.kajabi.com/v1/form_submissions/{{ $json.submission_id }}?include=form",
        "authentication": "oAuth2",
        "credentialName": "Kajabi OAuth2"
      }
    },
    {
      "id": "map-form-to-campaign",
      "type": "n8n-nodes-base.code",
      "code_template": "const formId = $json.data?.relationships?.form?.data?.id;\nconst formToCampaign = {FORM_MAPPING_PLACEHOLDER};\nconst campaign = formToCampaign[formId] || 'default_nurture';\nreturn [{json: {...$json, campaign_assignment: campaign}}];"
    },
    {
      "id": "normalize-fields",
      "type": "n8n-nodes-base.code",
      "purpose": "Smart Field Mapper for Kajabi data"
    },
    {
      "id": "duplicate-check",
      "type": "n8n-nodes-base.airtable",
      "config": {
        "operation": "search",
        "base": "app4wIsBfpJTg7pWS",
        "table": "tblYUvhGADerbD8EO",
        "filterByFormula": "{Email} = \"{{ $json.email }}\""
      }
    },
    {
      "id": "route-duplicate",
      "type": "n8n-nodes-base.if",
      "condition": "{{ $json.id }}"
    },
    {
      "id": "update-existing",
      "type": "n8n-nodes-base.airtable",
      "config": {
        "operation": "update",
        "base": "app4wIsBfpJTg7pWS",
        "table": "tblYUvhGADerbD8EO"
      }
    },
    {
      "id": "create-new",
      "type": "n8n-nodes-base.airtable",
      "config": {
        "operation": "create",
        "base": "app4wIsBfpJTg7pWS",
        "table": "tblYUvhGADerbD8EO"
      }
    },
    {
      "id": "log-audit",
      "type": "n8n-nodes-base.airtable",
      "config": {
        "operation": "create",
        "table": "tblKajabiSyncAudit"
      }
    }
  ]
}
```

---

## AIRTABLE SCHEMA

```json
{
  "leads_table_new_fields": {
    "kajabi_contact_id": {"type": "text"},
    "kajabi_tags": {"type": "long_text", "format": "json"},
    "campaign_assignment": {"type": "single_select", "options": ["webinar_jb_2024", "webinar_sales_2024", "default_nurture"]},
    "lead_source_detail": {"type": "text"},
    "kajabi_member_status": {"type": "single_select", "options": ["Prospect", "Active", "Trial", "Churned"]},
    "kajabi_last_sync": {"type": "datetime"}
  },
  "sms_templates_table": {
    "campaign_id": {"type": "text", "primary": true},
    "campaign_name": {"type": "text"},
    "kajabi_tag_match": {"type": "text"},
    "sequence_position": {"type": "number"},
    "message_template": {"type": "long_text"},
    "active": {"type": "checkbox"}
  },
  "kajabi_sync_audit_table": {
    "kajabi_contact_id": {"type": "text"},
    "lead_email": {"type": "email"},
    "sync_timestamp": {"type": "datetime"},
    "duplicate_found": {"type": "checkbox"},
    "campaign_assigned": {"type": "text"},
    "tags_captured": {"type": "long_text"},
    "error_log": {"type": "long_text"}
  }
}
```

---

## FORM MAPPING TABLE

```javascript
// To be filled in with Ian's actual form IDs
const formToCampaign = {
  'FORM_ID_1': 'webinar_jb_2024',
  'FORM_ID_2': 'webinar_sales_2024',
  'FORM_ID_3': 'webinar_ai_2024',
  'FORM_ID_4': 'newsletter_nurture',
  // Default catch-all
  '*': 'default_nurture'
};
```

---

## TESTING CHECKLIST

```
[ ] Webhook receives form submission
[ ] Form ID extracted correctly
[ ] Campaign mapped correctly
[ ] Airtable record created
[ ] Clay picks up lead
[ ] SMS sends correct campaign message
[ ] Duplicate handling works
[ ] No errors for 48 hours
```

---

## ERROR HANDLING

```javascript
{
  "oauth_token_expired": "n8n auto-refreshes",
  "kajabi_api_500": "Retry 3x with 2s delay",
  "kajabi_api_429": "Circuit breaker - pause 60s",
  "form_id_not_found": "Use default_nurture campaign",
  "duplicate_email": "Update existing, increment duplicate_count",
  "missing_email": "Log error, skip record"
}
```

---

## RATE LIMITS

```
Unknown (not documented)
Conservative approach: 1 request/second
Monitor headers: X-RateLimit-*
Circuit breaker after 5 consecutive failures
```

---

**That's the complete machine spec. Everything I need to build this is here.**

