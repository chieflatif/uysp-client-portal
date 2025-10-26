# 🎯 Step-by-Step Implementation: Zoom + Recall.ai

## ⏱️ **Total Time: 35 minutes**

---

## **PART 1: ZOOM SETUP (20 minutes)**

### **STEP 1: Enable Zoom Cloud Recording (5 min)**

1. Go to: https://zoom.us/profile/setting
2. Click "Recording" tab (left sidebar)
3. Find "Cloud Recording" → Check the box ✅
4. Click "Advanced cloud recording settings"
5. Find "Create audio transcript" → Check the box ✅
6. Click "Save"

**What you should see:**
- Cloud Recording: ON (blue)
- Audio transcript: ON (blue)

---

### **STEP 2: Create Zoom OAuth App (8 min)**

1. Go to: https://marketplace.zoom.us/
2. Click user icon → "Develop"
3. Click "Build App"
4. Select "Server-to-Server OAuth" → Click "Create"
5. Fill form:
   - App Name: `UYSP n8n Integration`
   - Company: `UYSP`
   - Email: Your email
6. Click "Create"

**IMPORTANT: Save these 3 values NOW:**
```
Account ID: _____________________
Client ID: ______________________
Client Secret: __________________
```

Continue on same page:
7. Scroll to "Scopes"
8. Click "+ Add Scopes"
9. Add these 3:
   - `meeting:read:admin`
   - `recording:read:admin`
   - `recording:write:admin`
10. Click "Save"
11. Find "Activate" button → Click

✅ **Checkpoint: Zoom app created and activated**

---

### **STEP 3: Add Zoom to n8n (4 min)**

1. Go to: https://rebelhq.app.n8n.cloud/projects/H4VRaaZhd8VKQANf/workflows
2. Click "Credentials" (top right)
3. Click "+ Create New"
4. Search "Zoom" → Click "Zoom OAuth2 API"
5. Fill in:
   - Name: `UYSP Zoom Pro`
   - Authentication: "Server-to-Server OAuth"
   - Account ID: (paste)
   - Client ID: (paste)
   - Client Secret: (paste)
6. Click "Save"

✅ **Checkpoint: Zoom added to n8n**

---

### **STEP 4: Import Zoom Workflow (3 min)**

1. In n8n, go to "Workflows"
2. Click "+ Add Workflow"
3. Choose "Import from File"
4. Import the Zoom workflow from: `/docs/HYBRID-ZOOM-RECALL-SOLUTION.md`
   - (Section: "Workflow 1: Zoom Meetings")
5. Click "Activate" toggle (top right)

✅ **Checkpoint: Zoom workflow active**

---

## **PART 2: RECALL.AI SETUP (15 minutes)**

### **STEP 1: Sign Up Recall.ai (3 min)**

1. Go to: https://www.recall.ai
2. Click "Get Started"
3. Create account:
   - Email: (your email)
   - Password: (strong password)
4. Select plan: "Developer" (pay-as-you-go)
5. Go to: Dashboard → Settings → API Keys
6. Click "+ Generate Key"
7. Name: `UYSP n8n`
8. **Copy the key**

✅ **Checkpoint: Recall.ai account + API key**

---

### **STEP 2: Import Recall Workflow (4 min)**

1. In n8n, go to "Workflows"
2. Click "+ Add Workflow"
3. Choose "Import from File"
4. Import Recall workflow from: `/docs/HYBRID-ZOOM-RECALL-SOLUTION.md`
   - (Section: "Workflow 2: Non-Zoom Meetings")
5. Add your Dropbox credential when prompted
6. Click "Activate" toggle

✅ **Checkpoint: Recall workflow active**

---

### **STEP 3: Setup Recall Webhook (5 min)**

1. In your Recall workflow, click "Recall.ai Webhook" node
2. Find and copy the "Production URL"
3. Go to: Recall.ai Dashboard → Settings → Webhooks
4. Click "Add Webhook"
5. Paste the URL
6. Select events:
   - ✅ `bot.status_change`
   - ✅ `transcript.ready`
7. Click "Save"

✅ **Checkpoint: Webhook configured**

---

### **STEP 4: Test (3 min)**

**For Zoom:**
1. Schedule a Zoom meeting
2. It will auto-record + auto-transcribe
3. Check workspace folder for transcript file

**For Google Meet:**
1. Create a Google Meet
2. Go to Recall.ai Dashboard
3. Click "Send Bot to Meeting"
4. Paste the Meet URL
5. Click "Send Bot"
6. Have a 2-minute conversation
7. End meeting
8. Wait 5 min for processing
9. Check workspace folder

✅ **Checkpoint: Both workflows working!**

---

## 🎉 **COMPLETE! You're Fully Automated**

**Zoom Calls:**
- Auto-records ✅
- Auto-transcribes ✅
- Auto-saves to workspace ✅
- Cost: $0

**Google Meet/Teams:**
- Send bot (1 click) ✅
- Auto-records ✅
- Auto-transcribes ✅
- Auto-saves to workspace ✅
- Cost: $0.15/hour (~$0.13 per 50-min call)

**Both trigger:**
- Workspace OS analysis → Notion ✅
- Notion → Airtable (n8n) ✅
- Dashboard updates ✅

---

## 📊 **Monthly Cost**

- Otter.ai (old): $16.99/month
- New hybrid: ~$0.63/month
- **Savings: $16.36/month = $196/year** 🎉

---

## 💡 **Next Times**

**Zoom meeting:**
1. Schedule call
2. Done! (auto-handled)

**Google Meet/Teams:**
1. Get URL
2. Recall.ai Dashboard → "Send Bot"
3. Paste URL
4. Done!

---

**You're now 100% automated!** 🚀
