import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });
import postgres from 'postgres';

(async () => {
  const sql = postgres(process.env.DATABASE_URL!);
  
  const user = await sql`SELECT email, role, client_id FROM users WHERE email = 'rebel@rebelhq.ai'`;
  
  if (user.length === 0) {
    console.log('❌ User rebel@rebelhq.ai not found');
  } else {
    console.log('Current status for rebel@rebelhq.ai:');
    console.log('  Role:', user[0].role);
    console.log('  Client ID:', user[0].client_id);
    
    if (user[0].role !== 'ADMIN') {
      console.log('\n🔧 Updating to ADMIN...');
      await sql`UPDATE users SET role = 'ADMIN' WHERE email = 'rebel@rebelhq.ai'`;
      console.log('✅ Role updated to ADMIN');
      console.log('\n🔄 Please logout and login again to refresh your session');
    } else {
      console.log('\n✅ Already set as ADMIN');
      console.log('🔄 If you don\'t see Admin link, please logout and login again');
    }
  }
  
  await sql.end();
})();






