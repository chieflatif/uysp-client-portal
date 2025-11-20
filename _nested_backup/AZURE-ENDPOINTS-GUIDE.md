# Azure AI Foundry Endpoints - WTF is Going On? 🤯

## The Confusion Explained

Azure AI Foundry gives you **multiple endpoints** for the **same models** with the **same API key**. Here's why:

### 3 Types of Endpoints You'll See:

1. **AI Services Endpoint** (Main one)
   ```
   https://<your-resource>.cognitiveservices.azure.com
   ```
   - This is your "main" Azure AI Services endpoint
   - Shows up in "Keys and Endpoint" section
   - **Usually NOT what you need for GPT models**

2. **OpenAI-Style Endpoint** (What you actually need)
   ```
   https://<your-resource>.openai.azure.com
   ```
   - OpenAI-compatible API endpoint
   - **This is what works for GPT models**
   - Path format: `/openai/deployments/{deployment-name}/chat/completions`

3. **AI Foundry Project Endpoint** (New unified endpoint)
   ```
   https://<project-name>.services.ai.azure.com
   ```
   - New unified endpoint for all AI Foundry projects
   - Example: `https://cursor-agent.services.ai.azure.com`
   - **This is probably what you have**

---

## Key Concepts

### Deployment Names ≠ Model Names

**CRITICAL:** Azure uses **deployment names**, not model names!

```
❌ WRONG: model = "gpt-4o"
✅ RIGHT: model = "my-gpt4o-deployment"
```

When you create a model in Azure AI Foundry:
1. You pick a **model** (e.g., `gpt-4o`)
2. You give it a **deployment name** (e.g., `production-chat-model`)
3. You use the **deployment name** in your API calls

**Example:**
- You deployed `gpt-4o` with deployment name `gpt-4.1-mini`
- Your code calls: `deployments/gpt-4.1-mini/chat/completions`
- Azure runs: The actual `gpt-4o` model

---

## What the Test Script Does

The script I just created will:

1. ✅ **Test your current endpoint** (from .env)
2. ✅ **Try to list all deployments** (shows what models you actually have)
3. ✅ **Test common deployment names** (in case listing doesn't work)
4. ✅ **Tell you exactly which config works**
5. ✅ **Show response times** (so you can pick the fastest)

---

## How to Use It

### Step 1: Make sure .env has your API key
```bash
AZURE_OPENAI_KEY=your-key-here
```

### Step 2: (Optional) Add your endpoint
```bash
AZURE_OPENAI_ENDPOINT=https://cursor-agent.services.ai.azure.com
```

### Step 3: Run the script
```bash
cd uysp-client-portal
node test-azure-endpoints.js
```

### Step 4: Wait for results
The script will:
- Test each endpoint
- Try to discover deployments
- Test common model names
- Show you what works

---

## What You'll See

### If it finds deployments:
```
========================================
Attempting to list deployments at: https://cursor-agent.services.ai.azure.com
========================================
✅ Found 3 deployments:

  1. Deployment Name: "gpt-4o-production"
     Model: gpt-4o
     Status: succeeded
     Created: 11/1/2025, 2:30:00 PM

  2. Deployment Name: "gpt-35-turbo-test"
     Model: gpt-35-turbo
     Status: succeeded
     Created: 10/15/2025, 9:15:00 AM
```

### If a test succeeds:
```
================================================================================
Testing: https://cursor-agent.services.ai.azure.com
Model: gpt-4o-production
API Version: 2024-08-01-preview
================================================================================
Response: 200 OK (2341ms)
✅ SUCCESS!
Response: "Hello!"
Model: gpt-4o-2024-08-06
Usage: {"prompt_tokens":15,"completion_tokens":2,"total_tokens":17}
```

### If a test fails:
```
Response: 404 Not Found (123ms)
❌ FAILED: 404
Error Code: DeploymentNotFound
Error Message: The API deployment for this resource does not exist.
💡 Hint: Model deployment "gpt-4.1-mini" doesn't exist at this endpoint
```

---

## Final Output

At the end, you'll get:

```
========================================
🏆 RECOMMENDED CONFIGURATION (fastest response)
========================================

Update your code with these values:

const AZURE_OPENAI_ENDPOINT = 'https://cursor-agent.services.ai.azure.com';
const PRIMARY_MODEL = 'gpt-4o-production';
const API_VERSION = '2024-08-01-preview';

.env file:
AZURE_OPENAI_ENDPOINT=https://cursor-agent.services.ai.azure.com
AZURE_OPENAI_KEY=sk-proj-...

📝 Other working models (for fallback):
   2. gpt-35-turbo-test (3421ms)
   3. o1-mini-preview (5234ms)
```

---

## Common Issues & Fixes

### Issue: "404 - DeploymentNotFound"
**Cause:** The deployment name doesn't exist
**Fix:**
1. Go to https://ai.azure.com
2. Click your project
3. Go to "Deployments"
4. Copy the **exact** deployment name (case-sensitive!)

### Issue: "401 - Unauthorized"
**Cause:** API key is wrong or expired
**Fix:**
1. Go to https://ai.azure.com
2. Click your project → Settings → Keys and Endpoints
3. Copy a fresh API key

### Issue: "429 - Too Many Requests"
**Cause:** Hit rate limit or quota
**Fix:**
1. Wait a few minutes
2. Check quota in Azure portal
3. Upgrade to paid tier if on free tier

### Issue: All tests fail with timeout
**Cause:** Wrong endpoint or network issue
**Fix:**
1. Verify endpoint URL in Azure AI Foundry
2. Check firewall/VPN settings
3. Try a different endpoint type

---

## Quick Reference: Where to Find Your Info

### Azure AI Foundry Dashboard
https://ai.azure.com

**Your Endpoint:**
1. Open your project
2. Settings → "Keys and Endpoints"
3. Look for "Target URI" or "Endpoint"

**Your Deployments:**
1. Open your project
2. Deployments (left sidebar)
3. See list of deployment names

**Your API Key:**
1. Open your project
2. Settings → "Keys and Endpoints"
3. Copy "Key 1" or "Key 2"

---

## TL;DR - Just Run This:

```bash
cd uysp-client-portal
node test-azure-endpoints.js
```

It will tell you EXACTLY what to use. Copy-paste the recommended config and you're done.
