import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  requireAuth,
  withErrorHandling,
  successResponse,
  errorResponse,
} from '@/lib/api-utils';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { GmailClient, parseGmailMessage } from '@/lib/gmail/client';

const QuerySchema = z.object({
  id: z.string().min(1),
});

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth();
    const supabase = createServerSupabaseClient();

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { id: messageId } = QuerySchema.parse(searchParams);

    // Get user's email account
    const { data: emailAccount, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (accountError || !emailAccount) {
      return errorResponse('No active email account found', 400);
    }

    // Create Gmail client
    const gmailClient = new GmailClient(
      emailAccount.id,
      emailAccount.access_token_encrypted,
      emailAccount.refresh_token_encrypted,
      new Date(emailAccount.token_expires_at)
    );

    try {
      // Fetch the full message
      const message = await gmailClient.getMessage(messageId, 'full');
      const parsed = parseGmailMessage(message);

      return successResponse({
        id: message.id,
        gmail_message_id: message.id,
        gmail_thread_id: message.threadId,
        from_address: parsed.from_address,
        from_name: parsed.from_name,
        to_addresses: parsed.to_addresses,
        cc_addresses: parsed.cc_addresses,
        subject: parsed.subject,
        snippet: parsed.snippet,
        body_text: parsed.body_text,
        body_html: parsed.body_html,
        internal_date: parsed.internal_date,
        is_starred: message.labelIds?.includes('STARRED') || false,
        is_unread: message.labelIds?.includes('UNREAD') || false,
        labels: message.labelIds || [],
        attachments: parsed.attachments,
      });
    } catch (error) {
      console.error('Error fetching message:', error);
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to fetch message',
        500
      );
    }
  });
}
