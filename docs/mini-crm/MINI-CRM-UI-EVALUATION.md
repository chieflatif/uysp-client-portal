# Mini-CRM Plan: UI Planning Evaluation

## The Verdict: 60% Planned, 40% Missing Detail

**What's there:** They've allocated Week 4 for "Build admin UI + lead timeline," which is smart—data-first approach. APIs are solid. BUT the UI spec is dangerously vague. They haven't designed the actual components, interaction patterns, or how you'll scan/filter 10K activity records fast. "Admin UI" could mean 20 hours or 80 hours of work. They need to answer: What EXACTLY do you see when you open `/admin/activity-logs`? Is it a table? A timeline? Both? What columns? What's sortable? Can you bulk-select? That detail doesn't exist yet.

**Critical gap:** There's NO mention of search/filter UX, export, bulk actions, or timeline visualization. They've spec'd the DATA API but not the UI contract. Week 4 will hit a wall if they don't know what "Airtable-like" means for a database activity log. They need a component spec BEFORE Week 3 ends—wireframe the table (columns: timestamp, lead name, event type, message preview, source), define sort/filter behavior, specify how to handle 50K+ records (pagination? infinite scroll? export to CSV?). Otherwise Week 4 becomes a guessing game and you'll get a clunky dashboard, not the Airtable scanner experience you want.

**Recommendation:** Add a 2-hour "UI/UX Design Sprint" to END of Week 3 (before Week 4 build) to nail the component spec. Spend 30 min on activity table wireframe, 30 min on lead timeline, 30 min on search/filter patterns, 30 min on export/bulk action needs. THEN hand off to Week 4 with crisp spec instead of vague instructions.

