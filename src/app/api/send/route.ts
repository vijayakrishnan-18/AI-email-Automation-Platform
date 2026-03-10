import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  requireAuth,
  withErrorHandling,
  successResponse,
  errorResponse,
  validateBody,
} from '@/lib/api-utils';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { GmailClient } from '@/lib/gmail/client';
import { validateEmailDomain } from '@/lib/email-validator';

const SendEmailSchema = z.object({
  threadId: z.string().uuid(),
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth();
    const supabase = createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();

    const reqBody = await request.json();
    const { threadId, to, subject, body } = validateBody(SendEmailSchema, reqBody);

    // Get thread and verify ownership
    const { data: thread, error: threadError } = await supabase
      .from('email_threads')
      .select(`
        *,
        email_account:email_accounts(*)
      `)
      .eq('id', threadId)
      .single();

    if (threadError || !thread) {
      return errorResponse('Thread not found', 404);
    }

    // Verify user owns this email account
    if (thread.email_account.user_id !== user.id) {
      return errorResponse('Unauthorized', 403);
    }

    const emailAccount = thread.email_account;

    // Validate recipient domain before sending
    const isDomainValid = await validateEmailDomain(to);
    if (!isDomainValid) {
      return errorResponse('The recipient domain does not have a valid email setup. Please check the email address.', 400);
    }

    // Create Gmail client and send
    const gmailClient = new GmailClient(
      emailAccount.id,
      emailAccount.access_token_encrypted,
      emailAccount.refresh_token_encrypted,
      new Date(emailAccount.token_expires_at)
    );

    try {
      const sentMessage = await gmailClient.sendMessage(
        to,
        subject,
        body,
        thread.gmail_thread_id
      );

      // Update thread status
      await serviceClient
        .from('email_threads')
        .update({
          status: 'replied',
          updated_at: new Date().toISOString(),
        })
        .eq('id', threadId);

      // Create audit log
      try {
        await serviceClient.from('audit_logs').insert({
          user_id: user.id,
          action: 'manual_reply_sent',
          entity_type: 'thread',
          entity_id: threadId,
          details: {
            to,
            subject,
            gmail_message_id: sentMessage.id,
          },
        });
      } catch (auditErr) {
        console.error('Failed to create audit log:', auditErr);
      }

      return successResponse({
        success: true,
        messageId: sentMessage.id,
      });
    } catch (sendError) {
      console.error('Failed to send email:', sendError);
      return errorResponse(
        sendError instanceof Error ? sendError.message : 'Failed to send email',
        500
      );
    }
  });
}
