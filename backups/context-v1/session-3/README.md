# Session 3: Qualification & Enrichment

## What You're Building
Two-phase qualification system that first checks if the company is B2B tech ($0.01), then enriches person data only if qualified ($0.025). Includes ICP scoring, cost tracking, and human review routing.

## Why This Matters
This saves significant money by filtering out 72% of leads before expensive person enrichment. It ensures we only spend on leads that match our ICP.

## Prerequisites
- Sessions 1-2 complete
- Pattern 03 loaded (enrichment patterns)
- Apollo API credentials configured
- Daily_Costs table initialized
- Understanding of two-phase logic

## Deliverables
- Company qualification (Apollo Org API)
- Person enrichment (Apollo People API)
- ICP scoring with Claude AI
- Cost tracking per API call
- Human review routing for unclear cases

## Critical Requirements
- Check costs BEFORE every API call
- Cache enrichment data (90 days)
- Route international phones to human review
- Track which phase each lead reaches
- Domain fallback if Claude fails

## Success Metrics
- 72% filtered at Phase 1 (saving money)
- ICP scores assigned to qualified leads
- Costs tracked accurately
- International numbers routed correctly
- Human review queue populated 