-- ============================================================================
-- CRITICAL DATA FIX: Reassign All Records from SYSTEM Client to UYSP Client
-- ============================================================================
--
-- PURPOSE: Fix client ID mismatch from Great Sync (Phase P2.2)
-- ISSUE:   All 1,270 records assigned to temporary SYSTEM client instead of production UYSP client
-- IMPACT:  Zero campaigns visible to production users despite successful sync
--
-- Date: 2025-11-12
-- RCA Report: RCA-ZERO-CAMPAIGNS.md
--
-- EXECUTION TIME: ~5 seconds
-- AFFECTED RECORDS: 1,270 total (26 campaigns, 1,211 leads, 21 tasks, 4 blockers, 8 status)
--
-- ============================================================================

-- SOURCE CLIENT (temporary system client created during Great Sync)
-- '550e8400-e29b-41d4-a716-446655440000' - SYSTEM (Great Sync)

-- TARGET CLIENT (production UYSP client)
-- '6a08f898-19cd-49f8-bd77-6fcb-2dd56db9' - UYSP

-- ============================================================================
-- STEP 1: CREATE BACKUP TABLES
-- ============================================================================

CREATE TABLE campaigns_backup_20251112 AS
SELECT * FROM campaigns
WHERE client_id = '550e8400-e29b-41d4-a716-446655440000';

CREATE TABLE leads_backup_20251112 AS
SELECT * FROM leads
WHERE client_id = '550e8400-e29b-41d4-a716-446655440000';

CREATE TABLE client_project_tasks_backup_20251112 AS
SELECT * FROM client_project_tasks
WHERE client_id = '550e8400-e29b-41d4-a716-446655440000';

CREATE TABLE client_project_blockers_backup_20251112 AS
SELECT * FROM client_project_blockers
WHERE client_id = '550e8400-e29b-41d4-a716-446655440000';

CREATE TABLE client_project_status_backup_20251112 AS
SELECT * FROM client_project_status
WHERE client_id = '550e8400-e29b-41d4-a716-446655440000';

-- Verify backups created
SELECT
  'campaigns_backup_20251112' as backup_table,
  COUNT(*) as record_count
FROM campaigns_backup_20251112
UNION ALL
SELECT
  'leads_backup_20251112',
  COUNT(*)
FROM leads_backup_20251112
UNION ALL
SELECT
  'client_project_tasks_backup_20251112',
  COUNT(*)
FROM client_project_tasks_backup_20251112
UNION ALL
SELECT
  'client_project_blockers_backup_20251112',
  COUNT(*)
FROM client_project_blockers_backup_20251112
UNION ALL
SELECT
  'client_project_status_backup_20251112',
  COUNT(*)
FROM client_project_status_backup_20251112;

-- Expected output:
-- campaigns_backup_20251112: 26
-- leads_backup_20251112: 1,211
-- client_project_tasks_backup_20251112: 21
-- client_project_blockers_backup_20251112: 4
-- client_project_status_backup_20251112: 8

-- ============================================================================
-- STEP 2: BULK UPDATE - REASSIGN TO PRODUCTION UYSP CLIENT
-- ============================================================================

-- Update campaigns
UPDATE campaigns
SET
  client_id = '6a08f898-19cd-49f8-bd77-6fcb-2dd56db9',
  updated_at = NOW()
WHERE client_id = '550e8400-e29b-41d4-a716-446655440000';
-- Expected: UPDATE 26

-- Update leads
UPDATE leads
SET
  client_id = '6a08f898-19cd-49f8-bd77-6fcb-2dd56db9',
  updated_at = NOW()
WHERE client_id = '550e8400-e29b-41d4-a716-446655440000';
-- Expected: UPDATE 1211

-- Update tasks
UPDATE client_project_tasks
SET
  client_id = '6a08f898-19cd-49f8-bd77-6fcb-2dd56db9',
  updated_at = NOW()
WHERE client_id = '550e8400-e29b-41d4-a716-446655440000';
-- Expected: UPDATE 21

-- Update blockers
UPDATE client_project_blockers
SET
  client_id = '6a08f898-19cd-49f8-bd77-6fcb-2dd56db9',
  updated_at = NOW()
