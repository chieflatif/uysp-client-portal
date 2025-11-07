# Mini-CRM Week 1 - Deployment Instructions

## ✅ Pre-Deployment Checklist Complete

- [x] Database schema created
- [x] 4 API endpoints built and tested
- [x] 1484 lines of API tests written
- [x] All security fixes applied
- [x] Forensic audit passed (100% compliant)
- [x] INTERNAL_API_KEY generated

---

## 🔑 Step 1: Add INTERNAL_API_KEY to Render

**Key Generated:**
```
741fae95182639f6b3fb48712a99ad41f65099aeee686b79bf734939e2f41c1d
```

**Add to Render:**
1. Go to: https://dashboard.render.com
2. Select: uysp-client-portal service
3. Navigate to: Environment tab
4. Add new variable:
   - Key: `INTERNAL_API_KEY`
   - Value: `741fae95182639f6b3fb48712a99ad41f65099aeee686b79bf734939e2f41c1d`
5. Click "Save Changes"

---

## 🚀 Step 2: Deploy to Staging

**Command:**
```bash
cd "/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal"
git push origin feature/mini-crm-activity-logging
```

**What happens:**
- Render auto-detects push
- Runs build
- Runs migrations
- Deploys new version

**Estimated time:** 3-5 minutes

---

## ✅ Step 3: Verify Deployment

**Health Check:**
```bash
curl https://[your-staging-url]/api/internal/activity-health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "totalEvents": 0,
  "lastEvent": null
}
```

**If you get this response: ✅ DEPLOYMENT SUCCESSFUL**

---

## 📊 Step 4: Seed Test Data (Optional)

```bash
npm run tsx scripts/seed-activity-log-test-data.ts
```

This creates sample activities for testing the UI.

---

## 🎯 Next: UI Development

Once deployment is verified, start UI development:
- **Guide:** docs/mini-crm/UI-IMPLEMENTATION-GUIDE.md
- **Timeline:** 12 hours (Day 1-5)
- **Components:** Admin browser + Lead timeline

---

**Questions?** Check docs/mini-crm/DEPLOYMENT-CHECKLIST.md for detailed troubleshooting.
