#!/usr/bin/env tsx
/**
 * FORENSIC DIAGNOSTIC: UI Data Integrity Issues
 * Purpose: Deep investigation of LinkedIn, ICP scores, Notes, Dashboard, and Booking discrepancies
 */

import { sql } from 'drizzle-orm';
import { db } from '../src/lib/db';

async function diagnoseUIIssues() {
  console.log('🔍 FORENSIC INVESTIGATION: UI DATA INTEGRITY ISSUES');
  console.log('='.repeat(80));

  try {
    // 1. LinkedIn Field Analysis
    console.log('\n📊 1. LINKEDIN FIELD ANALYSIS:');
    const linkedinCheck = await db.execute(sql`
      SELECT
        COUNT(*) as total_leads,
        COUNT(CASE WHEN linkedin_url IS NOT NULL AND linkedin_url != '' THEN 1 END) as with_linkedin,
        COUNT(CASE WHEN linkedin_url = '' THEN 1 END) as empty_linkedin,
        COUNT(CASE WHEN linkedin_url IS NULL THEN 1 END) as null_linkedin
      FROM leads
    `);
    const linkedinStats = linkedinCheck[0] as any;
    console.log(`  Total Leads: ${linkedinStats.total_leads}`);
    console.log(`  With LinkedIn: ${linkedinStats.with_linkedin}`);
    console.log(`  Empty LinkedIn: ${linkedinStats.empty_linkedin}`);
    console.log(`  NULL LinkedIn: ${linkedinStats.null_linkedin}`);

    // Sample LinkedIn URLs
    const linkedinSamples = await db.execute(sql`
      SELECT first_name, last_name, linkedin_url
      FROM leads
      WHERE linkedin_url IS NOT NULL AND linkedin_url != ''
      LIMIT 5
    `);
    if (linkedinSamples.length > 0) {
      console.log('\n🔗 Sample LinkedIn URLs:');
      linkedinSamples.forEach((row: any) => {
        console.log(`  ${row.first_name} ${row.last_name}: ${row.linkedin_url}`);
      });
    } else {
      console.log('  ⚠️  NO LINKEDIN URLs FOUND IN DATABASE');
    }

    // 2. ICP Score Analysis
    console.log('\n📊 2. ICP SCORE DISTRIBUTION:');
    const icpAnalysis = await db.execute(sql`
      SELECT
        icp_score,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM leads), 2) as percentage
      FROM leads
      GROUP BY icp_score
      ORDER BY icp_score DESC
    `);
    icpAnalysis.forEach((row: any) => {
      console.log(`  ${row.icp_score || 'NULL'}: ${row.count} leads (${row.percentage}%)`);
    });

    // 3. Notes Field Analysis
    console.log('\n📝 3. NOTES FIELD ANALYSIS:');
    const notesAnalysis = await db.execute(sql`
      SELECT
        COUNT(*) as total_leads,
        COUNT(CASE WHEN notes IS NOT NULL AND notes != '' THEN 1 END) as with_notes,
        COUNT(CASE WHEN notes = '' THEN 1 END) as empty_notes,
        COUNT(CASE WHEN notes IS NULL THEN 1 END) as null_notes
      FROM leads
    `);
    const notesStats = notesAnalysis[0] as any;
    console.log(`  Total Leads: ${notesStats.total_leads}`);
    console.log(`  With Notes: ${notesStats.with_notes}`);
    console.log(`  Empty Notes: ${notesStats.empty_notes}`);
    console.log(`  NULL Notes: ${notesStats.null_notes}`);

    // Sample notes
    const notesSamples = await db.execute(sql`
      SELECT first_name, last_name, notes
      FROM leads
      WHERE notes IS NOT NULL AND notes != ''
      LIMIT 3
    `);
    if (notesSamples.length > 0) {
      console.log('\n📝 Sample Notes:');
      notesSamples.forEach((row: any) => {
        console.log(`  ${row.first_name} ${row.last_name}: "${row.notes}"`);
      });
    } else {
      console.log('  ⚠️  NO NOTES FOUND IN DATABASE');
    }

    // 4. Booking Data Analysis
    console.log('\n📅 4. BOOKING DATA ANALYSIS:');
    const bookingAnalysis = await db.execute(sql`
      SELECT
        COUNT(*) as total_leads,
        COUNT(CASE WHEN booked = true THEN 1 END) as booked_count,
        COUNT(CASE WHEN sms_stop = true THEN 1 END) as opted_out
      FROM leads
    `);
    const booking = bookingAnalysis[0] as any;
    console.log(`  Total Leads: ${booking.total_leads}`);
    console.log(`  Booked Count: ${booking.booked_count}`);
    console.log(`  Opted Out: ${booking.opted_out}`);

    // Bookings by campaign
    const bookingsByCampaign = await db.execute(sql`
      SELECT
        c.name as campaign_name,
        c.id as campaign_id,
        COUNT(l.id) as total_leads,
        COUNT(CASE WHEN l.booked = true THEN 1 END) as booked_count
      FROM campaigns c
      LEFT JOIN leads l ON l.campaign_id = c.id
      GROUP BY c.id, c.name
      HAVING COUNT(CASE WHEN l.booked = true THEN 1 END) > 0
      ORDER BY booked_count DESC
    `);
    if (bookingsByCampaign.length > 0) {
      console.log('\n📊 Bookings by Campaign:');
      bookingsByCampaign.forEach((row: any) => {
        console.log(`  ${row.campaign_name}: ${row.booked_count} bookings / ${row.total_leads} leads`);
      });
    }

    // 5. Find "Call Booked - Sales Team" campaign
    console.log('\n🔍 5. INTERNAL CAMPAIGN ANALYSIS:');
    const internalCampaign = await db.execute(sql`
      SELECT
        id,
        name,
        client_id,
        is_active,
        created_at,
        (SELECT COUNT(*) FROM leads WHERE campaign_id = campaigns.id) as lead_count
      FROM campaigns
      WHERE name ILIKE '%call booked%' OR name ILIKE '%sales team%'
    `);
    if (internalCampaign.length > 0) {
      console.log('  Found internal campaigns:');
      internalCampaign.forEach((row: any) => {
        console.log(`  Campaign: ${row.name}`);
        console.log(`    ID: ${row.id}`);
        console.log(`    Lead Count: ${row.lead_count}`);
        console.log(`    Active: ${row.is_active}`);
      });
    } else {
      console.log('  No "Call Booked" or "Sales Team" campaigns found');
    }

    // 6. Campaign Dashboard Data
    console.log('\n📊 6. TOP CAMPAIGNS ANALYTICS:');
    const topCampaigns = await db.execute(sql`
      SELECT
        c.name,
        c.id,
        COUNT(l.id) as total_leads,
        COUNT(CASE WHEN l.booked = true THEN 1 END) as booked,
        COUNT(CASE WHEN l.sms_sent_count > 0 THEN 1 END) as messaged,
        COUNT(CASE WHEN l.engagement_level = 'High' THEN 1 END) as high_engagement
      FROM campaigns c
      LEFT JOIN leads l ON l.campaign_id = c.id
      GROUP BY c.id, c.name
      ORDER BY booked DESC
      LIMIT 10
    `);
    topCampaigns.forEach((row: any, idx: number) => {
      console.log(`  ${idx + 1}. ${row.name}:`);
      console.log(`     Leads: ${row.total_leads}, Booked: ${row.booked}, Messaged: ${row.messaged}, High Engagement: ${row.high_engagement}`);
    });

    // 7. Recent Activity Check
    console.log('\n📈 7. RECENT ACTIVITY DATA (Last 7 Days):');
    const recentActivity = await db.execute(sql`
      SELECT
        'Leads Created' as activity_type,
        COUNT(*) as count,
        MAX(created_at) as most_recent
      FROM leads
      WHERE created_at > NOW() - INTERVAL '7 days'

      UNION ALL

      SELECT
        'SMS Sent' as activity_type,
        COUNT(*) as count,
        MAX(sms_last_sent_at) as most_recent
      FROM leads
      WHERE sms_last_sent_at > NOW() - INTERVAL '7 days'

      UNION ALL

      SELECT
        'Bookings' as activity_type,
        COUNT(*) as count,
        MAX(updated_at) as most_recent
      FROM leads
      WHERE booked = true AND updated_at > NOW() - INTERVAL '7 days'
    `);
    recentActivity.forEach((row: any) => {
      console.log(`  ${row.activity_type}: ${row.count} (Most recent: ${row.most_recent || 'N/A'})`);
    });

    // 8. Data Integrity Check
    console.log('\n⚠️  8. DATA INTEGRITY ISSUES:');
    const integrityIssues = await db.execute(sql`
      SELECT
        'Leads without campaign' as issue,
        COUNT(*) as count
      FROM leads
      WHERE campaign_id IS NULL

      UNION ALL

      SELECT
        'Campaigns without client_id' as issue,
        COUNT(*) as count
      FROM campaigns
      WHERE client_id IS NULL

      UNION ALL

      SELECT
        'Leads with invalid ICP score' as issue,
        COUNT(*) as count
      FROM leads
      WHERE icp_score NOT IN ('High', 'Medium', 'Low') OR icp_score IS NULL

      UNION ALL

      SELECT
        'Booked leads without enrolled_at' as issue,
        COUNT(*) as count
      FROM leads
      WHERE booked = true AND enrolled_at IS NULL

      UNION ALL

      SELECT
        'Leads marked booked but not in sequence' as issue,
        COUNT(*) as count
      FROM leads
      WHERE booked = true AND (sms_sequence_position = 0 OR sms_sequence_position IS NULL)
    `);
    integrityIssues.forEach((row: any) => {
      if (parseInt(row.count) > 0) {
        console.log(`  ❌ ${row.issue}: ${row.count}`);
      }
    });

    // 9. Check Airtable field mapping
    console.log('\n🔄 9. CHECKING AIRTABLE FIELD MAPPING:');
    console.log('  Need to verify field mappings in src/lib/airtable/client.ts');

    // Check specific lead data
    console.log('\n🔎 10. SAMPLE LEAD DATA CHECK:');
    const sampleLeads = await db.execute(sql`
      SELECT
        id,
        first_name,
        last_name,
        icp_score,
        linkedin_url,
        notes,
        booked,
        campaign_id
      FROM leads
      LIMIT 5
    `);
    console.log('  Sample leads (first 5):');
    sampleLeads.forEach((lead: any, idx: number) => {
      console.log(`  ${idx + 1}. ${lead.first_name} ${lead.last_name}:`);
      console.log(`     ICP: ${lead.icp_score || 'NULL'}, LinkedIn: ${lead.linkedin_url || 'NULL'}`);
      console.log(`     Notes: ${lead.notes || 'NULL'}, Booked: ${lead.booked}`);
    });

  } catch (error) {
    console.error('Error during investigation:', error);
  }

  console.log('\n' + '='.repeat(80));
  console.log('FORENSIC INVESTIGATION COMPLETE');
}

// Execute diagnostic
diagnoseUIIssues().catch(console.error);