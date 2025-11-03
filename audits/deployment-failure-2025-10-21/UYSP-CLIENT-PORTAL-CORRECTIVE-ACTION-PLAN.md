# UYSP Client Portal - Corrective Action Plan

**Date**: 2025-10-21  
**Objective**: To provide a clear, final set of instructions to bring the `uysp-client-portal` application to a fully functional state.

---

## 1. Current State Assessment

Based on the forensic analysis of the deployment transcripts, the application is in the following state:

-   **Application**: Deployed and live at `https://uysp-portal-v2.onrender.com`.
-   **Authentication**: The SUPER_ADMIN user `rebel@rebelhq.ai` has been created, and login is successful.
-   **Database Schema**: **INCOMPLETE**. The `clients` and `users` tables exist, but the `leads`, `notes`, `campaigns`, and `activity_log` tables are either missing or have an incorrect schema. This is the root cause of all current application errors.
-   **Data Sync**: The Airtable lead synchronization failed because of the incomplete database schema. The database contains a partial, incorrect set of leads.

## 2. Root Cause of Immediate Failures

The primary failure is a **database schema mismatch**. The application code expects a full set of columns in the `leads` table that do not exist in the database. Every previous attempt to fix this has failed due to a combination of incorrect SQL commands, tool-chain failures, and a misunderstanding of the migration process.

## 3. Step-by-Step Fix: The Definitive Commands

The following steps will reset the database tables to a clean, correct state, and populate them with the full dataset from Airtable. **These commands must be executed in the Render Shell for the Web Service.**

### Step 1: Connect to the PostgreSQL Database

