# Google Meet + Recall.ai Setup Guide

## Overview
You're switching from Zoom + Otter.ai to Google Meet + Recall.ai to save $300+/year and get better automation.

**Cost Savings:**
- Old: Zoom Pro ($15-17/mo) + Otter.ai Pro ($17/mo) = **$32-34/month**
- New: Google Meet (FREE) + Recall.ai ($6-9/mo) = **$6-9/month**
- **Annual savings: $276-336**

---

## What You Already Have

✅ **Google Workspace Business Standard or higher** - Includes:
- Google Meet with recording
- Automatic transcription
- 150 participant limit
- 24-hour call limit
- Cloud storage for recordings

✅ **n8n Workflow** - Already configured:
- Workflow ID: `7oFBkyMgaUWCBNEd` (UYSP-Recall-AI-Transcript-Auto-Save)
- Status: **ACTIVE**
- Webhook URL: `https://rebelhq.app.n8n.cloud/webhook/recall-webhook`

---

## Step 1: Sign Up for Recall.ai (5 minutes)

1. Go to: https://www.recall.ai
2. Click "Get Started" or "Sign Up"
3. Create account with your email
4. Choose plan: **"Developer"** (pay-as-you-go)
   - First 5 hours: FREE
   - After: $0.15/hour
   - No monthly minimum
5. Go to **Dashboard → Settings → API Keys**
6. Click **"+ Generate Key"**
7. Name it: `UYSP n8n Integration`
8. **Copy the API key** and save it securely

---

## Step 2: Configure Recall.ai Webhook (3 minutes)

1. In Recall.ai dashboard, go to **Settings → Webhooks**
2. Click **"Add Webhook"**
3. **Webhook URL:** `https://rebelhq.app.n8n.cloud/webhook/recall-webhook`
4. **Events to subscribe to:**
   - `recording.completed`
   - `transcript.ready`
5. Click **Save**

---

## Step 3: Test the Setup (5 minutes)

### Test with Google Meet:

1. **Start a Google Meet call** (you can do this solo)
2. **In Recall.ai dashboard:** Click "Record Meeting"
3. **Enter the Google Meet link**
4. Recall.ai bot will join the meeting
5. **End the meeting** after 1-2 minutes
6. **Check your workspace folder:**
   - Path: `/Users/latifhorst/cursor projects/WorkspaceOS-1/assets/transcripts/raw/`
   - You should see a new transcript file

### Verify n8n execution:

1. Go to n8n: https://rebelhq.app.n8n.cloud
2. Click **"Executions"** (left sidebar)
3. Look for **"UYSP-Recall-AI-Transcript-Auto-Save"**
4. Should show **"Success"**

---

## How It Works

```
Google Meet Call
    ↓
Recall.ai bot joins → Records + Transcribes
    ↓
Recall.ai webhook → n8n
    ↓
n8n saves transcript → /WorkspaceOS-1/assets/transcripts/raw/
    ↓
Workspace OS picks up file → Analyzes → Creates summary
    ↓
Workspace OS → Notion (via MCP)
    ↓
Notion webhook → n8n → Airtable
    ↓
Frontend syncs with Airtable
```

---

## Recall.ai Works With:

✅ **Google Meet** (your primary platform)
✅ Microsoft Teams
✅ Zoom (if you ever need it)
✅ Webex
✅ GoToMeeting
✅ Any other video platform

**No per-platform setup needed** - Recall.ai handles them all the same way.

---

## Cancel Your Old Subscriptions

### Cancel Zoom Pro:

1. Go to: https://zoom.us/account/billing
2. Click **"Plans and Billing"**
3. Find **"Pro"** plan
4. Click **"Cancel Subscription"**
5. Confirm cancellation
6. **Savings: $15-17/month**

### Cancel Otter.ai Pro:

1. Go to: https://otter.ai/account
2. Click **"Subscription"**
3. Click **"Cancel Subscription"**
4. Confirm cancellation
5. **Savings: $17/month**

**Total monthly savings: $32-34**

---

## Troubleshooting

### Transcript not saving to workspace folder:

1. Check n8n execution logs for errors
2. Verify webhook URL is correct in Recall.ai
3. Make sure n8n workflow is **ACTIVE**

### Recall.ai bot not joining meeting:

1. Make sure you pasted the correct meeting link
2. Wait 10-15 seconds for bot to join
3. Check Recall.ai dashboard for bot status

### Google Meet recording not working:

1. Verify you're on Google Workspace Business Standard or higher
2. Check admin hasn't disabled recording for your account
3. Make sure you're the meeting host (only hosts can record)

---

## Support

- **Recall.ai docs:** https://docs.recall.ai
- **Google Meet help:** https://support.google.com/meet
- **n8n workflow ID:** `7oFBkyMgaUWCBNEd`

---

## Next Steps

1. ✅ Sign up for Recall.ai
2. ✅ Configure webhook
3. ✅ Test with Google Meet
4. ✅ Cancel Zoom Pro
5. ✅ Cancel Otter.ai Pro
6. 🎉 Save $300+/year

**You're all set!**

