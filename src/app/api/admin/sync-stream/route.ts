import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { clients, leads } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getAirtableClient } from '@/lib/airtable/client';

type NewLead = typeof leads.$inferInsert;
type AirtableLeadRecord = Parameters<ReturnType<typeof getAirtableClient>['mapToDatabaseLead']>[0];
type BatchItem = { record: AirtableLeadRecord; leadData: NewLead };

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const clientId = body.clientId;

  if (!clientId) {
    return new Response('clientId required', { status: 400 });
  }

  const client = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
  });

  if (!client || !client.airtableBaseId) {
    return new Response('Client not found', { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const airtable = getAirtableClient(client.airtableBaseId);
        let totalFetched = 0;
        let totalInserted = 0;
        const totalUpdated = 0;
        let errors = 0;

        const batchSize = 500; // Larger batches = faster sync
        let batch: BatchItem[] = [];

        // Send initial message
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start', message: 'Starting sync...' })}\n\n`));

        await airtable.streamAllLeads(async (record: AirtableLeadRecord) => {
          totalFetched++;
          
          try {
            const leadData = airtable.mapToDatabaseLead(record, clientId) as NewLead;
            batch.push({ record, leadData });

            if (batch.length >= batchSize) {
              await processBatch(batch);
              
              // Send progress update
              const progress = {
                type: 'progress',
                totalFetched,
                totalInserted,
                totalUpdated,
                errors,
                percentage: Math.round((totalFetched / 11000) * 100), // Estimate
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(progress)}\n\n`));
              
              batch = [];
            }
          } catch (error) {
            console.error('Error processing record batch item:', error);
            errors++;
          }
        });

        // Process remaining
        if (batch.length > 0) {
          await processBatch(batch);
        }

        // Update client sync time
        await db.update(clients)
          .set({ lastSyncAt: new Date() })
          .where(eq(clients.id, clientId));

        // Send completion
        const final = {
          type: 'complete',
          totalFetched,
          totalInserted,
          totalUpdated,
          errors,
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(final)}\n\n`));
        controller.close();

        async function processBatch(batchItems: BatchItem[]) {
          // Use PostgreSQL UPSERT - 100x faster than checking each record
          if (batchItems.length === 0) {
            return;
          }
          const now = new Date();
          const values: NewLead[] = batchItems.map(({ leadData }) => ({
            ...leadData,
            createdAt: now,
            updatedAt: now,
          }));

          try {
            await db.insert(leads)
              .values(values)
              .onConflictDoUpdate({
                target: leads.airtableRecordId,
                set: {
                  // Update only mutable fields
                  firstName: sql`excluded.first_name`,
                  lastName: sql`excluded.last_name`,
                  email: sql`excluded.email`,
                  phone: sql`excluded.phone`,
                  company: sql`excluded.company`,
                  title: sql`excluded.title`,
                  icpScore: sql`excluded.icp_score`,
                  status: sql`excluded.status`,
                  claimedBy: sql`excluded.claimed_by`,
                  claimedAt: sql`excluded.claimed_at`,
                  campaignId: sql`excluded.campaign_id`,
                  lastMessageAt: sql`excluded.last_message_at`,
                  lastActivityAt: sql`excluded.last_activity_at`,
                  campaignName: sql`excluded.campaign_name`,
                  campaignVariant: sql`excluded.campaign_variant`,
                  campaignBatch: sql`excluded.campaign_batch`,
                  smsSequencePosition: sql`excluded.sms_sequence_position`,
                  smsSentCount: sql`excluded.sms_sent_count`,
                  smsLastSentAt: sql`excluded.sms_last_sent_at`,
                  smsEligible: sql`excluded.sms_eligible`,
                  processingStatus: sql`excluded.processing_status`,
                  hrqStatus: sql`excluded.hrq_status`,
                  smsStop: sql`excluded.sms_stop`,
                  smsStopReason: sql`excluded.sms_stop_reason`,
                  booked: sql`excluded.booked`,
                  bookedAt: sql`excluded.booked_at`,
                  shortLinkId: sql`excluded.short_link_id`,
                  shortLinkUrl: sql`excluded.short_link_url`,
                  clickCount: sql`excluded.click_count`,
                  clickedLink: sql`excluded.clicked_link`,
                  firstClickedAt: sql`excluded.first_clicked_at`,
                  linkedinUrl: sql`excluded.linkedin_url`,
                  companyLinkedin: sql`excluded.company_linkedin`,
                  enrichmentOutcome: sql`excluded.enrichment_outcome`,
                  enrichmentAttemptedAt: sql`excluded.enrichment_attempted_at`,
                  formId: sql`excluded.form_id`,
                  webinarDatetime: sql`excluded.webinar_datetime`,
                  leadSource: sql`excluded.lead_source`,
                  kajabiTags: sql`excluded.kajabi_tags`,
                  engagementLevel: sql`excluded.engagement_level`,
                  notes: sql`excluded.notes`,
                  completedAt: sql`excluded.completed_at`,
                  campaignHistory: sql`excluded.campaign_history`,
                  enrolledCampaignVersion: sql`excluded.enrolled_campaign_version`,
                  enrolledMessageCount: sql`excluded.enrolled_message_count`,
                  enrolledAt: sql`excluded.enrolled_at`,
                  updatedAt: new Date(),
                },
              });
            totalInserted += batchItems.length;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown batch upsert error';
            console.error('Batch upsert error:', message);
            for (const item of batchItems) {
              try {
                await db.insert(leads).values({
                  ...item.leadData,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }).onConflictDoNothing();
                totalInserted++;
              } catch (e) {
                console.error('Failed to insert lead after upsert failure:', e);
                errors++;
              }
            }
          }
        }

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown sync error';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}


