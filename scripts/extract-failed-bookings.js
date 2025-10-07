#!/usr/bin/env node

/**
 * EXTRACT FAILED BOOKING DATA FROM N8N EXECUTIONS
 * 
 * This script uses the n8n API to extract booking data from failed executions
 * and generates a recovery script with the actual data.
 * 
 * REQUIRES: N8N_API_KEY environment variable
 */

const N8N_API_KEY = process.env.N8N_API_KEY || "YOUR_N8N_API_KEY";
const N8N_BASE_URL = "https://rebelhq.app.n8n.cloud/api/v1";
const WORKFLOW_ID = "LiVE3BlxsFkHhG83";

// Failed execution IDs from Oct 4-6, 2025
const FAILED_EXECUTION_IDS = [
  "7460", "7459", "7458", "7457", "7456", "7455", "7454", "7453",
  "7452", "7451", "7450", "7449", "7448", "7447", "7446", "7445",
  "7444", "7443", "7442", "7441"
];

async function getExecutionData(executionId) {
  try {
    const response = await fetch(
      `${N8N_BASE_URL}/executions/${executionId}`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.log(`❌ Failed to fetch execution ${executionId}`);
      return null;
    }

    const data = await response.json();
    
    // Extract email and bookedAt from Parse Calendly node
    const parseNode = data.data?.resultData?.runData?.['Parse Calendly']?.[0]?.data?.main?.[0]?.[0];
    
    if (!parseNode?.json?.email) {
      console.log(`⚠️  Execution ${executionId}: No email found`);
      return null;
    }

    return {
      executionId,
      email: parseNode.json.email,
      phoneDigits: parseNode.json.phoneDigits,
      bookedAt: parseNode.json.bookedAt,
      eventId: parseNode.json.eventId
    };

  } catch (error) {
    console.log(`❌ Error fetching execution ${executionId}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('\n🔍 EXTRACTING FAILED BOOKING DATA');
  console.log('═══════════════════════════════════════\n');

  if (!N8N_API_KEY || N8N_API_KEY === 'YOUR_N8N_API_KEY') {
    console.log('❌ ERROR: N8N_API_KEY environment variable not set');
    console.log('\nGet your API key from: https://rebelhq.app.n8n.cloud/settings/api');
    console.log('Then set it with: export N8N_API_KEY="your_key_here"\n');
    process.exit(1);
  }

  console.log(`📋 Processing ${FAILED_EXECUTION_IDS.length} failed executions...\n`);

  const bookings = [];

  for (const executionId of FAILED_EXECUTION_IDS) {
    const booking = await getExecutionData(executionId);
    if (booking) {
      bookings.push(booking);
      console.log(`✅ ${booking.email} - ${booking.bookedAt}`);
    }
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n═══════════════════════════════════════');
  console.log('📊 EXTRACTION SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Found: ${bookings.length} bookings`);
  console.log(`⚠️  Missing: ${FAILED_EXECUTION_IDS.length - bookings.length} executions\n`);

  if (bookings.length > 0) {
    console.log('📝 RECOVERY DATA (copy to recover-missed-bookings.js):');
    console.log('─────────────────────────────────────────\n');
    bookings.forEach(b => {
      console.log(`  { email: "${b.email}", bookedAt: "${b.bookedAt}" }, // Execution ${b.executionId}`);
    });
    console.log('');
  }
}

main();





