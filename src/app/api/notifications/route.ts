import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  requireAuth,
  withErrorHandling,
  successResponse,
} from '@/lib/api-utils';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  type: z.enum(['all', 'approvals', 'ai_actions', 'sync']).optional().default('all'),
  unread_only: z.coerce.boolean().optional().default(false),
});

export interface Notification {
  id: string;
  type: 'approval_pending' | 'approval_processed' | 'email_classified' | 'auto_reply_sent' | 'sync_complete' | 'rule_matched';
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  // Optional linked entities
  thread_id?: string;
  email_id?: string;
  draft_id?: string;
}

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth();
    const supabase = createServerSupabaseClient();

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = QuerySchema.parse(searchParams);

    const notifications: Notification[] = [];

    // 1. Get pending approvals as notifications
    if (query.type === 'all' || query.type === 'approvals') {
      const { data: pendingApprovals } = await supabase
        .from('approval_queue')
        .select(`
          id,
          status,
          created_at,
          thread:email_threads(id, subject, snippet),
          email:emails(id, from_address, from_name),
          decision:ai_decisions(reasoning)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (pendingApprovals) {
        for (const approval of pendingApprovals) {
          // Cast through unknown for proper type handling
          const thread = approval.thread as unknown as { id: string; subject: string; snippet: string } | null;
          const email = approval.email as unknown as { id: string; from_address: string; from_name: string | null } | null;
          const decision = approval.decision as unknown as { reasoning: string } | null;

          notifications.push({
            id: `approval_${approval.id}`,
            type: 'approval_pending',
            title: 'Reply Needs Approval',
            message: `AI draft for "${thread?.subject || 'Unknown'}" from ${email?.from_name || email?.from_address || 'Unknown'}`,
            metadata: {
              approval_id: approval.id,
              reasoning: decision?.reasoning,
            },
            is_read: false,
            created_at: approval.created_at,
            thread_id: thread?.id,
            email_id: email?.id,
          });
        }
      }
    }

    // 2. Get audit logs for AI actions
    if (query.type === 'all' || query.type === 'ai_actions') {
      const aiActions = [
        'email_classified',
        'auto_reply_sent',
        'added_to_approval_queue',
        'approval_approved',
        'approval_rejected',
        'approval_modified',
      ];

      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .in('action', aiActions)
        .order('created_at', { ascending: false })
        .limit(30);

      if (auditLogs) {
        for (const log of auditLogs) {
          let title = '';
          let message = '';

          switch (log.action) {
            case 'email_classified':
              title = 'Email Classified';
              message = `Classified as ${log.details?.category || 'unknown'} with ${log.details?.urgency || 'unknown'} urgency`;
              break;
            case 'auto_reply_sent':
              title = 'Auto-Reply Sent';
              message = `Automatically replied to ${log.details?.to || 'unknown'}: ${log.details?.subject || 'No subject'}`;
              break;
            case 'added_to_approval_queue':
              title = 'Added to Approval Queue';
              message = log.details?.reasoning || 'AI draft requires your approval';
              break;
            case 'approval_approved':
              title = 'Reply Approved & Sent';
              message = 'Your approved reply has been sent';
              break;
            case 'approval_rejected':
              title = 'Reply Rejected';
              message = 'AI draft was rejected';
              break;
            case 'approval_modified':
              title = 'Reply Modified & Sent';
              message = 'Your modified reply has been sent';
              break;
            default:
              title = log.action.replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase());
              message = JSON.stringify(log.details);
          }

          notifications.push({
            id: `audit_${log.id}`,
            type: log.action as Notification['type'],
            title,
            message,
            metadata: log.details || {},
            is_read: true, // Audit logs are considered "read" since they're historical
            created_at: log.created_at,
            email_id: log.entity_type === 'email' ? log.entity_id : undefined,
            draft_id: log.entity_type === 'draft' ? log.entity_id : undefined,
          });
        }
      }
    }

    // 3. Get sync events (from email_accounts last_sync_at)
    if (query.type === 'all' || query.type === 'sync') {
      const { data: syncLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('action', 'sync_completed')
        .order('created_at', { ascending: false })
        .limit(5);

      if (syncLogs) {
        for (const log of syncLogs) {
          notifications.push({
            id: `sync_${log.id}`,
            type: 'sync_complete',
            title: 'Sync Complete',
            message: `Synced ${log.details?.new_emails || 0} new emails`,
            metadata: log.details || {},
            is_read: true,
            created_at: log.created_at,
          });
        }
      }
    }

    // Sort all notifications by created_at descending
    notifications.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Filter unread if requested
    const filteredNotifications = query.unread_only
      ? notifications.filter(n => !n.is_read)
      : notifications;

    // Paginate
    const offset = (query.page - 1) * query.limit;
    const paginatedNotifications = filteredNotifications.slice(offset, offset + query.limit);

    // Count unread
    const unreadCount = notifications.filter(n => !n.is_read).length;

    return successResponse({
      notifications: paginatedNotifications,
      total: filteredNotifications.length,
      unread_count: unreadCount,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(filteredNotifications.length / query.limit),
    });
  });
}

// Mark notification as read (for pending approvals, this would process them)
export async function PATCH(request: NextRequest) {
  return withErrorHandling(async () => {
    // Auth check (user and supabase available for future use)
    await requireAuth();

    const body = await request.json();
    const { notification_ids, mark_all_read } = body;

    if (mark_all_read) {
      // For now, we don't have a separate notifications table
      // This would be implemented if we add one
      return successResponse({ marked: 0 });
    }

    // For approval notifications, we don't mark them read - they get processed
    // through the approvals API instead

    return successResponse({ marked: notification_ids?.length || 0 });
  });
}
