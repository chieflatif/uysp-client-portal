#!/usr/bin/env node

/**
 * UYSP Real Data Testing Suite
 * Tests field normalization, duplicate detection, and lead processing with actual CSV data
 */

const fs = require('fs');
const Papa = require('papaparse');

// Configuration
const CSV_PATH = process.argv[2] || '../form_submission 65.csv';
const WEBHOOK_URL = 'https://rebelhq.app.n8n.cloud/webhook/kajabi-leads';
const BATCH_SIZE = 10; // Process in batches to avoid overwhelming
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds between requests

// Test results tracking
const results = {
    testName: 'Real Data Field Normalization Test',
    startTime: new Date().toISOString(),
    totalRecords: 0,
    processedRecords: 0,
    successfulRecords: 0,
    failedRecords: 0,
    duplicatesDetected: 0,
    fieldNormalizationIssues: [],
    errors: [],
    samplePayloads: [],
    endTime: null
};

/**
 * Analyze CSV structure and field variations
 */
function analyzeCSVStructure(data) {
    console.log('\n📊 CSV Structure Analysis:');
    console.log('========================');
    
    const firstRecord = data[0];
    const fields = Object.keys(firstRecord);
    
    console.log(`Total Records: ${data.length}`);
    console.log(`\nFields Found:`);
    fields.forEach(field => {
        const nonEmptyCount = data.filter(r => r[field] && r[field].trim()).length;
        console.log(`  - "${field}": ${nonEmptyCount}/${data.length} populated (${(nonEmptyCount/data.length*100).toFixed(1)}%)`);
    });
    
    // Check for duplicates
    const emailField = 'Email Address';
    const emails = data.map(r => r[emailField]?.toLowerCase()).filter(Boolean);
    const uniqueEmails = new Set(emails);
    const duplicateCount = emails.length - uniqueEmails.size;
    
    console.log(`\nDuplicate Analysis:`);
    console.log(`  - Total emails: ${emails.length}`);
    console.log(`  - Unique emails: ${uniqueEmails.size}`);
    console.log(`  - Duplicates in CSV: ${duplicateCount}`);
    
    // Analyze field variations that need normalization
    console.log(`\n🔧 Field Normalization Requirements:`);
    console.log(`  - "Email Address" → "email"`);
    console.log(`  - "Full Name" → "name" → split to first_name/last_name`);
    console.log(`  - "Phone Number" → "phone"`);
    console.log(`  - "Company Name" → "company"`);
    console.log(`  - "Are you interested..." → "interested_in_coaching"`);
    
    return { fields, duplicateCount, uniqueEmails };
}

/**
 * Convert CSV record to webhook payload
 */
function createWebhookPayload(csvRecord, index) {
    // This payload structure will test the field normalization
    return {
        // Using exact CSV field names to test normalization
        "Email Address": csvRecord['Email Address'],
        "Full Name": csvRecord['Full Name'],
        "Company Name": csvRecord['Company Name'] || '',
        "Phone Number": csvRecord['Phone Number'] || '',
        
        // Test boolean conversion
        "interested_in_coaching": csvRecord['Are you interested in learning more about coaching with Ian?'],
        
        // Additional fields
        "landing_page_id": csvRecord['Landing Page ID'],
        "landing_page_title": csvRecord['Landing Page Title'],
        "created_at": csvRecord['Created At'],
        
        // Tracking fields
        "source_form": "lead-magnet-65",
        "request_id": `real-data-${index}-${Date.now()}`,
        "test_batch": "real-data-testing"
    };
}

/**
 * Send payload to webhook and track results
 */
async function sendToWebhook(payload, index) {
    const startTime = Date.now();
    
    try {
        console.log(`\n[${index}] Processing: ${payload['Email Address']}`);
        
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
            console.log(`  ✅ Success (${response.status}) - ${responseTime}ms`);
            results.successfulRecords++;
            
            // Save first few payloads as samples
            if (results.samplePayloads.length < 5) {
                results.samplePayloads.push({
                    index,
                    payload,
                    response: response.status,
                    responseTime
                });
            }
        } else {
            console.log(`  ❌ Failed (${response.status}) - ${response.statusText}`);
            results.failedRecords++;
            results.errors.push({
                index,
                email: payload['Email Address'],
                status: response.status,
                error: response.statusText
            });
        }
        
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        results.failedRecords++;
        results.errors.push({
            index,
            email: payload['Email Address'],
            error: error.message
        });
    }
    
    results.processedRecords++;
}

/**
 * Process CSV in batches
 */
