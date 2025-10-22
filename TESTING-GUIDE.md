# Testing Guide - What to Test & Current Issues

**Portal URL**: http://localhost:3001  
**Current Status**: Database synced, some features working, some need refresh/fixes

---

## 🔄 FIRST: Refresh Your Browser

**Action**: Hard refresh the page (Cmd+Shift+R)

**Why**: I just added:
- Analytics link to navigation
- Notes bug fixes
- Need HMR to pick up changes

---

## ✅ What Should Work NOW

### 1. Navigation
After refresh, you should see:
- Dashboard
- Leads
- **Analytics** ← NEW
- Settings

### 2. Dashboard (Current Page)
- Shows 11,046 total leads ✓
- Shows 347 high ICP (70+) leads ✓
- Quick actions ✓

### 3. Leads List
Click "View All Leads" or "Leads" in nav:
- Should show table of all 11,046 leads
- Click any lead to see detail

### 4. Lead Detail (You're Currently On)
- Contact info ✓
- Claim/Unclaim buttons ✓
- **Remove from Campaign button** ✓
- Notes section (should work after refresh)

---

## 🧪 Test Scenarios

### Test 1: Analytics Dashboard
1. **Refresh browser** (Cmd+Shift+R)
2. Click "Analytics" in top nav
3. **Should see**:
   - Overview stats cards
   - Campaign performance table
   - Each campaign showing:
     - Total leads
     - Step 1, 2, 3 counts
     - Booked count/rate
     - Opt-out count/rate
     - Click count/rate
   - "View Details" link per campaign

**If you don't see Analytics link**: Server needs restart
```bash
# Stop current server (Ctrl+C)
# Then: npm run dev
```

### Test 2: Campaign Drill-Down
1. Go to Analytics dashboard
2. Find a campaign in the table
3. Click "View Details"
4. **Should see**:
   - Overview stats per step
   - Lead lists showing who's at Step 0, 1, 2, 3
   - Per-lead data (name, company, ICP score, clicked, booked)
   - Step metrics (conversion rate, booking rate, opt-out rate)

### Test 3: Remove from Campaign
1. On current lead detail page (Sean Sheehan)
2. Click "Remove from Campaign" (red button, top right)
3. Enter reason: "Testing removal functionality"
4. Click "Confirm Removal"
5. **Should see**: Success message
6. **Check Airtable**: Leads table, find Sean Sheehan
   - Processing Status should = "Stopped"
   - SMS Stop should = true
   - SMS Stop Reason should = "Testing removal functionality"

### Test 4: Notes System
1. After refresh, scroll to Notes section
2. Select note type (e.g., "Call")
3. Type: "Test note - called lead, discussed requirements"
4. Click "Add Note"
5. **Should see**: Note appears below
6. **Check Airtable**: Leads table, Sean Sheehan, Notes field
   - Should contain: `[Call] 2025-10-20... - Rebel HQ:\nTest note - called lead...`

---

## ⚠️ Known Issues

### Notes Error
**Current**: "Failed to load notes"
**Fix Applied**: Authorization bug fixed
**Action**: Refresh browser to pick up fix

### Analytics Not Visible
**Current**: No Analytics link in nav yet
**Fix Applied**: Added to navigation
**Action**: Refresh browser

### Basic UI (Not Professional Yet)
**Current**: HTML tables, no charts
**Libraries Installed**: Recharts, TanStack Table
**Next**: Upgrade to professional visualizations

---

## 📊 Data Validation

### High ICP Count (347)
**You're concerned this seems low.**

**Check in Airtable**:
```
View: Filter where ICP Score >= 70
Count: Should match 347
```

**If it's actually higher in Airtable**:
- Re-run sync: `npm run sync:airtable`
- ICP Score field may not be syncing correctly

**If it's actually 347**:
- This is correct (3.1% of 11,046 leads)
- May indicate scoring needs adjustment
- Or most leads are lower quality

---

## 🎯 What to Focus On

**Priority 1**: Refresh browser, test Analytics dashboard  
**Priority 2**: Test Remove from Campaign (writes to Airtable)  
**Priority 3**: Test Notes (should work after refresh)  
**Priority 4**: Verify campaign drill-down works  

**Then tell me**:
- What's working
- What's broken
- What UI improvements you want

---

**Current state**: Functional backend, basic frontend, needs UI upgrade