WHERE client_id = '550e8400-e29b-41d4-a716-446655440000';
-- Expected: UPDATE 4

-- Update project status
UPDATE client_project_status
SET
  client_id = '6a08f898-19cd-49f8-bd77-6fcb-2dd56db9',
  updated_at = NOW()
WHERE client_id = '550e8400-e29b-41d4-a716-446655440000';
-- Expected: UPDATE 8

-- ============================================================================
-- STEP 3: CLEANUP - DELETE TEMPORARY SYSTEM CLIENT
-- ============================================================================

DELETE FROM clients
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
-- Expected: DELETE 1

-- ============================================================================
-- STEP 4: VERIFICATION QUERIES
-- ============================================================================

-- Verify all campaigns now belong to UYSP client
SELECT
  'campaigns' as table_name,
  client_id,
  COUNT(*) as record_count
FROM campaigns
GROUP BY client_id
ORDER BY record_count DESC;
-- Expected: 6a08f898-19cd-49f8-bd77-6fcb-2dd56db9 | 26

-- Verify all leads now belong to UYSP client
SELECT
  'leads' as table_name,
  client_id,
  COUNT(*) as record_count
FROM leads
GROUP BY client_id
ORDER BY record_count DESC;
-- Expected: 6a08f898-19cd-49f8-bd77-6fcb-2dd56db9 | 1,211

-- Verify NO records remain under SYSTEM client
SELECT
  COUNT(*) as orphaned_campaigns
FROM campaigns
WHERE client_id = '550e8400-e29b-41d4-a716-446655440000';
-- Expected: 0

SELECT
  COUNT(*) as orphaned_leads
FROM leads
WHERE client_id = '550e8400-e29b-41d4-a716-446655440000';
-- Expected: 0

-- Verify SYSTEM client no longer exists
SELECT
  COUNT(*) as system_client_count
FROM clients
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
-- Expected: 0

-- Final summary: UYSP client campaign count
SELECT
  c.id as client_id,
  c.company_name,
  c.email,
  COUNT(DISTINCT ca.id) as campaign_count,
  COUNT(DISTINCT l.id) as lead_count
FROM clients c
LEFT JOIN campaigns ca ON c.id = ca.client_id
LEFT JOIN leads l ON c.id = l.client_id
WHERE c.id = '6a08f898-19cd-49f8-bd77-6fcb-2dd56db9'
GROUP BY c.id, c.company_name, c.email;
-- Expected:
-- client_id: 6a08f898-19cd-49f8-bd77-6fcb-2dd56db9
-- company_name: UYSP
-- email: davidson@iankoniak.com
-- campaign_count: 26
-- lead_count: 1,211

-- ============================================================================
-- SUCCESS CRITERIA
-- ============================================================================
-- ✅ All 26 campaigns visible to UYSP users
-- ✅ All 1,211 leads associated with UYSP client
-- ✅ Campaign counts match on dashboard
-- ✅ Lead detail pages load correctly
-- ✅ No campaigns visible under SYSTEM client
-- ✅ SYSTEM client record deleted
-- ✅ Backup tables created successfully
-- ============================================================================

-- ROLLBACK SCRIPT (if needed)
-- ============================================================================
-- If this migration causes issues, run the following to restore:
--
-- BEGIN;
--
-- UPDATE campaigns c
-- SET client_id = b.client_id, updated_at = b.updated_at
-- FROM campaigns_backup_20251112 b
-- WHERE c.id = b.id;
--
-- UPDATE leads l
-- SET client_id = b.client_id, updated_at = b.updated_at
-- FROM leads_backup_20251112 b
-- WHERE l.id = b.id;
--
-- UPDATE client_project_tasks t
-- SET client_id = b.client_id, updated_at = b.updated_at
-- FROM client_project_tasks_backup_20251112 b
-- WHERE t.id = b.id;
--
-- UPDATE client_project_blockers bl
-- SET client_id = b.client_id, updated_at = b.updated_at
-- FROM client_project_blockers_backup_20251112 b
-- WHERE bl.id = b.id;
--
-- UPDATE client_project_status s
-- SET client_id = b.client_id, updated_at = b.updated_at
-- FROM client_project_status_backup_20251112 b
-- WHERE s.id = b.id;
--
-- COMMIT;
-- ============================================================================