async function processBatch(records, startIndex) {
    console.log(`\n📦 Processing batch ${Math.floor(startIndex/BATCH_SIZE) + 1}...`);
    
    for (let i = 0; i < records.length; i++) {
        const payload = createWebhookPayload(records[i], startIndex + i);
        await sendToWebhook(payload, startIndex + i + 1);
        
        // Delay between requests
        if (i < records.length - 1) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
        }
    }
}

/**
 * Verify results in Airtable
 */
async function verifyResults(uniqueEmails) {
    console.log('\n🔍 Verification Steps:');
    console.log('====================');
    
    console.log('\n1. Check Airtable for created records:');
    console.log('   - Go to People table');
    console.log('   - Filter by: test_batch = "real-data-testing"');
    console.log(`   - Expected: ${uniqueEmails.size} unique records`);
    
    console.log('\n2. Verify field normalization:');
    console.log('   - Check that "Email Address" mapped to "email" field');
    console.log('   - Check that "Full Name" split into first_name/last_name');
    console.log('   - Check that "Company Name" mapped to "company" field');
    console.log('   - Check that "Phone Number" mapped to "phone" field');
    
    console.log('\n3. Check duplicate handling:');
    console.log('   - Filter by duplicate_count > 0');
    console.log('   - Verify no duplicate People records exist');
    
    console.log('\n4. Review Field_Mapping_Log:');
    console.log('   - Check for any unmapped fields');
    console.log('   - Note any new field variations discovered');
    
    // Save verification queries
    const verificationQueries = {
        findTestRecords: `{test_batch} = "real-data-testing"`,
        checkDuplicates: `AND({test_batch} = "real-data-testing", {duplicate_count} > 0)`,
        fieldMappingSuccess: `AND({test_batch} = "real-data-testing", {field_mapping_success_rate} < 90)`,
        checkNormalization: `AND({test_batch} = "real-data-testing", {first_name} = BLANK())`
    };
    
    fs.writeFileSync('verification-queries.json', JSON.stringify(verificationQueries, null, 2));
    console.log('\n📄 Verification queries saved to verification-queries.json');
}

/**
 * Main execution
 */
async function main() {
    console.log('🚀 UYSP Real Data Testing Suite');
    console.log('================================\n');
    
    // Check if CSV exists
    if (!fs.existsSync(CSV_PATH)) {
        console.error(`❌ CSV file not found: ${CSV_PATH}`);
        console.log('\nUsage: node test-real-data.js [path-to-csv]');
        process.exit(1);
    }
    
    // Parse CSV
    console.log(`📂 Loading CSV from: ${CSV_PATH}`);
    const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
    const parsed = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true
    });
    
    results.totalRecords = parsed.data.length;
    
    // Analyze structure
    const { fields, duplicateCount, uniqueEmails } = analyzeCSVStructure(parsed.data);
    
    // Confirm before proceeding
    console.log('\n⚠️  Ready to send records to webhook?');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🔄 Starting webhook submissions...\n');
    
    // Process in batches
    for (let i = 0; i < parsed.data.length; i += BATCH_SIZE) {
        const batch = parsed.data.slice(i, i + BATCH_SIZE);
        await processBatch(batch, i);
        
        // Progress update
        const progress = ((i + batch.length) / parsed.data.length * 100).toFixed(1);
        console.log(`\n📊 Progress: ${progress}% (${i + batch.length}/${parsed.data.length})`);
    }
    
    // Complete results
    results.endTime = new Date().toISOString();
    
    // Summary
    console.log('\n\n📊 FINAL RESULTS');
    console.log('================');
    console.log(`Total Records: ${results.totalRecords}`);
    console.log(`Processed: ${results.processedRecords}`);
    console.log(`Successful: ${results.successfulRecords} (${(results.successfulRecords/results.totalRecords*100).toFixed(1)}%)`);
    console.log(`Failed: ${results.failedRecords}`);
    console.log(`Duplicates in CSV: ${duplicateCount}`);
    
    if (results.errors.length > 0) {
        console.log(`\n❌ Errors:`);
        results.errors.slice(0, 5).forEach(err => {
            console.log(`  - ${err.email}: ${err.error || err.status}`);
        });
        if (results.errors.length > 5) {
            console.log(`  ... and ${results.errors.length - 5} more`);
        }
    }
    
    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsPath = `real-data-results-${timestamp}.json`;
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Detailed results saved to: ${resultsPath}`);
    
    // Verification steps
    await verifyResults(uniqueEmails);
    
    console.log('\n✅ Testing complete!');
}

// Handle errors
process.on('unhandledRejection', (error) => {
    console.error('\n❌ Unhandled error:', error);
    process.exit(1);
});

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { analyzeCSVStructure, createWebhookPayload };
