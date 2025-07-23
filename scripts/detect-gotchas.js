#!/usr/bin/env node

/**
 * Platform Gotcha Detection Script
 * Scans workflow JSON for common gotchas that cause failures
 */

const fs = require('fs');
const path = require('path');

function detectGotchas(workflowPath) {
  console.log(`🔍 Scanning workflow: ${workflowPath}`);
  
  if (!fs.existsSync(workflowPath)) {
    console.error(`❌ Workflow file not found: ${workflowPath}`);
    return false;
  }

  const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
  const nodes = workflow.nodes || [];
  let gotchasFound = 0;

  console.log('\n🚨 PLATFORM GOTCHA DETECTION RESULTS:\n');

  // GOTCHA #17: Airtable Date Field Format Issues
  console.log('📅 GOTCHA #17: Airtable Date Field Expressions');
  nodes.forEach(node => {
    if (node.type === 'n8n-nodes-base.airtable') {
      const columns = node.parameters?.columns?.value;
      if (columns) {
        Object.keys(columns).forEach(fieldName => {
          const value = columns[fieldName];
          
          // Check for invalid $now expression
          if (typeof value === 'string' && value.includes('{{$now}}')) {
            console.log(`❌ CRITICAL: Node "${node.name}" field "${fieldName}" uses invalid {{$now}} expression`);
            console.log(`   FIX: Use {{DateTime.now().toFormat('M/d/yyyy')}} for date fields or {{DateTime.now().toISO()}} for dateTime fields`);
            gotchasFound++;
          }
          
          // Check for potential format mismatches (warn only)
          if (typeof value === 'string' && value.includes('DateTime.now()')) {
            if (fieldName.includes('date') && !fieldName.includes('time')) {
              if (value.includes('.toISO()')) {
                console.log(`⚠️  WARNING: Node "${node.name}" field "${fieldName}" may be date field using ISO format`);
                console.log(`   VERIFY: Check if this should be {{DateTime.now().toFormat('M/d/yyyy')}} instead`);
              }
            }
          }
        });
      }
    }
  });

  // GOTCHA #1: Always Output Data Missing
  console.log('\n🔀 GOTCHA #1: Always Output Data Settings');
  nodes.forEach(node => {
    if (node.type === 'n8n-nodes-base.if' || node.type === 'n8n-nodes-base.switch') {
      if (!node.alwaysOutputData) {
        console.log(`❌ CRITICAL: Node "${node.name}" missing alwaysOutputData=true`);
        console.log(`   FIX: Enable "Always Output Data" in node settings UI`);
        gotchasFound++;
      } else {
        console.log(`✅ OK: Node "${node.name}" has alwaysOutputData enabled`);
      }
    }
  });

  // GOTCHA #2: Hardcoded Table Names
  console.log('\n📋 GOTCHA #2: Hardcoded Table Names vs IDs');
  nodes.forEach(node => {
    if (node.type === 'n8n-nodes-base.airtable') {
      const table = node.parameters?.table?.value;
      if (table && !table.startsWith('tbl')) {
        console.log(`❌ CRITICAL: Node "${node.name}" uses table name "${table}" instead of ID`);
        console.log(`   FIX: Use table ID starting with "tbl" instead of table name`);
        gotchasFound++;
      }
    }
  });

  // GOTCHA #3: Missing Credentials
  console.log('\n🔐 GOTCHA #3: Missing Credentials');
  nodes.forEach(node => {
    if (node.credentials && Object.keys(node.credentials).length === 0) {
      console.log(`❌ CRITICAL: Node "${node.name}" has empty credentials object`);
      console.log(`   FIX: Configure credentials in n8n UI`);
      gotchasFound++;
    }
  });

  // GOTCHA #4: Expression Spacing Issues  
  console.log('\n📝 GOTCHA #4: Expression Syntax Issues');
  const jsonStr = JSON.stringify(workflow);
  const badExpressions = jsonStr.match(/\{\{[^}]+\}\}/g) || [];
  badExpressions.forEach(expr => {
    if (expr.includes('{{$json.') && !expr.includes(' ')) {
      console.log(`⚠️  WARNING: Expression spacing issue detected: ${expr}`);
      console.log(`   RECOMMENDED: Use "{{ $json.field }}" with spaces for readability`);
    }
  });

  console.log(`\n📊 SUMMARY: ${gotchasFound} critical gotchas found`);
  
  if (gotchasFound === 0) {
    console.log('🎉 No critical gotchas detected! Workflow looks good.');
    return true;
  } else {
    console.log('🚨 Critical issues found. Fix these before deployment.');
    return false;
  }
}

// CLI usage
if (require.main === module) {
  const workflowPath = process.argv[2] || 'workflows/uysp-lead-processing-WORKING.json';
  const success = detectGotchas(workflowPath);
  process.exit(success ? 0 : 1);
}

module.exports = { detectGotchas }; 