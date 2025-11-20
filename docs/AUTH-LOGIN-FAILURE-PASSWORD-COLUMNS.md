# Recurrent Auth Login Failure – Missing `password_setup_token` Columns

**Latest repro:** 20 Nov 2025 (staging + test services)

This incident keeps showing up because the staging database is frequently rebuilt from a snapshot that predates migration **0035_fix_missing_password_setup_token_columns** (and the parity catch‑up in **0040_schema_parity.sql**). When that happens the `users` table loses the `password_setup_token` and `password_setup_token_expiry` columns, which immediately breaks every authentication attempt.

---

## 1. Symptoms

- Portal login returns a 500 and NextAuth shows `Failed query: select ... "password_setup_token", "password_setup_token_expiry" ... from "users" ...`
- Postgres error log (or Drizzle query logger) contains `column "password_setup_token" does not exist` (sometimes swallowed by the “Failed query” wrapper)
- Only the portal login is broken; other queries still work

---

## 2. Root Cause

1. Database restore / new environment spins up from an older dump (pre-migration 0035/0040)
2. `users` table schema regresses → columns + index removed
3. `db.query.users.findFirst` (and the Direct PG fallback) both select those columns, so Postgres throws immediately

This exact scenario is already documented in:

- `SCHEMA-MISMATCH-FIX-COMPLETE.md`
- `LOGIN-FIX-COMPLETE.md`

The problem persists simply because the fix was never added to the staging bring-up checklist.

---

## 3. Quick Diagnosis

Run the column check (works on prod/staging/preview):

```bash
psql "$DATABASE_URL" -c "
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'users'
    AND column_name IN (
      'must_change_password',
      'password_setup_token',
      'password_setup_token_expiry'
    )
  ORDER BY column_name;
"
```

If either `password_setup_token` or `password_setup_token_expiry` is missing, you’ve hit this issue.

---

## 4. Fix Procedure (5 minutes)

> **Never** edit the table manually from psql — always run the migration script so every environment stays consistent.

1. Ensure `DATABASE_URL` is set to the affected environment.
2. Run the automated patch:

```bash
./apply-migration-0035.sh
# or (same SQL in TypeScript form)
npx tsx run-migration-0035.ts
```

Both scripts:
- add the two columns (no-op if they already exist)
- add the `idx_users_setup_token` index
- log before/after schema state for audit purposes

3. Re-run the column check (Section 3) to confirm.
4. Attempt a portal login (or hit `/api/auth/[...nextauth]` credentials flow) to verify.

👉 **Important:** Re-run `npm run db:migrate` after this fix if any other migrations are pending, so Drizzle’s meta-journal stays aligned.

---

## 5. Preventive Checklist

Add these two items whenever staging/test DBs are reprovisioned:

1. `./apply-migration-0035.sh` (or `tsx run-migration-0035.ts`)
2. `npm run db:migrate` (ensures future columns stay in sync)

This guarantees the `users` table always carries the auth columns that NextAuth depends on.

---

## 6. Fast Reference

| Item | Location |
| --- | --- |
| SQL Migration | `migrations/0035_fix_missing_password_setup_token_columns.sql` |
| Script wrapper | `apply-migration-0035.sh` / `run-migration-0035.ts` |
| Prior write-ups | `SCHEMA-MISMATCH-FIX-COMPLETE.md`, `LOGIN-FIX-COMPLETE.md` |
| Owner | Platform / DB maintenance |

Next time this crops up, search for `password_setup_token` in `docs/` and this file will show up immediately.


