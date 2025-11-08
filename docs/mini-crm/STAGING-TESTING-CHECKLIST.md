# Staging Testing Checklist - Mini-CRM Activity Logging

**Date:** November 7, 2025
**Staging URL:** https://uysp-portal-staging.onrender.com
**Branch:** `feature/mini-crm-activity-logging`
**Commit:** 6b4c0da (deployed at 2025-11-08T01:02:58Z)
**Status:** ⏳ PENDING MANUAL VERIFICATION

---

## 🎯 Testing Objective

Verify the CRITICAL BUG FIX works on staging before merging to production:
- Parameter mismatch fix (category filtering)
- All Day 1-4 features functional
- Lead Timeline component working

---

## ⚠️ CRITICAL TEST #1: Category Filtering (MUST PASS)

**This is the bug we just fixed - TEST FIRST!**

### Activity Browser Category Filtering

**URL:** https://uysp-portal-staging.onrender.com/admin/activity-logs

**Steps:**

1. **Login as Admin**
   - Navigate to staging URL
   - Login with admin credentials
   - Verify access to Activity Logs page

2. **Test "All" Filter (Baseline)**
   - [ ] Navigate to `/admin/activity-logs`
   - [ ] Verify URL shows no `category` parameter
   - [ ] Note total count in "All" badge (should be 16 events)
   - [ ] Verify events display in table

3. **Test "SMS" Filter** 🔴 CRITICAL
   - [ ] Click "SMS" filter chip
   - [ ] **VERIFY:** URL updates to `?category=SMS` (not `?eventCategory=SMS`)
   - [ ] **VERIFY:** Only SMS events display (should be 7)
   - [ ] **VERIFY:** SMS badge shows accurate count (7)
   - [ ] **VERIFY:** Event Type column shows SMS-related types (MESSAGE_SENT, etc.)
   - [ ] ✅ **PASS** or ❌ **FAIL**

4. **Test "Bookings" Filter**
   - [ ] Click "Bookings" filter chip
   - [ ] **VERIFY:** URL updates to `?category=BOOKING`
   - [ ] **VERIFY:** Only booking events display (should be 2)
   - [ ] **VERIFY:** Booking badge shows accurate count (2)
   - [ ] ✅ **PASS** or ❌ **FAIL**

5. **Test "Campaigns" Filter**
   - [ ] Click "Campaigns" filter chip
   - [ ] **VERIFY:** URL updates to `?category=CAMPAIGN`
   - [ ] **VERIFY:** Only campaign events display (should be 2)
   - [ ] **VERIFY:** Campaign badge shows accurate count (2)
   - [ ] ✅ **PASS** or ❌ **FAIL**

6. **Test Filter Persistence**
   - [ ] Apply SMS filter
   - [ ] Click "Next" page (if pagination available)
   - [ ] **VERIFY:** Filter persists across pages
   - [ ] **VERIFY:** URL keeps `?category=SMS&page=2`
   - [ ] ✅ **PASS** or ❌ **FAIL**

**Expected Results:**
- All category filters work correctly
- URL uses `category` parameter (not `eventCategory`)
- Counts accurate per category
- Only filtered events display

**If ANY test fails:**
- 🚨 DO NOT MERGE TO MAIN
- Bug fix did not work as expected
- Report failure for investigation

---

## 🧪 Test #2: Search + Category Combination

**URL:** https://uysp-portal-staging.onrender.com/admin/activity-logs

**Steps:**

1. **Search + SMS Filter**
   - [ ] Enter "booking" in search box
   - [ ] Wait 300ms for debounce
   - [ ] Click "SMS" filter chip
   - [ ] **VERIFY:** Results show SMS events containing "booking"
   - [ ] **VERIFY:** URL shows `?search=booking&category=SMS`
   - [ ] ✅ **PASS** or ❌ **FAIL**

