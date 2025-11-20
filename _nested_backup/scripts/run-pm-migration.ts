import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/db/schema';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function runMigration() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not found in environment');
    process.exit(1);
  }

  console.log('Connecting to database...');
  
  // Create postgres connection with SSL
  const connection = postgres(DATABASE_URL, { ssl: 'require' });
  const db = drizzle(connection, { schema });

  try {
    console.log('Creating client_project_tasks table...');
    await connection`
      CREATE TABLE IF NOT EXISTS client_project_tasks (
        id varchar(50) PRIMARY KEY NOT NULL,
        client_id uuid NOT NULL,
        airtable_record_id varchar(255) NOT NULL UNIQUE,
        task varchar(500) NOT NULL,
        status varchar(50) NOT NULL,
        priority varchar(50) NOT NULL,
        owner varchar(100),
        due_date timestamp,
        notes text,
        dependencies text,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `;

    console.log('Creating client_project_blockers table...');
    await connection`
      CREATE TABLE IF NOT EXISTS client_project_blockers (
        id varchar(50) PRIMARY KEY NOT NULL,
        client_id uuid NOT NULL,
        airtable_record_id varchar(255) NOT NULL UNIQUE,
        blocker varchar(500) NOT NULL,
        severity varchar(50) NOT NULL,
        action_to_resolve text,
        status varchar(50) NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        resolved_at timestamp
      );
    `;

    console.log('Creating client_project_status table...');
    await connection`
      CREATE TABLE IF NOT EXISTS client_project_status (
        id varchar(50) PRIMARY KEY NOT NULL,
        client_id uuid NOT NULL,
        airtable_record_id varchar(255) NOT NULL UNIQUE,
        metric varchar(200) NOT NULL,
        value text NOT NULL,
        category varchar(50) NOT NULL,
        display_order integer,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `;

    console.log('Creating indexes...');
    await connection`CREATE INDEX IF NOT EXISTS idx_project_tasks_client_id ON client_project_tasks (client_id);`;
    await connection`CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON client_project_tasks (status);`;
    await connection`CREATE INDEX IF NOT EXISTS idx_project_tasks_priority ON client_project_tasks (priority);`;
    await connection`CREATE INDEX IF NOT EXISTS idx_project_tasks_airtable_record ON client_project_tasks (airtable_record_id);`;
    
    await connection`CREATE INDEX IF NOT EXISTS idx_project_blockers_client_id ON client_project_blockers (client_id);`;
    await connection`CREATE INDEX IF NOT EXISTS idx_project_blockers_severity ON client_project_blockers (severity);`;
    await connection`CREATE INDEX IF NOT EXISTS idx_project_blockers_status ON client_project_blockers (status);`;
    await connection`CREATE INDEX IF NOT EXISTS idx_project_blockers_airtable_record ON client_project_blockers (airtable_record_id);`;
    
    await connection`CREATE INDEX IF NOT EXISTS idx_project_status_client_id ON client_project_status (client_id);`;
    await connection`CREATE INDEX IF NOT EXISTS idx_project_status_category ON client_project_status (category);`;
    await connection`CREATE INDEX IF NOT EXISTS idx_project_status_airtable_record ON client_project_status (airtable_record_id);`;

    console.log('✅ Migration complete! PM tables created successfully.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();

