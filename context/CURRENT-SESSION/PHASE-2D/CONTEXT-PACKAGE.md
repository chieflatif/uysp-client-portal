# Phase 2D Context Package (Exact Code)

## ICP Response Processor (replace existing node code)
```javascript
// COMPLETE REPLACEMENT CODE - Fixes all issues
const items = $input.all();
// ... full code from plan copied verbatim ...
```

## Anomaly Detection (new Code node)
```javascript
// Node Name: Anomaly Detection
const items = $input.all();
// ... full code from plan copied verbatim ...
return items;
```

## Junk Detection Filter (new Code node after Double-Fail TRUE)
```javascript
// Node Name: Junk Detection Filter
const items = $input.all();
// ... full code from plan copied verbatim ...
return items;
```

## Salvage Pre-Score Calculator (new Code node)
```javascript
// Node Name: Salvage Pre-Score Calculator
const items = $input.all();
// ... full code from plan copied verbatim ...
return items;
```

## Person Geo Inference (new Code node)
```javascript
// Node Name: Person Geo Inference (provisional; no gating)
const items = $input.all();
for (const item of items) {
  const d = item.json.normalized || item.json;
  // OPTIONAL low-confidence hints; cap combined ≤ 0.5
  let conf = 0; const sources = [];
  if (d.phone_country_code) { conf += 0.5; sources.push('phone'); }
  if (d.email && /\.\w+$/.test(String(d.email))) { /* country TLD optional; keep low weight */ }
  d.location_confidence = Math.min(0.5, conf);
  d.location_source = sources.join(',');
  item.json = d;
}
return items;
```

## Apply Person Location (post-enrichment)
```javascript
// Node Name: Apply Person Location (post-enrichment)
const items = $input.all();
for (const item of items) {
  const d = item.json;
  const tierPoints = { A: 15, B: 10, C: 4, D: -15 };
  const locTier = d.affordability_tier || null;
  const locConf = Math.max(0, Math.min(1, d.location_confidence ?? 0));
  let locAdj = 0;
  if (locTier && locConf >= 0.5 && tierPoints[locTier] !== undefined) {
    locAdj = Math.round(tierPoints[locTier] * locConf);
  }
  d.location_points_applied = locAdj;
  d.icp_score = Math.min(100, Math.max(0, Number(d.icp_score || 0) + locAdj));
  const score = d.icp_score;
  d.icp_tier = score >= 90 ? 'Ultra' : score >= 75 ? 'High' : score >= 70 ? 'Qualified' : 'Archive';
  const tierDHighConf = (locTier === 'D' && locConf >= 0.7);
  d.outreach_potential = (score >= 70) && !tierDHighConf;
  if ((score >= 70) && tierDHighConf) d.human_review_needed = true;
  item.json = d;
}
return items;
```

Notes:
- See `TECHNICAL-REQUIREMENTS.md` for node positions and wiring.
- Use `$vars`, proper expression spacing, and predefined credentials per platform gotchas.
