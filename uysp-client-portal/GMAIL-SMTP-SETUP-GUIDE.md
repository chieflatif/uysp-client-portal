# Gmail SMTP Setup Guide for UYSP Portal

This guide will help you configure Gmail to send invitation emails for the new self-service password setup flow.

---

## 🎯 Overview

The UYSP Portal now uses Gmail's SMTP service to automatically send invitation emails when admins create new users. Users receive a beautiful email with a secure setup link to create their own password.

**Benefits:**
- ✅ No more temporary passwords to manage
- ✅ Secure password creation (never transmitted)
- ✅ Professional branded emails
- ✅ Zero admin burden
- ✅ Better user experience

---

## 📋 Prerequisites

- A Gmail account (personal or Google Workspace)
- Admin access to the UYSP application
- Access to modify environment variables (Render dashboard or `.env.local`)

---

## 🔐 Step 1: Enable 2-Step Verification

App Passwords require 2-Step Verification to be enabled on your Google account.

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Scroll to "How you sign in to Google"
3. Click "2-Step Verification"
4. Follow the setup wizard to enable 2FA
   - Choose SMS, Google Authenticator, or Security Key
   - Complete the verification
5. **Important:** Keep your 2FA method secure!

---

## 🔑 Step 2: Generate App Password

1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - If you don't see this option, make sure 2-Step Verification is enabled

2. Sign in if prompted

3. Create an App Password:
   - **Select App:** Choose "Mail"
   - **Select Device:** Choose "Other (Custom name)"
   - **Custom Name:** Type "UYSP Portal"
   - Click **Generate**

4. **Copy the 16-character password:**
   ```
   Example: abcd efgh ijkl mnop
   ```
   - **IMPORTANT:** This password is shown only once!
   - Copy it immediately and store it securely
   - You'll use this in your `.env` file (NOT your regular Gmail password)

---

## ⚙️ Step 3: Configure Environment Variables

### For Local Development (`.env.local`):

1. Open `/uysp-client-portal/.env.local`
2. Add or update these variables:

```env
# Email Configuration (Gmail SMTP)
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=abcdefghijklmnop  # 16-char app password (remove spaces)
SMTP_FROM_EMAIL=noreply@uysp.com
SMTP_FROM_NAME=UYSP Portal

# Required for setup link generation
NEXTAUTH_URL=http://localhost:3000
```

**Example:**
```env
SMTP_USER=info@rebelhq.com
SMTP_PASSWORD=xyzw1234abcd5678
SMTP_FROM_EMAIL=noreply@uysp.com
SMTP_FROM_NAME=UYSP Portal
NEXTAUTH_URL=http://localhost:3000
```

### For Production (Render Dashboard):

1. Go to your Render dashboard
2. Select your web service (uysp-client-portal)
3. Go to "Environment" tab
4. Add these environment variables:

| Variable | Value |
|----------|-------|
| `SMTP_USER` | your-email@gmail.com |
| `SMTP_PASSWORD` | your-16-char-app-password |
| `SMTP_FROM_EMAIL` | noreply@uysp.com |
| `SMTP_FROM_NAME` | UYSP Portal |
| `NEXTAUTH_URL` | https://your-domain.com |

5. Click "Save Changes"
6. Render will automatically redeploy with new environment variables

---

## 🧪 Step 4: Test Email Configuration

### Option A: Use the Test Script

```bash
cd uysp-client-portal
npx tsx scripts/test-email.ts
```

Expected output:
```
✅ Email configuration is valid
✅ Test email sent successfully!
```

### Option B: Test via User Creation

1. Login to the portal as SUPER_ADMIN or CLIENT_ADMIN
2. Go to `/admin/users`
3. Click "Add User"
4. Fill in the form:
   - **Email:** Use YOUR email for testing
   - **First Name:** Test
   - **Last Name:** User
   - **Role:** CLIENT_USER
5. Click "Create User"
6. Check your email inbox (and spam folder)

**Expected Email:**
- **Subject:** "Complete Your UYSP Portal Account Setup"
- **Content:** Professional branded email with setup button
- **Link:** Should be clickable and direct to `/setup-password`

---

## 📧 Email Template Preview

