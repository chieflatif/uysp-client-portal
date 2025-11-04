# Frontend Logging Enhancement Plan

## The Problem

User is experiencing timeouts with NO error messages visible, and zero backend logs. This means:

1. **Request isn't reaching the backend** (or taking >30s to even connect)
2. **Error handling exists but isn't being triggered** (cached old code?)
3. **No visibility into what's happening** in the browser

## Root Cause Analysis

### Why No Error Message?

**Potential causes:**
1. **Browser cache** - Old JavaScript without error handling
2. **Network/DNS timeout** - Before AbortController fires (browser-level timeout)
3. **Connection timeout** - TCP/TLS handshake taking >30s
4. **Serverless cold start** - Render service spinning up
5. **Silent error** - Error state set but UI not rendering it

### Why No Backend Logs?

If zero `[AI-MSG` logs AND zero HTTP request logs for `/api/admin/campaigns/generate-message`:
- **Request never left browser** - DNS, network, or connection issue
- **Request blocked by firewall/proxy** - Corporate network filtering
- **Wrong URL** - Cached code hitting old endpoint

## Missing Observability

### Frontend Gaps:
- ❌ No log when request STARTS
- ❌ No request ID for tracing
- ❌ No elapsed time visible to user
- ❌ No way to tell if fetch() was even called
- ❌ Browser console might be ignored

### Backend Gaps:
- ✅ Has [AI-MSG] logging (good!)
- ❌ No health check endpoint
- ❌ No way to test connectivity without AI call
- ❌ No monitoring of 60s serverless timeout

## Solutions Implemented

### 1. Health Check Endpoint (NEW)
**File:** `src/app/api/health/route.ts`

```typescript
GET /api/health
Returns: { status, timestamp, apiKeys: { primary, fallback }, endpoints }
```

**Purpose:** Test basic connectivity without triggering AI/rate limits

**Test:** `curl https://uysp-client-portal.onrender.com/api/health`

### 2. Enhanced Frontend Logging (NEEDED)

Add to `CustomCampaignForm.tsx` `generateMessage()`:

```typescript
const generateMessage = async (index: number) => {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  console.log(`[FRONTEND ${requestId}] 🚀 START: Message ${index} at ${new Date().toISOString()}`);

  try {
    // ... existing code ...

    console.log(`[FRONTEND ${requestId}] 📤 FETCH: Sending request`);
    const response = await fetch(/* ... */);

    const elapsed = Date.now() - startTime;
    console.log(`[FRONTEND ${requestId}] 📥 RESPONSE: ${response.status} in ${elapsed}ms`);

    // ... handle response ...

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[FRONTEND ${requestId}] ❌ ERROR after ${elapsed}ms:`, error);
    console.error(`[FRONTEND ${requestId}] Error name: ${error.name}`);
    console.error(`[FRONTEND ${requestId}] Error message: ${error.message}`);
    console.error(`[FRONTEND ${requestId}] Error stack:`, error.stack);

    // Show error to user WITH request ID
    setErrors((prev) => ({
      ...prev,
      [`ai_${index}`]: `Error [${requestId.substr(-6)}]: ${error.name === 'AbortError' ? 'Timeout after 30s' : error.message}. Check console (F12) for details.`,
    }));
  }
};
```

### 3. Visible Request Tracking (NEEDED)

Show request info in UI while generating:

```typescript
// Add state
const [requestInfo, setRequestInfo] = useState<string | null>(null);

// In generateMessage:
setRequestInfo(`Request ${requestId.substr(-6)} started at ${new Date().toLocaleTimeString()}`);

// In UI (below "Generating..." spinner):
{requestInfo && (
  <p className="text-xs text-gray-400 mt-1">{requestInfo}</p>
)}
```

### 4. Test Button (NEEDED)

Add a "Test Connection" button that:
1. Calls `/api/health` first
2. Shows result immediately
3. If health works, tries actual AI call
4. Shows exact timing and response

## Debugging Steps for User

### Immediate (Right Now):

1. **Hard refresh page:**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Open browser DevTools:**
   - Press `F12`
   - Go to "Console" tab
   - Clear console
   - Click "AI Generate"
   - **Screenshot EVERYTHING in console** and send to me

3. **Check Network tab:**
   - F12 → Network tab
   - Clear network log
   - Click "AI Generate"
   - Look for `/api/admin/campaigns/generate-message` request
   - **Screenshot the request details** (Headers, Response, Timing)

4. **Test health endpoint:**
   - Open new tab: `https://uysp-client-portal.onrender.com/api/health`
   - Does it load? Screenshot result

### If Still No Logs:

**Possible scenarios:**

**A) Request never leaves browser**
- Symptoms: No network request in DevTools, no error in console
- Cause: JavaScript not running, event handler not attached
- Fix: Check if button onclick is working, add console.log to button click

**B) Network/connection timeout**
- Symptoms: Request in DevTools shows "pending" forever, then "failed"
- Cause: DNS, firewall, or connection issue
- Fix: Check network, try different network/device

**C) Silent error**
- Symptoms: Error in console, but no error message in UI
- Cause: State update not triggering re-render, error display logic broken
- Fix: Check React DevTools for error state

**D) Cached old code**
- Symptoms: Hard refresh doesn't help, request still missing
- Cause: Service worker or aggressive CDN caching
- Fix: Clear all browser data, try incognito mode

## Next Steps

1. **User does debugging steps above** - I need browser console output
2. **Deploy health endpoint** - So we can test connectivity
3. **Add enhanced logging** - So we can see exactly what's happening
4. **Add request tracking UI** - So user can see progress without F12

## Timeline

- **Now:** Health endpoint deployed
- **After user tests:** Add enhanced logging based on findings
- **After logging:** Add test button and visible tracking
