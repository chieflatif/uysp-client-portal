# Final Transcript Automation Setup

## Complete End-to-End Solution

**Cost:** $6-9/month (down from $32-34/month)  
**Savings:** $300+/year

---

## The Two-Path System

### **Path 1: YOUR Google Meet Meetings** (meetings you host)
- Google Meet auto-records → Google Drive
- Google Drive syncs to local folder
- Workspace OS picks up transcript
- **Cost: $0**

### **Path 2: OTHER People's Meetings** (you're invited)
- Recall.ai Chrome extension → One-click record
- Recall.ai webhook → n8n → Dropbox
- Dropbox syncs to local folder  
- Workspace OS picks up transcript
- **Cost: ~$6-9/month**

---

## PART 1: Google Meet Auto-Recording Setup

### Step 1: Enable Auto-Recording (Admin Console)

1. **Go to:** https://admin.google.com
2. **Sign in** with your Google Workspace admin account
3. **Navigate:** Apps → Google Workspace → Google Meet
4. **Click:** Settings (or Settings for Meet)
5. **Find:** "Recording" section
6. **Enable:** "Let people record their meetings"
7. **Set default:** Check "Turn on recording by default" (optional but recommended)
8. **Click:** Save

### Step 2: Set Recording Preferences (Your Personal Account)

1. **Go to:** https://meet.google.com/settings
2. **Sign in** with your account (latifhorst@rebelhq.ai or similar)
3. **Find:** Recording settings
4. **Enable:** "Automatically record meetings I create"
5. **Save**

### Step 3: Identify Where Google Meet Saves Recordings

**When you record a Google Meet:**
- Recordings save to: `Google Drive → My Drive → Meet Recordings/`
- **Or custom folder if you set one**

**To verify:**
1. Record a test Google Meet (1 minute)
2. Go to: https://drive.google.com
3. Search for: "Meet Recordings" or check "Recent"
4. **Note the exact folder path**

### Step 4: Sync Google Drive Folder to Local Machine

**You have two options:**

#### Option A: Google Drive Desktop (If it works)
1. **Open Google Drive Desktop** app
2. **Click:** Settings → Preferences → My Drive
3. **Find:** The "Meet Recordings" folder
4. **Ensure it's set to sync** (checked)
5. **It will sync to:** `~/Google Drive/My Drive/Meet Recordings/`

#### Option B: Create a Symlink to Workspace Folder

Since Workspace OS watches: `/Users/latifhorst/cursor projects/WorkspaceOS-1/assets/transcripts/raw/`

**Run this command:**
```bash
ln -s ~/Google\ Drive/My\ Drive/Meet\ Recordings/ "/Users/latifhorst/cursor projects/WorkspaceOS-1/assets/transcripts/raw/google-meet"
```

This creates a link so Workspace OS can see Google Meet recordings.

**OR if Google Drive is unreliable:**

Skip this entirely and only use Path 2 (Recall.ai) for ALL meetings. Your choice.

---

## PART 2: Recall.ai Chrome Extension Setup

### Step 1: Install Chrome Extension

1. **Go to:** https://chromewebstore.google.com/
2. **Search for:** "Recall.ai"
3. **Click:** "Add to Chrome"
4. **Click:** "Add Extension"
5. **Pin the extension** (click puzzle icon → pin Recall.ai)

### Step 2: Configure Extension

1. **Click the Recall.ai extension icon** (top right of Chrome)
2. **Sign in** with your Recall.ai account
3. **Enter API key:** `6db84e8ce832506dbef532c81e85bd1fe290ce17`
4. **Set region:** us-west-2
5. **Enable:** Auto-join meetings (toggle ON)
6. **Save settings**

### Step 3: Set Bot Name

1. In extension settings, find **"Bot Name"**
2. **Enter:** `RebelHQ Admin Assassin`
3. **Save**

---

## PART 3: Dropbox Integration (Already Done)

### What's Already Configured:

✅ **n8n workflow:** UYSP-Recall-AI-Transcript-Auto-Save (ID: 7oFBkyMgaUWCBNEd)  
✅ **Webhook:** https://rebelhq.app.n8n.cloud/webhook/recall-webhook  
✅ **Dropbox credentials:** Connected and working  
✅ **Dropbox save path:** `/Apps/RebelHQ/`  
✅ **Webhook events:** `transcript.done` only

### Dropbox Sync to Local Folder

**Your Dropbox saves to:** `~/Dropbox/Apps/RebelHQ/`  
**Workspace OS watches:** `/Users/latifhorst/cursor projects/WorkspaceOS-1/assets/transcripts/raw/`

