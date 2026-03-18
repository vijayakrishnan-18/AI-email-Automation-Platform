import { NextRequest } from 'next/server';
import {
  requireAuth,
  withErrorHandling,
  successResponse,
  errorResponse,
} from '@/lib/api-utils';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { processIncomingEmail } from '@/agents/pipeline';

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth();
    const supabase = createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();

    const { threadId } = await request.json();

    if (!threadId) {
      return errorResponse('Thread ID is required', 400);
    }

    // Get thread data
    const { data: thread, error: threadError } = await supabase
      .from('email_threads')
      .select('*')
      .eq('id', threadId)
      .single();

    if (threadError || !thread) {
      return errorResponse('Thread not found', 404);
    }

    // Get the email account
    const { data: account } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', thread.email_account_id)
      .single();

    if (!account) {
      return errorResponse('Email account not found', 404);
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

    // Get all emails in the thread
    const { data: emails } = await supabase
      .from('emails')
      .select('*')
      .eq('thread_id', threadId)
      .order('internal_date', { ascending: true });

    if (!emails || emails.length === 0) {
      return errorResponse('No emails found in thread', 404);
    }

    // Get the latest incoming email
    const latestIncoming = [...emails].reverse().find(e => e.is_incoming);
    if (!latestIncoming) {
      return errorResponse('No incoming email found in thread', 400);
    }

    // Delete old AI data for this thread so we get a clean reprocess
    await serviceClient
      .from('ai_decisions')
      .delete()
      .eq('thread_id', threadId);

    await serviceClient
      .from('ai_classifications')
      .delete()
      .eq('email_id', latestIncoming.id);

    await serviceClient
      .from('ai_drafts')
      .delete()
      .eq('thread_id', threadId);

    await serviceClient
      .from('approval_queue')
      .delete()
      .eq('thread_id', threadId);

    // Re-run the pipeline
    const result = await processIncomingEmail({
      userId: user.id,
      emailAccountId: account.id,
      thread,
      latestEmail: latestIncoming,
      threadHistory: emails,
      userSettings: settings,
      userRules: rules || [],
      emailAccount: account,
    });

    return successResponse({
      message: 'Email reprocessed successfully',
      decision: result.decision.decision,
      classification: result.classification.category,
      addedToApprovalQueue: result.addedToApprovalQueue,
    });
  });
}
