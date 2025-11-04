# PM Dashboard - What's Left

## Fixed:
- ✅ Duplicate navbar removed
- ✅ Database tables created (21 tasks in PostgreSQL)
- ✅ Airtable tables created
- ✅ Sync works

## Broken:
- ❌ API fetch fails - Debug `/api/clients/[id]/project` endpoint
- ❌ PM page is cards - Replace with table (copy `/src/app/(client)/leads/page.tsx`)
- ❌ No task detail page - Build `/project-management/tasks/[id]` (copy `/leads/[id]`)
- ❌ No save to Airtable - Add `PATCH /api/project/tasks/[id]`

## Fix:
1. Copy Leads page → PM page
2. Replace Lead → Task
3. Update fetch from `/api/leads` → `/api/clients/{clientId}/project`
4. Build detail page
5. Add save endpoint

**Time**: 2-3 hours if you just copy Leads pattern.

