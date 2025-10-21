-- Delete all leads (wrong client assignment)
DELETE FROM leads;

-- Delete all clients (wrong clients)
DELETE FROM clients;

-- Create UYSP client (the ONLY real client)
INSERT INTO clients (id, company_name, email, airtable_base_id, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'UYSP',
  'davidson@iankoniak.com',
  'app4wIsBfpJTg7pWS',
  true,
  NOW(),
  NOW()
)
RETURNING id, company_name, airtable_base_id;
