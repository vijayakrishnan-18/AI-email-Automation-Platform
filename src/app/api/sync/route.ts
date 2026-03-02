import { NextRequest } from 'next/server';
import {
  requireAuth,
  withErrorHandling,
  successResponse,
  errorResponse,
  checkRateLimit,
} from '@/lib/api-utils';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { GmailClient, parseGmailThread, parseGmailMessage } from '@/lib/gmail/client';
import { processIncomingEmail } from '@/agents/pipeline';

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth();
    const supabase = createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();

    // Rate limit: max 10 syncs per minute per user
    if (!checkRateLimit(`sync:${user.id}`, 10, 60000)) {
      return errorResponse('Rate limit exceeded. Please wait before syncing again.', 429);
    }

    // Get user's email accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (accountsError || !accounts || accounts.length === 0) {
      return errorResponse('No connected email accounts found', 404);
    }

    // Get user settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get user rules
    const { data: rules } = await supabase
      .from('ai_rules')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const syncResults = [];

    for (const account of accounts) {
      try {
        const gmailClient = new GmailClient(
          account.id,
          account.access_token_encrypted,
          account.refresh_token_encrypted,
          new Date(account.token_expires_at)
        );

        // Fetch recent threads from Gmail
        const { threads: gmailThreads } = await gmailClient.listThreads({
          maxResults: 20,
          labelIds: ['INBOX'],
        });

        let newThreads = 0;
        let newEmails = 0;
        let processed = 0;

        for (const gmailThread of gmailThreads) {
          if (!gmailThread.id) continue;

          // Check if thread exists
          const { data: existingThread } = await supabase
            .from('email_threads')
            .select('id, message_count')
            .eq('email_account_id', account.id)
            .eq('gmail_thread_id', gmailThread.id)
            .single();

          // Fetch full thread data
          const fullThread = await gmailClient.getThread(gmailThread.id, 'full');
          const threadData = parseGmailThread(fullThread);

          let dbThread;

          if (!existingThread) {
            // Create new thread
            const { data: newThread, error: threadError } = await serviceClient
              .from('email_threads')
              .insert({
                email_account_id: account.id,
                ...threadData,
              })
              .select()
              .single();

            if (threadError) {
              console.error('Failed to create thread:', threadError);
              continue;
            }

            dbThread = newThread;
            newThreads++;
          } else {
            // Update existing thread
            const { data: updatedThread } = await serviceClient
              .from('email_threads')
              .update({
                ...threadData,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingThread.id)
              .select()
              .single();

            dbThread = updatedThread || existingThread;
          }

          // Process messages in thread
          const messages = fullThread.messages || [];

          for (const message of messages) {
            if (!message.id) continue;

            // Check if message exists
            const { data: existingMessage } = await supabase
              .from('emails')
              .select('id')
              .eq('gmail_message_id', message.id)
              .single();

            if (!existingMessage) {
              const messageData = parseGmailMessage(message);

              const { data: newEmail, error: emailError } = await serviceClient
                .from('emails')
                .insert({
                  thread_id: dbThread.id,
                  ...messageData,
                })
                .select()
                .single();

              if (emailError) {
                console.error('Failed to create email:', emailError);
                continue;
              }

              newEmails++;

              // Process incoming emails through AI pipeline if AI is enabled
              if (
                settings?.ai_enabled &&
                messageData.is_incoming &&
                !message.labelIds?.includes('SENT')
              ) {
                try {
                  // Get thread history
                  const { data: threadEmails } = await supabase
                    .from('emails')
                    .select('*')
                    .eq('thread_id', dbThread.id)
                    .order('internal_date', { ascending: true });

                  await processIncomingEmail({
                    userId: user.id,
                    emailAccountId: account.id,
                    thread: dbThread,
                    latestEmail: newEmail,
                    threadHistory: threadEmails || [],
                    userSettings: settings,
                    userRules: rules || [],
                    emailAccount: account, // Pass account for auto-send
                  });

                  processed++;
                } catch (pipelineError: unknown) {
                  // Check if it's an OpenAI quota/rate limit error
                  const errorMessage = pipelineError instanceof Error ? pipelineError.message : String(pipelineError);
                  const isQuotaError = errorMessage.includes('insufficient_quota') ||
                                       errorMessage.includes('rate_limit') ||
                                       errorMessage.includes('429');

                  if (isQuotaError) {
                    console.warn('OpenAI quota/rate limit reached - skipping AI processing for remaining emails');
                    // Continue syncing emails without AI processing
                    // Don't try to process more emails with AI in this sync
                    break;
                  }

                  console.error('Pipeline error:', pipelineError);
                  // Don't fail the entire sync for other pipeline errors
                }
              }
            }
          }
        }

        // Update last sync time
        await serviceClient
          .from('email_accounts')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', account.id);

        syncResults.push({
          account: account.email_address,
          newThreads,
          newEmails,
          processed,
          success: true,
        });
      } catch (err) {
        console.error(`Sync error for ${account.email_address}:`, err);
        syncResults.push({
          account: account.email_address,
          error: err instanceof Error ? err.message : 'Sync failed',
          success: false,
        });
      }
    }

    // Audit log (don't fail if this errors)
    try {
      await serviceClient.from('audit_logs').insert({
        user_id: user.id,
        action: 'email_sync',
        entity_type: 'sync',
        entity_id: null,
        details: { results: syncResults },
      });
    } catch (auditErr) {
      console.error('Failed to create audit log:', auditErr);
    }

    return successResponse({ results: syncResults });
  });
}
