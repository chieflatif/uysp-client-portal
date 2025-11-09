/**
 * Campaign Type Constants
 *
 * Centralizes campaign type mappings between database values and UI labels
 * to ensure consistency across the application and facilitate maintenance.
 *
 * @module lib/constants/campaigns
 */

/**
 * Database column values for campaign types
 */
export const CAMPAIGN_TYPES_DB = {
  STANDARD: 'Standard',
  WEBINAR: 'Webinar',
  CUSTOM: 'Custom',
} as const;

/**
 * User-friendly labels for campaign types
 */
export const CAMPAIGN_TYPES_UI = {
  LEAD_FORM: 'Lead Form',
  WEBINAR: 'Webinar',
  NURTURE: 'Nurture',
  ALL: 'All',
} as const;

/**
 * Valid filter values for type parameter (used in API and UI)
 */
export const VALID_TYPE_FILTERS = [
  CAMPAIGN_TYPES_UI.ALL,
  CAMPAIGN_TYPES_UI.LEAD_FORM,
  CAMPAIGN_TYPES_UI.WEBINAR,
  CAMPAIGN_TYPES_UI.NURTURE,
] as const;

/**
 * Valid filter values for status parameter (used in API and UI)
 */
export const VALID_STATUS_FILTERS = ['All', 'Active', 'Paused'] as const;

/**
 * Mapping from user-friendly UI labels to database values
 * Used by API to translate filter parameters to database queries
 */
export const CAMPAIGN_TYPE_UI_TO_DB: Record<string, string> = {
  [CAMPAIGN_TYPES_UI.LEAD_FORM]: CAMPAIGN_TYPES_DB.STANDARD,
  [CAMPAIGN_TYPES_UI.WEBINAR]: CAMPAIGN_TYPES_DB.WEBINAR,
  [CAMPAIGN_TYPES_UI.NURTURE]: CAMPAIGN_TYPES_DB.CUSTOM,
  [CAMPAIGN_TYPES_UI.ALL]: CAMPAIGN_TYPES_UI.ALL,
} as const;

/**
 * Mapping from database values to user-friendly UI labels
 * Used by UI to display campaign types
 */
export const CAMPAIGN_TYPE_DB_TO_UI: Record<string, string> = {
  [CAMPAIGN_TYPES_DB.STANDARD]: CAMPAIGN_TYPES_UI.LEAD_FORM,
  [CAMPAIGN_TYPES_DB.WEBINAR]: CAMPAIGN_TYPES_UI.WEBINAR,
  [CAMPAIGN_TYPES_DB.CUSTOM]: CAMPAIGN_TYPES_UI.NURTURE,
} as const;

/**
 * TypeScript type for campaign type filters
 */
export type CampaignTypeFilter = typeof VALID_TYPE_FILTERS[number];

/**
 * TypeScript type for campaign status filters
 */
export type CampaignStatusFilter = typeof VALID_STATUS_FILTERS[number];
