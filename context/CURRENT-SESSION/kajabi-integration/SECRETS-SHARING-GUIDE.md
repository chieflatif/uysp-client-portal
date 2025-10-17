# Secrets & Credentials - Complete Guide for Cursor Projects
**Created**: October 17, 2025  
**Purpose**: How to safely handle API keys, tokens, and sensitive data in Cursor

---

## 🔐 THE PROBLEM

When working with AI assistants in Cursor, you need to:
1. Share secrets so I (Claude) can help with documentation and code
2. Share secrets so Gabriel can test APIs
3. Keep secrets OUT of git
4. Keep secrets secure from accidental exposure

**This guide solves all of these challenges.**

---

## ✅ RECOMMENDED APPROACH (3-Layer Security)

### Layer 1: .env File (Local Development)
**For**: Quick access by Claude and local testing

### Layer 2: credentials/ Folder (Team Sharing)
**For**: Secure documentation and sharing with Gabriel

### Layer 3: n8n Cloud Credentials UI (Production)
**For**: Actual production use (never in files)

---

## 📋 STEP-BY-STEP SETUP

### Step 1: Create Your .env File (5 minutes)

```bash
# In project root, copy the template:
cp environment.template .env

# Edit .env and fill in real values:
# Use any text editor - I can read it to help you!
```

**What to put in .env:**
```bash
KAJABI_API_KEY=your_actual_api_key_here
KAJABI_SITE_ID=your_actual_site_id_here
KAJABI_TEST_CONTACT_ID=cont_123abc456
```

**Important**:
- ✅ `.env` is already in `.gitignore` (I checked!)
- ✅ I (Claude) can read `.env` to help you
- ✅ Won't be committed to git automatically
- ⚠️ You still need to share values with Gabriel separately

---

### Step 2: Create Credentials File for Team (10 minutes)

```bash
# Create credentials directory (ignored by git):
mkdir -p credentials

# Copy template:
cp credentials.template credentials/kajabi-credentials.md

# Edit with real values:
# Use any text editor
```

**What to put in credentials/kajabi-credentials.md:**
- All API keys and secrets
- Test account information
- Instructions for Gabriel
- Security reminders

**Important**:
- ✅ `credentials/` folder is in `.gitignore`
- ✅ I can read it to help with documentation
- ✅ Contains instructions for Gabriel
- ⚠️ Share this file with Gabriel via secure method (see below)

---

### Step 3: Share with Gabriel Securely

**BEST METHOD: 1Password or LastPass**
```
1. Save credentials/kajabi-credentials.md to password manager
2. Create shared vault
3. Invite Gabriel
4. He copies values into n8n manually
```

**ACCEPTABLE: Encrypted Slack DM**
```
1. Copy contents of credentials/kajabi-credentials.md
2. Send via Slack DM to Gabriel (not channel!)
3. Ask him to delete after saving
4. Delete your message after confirmed
```

**NOT RECOMMENDED: Email**
```
- Only if encrypted (ProtonMail, etc.)
- Never use regular Gmail/Outlook
```

---

## 🤖 HOW I (CLAUDE) ACCESS SECRETS

### What I Can Do:
✅ **Read `.env` file** - I can see values and use them in examples  
✅ **Read `credentials/` folder** - I can reference for documentation  
✅ **Help you test API calls** - I can write curl commands with real keys  
✅ **Generate code with secrets** - Using environment variables

### What I Cannot Do:
❌ **Write to `.env`** - It's blocked for safety  
❌ **Commit secrets to git** - I follow .gitignore  
❌ **Share secrets outside our conversation** - Privacy guaranteed  
❌ **Access n8n credentials** - That's in n8n's secure vault

---

## 📝 EXAMPLE: HOW TO SHARE KAJABI CREDENTIALS

### For You (Latif):

**1. Create .env file:**
```bash
# In project root
cp environment.template .env
nano .env  # or use VS Code
```

