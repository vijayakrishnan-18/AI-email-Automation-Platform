import { NextRequest } from 'next/server';
import {
  requireAuth,
  withErrorHandling,
  successResponse,
  errorResponse,
} from '@/lib/api-utils';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  return withErrorHandling(async () => {
    const user = await requireAuth();
    const supabase = createServerSupabaseClient();
    const { threadId } = params;

    // Fetch thread with all related data
    const { data: thread, error } = await supabase
      .from('email_threads')
      .select(
        `
        *,
        email_account:email_accounts!inner(
          id,
          user_id,
          email_address
        ),
        emails(
          *,
          classification:ai_classifications(*)
        ),
        decisions:ai_decisions(*),
        drafts:ai_drafts(*),
        approvals:approval_queue(*)
      `
      )
      .eq('id', threadId)
      .single();

    if (error || !thread) {
      return errorResponse('Thread not found', 404);
    }

    // Verify ownership
    if (thread.email_account.user_id !== user.id) {
      return errorResponse('Unauthorized', 403);
    }

    // Sort emails by date
    const sortedEmails = (thread.emails || []).sort(
      (a: { internal_date: string }, b: { internal_date: string }) =>
        new Date(a.internal_date).getTime() - new Date(b.internal_date).getTime()
    );

    // Get latest classification and decision
    const latestEmail = sortedEmails[sortedEmails.length - 1];
    const latestClassification = latestEmail?.classification?.[0] || null;
    const latestDecision = (thread.decisions || [])
      .sort(
        (a: { created_at: string }, b: { created_at: string }) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0] || null;
    const latestDraft =
      (thread.drafts || []).find((d: { is_sent: boolean }) => !d.is_sent) || null;
    const pendingApproval =
      (thread.approvals || []).find((a: { status: string }) => a.status === 'pending') ||
      null;

    // Mark thread as read
    if (thread.is_unread) {
      await supabase
        .from('email_threads')
        .update({ is_unread: false, status: 'read' })
        .eq('id', threadId);
    }

    return successResponse({
      id: thread.id,
      gmail_thread_id: thread.gmail_thread_id,
      subject: thread.subject,
      snippet: thread.snippet,
      last_message_at: thread.last_message_at,
      message_count: thread.message_count,
      is_unread: false, // Just marked as read
      status: thread.status,
      labels: thread.labels,
      participants: thread.participants,
      email_account: {
        id: thread.email_account.id,
        email_address: thread.email_account.email_address,
      },
      emails: sortedEmails,
      classification: latestClassification,
      decision: latestDecision,
      draft: latestDraft,
      approval: pendingApproval,
    });
  });
}