The invitation email includes:
- 🎨 Gradient header with UYSP branding
- 📋 Clear password requirements listed
- 🔘 Prominent "Set Up Your Password" button
- 🔗 Fallback text link
- ⚠️ 24-hour expiration notice
- 🛡️ Professional footer

---

## 🐛 Troubleshooting

### Problem: "Invalid credentials" or "Authentication failed"

**Solution:**
- ✅ Make sure you're using the **App Password**, not your regular Gmail password
- ✅ Remove spaces from the App Password (copy as one continuous string)
- ✅ Verify 2-Step Verification is enabled
- ✅ Try generating a new App Password

### Problem: "Less secure app access"

**Solution:**
- ✅ App Passwords bypass "less secure apps" restrictions
- ✅ Make sure you're using an App Password (16 characters)
- ✅ Don't use your regular Gmail password

### Problem: Emails not arriving

**Solution:**
- ✅ Check spam/junk folder
- ✅ Wait 2-3 minutes (SMTP can be slow)
- ✅ Verify `SMTP_USER` is correct
- ✅ Check server logs for errors: `docker logs <container-name>`
- ✅ Test with the test script to verify connection

### Problem: "Failed to send email"

**Solution:**
- ✅ Check environment variables are set correctly
- ✅ Restart the application after changing `.env`
- ✅ Verify network connectivity (Gmail SMTP uses port 587)
- ✅ Check Render logs if deployed

### Problem: Setup link doesn't work

**Solution:**
- ✅ Verify `NEXTAUTH_URL` is set correctly
  - Local: `http://localhost:3000`
  - Production: `https://your-domain.com`
- ✅ Make sure there's no trailing slash in `NEXTAUTH_URL`
- ✅ Check that the email address matches exactly

---

## 🔒 Security Best Practices

### App Password Storage:
- ✅ Never commit App Passwords to Git
- ✅ Store in environment variables only
- ✅ Use different App Passwords for dev/staging/prod
- ✅ Rotate App Passwords every 90 days
- ✅ Revoke unused App Passwords immediately

### Access Control:
- ✅ Limit who has access to the Gmail account
- ✅ Use a dedicated email account for notifications
- ✅ Monitor sent emails regularly
- ✅ Set up alerts for suspicious activity

### Monitoring:
- ✅ Check Gmail's "Sent" folder periodically
- ✅ Monitor for bounced emails
- ✅ Track delivery rates
- ✅ Set up error logging in your application

---

## 🔄 Revoking App Passwords

If you need to revoke an App Password:

1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Find "UYSP Portal" in the list
3. Click "Remove" or the trash icon
4. Generate a new one if needed
5. Update environment variables with the new password

---

## 📊 Email Delivery Limits

**Gmail SMTP Limits:**
- Free Gmail: 500 emails/day
- Google Workspace: 2,000 emails/day
- Rate limit: ~100 emails per 15 minutes

**For UYSP Portal:**
- Each user creation = 1 email
- Should be well within limits
- Consider SendGrid/AWS SES for high-volume needs

---

## 🆘 Need Help?

**Common Issues:**
- Check `.env.local` or Render environment variables
- Verify 2FA is enabled on Gmail
- Make sure App Password has no spaces
- Check server logs for detailed errors
- Test with a different email address

**Alternative Email Providers:**
If Gmail doesn't work for your use case:
- SendGrid (free tier: 100 emails/day)
- AWS SES (very cheap, reliable)
- Mailgun (free tier: 5,000 emails/month)
- Postmark (great for transactional emails)

---

## ✅ Verification Checklist

Before going to production, verify:

- [ ] 2-Step Verification enabled on Gmail
- [ ] App Password generated and saved securely
- [ ] All environment variables configured
- [ ] Test email sent successfully
- [ ] Test user creation sends invitation email
- [ ] Setup link works and loads password page
- [ ] Password requirements are clear
- [ ] User can successfully set password and login
- [ ] Confirmation email sent after password set
- [ ] Production NEXTAUTH_URL uses HTTPS

---

## 🎉 Success!

Once configured, your workflow will be:

1. Admin creates user → 🎯 Done!
2. System sends email automatically
3. User receives beautiful invitation
4. User creates secure password
5. User logs in immediately

**No temporary passwords, no insecure transmissions, no admin burden!**

---

**Last Updated:** October 23, 2025
**Version:** 1.0
