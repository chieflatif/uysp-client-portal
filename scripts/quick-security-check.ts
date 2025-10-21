import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });
import postgres from 'postgres';

(async () => {
  const sql = postgres(process.env.DATABASE_URL!);
  
  console.log('🔒 Quick Security Check\n');
  
  const clients = await sql`SELECT id, company_name FROM clients`;
  console.log(`Clients: ${clients.length}`);
  clients.forEach(c => console.log(`  - ${c.company_name}`));
  
  const users = await sql`SELECT email, client_id IS NOT NULL as has_client FROM users`;
  console.log(`\nUsers: ${users.length}`);
  const withClient = users.filter(u => u.has_client).length;
  console.log(`  With clientId: ${withClient}/${users.length}`);
  
  const leads = await sql`SELECT COUNT(*) as total, COUNT(client_id) as with_client FROM leads`;
  console.log(`\nLeads:`);
  console.log(`  Total: ${leads[0].total}`);
  console.log(`  With clientId: ${leads[0].with_client}`);
  
  console.log(withClient === users.length && leads[0].total === leads[0].with_client 
    ? '\n✅ Security ready for production!'
    : '\n⚠️ Some data needs clientId assignment');
  
  await sql.end();
})();