Fill in:
```bash
KAJABI_API_KEY=kaj_live_abc123def456ghi789
KAJABI_SITE_ID=site_xyz789
KAJABI_TEST_CONTACT_ID=cont_test123
```

**2. Tell me to read it:**
```
"Claude, please read the .env file and help me test the Kajabi API"
```

I'll respond:
```
✅ I can see your credentials. Your API key starts with kaj_live_abc...
   Let me help you test the API connection.
```

**3. Share with Gabriel:**
```bash
# Create filled credentials file:
mkdir -p credentials
cp credentials.template credentials/kajabi-credentials.md
nano credentials/kajabi-credentials.md  # Fill in real values

# Then share via 1Password or Slack DM
```

---

### For Gabriel:

**When Latif shares credentials with you:**

**Step 1: Save Securely**
- Copy to your password manager
- Or save locally in your own `.env` file
- Delete the Slack message after saving

**Step 2: Use in n8n**
```
1. n8n Cloud → Credentials → Add Credential
2. Type: HTTP Header Auth
3. Name: "Kajabi API"
4. Header Name: Authorization
5. Header Value: Bearer [PASTE_API_KEY]
6. Save
```

**Step 3: Test Authentication**
```bash
curl -X GET "https://api.kajabi.com/v1/site" \
  -H "Authorization: Bearer [YOUR_API_KEY]" \
  -H "Accept: application/json"
```

**Step 4: Use in API Investigation**
- Follow `KAJABI-API-INVESTIGATION-GUIDE.md`
- API key is now in n8n credential - reference by name
- Never hardcode in workflow nodes

---

## 🔍 HOW TO KNOW IF SECRETS ARE SAFE

### Quick Safety Checklist:

✅ **Check .gitignore includes:**
```bash
.env
.env.*
credentials/
*.key
api-keys.json
```

✅ **Verify before committing:**
```bash
git status
# Should NOT show .env or credentials/ folder
```

✅ **Test with fake credentials first:**
```bash
# In .env, use fake values initially:
KAJABI_API_KEY=test_fake_key_12345
# If this appears in git, you'll catch it before real credentials
```

✅ **Use git secrets scanning:**
```bash
# Install git-secrets (optional but recommended):
brew install git-secrets
git secrets --install
git secrets --register-aws  # Add more patterns as needed
```

---

## 🚨 IF CREDENTIALS ARE ACCIDENTALLY EXPOSED

### Immediate Actions:

**1. If committed to git:**
```bash
# DO NOT just delete and commit again - it's still in history!
# Instead:

# Remove from history (WARNING: Rewrites git history):
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Or use BFG Repo-Cleaner (easier):
brew install bfg
bfg --delete-files .env
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# Force push (if already pushed to remote):
git push origin --force --all
```

**2. Rotate credentials immediately:**
- Kajabi: Admin → Settings → API → Revoke key → Create new
- Update your `.env` with new key
- Notify Gabriel of new credentials

**3. Monitor for unauthorized access:**
- Check Kajabi API usage logs
- Look for unexpected API calls
- Review n8n execution history

---

## 💡 PRO TIPS FOR CURSOR + SECRETS

### Tip 1: Use Environment Variables in Code

**Instead of:**
```javascript
const apiKey = "kaj_live_abc123";  // ❌ Hardcoded
```

**Do this:**
```javascript
const apiKey = process.env.KAJABI_API_KEY;  // ✅ From .env
```

**I (Claude) will write code this way automatically if I know you have .env**

---

### Tip 2: Reference Secrets in Prompts

**Instead of:**
```
"Claude, test the API with key kaj_live_abc123"
```

**Do this:**
```
"Claude, read my .env file and test the Kajabi API"
```

**I'll read the file privately and use the key in testing**

---

### Tip 3: Separate Dev and Prod Credentials

**Create multiple env files:**
```bash
.env              # Local development
.env.production   # Production (Gabriel keeps this)
.env.test         # Testing with fake data
```