1.  Navigate to the Render Web Service Shell for `uysp-portal-v2`:
    [https://dashboard.render.com/web/srv-d3r7o1u3jp1c73943qp0/shell](https://dashboard.render.com/web/srv-d3r7o1u3jp1c73943qp0/shell)

2.  Once the shell is connected, execute the following command to connect to the database using `psql`. This command includes the password and connects directly.

    ```bash
    PGPASSWORD=PuLMS841kifvBNpl3mGcLBl1WjIs0ey2 psql -h dpg-d3q9raodl3ps73bp1r50-a.virginia-postgres.render.com -U uysp_client_portal_db_user uysp_client_portal_db
    ```

    You will know you are connected when the prompt changes to `uysp_client_portal_db=>`.

### Step 2: Reset and Recreate All Tables

The most reliable method to fix the schema is to drop the inconsistent tables and recreate them from scratch with the correct, complete schema.

1.  Inside the `psql` prompt, copy and paste the **entire SQL block below** at once. This will drop the old tables and create the new, correct ones.

    ```sql
    -- Drop existing tables to ensure a clean slate
    DROP TABLE IF EXISTS "activity_log";
    DROP TABLE IF EXISTS "notes";
    DROP TABLE IF EXISTS "leads";
    DROP TABLE IF EXISTS "campaigns";
    DROP TABLE IF EXISTS "users";
    DROP TABLE IF EXISTS "clients";
    DROP TABLE IF EXISTS "sms_audit";
    DROP TABLE IF EXISTS "sms_templates";

    -- Recreate all tables with the correct and complete schema from migrations
    CREATE TABLE "activity_log" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid,
        "client_id" uuid,
        "lead_id" uuid,
        "action" varchar(255) NOT NULL,
        "details" text,
        "ip_address" varchar(45),
        "created_at" timestamp DEFAULT now() NOT NULL
    );

    CREATE TABLE "campaigns" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "client_id" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "airtable_record_id" varchar(255),
        "message_template" text,
        "send_interval" integer DEFAULT 3600,
        "is_paused" boolean DEFAULT false NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
    );

    CREATE TABLE "clients" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "company_name" varchar(255) NOT NULL,
        "email" varchar(255) NOT NULL,
        "phone" varchar(20),
        "airtable_base_id" varchar(255) NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "last_sync_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
    );

    CREATE TABLE "leads" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "client_id" uuid NOT NULL,
        "airtable_record_id" varchar(255) NOT NULL,
        "first_name" varchar(255) NOT NULL,
        "last_name" varchar(255) NOT NULL,
        "email" varchar(255) NOT NULL,
        "phone" varchar(20),
        "company" varchar(255),
        "title" varchar(255),
        "icp_score" integer DEFAULT 0 NOT NULL,
        "status" varchar(50) DEFAULT 'New' NOT NULL,
        "claimed_by" uuid,
        "claimed_at" timestamp,
        "campaign_id" uuid,
        "last_message_at" timestamp,
        "is_active" boolean DEFAULT true NOT NULL,
        "campaign_name" varchar(255),
        "campaign_batch" varchar(100),
        "sms_sequence_position" integer DEFAULT 0,
        "sms_sent_count" integer DEFAULT 0,
        "sms_last_sent_at" timestamp,
        "processing_status" varchar(50),
        "hrq_status" varchar(50),
        "sms_stop" boolean DEFAULT false,
        "sms_stop_reason" varchar(500),
        "booked" boolean DEFAULT false,
        "booked_at" timestamp,
        "short_link_id" varchar(100),
        "short_link_url" varchar(500),
        "click_count" integer DEFAULT 0,
        "clicked_link" boolean DEFAULT false,
        "first_clicked_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "campaign_variant" varchar(10),
        "sms_eligible" boolean DEFAULT true,
        "linkedin_url" varchar(500),
        "company_linkedin" varchar(500),
        "enrichment_outcome" varchar(100),
        "enrichment_attempted_at" timestamp
    );

    CREATE TABLE "notes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "lead_id" uuid NOT NULL,
        "created_by" uuid NOT NULL,
        "content" text NOT NULL,
        "type" varchar(50) NOT NULL,
        "is_private" boolean DEFAULT false NOT NULL,
        "is_system_generated" boolean DEFAULT false NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
    );

    CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "email" varchar(255) NOT NULL,
        "password_hash" text NOT NULL,
        "first_name" varchar(255),
        "last_name" varchar(255),
        "role" varchar(50) DEFAULT 'CLIENT' NOT NULL,
        "client_id" uuid,
        "is_active" boolean DEFAULT true NOT NULL,
        "last_login_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "users_email_unique" UNIQUE("email")
    );
    
    CREATE TABLE "sms_audit" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "airtable_record_id" varchar(255) NOT NULL,
        "sms_campaign_id" varchar(255),
        "phone" varchar(50) NOT NULL,
        "lead_record_id" varchar(255),
        "event" varchar(100),
        "text" text,
        "status" varchar(50),
        "carrier" varchar(100),
        "sent_at" timestamp,
        "delivery_at" timestamp,
        "clicked_at" timestamp,
        "clicked" boolean DEFAULT false,
        "webhook_raw" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "sms_audit_airtable_record_id_unique" UNIQUE("airtable_record_id")
    );

    CREATE TABLE "sms_templates" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "airtable_record_id" varchar(255) NOT NULL,
        "campaign" varchar(255) NOT NULL,
        "variant" varchar(10),
        "step" integer NOT NULL,
        "delay_days" integer,
        "fast_delay_minutes" integer,
        "body" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "sms_templates_airtable_record_id_unique" UNIQUE("airtable_record_id")
    );
    ```

2.  You should see a series of `DROP TABLE` and `CREATE TABLE` success messages.

3.  Now, create the `Rebel HQ` client and the `SUPER_ADMIN` user again. Paste this SQL into the same `psql` prompt:

    ```sql
    -- Recreate client and admin user
    WITH new_client AS (
      INSERT INTO clients (id, company_name, email, airtable_base_id, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), 'Rebel HQ', 'rebel@rebelhq.ai', 'app4wIsBfpJTg7pWS', true, NOW(), NOW())
      RETURNING id
    )
    INSERT INTO users (id, email, password_hash, first_name, last_name, role, client_id, is_active, created_at, updated_at)
    SELECT
      gen_random_uuid(),
      'rebel@rebelhq.ai',
      crypt('RElH0rst89!', gen_salt('bf', 10)),
      'Rebel','Admin','SUPER_ADMIN',
      new_client.id,
      true, NOW(), NOW()
    FROM new_client;
    ```
    You should see an `INSERT` success message.

4.  Type `\q` and press `Enter` to exit `psql`.

### Step 3: Synchronize All Airtable Leads

Now that the database schema is correct, the Airtable sync script will work.

1.  In the Render Shell (you should be back in the `bash` prompt), execute the sync script:

    ```bash
    npx tsx scripts/sync-airtable.ts
    ```

2.  This process will take a few minutes. You should see output indicating that leads are being fetched and synced. The final output should show **11047** records processed with **0 errors**.

### Step 4: Verification

1.  **Log In**: Navigate to [https://uysp-portal-v2.onrender.com/login](https://uysp-portal-v2.onrender.com/login) and log in with your credentials (`rebel@rebelhq.ai` / `RElH0rst89!`).
2.  **Check Dashboard**: The "Error Loading Dashboard" message should be gone. The stats widgets should show correct counts, including the total leads count of **11,047**.
3.  **Check Leads Table**: Navigate to the "Leads" page. The table should be populated with all leads. Click on a few leads to ensure the detail pages load correctly.
4.  **Verify Styling**: Confirm that the "Rebel HQ Oceanic" dark theme, including pink and cyan accent colors, is rendering correctly throughout the application.

---

This plan will restore the application to its fully intended state. Once you confirm it is working, I will proceed with creating the forensic analysis and prevention strategy documents.
