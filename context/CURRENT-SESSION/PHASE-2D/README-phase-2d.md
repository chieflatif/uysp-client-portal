# Phase 2D: Enrichment Waterfall Enhancements
*Pre‑third‑provider (Dropcontact) Optimizations for Quality & Cost Control*

## Overview
Enhancing the existing PDL/Hunter waterfall BEFORE adding Dropcontact as third provider.
Based on production data showing 40% double-failure rate and ±15 point score variance.

## Current Problems Being Solved
1. **40% Double-Failure Rate** → Sending junk to human review
2. **Score Variance ±15 Points** → Uncapped scoring sections
3. **$50/day Cost Overruns** → No pre-filtering of junk
4. **100% HR Queue Load** → No smart triage

## Components to Build
1. **Junk Detection Filter**
   - Position: After Double Failure Router TRUE path
   - Purpose: Auto-archive obvious junk (generic email + no data)
   - Target: Remove 20-30% of double-fails

2. **Salvage Pre-Score Calculator**
   - Position: After Junk Filter
   - Purpose: Identify salvageable leads before HR
   - Target: Rescue 10-15% with signals

3. **V3.2 Base Scoring Caps**
   - Company: 15 points max
   - Role: 40 points max
   - Engagement: 30 points max
   - Target: Reduce variance to ±5 points; Person Location (+15) applied post-enrichment

4. **Anomaly Detection**
5. **Person Location Application (Post-Enrichment)**
   - PERSON-only (LinkedIn/PDL Person), confidence-weighted
   - Unknown=neutral (0); Tier D (conf≥0.7) → human review (no auto-SMS/calls)
   - High engagement + low score
   - Coaching interest + non-sales role
   - Suspicious score distributions

## Success Metrics
- Double-fail rate: <25% (from 40%)
- Score variance: ±5 points (from ±15)
- Daily costs: <$50 (from >$50)
- HR queue: 70% of current (30% reduction)

## Prerequisites
- [ ] Phase 2C bug fixes complete
- [ ] PDL/Hunter waterfall functional
- [ ] Test suite operational
- [ ] Airtable schema current

## n8n Cloud Constraints
- Use `$vars` not `$env`
- Expression spacing: `{{ $json.field }}`
- Credentials via UI only (predefined credential types)
- See `docs/CURRENT/critical-platform-gotchas.md`