**Create symlink:**
```bash
ln -s ~/Dropbox/Apps/RebelHQ/ "/Users/latifhorst/cursor projects/WorkspaceOS-1/assets/transcripts/raw/recall-ai"
```

This makes Recall.ai transcripts visible to Workspace OS.

---

## How It Works in Practice

### Scenario 1: You Host a Google Meet

1. **You:** Start Google Meet
2. **Google:** Auto-records + transcribes
3. **Google Drive:** Saves transcript
4. **Google Drive Desktop:** Syncs to `~/Google Drive/My Drive/Meet Recordings/`
5. **Workspace OS:** Picks up from symlink at `/assets/transcripts/raw/google-meet/`
6. **Done:** Summary → Notion → Airtable → Dashboard

**Your actions: 0**

---

### Scenario 2: You Join Someone Else's Meeting (Google Meet, Zoom, Teams, etc.)

1. **You:** Join meeting in Chrome
2. **Recall.ai extension:** Detects meeting
3. **You:** Click extension icon → Click "Record"
4. **Recall.ai bot:** Joins as "RebelHQ Admin Assassin"
5. **Meeting ends**
6. **Recall.ai:** Processes transcript (5-10 min)
7. **Recall.ai webhook → n8n**
8. **n8n:** Saves to Dropbox `/Apps/RebelHQ/`
9. **Dropbox Desktop:** Syncs to `~/Dropbox/Apps/RebelHQ/`
10. **Workspace OS:** Picks up from symlink at `/assets/transcripts/raw/recall-ai/`
11. **Done:** Summary → Notion → Airtable → Dashboard

**Your actions: 1 click (when joining meeting)**

---

## Testing

### Test Path 1 (Google Meet Native):

1. Start a Google Meet: https://meet.google.com/new
2. Click "Record" during the meeting
3. Talk for 1 minute
4. Stop recording
5. End meeting
6. Wait 5 minutes
7. Check: `~/Google Drive/My Drive/Meet Recordings/`
8. Check symlink works: `ls -lah "/Users/latifhorst/cursor projects/WorkspaceOS-1/assets/transcripts/raw/google-meet/"`

### Test Path 2 (Recall.ai Extension):

1. Start a Google Meet: https://meet.google.com/new
2. Click Recall.ai extension → Click "Record"
3. Admit bot when it joins
4. Talk for 1 minute
5. End meeting
6. Wait 5-10 minutes
7. Check: `~/Dropbox/Apps/RebelHQ/`
8. Check symlink works: `ls -lah "/Users/latifhorst/cursor projects/WorkspaceOS-1/assets/transcripts/raw/recall-ai/"`

---

## Folder Structure

```
/Users/latifhorst/cursor projects/WorkspaceOS-1/assets/transcripts/raw/
├── google-meet/     → Symlink to ~/Google Drive/My Drive/Meet Recordings/
└── recall-ai/       → Symlink to ~/Dropbox/Apps/RebelHQ/
```

Workspace OS watches the `raw/` folder and picks up transcripts from both sources.

---

## What to Cancel

Once both paths are working:

### Cancel Zoom Pro
1. https://zoom.us/account/billing
2. Cancel subscription
3. **Save: $15-17/month**

### Cancel Otter.ai Pro
1. https://otter.ai/account
2. Cancel subscription
3. **Save: $17/month**

**Total savings: $32-34/month = $384-408/year**

---

## Troubleshooting

### Google Meet recordings not appearing:
- Check Google Drive for "Meet Recordings" folder
- Verify Google Drive Desktop is syncing
- Check symlink exists and points to right folder

### Recall.ai transcripts not appearing in Dropbox:
- Check n8n executions for errors
- Verify Dropbox credentials are valid
- Check Dropbox Desktop is running and syncing

### Workspace OS not picking up transcripts:
- Verify symlinks are created correctly
- Check folder permissions
- Check Workspace OS is watching the right folder

---

## Support Files

- **Recall.ai API key:** Saved in `docs/RECALL-AI-CREDENTIALS.md`
- **Dropbox credentials:** Configured in n8n
- **n8n workflow ID:** 7oFBkyMgaUWCBNEd

---

## Next Steps

1. ☐ Install Recall.ai Chrome extension
2. ☐ Configure extension with API key
3. ☐ Enable Google Meet auto-recording
4. ☐ Create symlinks for both paths
5. ☐ Test both paths
6. ☐ Cancel Zoom Pro
7. ☐ Cancel Otter.ai Pro
8. ☐ Save $300+/year

**Start with the Chrome extension - that's the quickest win.**

