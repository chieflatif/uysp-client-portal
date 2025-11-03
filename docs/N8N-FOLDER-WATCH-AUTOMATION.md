# n8n Workflow: Watch Folder for Otter Transcripts

## 🎯 Strategy: Semi-Automated (Pragmatic Approach)

Since Otter.ai has no API, we automate everything AFTER you manually export.

**Your workflow:**
1. Finish call in Otter
2. Click "Export" → Save to Dropbox/Google Drive watched folder (5 seconds)
3. n8n detects new file → Triggers automation
4. Rest is fully automatic

---

## n8n Workflow Configuration

### Option A: Dropbox Watched Folder

```json
{
  "name": "UYSP-Transcript-Processor",
  "nodes": [
    {
      "parameters": {
        "triggerOn": "fileCreated",
        "path": "/Workspace/Otter Exports/",
        "pollTimes": {
          "item": [
            {
              "mode": "everyX",
              "value": 1,
              "unit": "minutes"
            }
          ]
        }
      },
      "id": "dropbox-trigger",
      "name": "Watch Dropbox Folder",
      "type": "n8n-nodes-base.dropboxTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "operation": "download",
        "path": "={{$json.path}}"
      },
      "id": "download-file",
      "name": "Download Transcript",
      "type": "n8n-nodes-base.dropbox",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "functionCode": "// Extract text from file\nconst fileData = $input.item.binary;\nconst filename = $json.name;\n\n// Parse filename for metadata\n// Example: \"Client Call - Acme Corp - 2025-10-23.txt\"\nconst match = filename.match(/(.*?)\\s*-\\s*(\\d{4}-\\d{2}-\\d{2})/);\n\nreturn {\n  json: {\n    filename: filename,\n    title: match ? match[1].trim() : filename.replace('.txt', ''),\n    date: match ? match[2] : new Date().toISOString().split('T')[0],\n    transcript: fileData.data.toString('utf-8'),\n    originalPath: $json.path\n  }\n};"
      },
      "id": "parse-transcript",
      "name": "Parse Transcript",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [650, 300]
    },
    {
      "parameters": {
        "operation": "upload",
        "path": "/Workspace/Client Calls/Transcripts/={{$json.filename}}",
        "binaryData": false,
        "fileContent": "={{$json.transcript}}"
      },
      "id": "save-to-workspace",
      "name": "Save to Workspace Folder",
      "type": "n8n-nodes-base.dropbox",
      "typeVersion": 1,
      "position": [850, 300]
    },
    {
      "parameters": {
        "operation": "delete",
        "path": "={{$node['Watch Dropbox Folder'].json.path}}"
      },
      "id": "cleanup-export",
      "name": "Delete from Exports (Cleanup)",
      "type": "n8n-nodes-base.dropbox",
      "typeVersion": 1,
      "position": [1050, 300]
    },
    {
      "parameters": {
        "channel": "#transcripts",
        "text": "=📝 New transcript processed\\n\\n**File:** {{$json.filename}}\\n**Title:** {{$json.title}}\\n**Date:** {{$json.date}}\\n\\n✅ Ready for Workspace OS analysis"
      },
      "id": "notify-slack",
      "name": "Notify (Optional)",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 1,
      "position": [1250, 300]
    }
  ],
  "connections": {
    "Watch Dropbox Folder": {
      "main": [[{ "node": "Download Transcript", "type": "main", "index": 0 }]]
    },
    "Download Transcript": {
      "main": [[{ "node": "Parse Transcript", "type": "main", "index": 0 }]]
    },
    "Parse Transcript": {
      "main": [[{ "node": "Save to Workspace Folder", "type": "main", "index": 0 }]]
    },
    "Save to Workspace Folder": {
      "main": [[{ "node": "Delete from Exports (Cleanup)", "type": "main", "index": 0 }]]
    },
    "Delete from Exports (Cleanup)": {
      "main": [[{ "node": "Notify (Optional)", "type": "main", "index": 0 }]]
    }
  },
  "active": false
}
```

---

### Option B: Google Drive Watched Folder

```json
{
  "name": "UYSP-Transcript-Processor-GDrive",
  "nodes": [
    {
      "parameters": {
        "resource": "file",
        "event": "fileCreated",
        "folderId": "YOUR_FOLDER_ID",
        "pollTimes": {
          "item": [
            {
              "mode": "everyX",
              "value": 1,
              "unit": "minutes"
            }
          ]
        }
      },
      "id": "gdrive-trigger",
      "name": "Watch Google Drive Folder",
      "type": "n8n-nodes-base.googleDriveTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "operation": "download",
        "fileId": "={{$json.id}}"
      },
      "id": "download-file",
      "name": "Download Transcript",
      "type": "n8n-nodes-base.googleDrive",
      "typeVersion": 1,
      "position": [450, 300]
    },
    // ... rest same as Dropbox version
  ]
}
```

---

## Setup Instructions

### Step 1: Create Export Folder
**In Dropbox:**
1. Create folder: `/Workspace/Otter Exports/`
2. This is where you'll save Otter exports

**In Google Drive:**
1. Create folder: "Otter Exports"
2. Copy the folder ID from URL: `https://drive.google.com/drive/folders/[FOLDER_ID]`

### Step 2: Import Workflow to n8n
1. Copy JSON above
2. Go to n8n: `https://rebelhq.app.n8n.cloud/projects/H4VRaaZhd8VKQANf/workflows`
3. Import workflow
4. Add credentials (Dropbox or Google Drive)

### Step 3: Configure Paths
- Update folder paths to match your structure
- Set polling interval (default: 1 minute)

### Step 4: Test
1. Export a test transcript from Otter
2. Save to `/Workspace/Otter Exports/`
3. Wait 1 minute
4. Check n8n executions
5. Verify file moved to `/Workspace/Client Calls/Transcripts/`

### Step 5: Activate
- Toggle workflow to "Active"
- Done!

---

## Your New Workflow

```
1. Finish call in Otter
2. Click Export → Save to "Otter Exports" folder (5 seconds)
3. ✨ n8n detects file (within 1 minute)
4. ✨ n8n moves to workspace folder
5. ✨ Workspace OS picks up → analyzes → Notion
6. ✨ n8n syncs Notion → Airtable
7. ✨ Dashboard updates
```

**Your manual work:** 5 seconds to click Export + Save  
**Everything else:** Automatic

---

## Naming Convention (for Best Results)

When exporting from Otter, name files consistently:

**Format:** `[Client Name] - [Date].txt`

**Examples:**
- `Acme Corp - 2025-10-23.txt`
- `Client Call - Davidson - 2025-10-23.txt`
- `UYSP Team Sync - 2025-10-23.txt`

The n8n workflow will parse this to extract metadata automatically.

---

## Why This Approach Works

✅ **Reliable** - No API dependencies  
✅ **Compliant** - Uses Otter's official export feature  
✅ **Simple** - One extra click, rest is auto  
✅ **Flexible** - Works with any file source  
✅ **Scalable** - Can handle multiple calls per day  

**The "perfect" is the enemy of the "good"** - This gets you 95% automated with zero risk.

---

## Future: Migrate to Rev.ai or AssemblyAI

When ready to go 100% automated:
1. Sign up for Rev.ai ($0.02/min) or AssemblyAI ($0.015/min)
2. Replace Otter workflow with direct API call
3. No manual export needed
4. Same n8n workflow processes the rest

**Migration is simple** - just swap the first node!

