import { NextResponse } from 'next/server';

/**
 * GET /api/health
 *
 * A public endpoint to verify the deployment status, commit SHA, and build time.
 * This is used to confirm that the code deployed on the server matches the
 * latest commit on the main branch.
 */
export async function GET() {
  const commitSha = process.env.NEXT_PUBLIC_GIT_COMMIT_SHA;
  const buildTimestamp = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP;

  return NextResponse.json({
    status: 'ok',
    commitSha: commitSha || 'unknown',
    buildTimestamp: buildTimestamp || 'unknown',
  });
}
