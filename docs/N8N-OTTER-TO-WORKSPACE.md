# n8n Workflow: Otter → Workspace OS

## 🎯 Solution: All-n8n Automation

Instead of Zapier, use n8n for the complete pipeline:
1. **Otter → n8n** (webhook or polling)
2. **n8n → Your Workspace Folder** (file write)

---

## Option 1: Otter Webhook → n8n (Recommended)

### Workflow Nodes:

```
1. Webhook Trigger (receives Otter webhook)
   ↓
2. Parse Otter Data (extract transcript)
   ↓
3. Write File (to your workspace folder)
   ↓
4. (Optional) Trigger Workspace OS processing
```

### Node Configuration:

#### Node 1: Webhook Trigger
```json
{
  "name": "Otter Webhook",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "httpMethod": "POST",
    "path": "otter-transcript",
    "responseMode": "onReceived"
  }
}
```

**Webhook URL:** `https://your-n8n-instance.com/webhook/otter-transcript`

#### Node 2: Parse Otter Data
```javascript
// Extract transcript data from Otter webhook
const otterData = $input.item.json;

return {
  json: {
    title: otterData.title || 'Untitled Call',
    transcript: otterData.transcript || otterData.text,
    date: otterData.created_at || new Date().toISOString(),
    duration: otterData.duration,
    speakers: otterData.speakers || [],
    filename: `${otterData.title} - ${new Date().toISOString().split('T')[0]}.txt`
  }
};
```

#### Node 3: Write File

**If workspace is on Dropbox:**
```json
{
  "name": "Save to Dropbox",
  "type": "n8n-nodes-base.dropbox",
  "parameters": {
    "operation": "upload",
    "path": "/Workspace/Transcripts/{{$json.filename}}",
    "binaryData": false,
    "fileContent": "={{$json.transcript}}"
  }
}
```

**If workspace is on Google Drive:**
```json
{
  "name": "Save to Google Drive",
  "type": "n8n-nodes-base.googleDrive",
  "parameters": {
    "operation": "upload",
    "folderId": "YOUR_FOLDER_ID",
    "name": "={{$json.filename}}",
    "fileContent": "={{$json.transcript}}"
  }
}
```

**If workspace is local/SSH:**
```json
{
  "name": "Write File (SSH)",
  "type": "n8n-nodes-base.ssh",
  "parameters": {
    "command": "echo '{{$json.transcript}}' > /path/to/workspace/transcripts/{{$json.filename}}"
  }
}
```

---

## Option 2: n8n Polling Otter API

If Otter doesn't support webhooks:

### Workflow Nodes:

```
1. Cron Trigger (every 5 minutes)
   ↓
2. HTTP Request (Otter API - get transcripts)
   ↓
3. Filter (only new transcripts)
   ↓
4. Loop through transcripts
   ↓
5. Write each file to workspace
```

#### Node 1: Cron Trigger
```json
{
  "name": "Check Every 5 Minutes",
  "type": "n8n-nodes-base.cron",
  "parameters": {
    "triggerTimes": {
      "item": [
        {
          "mode": "everyX",
          "value": 5,
          "unit": "minutes"
        }
      ]
    }
  }
}
```

#### Node 2: Fetch from Otter API
```json
{
  "name": "Get Recent Transcripts",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "https://otter.ai/api/v1/speeches",
    "authentication": "headerAuth",
    "headerAuth": {
      "name": "Authorization",
      "value": "Bearer YOUR_OTTER_API_KEY"
    },
    "method": "GET",
    "qs": {
      "created_after": "={{$now.minus({minutes: 10}).toISO()}}"
    }
  }
}
```

#### Node 3: Filter New Transcripts
```javascript
// Only process transcripts we haven't seen before
// Store last processed ID in static data or workflow variable

const transcripts = $input.all();
const lastProcessedId = $workflow.staticData.lastProcessedId || 0;

return transcripts.filter(item => {
  return item.json.id > lastProcessedId;
});
```

#### Node 4: Loop & Save
```json
{
  "name": "Loop Transcripts",
  "type": "n8n-nodes-base.splitInBatches",
  "parameters": {
    "batchSize": 1
  }
}
```

Then connect to "Write File" node (same as Option 1)

---

## Complete Workflow JSON (Webhook Version)

