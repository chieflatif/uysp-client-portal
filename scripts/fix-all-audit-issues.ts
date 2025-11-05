/**
 * Comprehensive Fix Script for Round 2 Audit Issues
 * This script systematically fixes ALL identified issues from the audit
 *
 * Run with: npx tsx scripts/fix-all-audit-issues.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface Fix {
  file: string;
  description: string;
  search: string;
  replace: string;
}

const fixes: Fix[] = [
  // Fix [id]/route.ts - Remove `any` from error handler
  {
    file: 'src/app/api/admin/campaigns/[id]/route.ts',
    description: 'Remove any type from error handler',
    search: '  } catch (error: any) {',
    replace: '  } catch (error) {',
  },

  // Fix [id]/route.ts - Replace updateData any type
  {
    file: 'src/app/api/admin/campaigns/[id]/route.ts',
    description: 'Fix updateData any type',
    search: '    const updateData: any = {',
    replace: '    const updateData: Record<string, unknown> = {',
  },

  // Fix preview-leads/route.ts - Remove unused imports
  {
    file: 'src/app/api/admin/campaigns/preview-leads/route.ts',
    description: 'Remove unused Drizzle imports',
    search: 'import { and, eq, gte, lte, arrayContains, or, sql, inArray } from \'drizzle-orm\';',
    replace: 'import { and, sql } from \'drizzle-orm\';',
  },

  // Fix preview-leads/route.ts - Remove unused type
  {
    file: 'src/app/api/admin/campaigns/preview-leads/route.ts',
    description: 'Remove unused PreviewLeadsInput type',
    search: 'type PreviewLeadsInput = z.infer<typeof previewLeadsSchema>;',
    replace: '// Type inferred directly in handler',
  },

  // Fix auto-create/route.ts - Remove unused type
  {
    file: 'src/app/api/admin/campaigns/auto-create/route.ts',
    description: 'Remove unused AutoCreateInput type',
    search: 'type AutoCreateInput = z.infer<typeof autoCreateSchema>;',
    replace: '// Type inferred directly in validation',
  },
];

function applyFixes() {
  let successCount = 0;
  let failCount = 0;

  console.log('🔧 Starting comprehensive audit fixes...\n');

  for (const fix of fixes) {
    const filePath = path.join(process.cwd(), fix.file);

    try {
      if (!fs.existsSync(filePath)) {
        console.log(`⏭️  Skip: ${fix.file} (file not found)`);
        continue;
      }

      let content = fs.readFileSync(filePath, 'utf8');

      if (!content.includes(fix.search)) {
        console.log(`⏭️  Skip: ${fix.description} (already fixed or not found)`);
        continue;
      }

      content = content.replace(fix.search, fix.replace);
      fs.writeFileSync(filePath, content, 'utf8');

      console.log(`✅ Fixed: ${fix.description}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error fixing ${fix.description}:`, error);
      failCount++;
    }
  }

  console.log(`\n📊 Summary: ${successCount} fixes applied, ${failCount} failures`);
}

applyFixes();