**In .gitignore:**
```
.env*
```

**Load the right one:**
```javascript
// In testing:
require('dotenv').config({ path: '.env.test' });

// In production (n8n):
// Use n8n's credential system instead
```

---

### Tip 4: Document Without Exposing

**In documentation, use placeholders:**
```bash
# ❌ Don't do this:
curl -H "Authorization: Bearer kaj_live_abc123def456"

# ✅ Do this:
curl -H "Authorization: Bearer ${KAJABI_API_KEY}"
```

**I (Claude) will write examples this way**

---

## 📁 PROJECT STRUCTURE FOR SECRETS

```
your-project/
├── .env                          ← Your local secrets (gitignored)
├── environment.template          ← Template (COMMITTED to git)
├── credentials.template          ← Template (COMMITTED to git)
├── credentials/                  ← Gitignored folder
│   └── kajabi-credentials.md    ← Filled template (NEVER commit)
├── .gitignore                    ← Must include all above
└── context/CURRENT-SESSION/
    └── kajabi-integration/
        └── SECRETS-SHARING-GUIDE.md  ← This guide (safe to commit)
```

**What gets committed:**
- ✅ Templates (`.template` files)
- ✅ This guide
- ✅ `.gitignore`

**What NEVER gets committed:**
- ❌ `.env`
- ❌ `credentials/` folder
- ❌ Any file with real secrets

---

## 🎯 QUICK START (TL;DR)

**For Latif:**
1. Copy `environment.template` → `.env`
2. Fill in real Kajabi credentials
3. Tell Claude: "Read my .env and help me test"
4. Copy `credentials.template` → `credentials/kajabi-credentials.md`
5. Fill in and share with Gabriel via 1Password/Slack DM

**For Gabriel:**
1. Receive credentials from Latif (1Password/Slack DM)
2. Save to password manager or local `.env`
3. Enter manually in n8n Cloud UI (HTTP Header Auth)
4. Test with `curl` before using in workflows
5. Delete Slack message after saving

**For Claude (me):**
1. Read `.env` or `credentials/kajabi-credentials.md` when asked
2. Use values in code examples and API testing
3. Never expose in chat unless explicitly asked
4. Always use environment variable syntax in code

---

## ❓ FAQ

**Q: Can Claude access my .env file?**  
A: Yes, if you ask me to. I can read any file in your project (except those blocked by globalIgnore).

**Q: Will Claude commit secrets to git?**  
A: No. I respect `.gitignore` and will never commit `.env` or `credentials/` folder.

**Q: How do I know if my .env is safe?**  
A: Run `git status` - if you see `.env` listed, it's NOT safe. Add to `.gitignore` immediately.

**Q: Can I share .env file with Gabriel directly?**  
A: Technically yes, but better to use `credentials/kajabi-credentials.md` which has instructions.

**Q: What if I accidentally commit credentials?**  
A: See "IF CREDENTIALS ARE ACCIDENTALLY EXPOSED" section above. Act immediately.

**Q: Do I need both .env AND credentials/ folder?**  
A: Not strictly necessary, but recommended:
- `.env` = Quick access for you and Claude
- `credentials/` = Team sharing with instructions

**Q: Can n8n read my .env file?**  
A: No. n8n Cloud cannot access your local files. Gabriel must enter credentials manually in n8n UI.

---

## 📞 SUPPORT

**Questions about:**
- **.env files**: Ask Claude (me!) - "Claude, help me set up .env"
- **Sharing with Gabriel**: Use credentials.template as guide
- **n8n credentials**: Ask Gabriel or check n8n docs
- **Security concerns**: Slack #uysp-debug (no actual secrets in channel!)

---

**Remember**: Templates are safe to commit, actual secrets are never committed!

---

**Last Updated**: October 17, 2025  
**Status**: Ready to use  
**Templates Available**: ✅ environment.template, ✅ credentials.template