```json
{
  "name": "UYSP-Otter-to-Workspace",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "otter-transcript",
        "responseMode": "onReceived"
      },
      "id": "webhook-otter",
      "name": "Otter Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "functionCode": "const otterData = $input.item.json;\n\nconst title = otterData.title || otterData.summary?.title || 'Untitled Call';\nconst date = new Date(otterData.created_at || Date.now());\nconst dateStr = date.toISOString().split('T')[0];\n\nreturn {\n  json: {\n    title: title,\n    transcript: otterData.transcript || otterData.text || '',\n    date: dateStr,\n    duration: otterData.duration || 0,\n    filename: `${title.replace(/[^a-zA-Z0-9\\s-]/g, '')} - ${dateStr}.txt`,\n    fullData: otterData\n  }\n};"
      },
      "id": "parse-otter",
      "name": "Parse Otter Data",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "operation": "upload",
        "path": "/Workspace/Client Calls/Transcripts/={{$json.filename}}",
        "binaryData": false,
        "fileContent": "=# {{$json.title}}\n\nDate: {{$json.date}}\nDuration: {{$json.duration}} seconds\n\n---\n\n{{$json.transcript}}"
      },
      "id": "save-to-storage",
      "name": "Save to Workspace",
      "type": "n8n-nodes-base.dropbox",
      "typeVersion": 1,
      "position": [650, 300],
      "credentials": {
        "dropboxApi": {
          "id": "{{$credentials.dropboxApi.id}}",
          "name": "Dropbox API"
        }
      }
    },
    {
      "parameters": {
        "channel": "#transcripts",
        "text": "=📝 New call transcript saved\\n\\n**Title:** {{$json.title}}\\n**Date:** {{$json.date}}\\n**Duration:** {{$json.duration}} seconds\\n\\n✅ Ready for Workspace OS processing"
      },
      "id": "notify-slack",
      "name": "Notify Team (Optional)",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 1,
      "position": [850, 300]
    }
  ],
  "connections": {
    "Otter Webhook": {
      "main": [[{ "node": "Parse Otter Data", "type": "main", "index": 0 }]]
    },
    "Parse Otter Data": {
      "main": [[{ "node": "Save to Workspace", "type": "main", "index": 0 }]]
    },
    "Save to Workspace": {
      "main": [[{ "node": "Notify Team (Optional)", "type": "main", "index": 0 }]]
    }
  },
  "active": false,
  "settings": {},
  "versionId": "1.0.0",
  "tags": [
    { "name": "otter-integration", "id": "1" },
    { "name": "automation", "id": "2" }
  ]
}
```

---

## Setup Steps

### 1. Import to n8n
1. Copy the JSON above
2. Go to your n8n instance: `https://rebelhq.app.n8n.cloud/projects/H4VRaaZhd8VKQANf/workflows`
3. Click "Add Workflow" → "Import from File"
4. Paste JSON
5. Click "Import"

### 2. Configure Storage Credential

**If using Dropbox:**
1. Click "Save to Workspace" node
2. Add credential: "Dropbox API"
3. Authorize your Dropbox account
4. Update folder path to your actual workspace location

**If using Google Drive:**
1. Replace Dropbox node with Google Drive node
2. Add credential: "Google Drive API"
3. Get your folder ID (from Drive URL)
4. Update configuration

**If using local filesystem (advanced):**
1. Use SSH node or Execute Command node
2. Configure path to your workspace folder

### 3. Get Webhook URL
1. Click "Otter Webhook" node
2. Copy the "Production URL"
3. It will look like: `https://rebelhq.app.n8n.cloud/webhook/otter-transcript`

### 4. Configure Otter to Send Webhooks
1. Log into Otter.ai
2. Go to Settings → Integrations
3. Add webhook URL from step 3
4. Select events: "Transcript Created"
5. Save

### 5. Test
1. Record a short test call in Otter
2. Wait for transcript to process
3. Check n8n executions
4. Verify file appears in your workspace folder

### 6. Activate
1. Toggle workflow to "Active"
2. Done!

---

## Alternative: Otter Email → n8n

If Otter doesn't have webhooks, you can:

1. **Configure Otter** to email transcripts
2. **Use n8n Email Trigger** to watch for Otter emails
3. **Extract transcript** from email body
4. **Save to workspace** folder

This is simpler but slightly slower (~1-2 min delay).

---

## Full System (All n8n)

With this, your complete system is:

```
Workflow 1: Otter → Workspace
   ↓
Workspace OS (AI analysis via MCP)
   ↓
Workflow 2: Notion → Airtable
   ↓
Frontend (already working)
```

**Both workflows in n8n = Easy to manage, monitor, debug!**

---

## Questions to Configure This

1. **Where is your workspace folder?**
   - Dropbox folder path?
   - Google Drive folder ID?
   - Local path (if accessible)?

2. **Does Otter support webhooks?**
   - Check: Otter.ai Settings → Integrations
   - If not, we'll use polling (Option 2)

3. **What's your Otter API key?**
   - If using polling, need API access
   - Check: Otter.ai Settings → API

Let me know these and I'll give you the exact workflow configuration!

---

**Advantage of all-n8n:**
- ✅ One platform to manage
- ✅ Visual workflow builder
- ✅ Easy debugging
- ✅ No additional subscriptions
- ✅ You already know n8n!

