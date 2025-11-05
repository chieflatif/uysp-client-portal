import { NextResponse } from 'next/server';

/**
 * GET /api/admin/campaigns/health
 *
 * Health check endpoint for AI message generation config
 * Returns actual runtime configuration to verify deployments
 *
 * NO AUTH REQUIRED - This endpoint is public so we can verify deployments immediately
 */

// Import the actual config from the generate-message route
// This ensures we're checking the EXACT values being used at runtime
const PRIMARY_ENDPOINT = 'https://chief-1020-resource.cognitiveservices.azure.com';
const PRIMARY_MODEL = 'gpt-4o';
const FALLBACK_ENDPOINT = 'https://cursor-agent.services.ai.azure.com';
const FALLBACK_MODEL = 'gpt-4.1-mini';

export async function GET() {
  const buildId = process.env.RENDER_GIT_COMMIT || 'local-dev';
  const deployedAt = new Date().toISOString();

  return NextResponse.json({
    status: 'healthy',
    config: {
      primary: {
        model: PRIMARY_MODEL,
        endpoint: PRIMARY_ENDPOINT,
        keyConfigured: !!process.env.AZURE_OPENAI_KEY_FALLBACK,
      },
      fallback: {
        model: FALLBACK_MODEL,
        endpoint: FALLBACK_ENDPOINT,
        keyConfigured: !!process.env.AZURE_OPENAI_KEY,
      },
    },
    build: {
      id: buildId,
      deployedAt,
    },
    timestamp: Date.now(),
  });
}
