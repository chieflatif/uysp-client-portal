# Production Database Migration Strategy

A reliable database migration strategy is not optional; it is a prerequisite for successful, automated deployments. The catastrophic failure of the UYSP Client Portal deployment was a direct result of deploying an application before its corresponding database schema was created. This document outlines the standard operating procedures for database migrations to prevent this class of error entirely.

---

## The Core Principle: Schema First, Application Second

An application that reads from or writes to a database table requires that table, and all its expected columns, to exist. Therefore, the database schema **must** be updated to the correct state *before* the application code that depends on it is deployed.

There are three primary, approved strategies for achieving this.

---

## Strategy 1: Automated Migration via Bootstrap Endpoint (Recommended)

This is the most robust and automated approach. It involves creating a secure, idempotent API endpoint within the application that, when called, runs all necessary database migrations.

### How It Works

1.  **Create a Bootstrap Endpoint**: A dedicated API route (e.g., `/api/setup/bootstrap`) is created. This route is responsible for programmatically running migrations.
2.  **Security**: The endpoint **must** be protected by a secret key, passed as a header or query parameter, to prevent unauthorized execution. This secret should be stored securely (e.g., as a GitHub Secret).
3.  **Idempotency**: The migration logic should be idempotent, meaning it can be run multiple times without causing errors. It should check if migrations have already been applied (e.g., by using a `migrations` table that logs executed scripts) or use `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` to avoid errors on subsequent runs.
4.  **CI/CD Integration**: The deployment workflow (e.g., GitHub Actions) is configured to call this endpoint automatically after a new version of the application is confirmed to be "live".

### Example Bootstrap Endpoint (`route.ts`)

```typescript
// src/app/api/setup/bootstrap/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Raw SQL from your Drizzle migration files
const MIGRATION_SQL = `
  CREATE TABLE IF NOT EXISTS "users" ( ... );
  CREATE TABLE IF NOT EXISTS "leads" ( ... );
  -- Add all other CREATE TABLE and ALTER TABLE statements here
`;

async function handle(req: NextRequest) {
  // 1. Verify secret
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.BOOTSTRAP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // 2. Run Migrations
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await pool.query(MIGRATION_SQL);
    // 3. (Optional) Seed initial data
    await pool.query(`INSERT INTO users (...) VALUES (...) ON CONFLICT DO NOTHING;`);
    return NextResponse.json({ ok: true, message: 'Bootstrap complete' });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  } finally {
    await pool.end();
  }
}

export async function GET(req: NextRequest) { return handle(req); }
```

---

## Strategy 2: Release Phase Migrations (Render Specific)

For platforms like Heroku or Render (with a `render.yaml`), you can specify a "release phase" command. This command runs *after* the new version is built but *before* it is switched to "live" to receive traffic.

### How It Works

1.  **Create a Migration Script**: Create a script in your repository (e.g., `scripts/run-migrations.sh`) that executes the migrations.
2.  **Configure `render.yaml`**: Define a `migrate` command in the `pre-deploy` or `release` phase of your service definition.

### Example `render.yaml`

```yaml
services:
  - type: web
    name: my-app
    env: node
    plan: starter
    buildCommand: "npm install && npm run build"
    startCommand: "npm run start"
    preDeployCommand: "npm run db:migrate" # This runs migrations before the app goes live
```

### Example Migration Script (`package.json`)

This assumes you are using a library like `node-postgres-migrate`.

```json
{
  "scripts": {
    "db:migrate": "migrate -d ./migrations -c migrate-config.js up"
  }
}
```

---

## Strategy 3: Manual, but Controlled, Migration

This is the least preferred method and should only be used if automation is not possible. It relies on a human operator but follows a strict, verifiable process.

### How It Works

1.  **Put App in Maintenance Mode**: Before deploying, enable a maintenance mode for your application to prevent users from accessing it during the schema change.
2.  **Deploy New Code**: Push the new version of the application code.
3.  **Connect to DB via Shell**: Manually connect to the production database using a secure shell (e.g., the Render Shell with `psql`).
4.  **Execute Migrations**: Manually run the required SQL migration files. **Crucially, you must run the FULL migration scripts, not partial or incomplete statements.**
5.  **Disable Maintenance Mode**: Once the application is live and migrations are complete, disable maintenance mode.

This manual process is what the agent should have guided the user through if all automation attempts failed. Its failure to do so correctly was a primary source of the deployment disaster.
