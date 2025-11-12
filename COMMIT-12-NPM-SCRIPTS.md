# COMMIT 12: NPM Scripts

## Summary
Added convenient npm scripts for running the bi-directional reconciliation engine from the command line.

## Files Modified

### 1. `package.json` (+5 scripts)
Added sync convenience scripts:

```json
"scripts": {
  // New sync scripts
  "sync:delta": "tsx -r dotenv/config scripts/run-reconciler.ts 20",
  "sync:delta:1h": "tsx -r dotenv/config scripts/run-reconciler.ts 60",
  "sync:delta:6h": "tsx -r dotenv/config scripts/run-reconciler.ts 360",
  "sync:delta:24h": "tsx -r dotenv/config scripts/run-reconciler.ts 1440",
  "sync:help": "echo \"...[help text]...\""
}
```

## Files Created

### 1. `scripts/run-reconciler.ts` (145 lines)
**Purpose**: CLI runner for bi-directional reconciliation engine

**Features**:
- ✅ Command-line argument parsing (lookback minutes)
- ✅ Input validation (1-1440 range)
- ✅ Environment check (DATABASE_URL)
- ✅ Formatted banner display
- ✅ Comprehensive statistics reporting
- ✅ Error summary (shows first 5 errors)
- ✅ Proper exit codes (0 = success, 1 = failure)
- ✅ Warning for high error counts (>10 errors)

**Output Format**:
```
======================================================================
  BI-DIRECTIONAL RECONCILIATION ENGINE
======================================================================
  Lookback window: 20 minutes
  Started at: 2025-11-12T10:30:00.000Z
======================================================================

🔄 Starting bi-directional reconciliation...
   ... [reconciler output] ...

======================================================================
  RECONCILIATION COMPLETE
======================================================================

📊 Statistics:
   Duration: 5.23s
   Client: client-uuid-here
   Status: ✅ SUCCESS

📥 Stage 1: Airtable → PostgreSQL
   Records processed: 15
   Inserted: 5
   Updated: 10
   Errors: 0

📤 Stage 2: PostgreSQL → Airtable
   Records processed: 8
   Updated: 6
   Skipped (grace period): 2
   Errors: 0

======================================================================
```

## Usage

### Quick Sync (Predefined Windows)
```bash
# Sync last 20 minutes (default)
npm run sync:delta

# Sync last 1 hour
npm run sync:delta:1h

# Sync last 6 hours
npm run sync:delta:6h

# Sync last 24 hours (maximum)
npm run sync:delta:24h

# Show help
npm run sync:help
```

### Custom Sync Window
```bash
# Sync last 2 hours (120 minutes)
tsx scripts/run-reconciler.ts 120

# Sync last 30 minutes
tsx scripts/run-reconciler.ts 30
```

### Cron Job Setup
```bash
# Add to crontab for automatic sync every 20 minutes
*/20 * * * * cd /path/to/uysp-client-portal && npm run sync:delta >> /var/log/reconciler.log 2>&1
```

## Error Handling

### Invalid Input
```bash
$ tsx scripts/run-reconciler.ts abc

❌ Invalid lookback minutes
   Must be a number between 1 and 1440 (24 hours)

   Usage: tsx scripts/run-reconciler.ts <minutes>
   Example: tsx scripts/run-reconciler.ts 60
```

### Missing Environment Variable
```bash
$ npm run sync:delta

❌ DATABASE_URL not found in environment
   Make sure .env file exists with DATABASE_URL set
```

### Reconciliation Failure
```bash
$ npm run sync:delta

======================================================================
  ❌ RECONCILIATION FAILED
======================================================================

Error: No active client found in database. Please ensure at least one
client is marked as active in the clients table.
```

## Exit Codes

| Exit Code | Meaning |
|-----------|---------|
| 0 | Success (or <10 errors) |
| 1 | Failed validation, missing env, or >10 errors |

## Integration with Existing Scripts

The new sync scripts complement existing scripts:

```bash
# Database operations
npm run db:migrate          # Run migrations
npm run db:studio           # Open Drizzle Studio
npm run db:push             # Push schema changes

# Testing
npm run test                # Unit tests
npm run test:integration    # Integration tests (includes reconciler tests)
npm run test:all            # All tests

# Sync operations (NEW!)
npm run sync:delta          # Run reconciler
npm run sync:delta:1h       # Run with custom window
npm run sync:help           # Show sync help

# Development
npm run dev                 # Start dev server
npm run build               # Build for production
npm run type-check          # Check types

# Validation
npm run validate            # Full validation (types, lint, tests)
npm run pre-deploy          # Pre-deployment checks
```

## Technical Details

### Script Arguments
- **Input**: Minutes (1-1440)
- **Default**: 20 minutes
- **Passed to**: `reconcileRecentChanges(minutes)`

### Environment Requirements
- `DATABASE_URL`: PostgreSQL connection string
- `AIRTABLE_API_KEY`: Airtable API key
- `AIRTABLE_BASE_ID`: Airtable base ID

### Output Formatting
- Banner width: 70 characters
- Error preview: First 5 errors (with count if more)
- Duration: Fixed to 2 decimal places
- Timestamps: ISO 8601 format

### Error Reporting
```typescript
// Shows first 5 errors
if (result.stage1.errors.length > 0) {
  console.log(`\n   ⚠️  Stage 1 Errors:`);
  result.stage1.errors.slice(0, 5).forEach((err, idx) => {
    console.log(`   ${idx + 1}. ${err}`);
  });
  if (result.stage1.errors.length > 5) {
    console.log(`   ... and ${result.stage1.errors.length - 5} more errors`);
  }
}
```

### Exit Code Logic
```typescript
// Exit 1 if failed
if (!result.success) {
  process.exit(1);
}

// Exit 1 if too many errors (>10)
const totalErrors = result.stage1.errors.length + result.stage2.errors.length;
if (totalErrors > 10) {
  console.warn(`\n⚠️  Warning: ${totalErrors} total errors encountered`);
  process.exit(1);
}

// Exit 0 if success
process.exit(0);
```

## Use Cases

### 1. Manual Sync After Data Import
```bash
# After importing leads to Airtable, sync to PostgreSQL
npm run sync:delta:1h
```

### 2. Recovery After Downtime
```bash
# After system downtime, sync last 24 hours
npm run sync:delta:24h
```

### 3. Automated Cron Job
```bash
# Set up cron job for continuous sync
*/20 * * * * cd /app && npm run sync:delta
```

### 4. Development Testing
```bash
# Quick test with minimal data
tsx scripts/run-reconciler.ts 5
```

### 5. CI/CD Pipeline
```bash
# Run sync as part of deployment
npm run sync:delta || echo "Sync failed, investigate"
```

## Production Readiness

✅ **Input Validation**: Rejects invalid minutes
✅ **Environment Check**: Verifies DATABASE_URL exists
✅ **Error Handling**: Catches and reports all errors
✅ **Exit Codes**: Proper codes for automation
✅ **Logging**: Clear, structured output
✅ **Configurable**: Supports custom time windows

## Technical Debt
**ZERO** - Scripts follow npm best practices and proper error handling

## Next Steps
- Commit 13: Create comprehensive documentation

---

**Status**: ✅ COMPLETE - All npm scripts implemented and tested
**Date**: 2025-11-12
**Commit**: #12
