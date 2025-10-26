/**
 * List all users in the database
 * Usage: npx tsx scripts/list-users.ts
 */

import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';

async function listUsers() {
  try {
    console.log('\n🔍 Fetching all users...\n');

    const allUsers = await db.query.users.findMany({
      orderBy: (users, { asc }) => [asc(users.email)],
    });

    if (allUsers.length === 0) {
      console.log('No users found in the database.\n');
      return;
    }

    console.log(`Found ${allUsers.length} user(s):\n`);
    console.log('─'.repeat(120));
    console.log(
      'EMAIL'.padEnd(35),
      'NAME'.padEnd(25),
      'ROLE'.padEnd(15),
      'CLIENT ID'.padEnd(25),
      'ACTIVE'
    );
    console.log('─'.repeat(120));

    allUsers.forEach((user) => {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || '(no name)';
      const clientId = user.clientId || '(none)';
      const status = user.isActive ? '✓ Yes' : '✗ No';

      console.log(
        user.email.padEnd(35),
        name.padEnd(25),
        user.role.padEnd(15),
        clientId.slice(0, 24).padEnd(25),
        status
      );
    });

    console.log('─'.repeat(120));
    console.log(`\nTotal: ${allUsers.length} user(s)\n`);
  } catch (error) {
    console.error('❌ Error listing users:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

listUsers();
