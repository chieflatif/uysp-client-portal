# Implementation Walkthrough - Zoom + Recall.ai Setup

## ⏱️ **Total Time: 35 minutes**

- Part 1 (Zoom): 20 minutes
- Part 2 (Recall.ai): 15 minutes

---

## 🎯 **PART 1: ZOOM SETUP (20 minutes)**

### **⏰ Step 1: Enable Zoom Cloud Recording + Transcription (5 min)**

1. **Go to:** https://zoom.us/profile/setting
   - OR: Sign in to Zoom → Click your profile picture → Settings

2. **Find the "Recording" tab** (left sidebar)

3. **Enable these settings:**
   - Look for "Cloud Recording"
     - [ ] Check the box
     - ✅ Should now be ON (blue toggle)
   
   - Look for "Advanced cloud recording settings"
     - [ ] Click to expand
     - [ ] Find "Create audio transcript"
     - [ ] Check the box
     - [ ] Click "Save"

4. **Verify:** You should see:
   - ✅ Cloud Recording: ON
   - ✅ Audio transcript: ON
   - ✅ Save chat text from the meeting: ON (optional but good)

✅ **Checkpoint 1: Zoom recording + transcription enabled**

---

### **⏰ Step 2: Create Zoom OAuth App (8 min)**

1. **Go to:** https://marketplace.zoom.us/
   - Click the user icon (top right)
   - Click "Develop"

2. **Click "Build App"**

3. **Choose App Type:**
   - Select "Server-to-Server OAuth"
   - Click "Create"

4. **Fill out the form:**
   - App Name: `UYSP n8n Integration`
   - Company Name: `UYSP` (or your name)
   - Developer Contact Email: (your email)
   - Check: "I will be running this app in production"
   - Click "Create"

5. **You'll be on the "App Credentials" page**
   - **COPY and SAVE these 3 values somewhere (notepad/password manager):**
     ```
     Account ID: ___________________
     Client ID: ____________________
     Client Secret: _________________
     ```
   - ⚠️ **IMPORTANT:** You can only see Client Secret ONCE! Copy it now!

6. **Add Scopes (on same page):**
   - Scroll down to "Scopes"
   - Click "+ Add Scopes"
   - Search for and add:
     - `meeting:read:admin`
     - `recording:read:admin`
     - `recording:write:admin`
   - Click "Save"

7. **Activate the App:**
   - Look for "Activate" button
   - Click to activate

✅ **Checkpoint 2: Zoom OAuth app created + credentials saved**

---

### **⏰ Step 3: Add Zoom Credentials to n8n (4 min)**

1. **Open n8n:**
   - Go to: https://rebelhq.app.n8n.cloud/projects/H4VRaaZhd8VKQANf/workflows

2. **Click "Credentials" (top right or left sidebar)**

3. **Click "+ Create New"**

4. **Search for: "Zoom"**
   - Click "Zoom OAuth2 API"

5. **Configuration:**
   - Name: `UYSP Zoom Pro`
   - Authentication: Choose "Server-to-Server OAuth"
   - Paste your 3 values:
     - Account ID
     - Client ID
     - Client Secret
   - Click "Save"

✅ **Checkpoint 3: Zoom credentials added to n8n**

---

## 🎯 **PART 2: RECALL.AI SETUP (15 minutes)**

### **Use ONLY for non-Zoom meetings (Google Meet, Teams, etc.)**

### **⏰ Step 1: Sign Up for Recall.ai (3 min)**

1. **Go to:** https://www.recall.ai

2. **Click "Get Started" or "Sign Up"**

3. **Create account:**
   - Email: (your email)
   - Password: (strong password)
   - Company: (optional)

4. **Choose plan:** "Developer" (pay-as-you-go)
   - First 5 hours FREE
   - Then $0.15/hour for transcription
   - No monthly minimum

5. **After signup, go to Dashboard → Settings → API Keys**

6. **Create new API key:**
   - Click "+ Generate Key"
   - Name: `UYSP n8n`
   - Copy the key somewhere safe

✅ **Checkpoint 1: Recall.ai account created + API key saved**

---

## 🎉 **YOU'RE DONE! Complete Automation Set Up**

Your workflows are now configured. Follow the detailed setup in the docs!
