{
  "name": "UYSP-Project-Call-Summary-Sync",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "project-call-summary",
        "responseMode": "onReceived",
        "options": {}
      },
      "id": "webhook-notion",
      "name": "Webhook (Notion)",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "project-call-summary-sync"
    },
    {
      "parameters": {
        "functionCode": "const pageData = $input.item.json;\n\n// Helper to extract text from Notion rich_text\nfunction getText(property) {\n  if (!property) return '';\n  if (property.rich_text && property.rich_text.length > 0) {\n    return property.rich_text.map(t => t.plain_text).join('');\n  }\n  if (property.url) return property.url;\n  if (property.date && property.date.start) return property.date.start;\n  return '';\n}\n\nconst props = pageData.properties;\n\nreturn {\n  json: {\n    notionPageId: pageData.id,\n    callDate: getText(props['Call Date']),\n    executiveSummary: getText(props['Executive Summary']),\n    topPriorities: getText(props['Top Priorities']),\n    keyDecisions: getText(props['Key Decisions']),\n    blockers: getText(props['Blockers']),\n    nextSteps: getText(props['Next Steps']),\n    attendees: getText(props['Attendees']),\n    recordingUrl: getText(props['Call Recording URL']),\n    transcript: getText(props['Transcript']),\n    processedAt: new Date().toISOString()\n  }\n};"
      },
      "id": "parse-notion-data",
      "name": "Parse Notion Data",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "operation": "append",
        "application": "app4wIsBfpJTg7pWS",
        "table": "Project_Call_Summaries",
        "options": {},
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "Call Date",
              "fieldValue": "={{$json.callDate}}"
            },
            {
              "fieldId": "Executive Summary",
              "fieldValue": "={{$json.executiveSummary}}"
            },
            {
              "fieldId": "Top Priorities",
              "fieldValue": "={{$json.topPriorities}}"
            },
            {
              "fieldId": "Key Decisions",
              "fieldValue": "={{$json.keyDecisions}}"
            },
            {
              "fieldId": "Blockers Discussed",
              "fieldValue": "={{$json.blockers}}"
            },
            {
              "fieldId": "Next Steps",
              "fieldValue": "={{$json.nextSteps}}"
            },
            {
              "fieldId": "Attendees",
              "fieldValue": "={{$json.attendees}}"
            },
            {
              "fieldId": "Call Recording URL",
              "fieldValue": "={{$json.recordingUrl}}"
            },
            {
              "fieldId": "Transcript",
              "fieldValue": "={{$json.transcript}}"
            },
            {
              "fieldId": "Is Latest",
              "fieldValue": true
            }
          ]
        }
      },
      "id": "create-call-summary",
      "name": "Create Call Summary",
      "type": "n8n-nodes-base.airtable",
      "typeVersion": 1,
      "position": [650, 300],
      "credentials": {
        "airtableTokenApi": {
          "id": "{{$credentials.airtableTokenApi.id}}",
          "name": "Airtable Personal Access Token"
        }
      }
    },
    {
      "parameters": {
        "operation": "search",
        "application": "app4wIsBfpJTg7pWS",
        "table": "Project_Call_Summaries",
        "filterByFormula": "=AND({Is Latest} = TRUE(), RECORD_ID() != \"{{$json.id}}\")",
        "options": {
          "returnAll": true
        }
      },
      "id": "find-old-latest",
      "name": "Find Old 'Is Latest' Records",
      "type": "n8n-nodes-base.airtable",
      "typeVersion": 1,
      "position": [850, 300],
      "credentials": {
        "airtableTokenApi": {
          "id": "{{$credentials.airtableTokenApi.id}}",
          "name": "Airtable Personal Access Token"
        }
      }
    },
    {
      "parameters": {
        "operation": "update",
        "application": "app4wIsBfpJTg7pWS",
        "table": "Project_Call_Summaries",
        "id": "={{$json.id}}",
        "options": {},
        "fieldsUi": {
          "fieldValues": [
            {
              "fieldId": "Is Latest",
              "fieldValue": false
            }
          ]
        }
      },
      "id": "clear-old-latest",
      "name": "Clear Old 'Is Latest' Flags",
      "type": "n8n-nodes-base.airtable",
      "typeVersion": 1,
      "position": [1050, 300],
      "credentials": {
        "airtableTokenApi": {
          "id": "{{$credentials.airtableTokenApi.id}}",
          "name": "Airtable Personal Access Token"
        }
      }
    },
    {
      "parameters": {
        "channel": "#client-updates",
        "text": "=📞 **New Project Call Processed**\\n\\n**Date:** {{$node['Parse Notion Data'].json.callDate}}\\n**Attendees:** {{$node['Parse Notion Data'].json.attendees}}\\n\\n**Executive Summary:**\\n{{$node['Parse Notion Data'].json.executiveSummary.substring(0, 300)}}{{$node['Parse Notion Data'].json.executiveSummary.length > 300 ? '...' : ''}}\\n\\n**Top Priorities:**\\n{{$node['Parse Notion Data'].json.topPriorities.substring(0, 200)}}{{$node['Parse Notion Data'].json.topPriorities.length > 200 ? '...' : ''}}\\n\\n🔗 <https://notion.so/{{$node['Parse Notion Data'].json.notionPageId}}|View in Notion>\\n📊 <https://uysp-portal-v2.onrender.com|View in Portal>",
        "otherOptions": {
          "mrkdwn": true
        }
      },
      "id": "send-slack-notification",
      "name": "Send Slack Notification",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 1,
      "position": [1250, 300],
      "credentials": {
        "slackApi": {
          "id": "{{$credentials.slackApi.id}}",
          "name": "Slack API"
        }
      }
    },
    {
      "parameters": {
        "functionCode": "return {\n  json: {\n    success: true,\n    message: 'Call summary processed successfully',\n    airtableRecordId: $node['Create Call Summary'].json.id,\n    notionPageId: $node['Parse Notion Data'].json.notionPageId,\n    isLatest: true,\n    processedAt: new Date().toISOString()\n  }\n};"
      },
      "id": "respond-success",
      "name": "Respond Success",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [1450, 300]
    }
  ],
  "connections": {
    "Webhook (Notion)": {
      "main": [
        [
          {
            "node": "Parse Notion Data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Parse Notion Data": {
      "main": [
        [
          {
            "node": "Create Call Summary",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Create Call Summary": {
      "main": [
        [
          {
            "node": "Find Old 'Is Latest' Records",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Find Old 'Is Latest' Records": {
      "main": [
        [
          {
            "node": "Clear Old 'Is Latest' Flags",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Clear Old 'Is Latest' Flags": {
      "main": [
        [
          {
            "node": "Send Slack Notification",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Send Slack Notification": {
      "main": [
        [
          {
            "node": "Respond Success",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": false,
  "settings": {
    "saveExecutionProgress": true,
    "saveManualExecutions": true,
    "saveDataErrorExecution": "all",
    "saveDataSuccessExecution": "all",
    "executionTimeout": 30,
    "timezone": "America/New_York"
  },
  "versionId": "1.0.0",
  "tags": [
    {
      "name": "project-management",
      "id": "1"
    },
    {
      "name": "automation",
      "id": "2"
    },
    {
      "name": "notion-integration",
      "id": "3"
    }
  ]
}

