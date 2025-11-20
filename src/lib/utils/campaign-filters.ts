/**
 * Shared Campaign Filter Utility
 *
 * Provides consistent lead filtering logic for campaign preview and creation endpoints.
 * Ensures preview counts match actual enrollment counts.
 */

import { eq, gte, lte, inArray, sql, type SQL } from 'drizzle-orm';
import { leads } from '@/lib/db/schema';

export interface CampaignFilterParams {
  clientId: string;
  targetTags: string[];
  createdAfter?: string | null;
  createdBefore?: string | null;
  minIcpScore?: number | null;
  maxIcpScore?: number | null;
  engagementLevels?: string[] | null;
  excludeBooked?: boolean;
  excludeSmsStop?: boolean;
  excludeInActiveCampaign?: boolean;
}

/**
 * Build WHERE conditions for lead filtering
 */
export function buildLeadFilterConditions(params: CampaignFilterParams): SQL<unknown>[] {
  const conditions: SQL<unknown>[] = [
    eq(leads.clientId, params.clientId),
    eq(leads.isActive, true),
    // BUG FIX: Cast targetTags array to PostgreSQL text[] type using ARRAY constructor
    sql`${leads.kajabiTags} && ARRAY[${sql.join(params.targetTags.map(tag => sql`${tag}`), sql`, `)}]::text[]`,
  ];

  if (params.createdAfter) {
    conditions.push(gte(leads.createdAt, new Date(params.createdAfter)));
  }
  if (params.createdBefore) {
    conditions.push(lte(leads.createdAt, new Date(params.createdBefore)));
  }

  if (params.minIcpScore !== null && params.minIcpScore !== undefined) {
    conditions.push(gte(leads.icpScore, params.minIcpScore));
  }
  if (params.maxIcpScore !== null && params.maxIcpScore !== undefined) {
    conditions.push(lte(leads.icpScore, params.maxIcpScore));
  }

  if (params.engagementLevels && params.engagementLevels.length > 0) {
    conditions.push(inArray(leads.engagementLevel, params.engagementLevels));
  }

  if (params.excludeBooked) {
    conditions.push(eq(leads.booked, false));
  }
  if (params.excludeSmsStop) {
    conditions.push(eq(leads.smsStop, false));
  }
  if (params.excludeInActiveCampaign) {
    conditions.push(eq(leads.smsSequencePosition, 0));
  }

  return conditions;
}
