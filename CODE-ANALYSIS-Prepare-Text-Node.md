# Forensic Code Analysis: UYSP-SMS-Scheduler-v2 -> "Prepare Text (A/B)" Node

This document provides a line-by-line deconstruction of the core logic node in the SMS Scheduler.

---

## 1. Data Ingestion and Initialization

**Code:**
```javascript
const crypto = require('crypto');
const leads = ($items("List Due Leads", 0) || []).map(i => i.json.fields || i.json);
const settingsRows = ($items("Get Settings", 0) || []).map(i => i.json);
const templates = ($items("List Templates", 0) || []).map(i => i.json.fields || i.json);
// ...
const now = new Date();
const nowMs = now.getTime();
```
**Analysis:**
- The node ingests all potential leads, all settings, and all templates into memory at the start.
- This is efficient for small batches but could pose a memory risk if the number of settings or templates grows significantly.
- It establishes a single, authoritative `now` timestamp for the entire run, which is crucial for consistent time-based comparisons.

---
## 2. Global Safety Gates

### 2.1. Time Window Enforcement
**Code:**
```javascript
const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
const currentHour = easternTime.getHours();
if (currentHour < 9 || currentHour >= 17) {
  console.log(`BLOCKED: Outside time window...`);
  return [];
}
```
**Analysis:**
- **Dependency**: Hardcoded `America/New_York` timezone string.
- **Business Logic**: Enforces a strict 9 AM to 5 PM (17:00) sending window based on Eastern Time.
- **Risk/Improvement**: This is a **high-risk hardcoded value**. If business requirements change (e.g., to support multiple timezones or adjust hours), a code change is required.
- **Hypothesis**: This logic should be driven by fields in the `Settings` table (e.g., `Start Hour`, `End Hour`, `Timezone`) to make it configurable without developer intervention.

### 2.2. Batch Size Limit
**Code:**
```javascript
const limitedLeads = leads.slice(0, 25);
debugLog.push(`BATCH SIZE: Processing ${limitedLeads.length} of ${leads.length} total leads`);
```
**Analysis:**
- **Dependency**: Hardcoded batch size of `25`.
- **Business Logic**: Acts as a rate limit, ensuring no more than 25 leads are processed in a single run (approx. every hour).
- **Risk/Improvement**: This is another **high-risk hardcoded value**. Adjusting the sending volume requires a code change. A typo here could have major consequences.
- **Hypothesis**: This value should be moved to the `Settings` table (e.g., `Batch Size Limit`) to allow for dynamic control of message throughput.

---
*Analysis of the per-lead iteration loop to follow.*

---
## 3. Per-Lead Iteration Logic

After the global gates pass, the code iterates through each lead in the batch and applies a series of individual checks. If any check fails for a lead, the code executes a `continue` statement, skipping that lead and moving to the next one.

### 3.1. Phone & Country Validation
**Code:**
```javascript
const phoneOriginal = String(rec['Phone'] || '');
const phoneDigits = phoneOriginal.replace(/\\D/g,'').replace(/^1/, '');
const country = rec['Location Country'] || '';
const isUSCA = country === 'United States' || country === 'Canada';
if (!isUSCA || phoneDigits.length !== 10) {
  debugLog.push(`SKIP: ${rec['First Name']} - Invalid phone/country`);
  continue;
}
```
**Analysis:**
- **Dependency**: `Leads` table fields: `Phone`, `Location Country`.
- **Business Logic**: This is a data integrity and compliance check. It ensures that the lead has a 10-digit phone number (after cleaning) and is located in the 'United States' or 'Canada'.
- **Risk/Improvement**: The country check relies on an exact string match. A typo in the Airtable data (e.g., "united states") could cause an eligible lead to be skipped. The phone cleaning logic (`replace(/^1/, '')`) is specific to North American numbers and could fail for other international formats if the business expands.
- **Hypothesis**: The country check could be made more resilient by converting the input to lowercase and trimming whitespace before comparison, e.g., `(rec['Location Country'] || '').toLowerCase().trim()`.

