# Calendly Webhook Troubleshooting Guide

**Last Updated:** September 15, 2025  
**Issue Resolved:** Disabled webhook subscription causing booking tracking failures

## Common Issues and Solutions

### Issue 1: Bookings Not Triggering Webhook Executions

**Symptoms:**
- Real Calendly bookings don't create n8n executions
- Leads not marked as booked in Airtable
- No Slack booking notifications
- Webhook endpoint returns 404 error

**Root Cause:**
Calendly webhook subscription becomes disabled due to delivery failures or configuration issues.

**Diagnostic Steps:**
1. **Test webhook endpoint:**
   ```bash
   curl -X POST https://rebelhq.app.n8n.cloud/webhook/calendly \
     -H "Content-Type: application/json" \
     -d '{"event": "invitee.created", "payload": {"email": "test@example.com"}}'
   ```

2. **Check webhook subscription status:**
   ```bash
   curl -X GET "https://api.calendly.com/webhook_subscriptions?organization=https://api.calendly.com/organizations/EHFAQL2MPMGSASBN&scope=organization" \
     -H "Authorization: Bearer YOUR_PERSONAL_ACCESS_TOKEN"
   ```

**Solution:**
1. **Delete disabled subscription:**
   ```bash
   curl -X DELETE https://api.calendly.com/webhook_subscriptions/WEBHOOK_ID \
     -H "Authorization: Bearer YOUR_PERSONAL_ACCESS_TOKEN"
   ```

2. **Create new active subscription:**
   ```bash
   curl -X POST https://api.calendly.com/webhook_subscriptions \
     -H "Authorization: Bearer YOUR_PERSONAL_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://rebelhq.app.n8n.cloud/webhook/calendly",
       "events": ["invitee.created", "invitee.canceled"],
       "organization": "https://api.calendly.com/organizations/EHFAQL2MPMGSASBN",
       "scope": "organization"
     }'
   ```

### Issue 2: n8n Webhook Configuration Problems

**Symptoms:**
- Webhook endpoint returns 404
- n8n workflow shows as active but doesn't receive webhooks

**Solution:**
Update webhook node parameters:
```json
{
  "httpMethod": "POST",
  "path": "calendly",
  "responseMode": "lastNode",
  "authentication": "none",
  "options": {}
}
```

### Issue 3: Lead Not Found After Booking

**Symptoms:**
- Webhook executes successfully
- No lead gets marked as booked
- Execution shows empty results from "Find Lead by Email"

**Root Cause:**
Email or phone mismatch between Calendly booking and Airtable record.

**Solution:**
1. **Verify exact email** used in Calendly booking
2. **Check phone format** consistency
3. **Review filter formula** in "Find Lead by Email" node

## Current Active Configuration

**Calendly Webhook Subscription:**
- **URL:** `https://rebelhq.app.n8n.cloud/webhook/calendly`
- **Events:** `invitee.created`, `invitee.canceled`
- **State:** `active`
- **Organization:** `EHFAQL2MPMGSASBN`
- **Created:** 2025-09-15T23:50:02.208340Z

**n8n Workflow:**
- **ID:** `LiVE3BlxsFkHhG83`
- **Name:** `UYSP-Calendly-Booked`
- **Status:** Active
- **Webhook Path:** `calendly`

## Testing Procedures

### Manual Webhook Test
```bash
curl -X POST https://rebelhq.app.n8n.cloud/webhook/calendly \
  -H "Content-Type: application/json" \
  -d '{
    "event": "invitee.created",
    "payload": {
      "email": "testlead@example.com",
      "first_name": "Test",
      "last_name": "Lead",
      "questions_and_answers": [
        {"question": "Phone Number", "answer": "+15593310097"}
      ],
      "scheduled_event": {
        "start_time": "2025-09-16T15:00:00.000Z"
      }
    }
  }'
```

**Expected Results:**
1. n8n execution fires immediately
2. Lead marked as booked in Airtable
3. Enhanced Slack notification sent
4. SMS sequence stopped for lead

## Maintenance

### Daily Health Check
1. **Verify webhook subscription status:**
   ```bash
   curl -X GET "https://api.calendly.com/webhook_subscriptions?organization=https://api.calendly.com/organizations/EHFAQL2MPMGSASBN&scope=organization" \
     -H "Authorization: Bearer YOUR_PERSONAL_ACCESS_TOKEN"
   ```

2. **Check for disabled state** and recreate if necessary

3. **Monitor n8n executions** for booking workflow

### Personal Access Token Management
- **Location:** Calendly Settings → Developer Tools → Personal Access Tokens
- **Permissions:** Webhook management
- **Security:** Store securely, rotate periodically
