import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { getGlobalPool, executeWithTimeout } from '../src/lib/db/pool';

async function test() {
  try {
    console.log('='.repeat(60));
    console.log('TESTING CONNECTION POOL');
    console.log('='.repeat(60));

    console.log('\n1. Getting global pool...');
    const pool = getGlobalPool();
    console.log('✅ Pool created');

    console.log('\n2. Testing simple query...');
    const result1 = await pool.query('SELECT 1 as test');
    console.log('✅ Simple query works:', result1.rows);

    console.log('\n3. Testing with timeout wrapper...');
    const result2 = await executeWithTimeout(
      async () => pool.query('SELECT 2 as test'),
      5000,
      3
    );
    console.log('✅ Timeout wrapper works:', result2.rows);

    console.log('\n4. Testing actual user query...');
    const result3 = await executeWithTimeout(
      async () => pool.query(
        `SELECT id, email, role FROM users WHERE email = $1 LIMIT 1`,
        ['rebel@rebelhq.ai']
      ),
      5000,
      3
    );
    console.log('✅ User query works:', result3.rows);

    console.log('\n' + '='.repeat(60));
    console.log('ALL TESTS PASSED');
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(60));
    console.error(error);
    process.exit(1);
  }
}

test();
