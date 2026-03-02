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
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.string().optional(),
  status: z.enum(['unread', 'read', 'replied', 'archived', 'deleted']).optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth();
    const supabase = createServerSupabaseClient();

    // Parse query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = QuerySchema.parse(searchParams);

    // Get user's email accounts
    const { data: accounts } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (!accounts || accounts.length === 0) {
      return successResponse({
        threads: [] as any[],
        total: 0,
        page: query.page,
        limit: query.limit,
        totalPages: 0,
        message: 'No email accounts connected. Please sync your emails first.'
      });
    }

    const accountIds = accounts.map((a) => a.id);

    // Build simple query without joins
    let dbQuery = supabase
      .from('email_threads')
      .select('*', { count: 'exact' })
      .in('email_account_id', accountIds)
      .order('last_message_at', { ascending: false });

    // Apply filters
    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status);
    }

    if (query.search) {
      dbQuery = dbQuery.or(
        `subject.ilike.%${query.search}%,snippet.ilike.%${query.search}%`
      );
    }

    // Pagination
    const offset = (query.page - 1) * query.limit;
    dbQuery = dbQuery.range(offset, offset + query.limit - 1);

    const { data: threads, error, count } = await dbQuery;

    if (error) {
      throw new Error(`Failed to fetch threads: ${error.message}`);
    }

    // If no threads, return empty with helpful message
    if (!threads || threads.length === 0) {
      return successResponse({
        threads: [] as any[],
        total: 0,
        page: query.page,
        limit: query.limit,
        totalPages: 0,
        message: 'No emails found. Click "Sync Emails" to fetch your emails from Gmail.'
      });
    }

    // Get related data separately for threads that exist
    const threadIds = threads.map(t => t.id);

    // Fetch classifications
    const { data: classifications } = await supabase
      .from('ai_classifications')
      .select('*')
      .in('thread_id', threadIds);

    // Fetch latest emails
    const { data: emails } = await supabase
      .from('emails')
      .select('id, thread_id, from_address, from_name, subject, snippet, internal_date')
      .in('thread_id', threadIds)
      .order('internal_date', { ascending: false });

    // Create lookup maps
    const classificationMap = new Map();
    classifications?.forEach(c => {
      if (!classificationMap.has(c.thread_id)) {
        classificationMap.set(c.thread_id, c);
      }
    });

    const emailMap = new Map();
    emails?.forEach(e => {
      if (!emailMap.has(e.thread_id)) {
        emailMap.set(e.thread_id, e);
      }
    });

    // Transform response
    const transformedThreads = threads.map((thread) => ({
      id: thread.id,
      gmail_thread_id: thread.gmail_thread_id,
      subject: thread.subject,
      snippet: thread.snippet,
      last_message_at: thread.last_message_at,
      message_count: thread.message_count,
      is_unread: thread.is_unread,
      status: thread.status,
      labels: thread.labels,
      participants: thread.participants,
      latest_email: emailMap.get(thread.id) || null,
      classification: classificationMap.get(thread.id) || null,
    }));

    return successResponse({
      threads: transformedThreads,
      total: count || 0,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil((count || 0) / query.limit),
      message: '',
    });
  });
}