2. **Clear Search, Keep Filter**
   - [ ] Clear search box
   - [ ] **VERIFY:** SMS filter remains active
   - [ ] **VERIFY:** All SMS events display (not just with "booking")
   - [ ] ✅ **PASS** or ❌ **FAIL**

---

## 🧪 Test #3: CSV Export with Filtering

**URL:** https://uysp-portal-staging.onrender.com/admin/activity-logs

**Steps:**

1. **Export with SMS Filter**
   - [ ] Apply "SMS" filter
   - [ ] Click "Export CSV" button
   - [ ] **VERIFY:** Button shows "Exporting..." with pulsing icon
   - [ ] **VERIFY:** Button disabled during export
   - [ ] **VERIFY:** CSV file downloads

2. **Verify CSV Contents**
   - [ ] Open CSV in Excel or Google Sheets
   - [ ] **VERIFY:** Only SMS events included (7 rows + header = 8 total)
   - [ ] **VERIFY:** All fields properly quoted (no broken columns)
   - [ ] **VERIFY:** Commas in descriptions don't break CSV
   - [ ] ✅ **PASS** or ❌ **FAIL**

3. **Export with "All" Filter**
   - [ ] Click "All" filter
   - [ ] Export CSV
   - [ ] **VERIFY:** All 16 events included (16 rows + header = 17 total)
   - [ ] ✅ **PASS** or ❌ **FAIL**

---

## 🧪 Test #4: Sorting with Category Filter

**URL:** https://uysp-portal-staging.onrender.com/admin/activity-logs

**Steps:**

1. **Sort + Filter Combination**
   - [ ] Apply "SMS" filter
   - [ ] Click "When" column header
   - [ ] **VERIFY:** Sort order toggles (asc/desc)
   - [ ] **VERIFY:** Arrow icon appears
   - [ ] **VERIFY:** SMS filter persists
   - [ ] **VERIFY:** URL shows `?category=SMS&sortBy=timestamp&sortOrder=asc`
   - [ ] ✅ **PASS** or ❌ **FAIL**

2. **Sort Event Category Column**
   - [ ] Click "Event" column header
   - [ ] **VERIFY:** Events sort alphabetically by category
   - [ ] **VERIFY:** SMS filter persists
   - [ ] ✅ **PASS** or ❌ **FAIL**

---

## 🧪 Test #5: Detail Modal

**URL:** https://uysp-portal-staging.onrender.com/admin/activity-logs

**Steps:**

1. **Open Modal**
   - [ ] Click any event row
   - [ ] **VERIFY:** Modal opens with event details
   - [ ] **VERIFY:** Shows timestamp, description, metadata
   - [ ] **VERIFY:** Close button (X) visible
   - [ ] ✅ **PASS** or ❌ **FAIL**

2. **Close Modal**
   - [ ] Click "Close" button
   - [ ] **VERIFY:** Modal closes
   - [ ] Press ESC key
   - [ ] **VERIFY:** Modal closes
   - [ ] ✅ **PASS** or ❌ **FAIL**

---

## 🧪 Test #6: Auto-Refresh Toggle

**URL:** https://uysp-portal-staging.onrender.com/admin/activity-logs

**Steps:**

1. **Toggle Auto-Refresh**
   - [ ] Verify "Auto-refresh: ON" button visible
   - [ ] Click toggle to turn OFF
   - [ ] **VERIFY:** Button shows "Auto-refresh: OFF"
   - [ ] **VERIFY:** Preference saved (check localStorage)
   - [ ] ✅ **PASS** or ❌ **FAIL**

2. **Verify Persistence**
   - [ ] Refresh page (F5)
   - [ ] **VERIFY:** Auto-refresh state persists (still OFF)
   - [ ] ✅ **PASS** or ❌ **FAIL**

---

## 🧪 Test #7: Lead Timeline Component

**URL:** https://uysp-portal-staging.onrender.com/leads/{lead-id}

**Prerequisites:** Need a valid lead ID. Use: `d637f453-e7ab-4f39-9463-84e715d478f8` (Alex Oanca)