### 3.2. 24-Hour Resend Lock
**Code:**
```javascript
if (last) {
  const lastMs = new Date(last).getTime();
  if (!Number.isNaN(lastMs)) {
    const msSinceLastSend = nowMs - lastMs;
    if (msSinceLastSend < TWENTY_FOUR_HOURS) {
      // ... SKIPPED
      continue;
    }
  }
}
```
**Analysis:**
- **Dependency**: `Leads` table field: `SMS Last Sent At`.
- **Business Logic**: **CRITICAL ANTI-SPAM RULE.** Prevents sending more than one message to the same lead within a 24-hour rolling window.
- **Risk/Improvement**: This logic is robust. The primary risk is data integrity; if another process writes an invalid date string to `SMS Last Sent At`, the `Number.isNaN(lastMs)` check correctly handles it, preventing the workflow from crashing. No immediate improvement is obvious, as this is a core, well-implemented safety feature.

### 3.3. Sequence Progression & Delay Validation
**Code:**
```javascript
if (pos > 0 && last){
  // ...
  const msSince = nowMs - lastMs;
  const needMs = delayMsFor(nextStep, t);
  if (msSince < needMs) {
    // ... SKIPPED
    continue;
  }
}
```
**Analysis:**
- **Dependency**: `Leads` table (`SMS Sequence Position`, `SMS Last Sent At`), `Settings` table (`Fast Mode`), and `SMS_Templates` table (`Delay Days`, `Fast Delay Minutes`).
- **Business Logic**: This orchestrates the timing of the multi-day sequence. It ensures that the time elapsed since the last message (`msSince`) is greater than the required delay for the next step (`needMs`).
- **Risk/Improvement**: This logic is highly dependent on the integrity of data across three different Airtable tables. A missing `Delay Days` value in the `SMS_Templates` table or an incorrect `Fast Mode` setting could disrupt the timing for the entire campaign.
- **Hypothesis**: The `delayMsFor` function contains fallback logic (e.g., `?? (step===2?3:7)`). While good for resilience, this means a missing template value would cause the system to "silently" fall back to a default delay, which might not be the intended business logic. Stricter validation with an explicit error or alert for missing template values might be preferable.

### 3.4. A/B Variant Assignment & Template Selection
**Code:**
```javascript
const variant = pickVariant(rec['SMS Variant']);
const t = tmplFor(variant, nextStep);
if (!t || !t.Body) {
  debugLog.push(`SKIP: ${rec['First Name']} - No template for variant ${variant} step ${nextStep}`);
  continue;
}
let text = String(t.Body).replaceAll('{Name}', firstName(rec));
```
**Analysis:**
- **Dependency**: `Leads` (`SMS Variant`), `Settings` (`ab_ratio_a`), `SMS_Templates` (all fields).
- **Business Logic**: This is the core content selection logic. It first assigns a persistent A/B `variant` to a lead if they don't have one. Then, it attempts to find a matching template in the `SMS_Templates` table for that `variant` and the lead's `nextStep`. If no template is found, the lead is skipped. Finally, it performs a simple `replaceAll` to personalize the message.
- **Risk/Improvement**: The biggest risk here is a missing template. If a template for `Variant: B, Step: 2` is deleted or not created, all leads in that bucket will simply stop progressing in the sequence with only a debug log to indicate why. There is no automatic alert for this condition.
- **Hypothesis**: The system should have a separate, periodic "sanity check" workflow that validates the integrity of the `SMS_Templates` table, ensuring that a template exists for every required `Variant` and `Step`. This would proactively alert the team to a misconfiguration before it impacts a live campaign.

### 3.5. Output Assembly
**Code:**
```javascript
out.push({ json: {
  id: rec.id || rec['Record ID'], text, variant, campaign_id: campaignId,
  prev_pos: pos, prev_sent_count: Number(rec['SMS Sent Count'] || 0),
  // ... other fields for downstream nodes
}});
```
**Analysis:**
- **Business Logic**: This section assembles a clean, structured JSON object for each lead that has passed all the preceding gates. This object is what gets passed to the next nodes in the n8n workflow.
- **Risk/Improvement**: This process is robust. It carefully selects and renames fields (`id`, `prev_pos`) to provide a clear and predictable data structure for the downstream API call and Airtable update nodes. This reduces the risk of schema mismatches between nodes. The `debug_info` field is particularly valuable for troubleshooting individual lead issues from the n8n execution logs.

---
## Final Forensic Conclusion on Code

The code in this node is dense, highly stateful, and packed with critical business logic. It demonstrates a mature, defense-in-depth approach with multiple layers of safety checks. However, its heavy reliance on hardcoded configuration values (batch size, time window) and its silent-failure modes on data integrity issues (missing templates, unexpected country strings) are its primary weaknesses. The proposed improvements would focus on externalizing all configuration to the Airtable `Settings` table and adding proactive monitoring for data integrity issues.
