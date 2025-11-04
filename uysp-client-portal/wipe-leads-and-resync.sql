-- Wipe all leads for a fresh sync from Airtable
-- WARNING: This permanently deletes ALL leads for the specified client
-- Only use this when you have a fresh Airtable and want to start clean

-- Step 1: Find your client ID
SELECT id, company_name, airtable_base_id, last_sync_at
FROM clients
WHERE company_name ILIKE '%ian%' OR company_name ILIKE '%uysp%';

-- Step 2: (COPY THE CLIENT ID FROM ABOVE)
-- Replace 'YOUR-CLIENT-ID-HERE' with the actual UUID

-- Check how many leads will be deleted (SAFETY CHECK)
SELECT COUNT(*) as total_leads
FROM leads
WHERE client_id = 'YOUR-CLIENT-ID-HERE';

-- Step 3: Delete all leads for this client
-- UNCOMMENT THE LINE BELOW WHEN READY:
-- DELETE FROM leads WHERE client_id = 'YOUR-CLIENT-ID-HERE';

-- Step 4: Verify deletion
SELECT COUNT(*) as remaining_leads
FROM leads
WHERE client_id = 'YOUR-CLIENT-ID-HERE';

-- Expected result: remaining_leads = 0

-- Step 5: After running this, go to the admin UI and click "Sync Airtable"
-- The sync will pull all fresh data from your new Airtable without the 10% safety threshold blocking it