**Steps:**

1. **Navigate to Lead Detail**
   - [ ] Navigate to `/leads/d637f453-e7ab-4f39-9463-84e715d478f8`
   - [ ] Scroll down to "Activity Timeline" section
   - [ ] **VERIFY:** Timeline section exists below Notes
   - [ ] ✅ **PASS** or ❌ **FAIL**

2. **Test Timeline Rendering**
   - [ ] **If no events:** Verify "No activity events found" message displays
   - [ ] **If events exist:** Verify timeline displays with:
     - [ ] Color-coded timeline dots
     - [ ] Event cards with descriptions
     - [ ] Timestamps formatted correctly
     - [ ] Category badges (SMS, Booking, etc.)
   - [ ] ✅ **PASS** or ❌ **FAIL**

3. **Test Category Filtering** 🔴 CRITICAL
   - [ ] **If events exist:**
     - [ ] Click a category filter chip (e.g., SMS)
     - [ ] **VERIFY:** Only that category displays
     - [ ] **VERIFY:** Count badges accurate
     - [ ] ✅ **PASS** or ❌ **FAIL**
   - [ ] **If no events:** Skip this test

4. **Test Expand/Collapse**
   - [ ] **If events exist:**
     - [ ] Click an event card
     - [ ] **VERIFY:** Card expands (cyan border appears)
     - [ ] **VERIFY:** Shows additional details (message content, metadata)
     - [ ] Click same card again
     - [ ] **VERIFY:** Card collapses
     - [ ] ✅ **PASS** or ❌ **FAIL**
   - [ ] **If no events:** Skip this test

5. **Test Refresh**
   - [ ] Click "Refresh" button in timeline header
   - [ ] **VERIFY:** Brief loading spinner
   - [ ] **VERIFY:** Timeline refreshes
   - [ ] ✅ **PASS** or ❌ **FAIL**

---

## 🧪 Test #8: Health Check Endpoint

**URL:** https://uysp-portal-staging.onrender.com/api/internal/activity-health

**Steps:**

1. **Check Health Endpoint**
   - [ ] Navigate to health endpoint (or use curl)
   - [ ] **VERIFY:** Returns JSON with:
     - [ ] `status: "healthy"`
     - [ ] `stats.events_last_hour` (number)
     - [ ] `stats.total_events` (should be 16)
     - [ ] `last_event` object with details
   - [ ] ✅ **PASS** or ❌ **FAIL**

**Terminal Command:**
```bash
curl https://uysp-portal-staging.onrender.com/api/internal/activity-health | python3 -m json.tool
```

---

## 🧪 Test #9: Mobile Responsiveness

**URL:** https://uysp-portal-staging.onrender.com/admin/activity-logs

**Steps:**

1. **Resize Browser to Mobile**
   - [ ] Open DevTools (F12)
   - [ ] Toggle device toolbar (Ctrl+Shift+M)
   - [ ] Select "iPhone 12 Pro" or similar
   - [ ] **VERIFY:** Filter chips wrap to multiple lines
   - [ ] **VERIFY:** Table remains scrollable
   - [ ] **VERIFY:** Buttons remain accessible
   - [ ] ✅ **PASS** or ❌ **FAIL**

2. **Test Mobile Interactions**
   - [ ] Tap filter chips (touch events)
   - [ ] **VERIFY:** Filters work on mobile
   - [ ] Tap event row
   - [ ] **VERIFY:** Modal opens
   - [ ] ✅ **PASS** or ❌ **FAIL**

---

## 🧪 Test #10: Error Handling

**URL:** https://uysp-portal-staging.onrender.com/admin/activity-logs

**Steps:**

1. **Test Network Error**
   - [ ] Open DevTools → Network tab
   - [ ] Set throttling to "Offline"
   - [ ] Click "Refresh" button
   - [ ] **VERIFY:** Error message displays
   - [ ] **VERIFY:** Error message user-friendly (not technical)
   - [ ] Set throttling back to "Online"
   - [ ] ✅ **PASS** or ❌ **FAIL**

