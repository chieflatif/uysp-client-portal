import { NextResponse } from 'next/server';

/**
 * Health check endpoint for debugging connectivity issues
 * GET /api/health
 *
 * Returns:
 * - Timestamp
 * - Environment info
 * - API key status (not values, just presence)
 */
export async function GET() {
  const timestamp = new Date().toISOString();

  return NextResponse.json({
    status: 'ok',
    timestamp,
    environment: process.env.NODE_ENV || 'unknown',
    apiKeys: {
      primary: !!process.env.AZURE_OPENAI_KEY,
      fallback: !!process.env.AZURE_OPENAI_KEY_FALLBACK,
    },
    endpoints: {
      primary: 'cursor-agent.services.ai.azure.com',
      fallback: 'chief-1020-resource.cognitiveservices.azure.com',
    },
  });
}
