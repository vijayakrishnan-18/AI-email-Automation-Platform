import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/gmail/oauth';
import { requireAuth, withErrorHandling, successResponse } from '@/lib/api-utils';

export async function GET() {
  return withErrorHandling(async () => {
    const user = await requireAuth();

    // Generate OAuth URL with user ID as state for security
    const state = Buffer.from(
      JSON.stringify({ userId: user.id, timestamp: Date.now() })
    ).toString('base64');

    const authUrl = getAuthUrl(state);

    return successResponse({ url: authUrl });
  });
}