2. **Test Empty State**
   - [ ] Apply a category filter that has 0 events (if exists)
   - [ ] **VERIFY:** "No activities found" message displays
   - [ ] **VERIFY:** Suggestion to "adjust filters" shown
   - [ ] ✅ **PASS** or ❌ **FAIL**

---

## ✅ Staging Test Summary

**Test Results:**

| Test # | Test Name | Result | Notes |
|--------|-----------|--------|-------|
| 1 | Category Filtering (CRITICAL) | ⏳ Pending | |
| 2 | Search + Category Combo | ⏳ Pending | |
| 3 | CSV Export with Filtering | ⏳ Pending | |
| 4 | Sorting with Category Filter | ⏳ Pending | |
| 5 | Detail Modal | ⏳ Pending | |
| 6 | Auto-Refresh Toggle | ⏳ Pending | |
| 7 | Lead Timeline Component | ⏳ Pending | |
| 8 | Health Check Endpoint | ⏳ Pending | |
| 9 | Mobile Responsiveness | ⏳ Pending | |
| 10 | Error Handling | ⏳ Pending | |

**Pass/Fail Criteria:**
- **CRITICAL:** Test #1 (Category Filtering) MUST PASS
- **REQUIRED:** Tests #2-7 should pass (at least 80%)
- **NICE TO HAVE:** Tests #8-10 (monitoring/UX)

---

## 🚫 If Tests FAIL

### Critical Test Failure (Test #1)

**If category filtering doesn't work:**

1. **Check URL Parameter**
   - Does URL show `?category=SMS` or `?eventCategory=SMS`?
   - If `eventCategory`: Bug fix didn't deploy correctly

2. **Check Network Tab**
   - Open DevTools → Network
   - Click SMS filter
   - Look for request to `/api/admin/activity-logs?category=SMS`
   - Check response - does it return filtered data?

3. **Check Console Errors**
   - Open DevTools → Console
   - Look for any JavaScript errors
   - Report errors for investigation

4. **DO NOT MERGE TO MAIN**
   - Report failure immediately
   - Investigate root cause
   - Fix and re-test on staging

### Non-Critical Test Failure (Tests #2-10)

**If other tests fail:**
- Document which test failed
- Document expected vs actual behavior
- Take screenshots
- Decide if blocking for production or can be fixed post-deployment

---

## ✅ If All Tests PASS

### Staging Verification Complete

**Checklist before merging to main:**
- [x] Test #1 (Category Filtering) PASSED ✅
- [x] At least 8/10 tests PASSED ✅
- [x] No console errors observed ✅
- [x] No network errors observed ✅
- [x] User experience acceptable ✅

**Next Steps:**

1. **Document Test Results**
   - Update this checklist with results
   - Add screenshots if needed
   - Commit updated checklist

2. **Merge to Main**
   ```bash
   cd /Users/latifhorst/cursor\ projects/UYSP\ Lead\ Qualification\ V1/uysp-client-portal
   git checkout main
   git pull origin main
   git merge feature/mini-crm-activity-logging
   git push origin main
   ```

3. **Monitor Production Deployment**
   - Wait 3-5 minutes for Render auto-deploy
   - Check production health: `curl https://uysp-client-portal.onrender.com/api/health`
   - Verify commit SHA matches

4. **Spot Check Production**
   - Quick test of category filtering on production
   - Verify no errors in production logs
   - Monitor for 24 hours

---

## 📋 Test Execution Log

**Tester:** _________________
**Date:** _________________
**Start Time:** _________________
**End Time:** _________________

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Issues Found:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Overall Result:** [ ] PASS - Ready for Production  |  [ ] FAIL - Do Not Merge

**Signature:** _________________

---

**Last Updated:** November 7, 2025
**Version:** 1.0
**Status:** ⏳ AWAITING STAGING VERIFICATION
