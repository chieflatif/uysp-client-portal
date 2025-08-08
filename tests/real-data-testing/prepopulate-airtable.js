#!/usr/bin/env node

/**
 * Pre-populate Airtable with sample records from CSV for duplicate testing
 * This creates known records that we can verify get updated (not duplicated)
 */

const fs = require('fs');
const Papa = require('papaparse');

// Configuration
const SAMPLE_COUNT = 10; // Number of records to pre-populate
const CSV_PATH = '../form_submission 65.csv';
const WEBHOOK_URL = 'https://rebelhq.app.n8n.cloud/webhook/kajabi-leads';

async function selectSampleRecords() {
    console.log('📊 Reading CSV file...');
    
    const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
    const parsed = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true
    });
    
    console.log(`✅ Found ${parsed.data.length} total records\n`);
    
    // Select evenly distributed samples
    const sampleIndices = [];
    const interval = Math.floor(parsed.data.length / SAMPLE_COUNT);
    
    for (let i = 0; i < SAMPLE_COUNT; i++) {
        sampleIndices.push(i * interval);
    }
    
    const samples = sampleIndices.map(index => parsed.data[index]);
    
    console.log('🎯 Selected sample records for pre-population:\n');
    samples.forEach((record, index) => {
        console.log(`Sample ${index + 1}:`);
        console.log(`  Email: ${record['Email Address']}`);
        console.log(`  Name: ${record['Full Name']}`);
        console.log(`  Company: ${record['Company Name'] || 'N/A'}`);
        console.log('');
    });
    
    return { samples, allRecords: parsed.data };
}

function generateWebhookPayload(csvRecord) {
    // Map CSV fields to webhook format
    return {
        // Test different field name variations
        "Email Address": csvRecord['Email Address'],
        "Full Name": csvRecord['Full Name'],
        "Company Name": csvRecord['Company Name'] || '',
        "Phone Number": csvRecord['Phone Number'] || '',
        "interested_in_coaching": csvRecord['Are you interested in learning more about coaching with Ian?'],
        "landing_page_id": csvRecord['Landing Page ID'],
        "landing_page_title": csvRecord['Landing Page Title'],
        "created_at": csvRecord['Created At'],
        "source_form": "lead-magnet-65",
        "request_id": `prepop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
}

async function sendToWebhook(payload) {
    console.log(`📤 Sending to webhook: ${payload['Email Address']}`);
    
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            console.log(`✅ Success: ${response.status}`);
            const recordId = response.headers.get('x-record-id') || 'check-airtable';
            console.log(`   Record ID: ${recordId}`);
        } else {
            console.log(`❌ Failed: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
}

async function main() {
    console.log('🚀 UYSP Real Data Pre-Population Tool\n');
    
    const { samples, allRecords } = await selectSampleRecords();
    
    console.log('\n📝 Instructions for manual pre-population:');
    console.log('1. Copy the emails above');
    console.log('2. Go to Airtable and manually create records for these emails');
    console.log('3. This ensures we have known duplicates when we run the full test\n');
    
    const proceed = process.argv.includes('--send');
    
    if (proceed) {
        console.log('\n🔄 Sending sample records to webhook...\n');
        
        for (const record of samples) {
            const payload = generateWebhookPayload(record);
            await sendToWebhook(payload);
        }
        
        console.log('\n✅ Pre-population complete!');
        console.log(`📊 ${samples.length} records sent to webhook`);
    } else {
        console.log('To actually send these records, run with --send flag:');
        console.log('node prepopulate-airtable.js --send\n');
    }
    
    // Save sample emails for verification
    const sampleEmails = samples.map(r => r['Email Address']);
    fs.writeFileSync('sample-emails.json', JSON.stringify(sampleEmails, null, 2));
    console.log('\n📄 Sample emails saved to sample-emails.json for verification');
}

// Run the script
main().catch(console.error);
