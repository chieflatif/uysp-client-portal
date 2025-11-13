/**
 * ICP Score utility functions
 * Maps numeric scores (0-100) to categories and display values
 */

export type ICPCategory = 'High' | 'Medium' | 'Low' | 'Unknown';

/**
 * Convert numeric ICP score to category
 */
export function getICPCategory(score: number | null | undefined): ICPCategory {
  if (score === null || score === undefined) return 'Unknown';
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  if (score > 0) return 'Low';
  return 'Unknown';
}

/**
 * Get display color class for ICP score
 */
export function getICPColorClass(score: number | null | undefined): string {
  const category = getICPCategory(score);
  switch (category) {
    case 'High':
      return 'text-green-600 bg-green-100';
    case 'Medium':
      return 'text-yellow-600 bg-yellow-100';
    case 'Low':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

/**
 * Format ICP score for display
 */
export function formatICPScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'Unknown';
  const category = getICPCategory(score);
  return `${score} (${category})`;
}

/**
 * Get badge style for ICP category
 */
export function getICPBadgeClass(score: number | null | undefined): string {
  const category = getICPCategory(score);
  switch (category) {
    case 'High':
      return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800';
    case 'Medium':
      return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800';
    case 'Low':
      return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800';
    default:
      return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800';
  }
}