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

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  status: z.enum(['pending', 'approved', 'rejected', 'modified']).optional(),
});

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth();
    const supabase = createServerSupabaseClient();

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = QuerySchema.parse(searchParams);

    let dbQuery = supabase
      .from('approval_queue')
      .select(
        `
        *,
        thread:email_threads(
          id,
          subject,
          snippet,
          participants,
          last_message_at
        ),
        email:emails(
          id,
          from_address,
          from_name,
          body_text,
          internal_date
        ),
        draft:ai_drafts(
          id,
          subject,
          body_text,
          tone
        ),
        decision:ai_decisions(
          id,
          decision,
          reasoning,
          confidence
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status);
    } else {
      // Default to pending
      dbQuery = dbQuery.eq('status', 'pending');
    }

    const offset = (query.page - 1) * query.limit;
    dbQuery = dbQuery.range(offset, offset + query.limit - 1);

    const { data: approvals, error, count } = await dbQuery;

    if (error) {
      throw new Error(`Failed to fetch approvals: ${error.message}`);
    }

    // Fetch classifications for each email
    const emailIds = (approvals || []).map((a) => a.email_id);
    const { data: classifications } = await supabase
      .from('ai_classifications')
      .select('*')
      .in('email_id', emailIds);

    const classificationMap = new Map(
      (classifications || []).map((c) => [c.email_id, c])
    );

    const transformedApprovals = (approvals || []).map((approval) => ({
      id: approval.id,
      status: approval.status,
      created_at: approval.created_at,
      reviewed_at: approval.reviewed_at,
      reviewer_notes: approval.reviewer_notes,
      thread: approval.thread,
      email: approval.email,
      draft: approval.draft,
      decision: approval.decision,
      classification: classificationMap.get(approval.email_id) || null,
    }));

    return successResponse({
      approvals: transformedApprovals,
      total: count || 0,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil((count || 0) / query.limit),
    });
  });
}

const ApprovalActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'modify']),
  notes: z.string().optional(),
  modifiedBody: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth();
    const supabase = createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();

    const body = await request.json();
    const { action, notes, modifiedBody } = validateBody(ApprovalActionSchema, body);

    const approvalId = request.nextUrl.searchParams.get('id');
    if (!approvalId) {
      return errorResponse('Approval ID is required', 400);
    }

    // Fetch approval with related data
    const { data: approval, error: fetchError } = await supabase
      .from('approval_queue')
      .select(
        `
        *,
        thread:email_threads(
          *,
          email_account:email_accounts(*)
        ),
        email:emails(*),
        draft:ai_drafts(*)
      `
      )
      .eq('id', approvalId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !approval) {
      return errorResponse('Approval not found', 404);
    }

    if (approval.status !== 'pending') {
      return errorResponse('Approval already processed', 400);
    }

    const emailAccount = approval.thread.email_account;
    const draft = approval.draft;

    // Process based on action
    if (action === 'approve' || action === 'modify') {
      const bodyToSend = action === 'modify' && modifiedBody ? modifiedBody : draft.body_text;

      // Get recipient from original email
      const { data: originalEmail } = await supabase
        .from('emails')
        .select('from_address')
        .eq('id', approval.email_id)
        .single();

      if (!originalEmail) {
        return errorResponse('Original email not found', 404);
      }

      // Send email via Gmail
      const gmailClient = new GmailClient(
        emailAccount.id,
        emailAccount.access_token_encrypted,
        emailAccount.refresh_token_encrypted,
        new Date(emailAccount.token_expires_at)
      );

      await gmailClient.sendMessage(
        originalEmail.from_address,
        draft.subject,
        bodyToSend,
        approval.thread.gmail_thread_id
      );

      // Update draft as sent
      await serviceClient
        .from('ai_drafts')
        .update({
          is_sent: true,
          sent_at: new Date().toISOString(),
          body_text: bodyToSend,
        })
        .eq('id', draft.id);

      // Update thread status
      await serviceClient
        .from('email_threads')
        .update({ status: 'replied' })
        .eq('id', approval.thread_id);
    }

    // Update approval status
    const newStatus = action === 'modify' ? 'modified' : action === 'approve' ? 'approved' : 'rejected';

    await serviceClient
      .from('approval_queue')
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewer_notes: notes || null,
      })
      .eq('id', approvalId);

    // Create audit log
    await serviceClient.rpc('create_audit_log', {
      p_user_id: user.id,
      p_action: `approval_${newStatus}`,
      p_entity_type: 'approval',
      p_entity_id: approvalId,
      p_details: {
        action,
        thread_id: approval.thread_id,
        notes,
      },
    });

    return successResponse({ status: newStatus });
  });
}
