-- Get all campaigns with their PostgreSQL UUIDs and Airtable Record IDs
SELECT 
  id as "PostgreSQL UUID",
  airtable_record_id as "Airtable Record ID",
  name as "Campaign Name"
FROM campaigns 
WHERE airtable_record_id IS NOT NULL
ORDER BY name;

