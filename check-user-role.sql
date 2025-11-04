-- Check current user roles
SELECT 
  id,
  email,
  role,
  "firstName",
  "lastName"
FROM users
ORDER BY "createdAt" DESC
LIMIT 10;
