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
import { composeEmail } from '@/agents/compose-agent';

// Generate email from instructions
const GenerateSchema = z.object({
  instructions: z.string().min(10, 'Instructions must be at least 10 characters'),
});

// Send the composed email
const SendSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  emailAccountId: z.string().uuid().optional(),
});

// POST /api/compose - Generate email from instructions
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth();
    const supabase = createServerSupabaseClient();

    const body = await request.json();
    const { instructions } = validateBody(GenerateSchema, body);

    // Get user settings for sender name
    const { data: settings } = await supabase
      .from('user_settings')
      .select('signature, default_tone')
      .eq('user_id', user.id)
      .single();

    // Get user's email account for sender info
    const { data: emailAccount } = await supabase
      .from('email_accounts')
      .select('email_address')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    try {
      const { result, tokensUsed } = await composeEmail({
        instructions,
        senderName: user.user_metadata?.full_name || user.email?.split('@')[0],
        senderEmail: emailAccount?.email_address,
      });

      // Log the compose action
      const serviceClient = createServiceRoleClient();
      try {
        await serviceClient.from('audit_logs').insert({
          user_id: user.id,
          action: 'ai_compose_generated',
          entity_type: 'email',
          entity_id: null,
          details: {
            to: result.to,
            subject: result.subject,
            tokens_used: tokensUsed,
          },
        });
      } catch (auditErr) {
        console.error('Failed to create audit log:', auditErr);
      }

      return successResponse({
        draft: result,
        tokensUsed,
      });
    } catch (error) {
      console.error('Compose error:', error);
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to generate email',
        500
      );
    }
  });
}

// PUT /api/compose - Send the composed email
export async function PUT(request: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth();
    const supabase = createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();

    const body = await request.json();
    const { to, subject, body: emailBody, emailAccountId } = validateBody(SendSchema, body);

    // Get user's email account
    let accountQuery = supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (emailAccountId) {
      accountQuery = accountQuery.eq('id', emailAccountId);
    }

    const { data: emailAccount, error: accountError } = await accountQuery.single();

    if (accountError || !emailAccount) {
      return errorResponse('No active email account found. Please connect your Gmail.', 400);
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
        emailBody
        // No thread ID - this is a new email
      );

      // Create audit log
      try {
        await serviceClient.from('audit_logs').insert({
          user_id: user.id,
          action: 'ai_compose_sent',
          entity_type: 'email',
          entity_id: sentMessage.id,
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
      console.error('Failed to send composed email:', sendError);
      return errorResponse(
        sendError instanceof Error ? sendError.message : 'Failed to send email',
        500
      );
    }
  });
}
