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
  limit: z.coerce.number().min(1).max(100).default(50),
  action: z.string().optional(),
  entity_type: z.string().optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
});

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth();
    const supabase = createServerSupabaseClient();

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = QuerySchema.parse(searchParams);

    let dbQuery = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (query.action) {
      dbQuery = dbQuery.eq('action', query.action);
    }

    if (query.entity_type) {
      dbQuery = dbQuery.eq('entity_type', query.entity_type);
    }

    if (query.from_date) {
      dbQuery = dbQuery.gte('created_at', query.from_date);
    }

    if (query.to_date) {
      dbQuery = dbQuery.lte('created_at', query.to_date);
    }

    const offset = (query.page - 1) * query.limit;
    dbQuery = dbQuery.range(offset, offset + query.limit - 1);

    const { data: logs, error, count } = await dbQuery;

    if (error) {
      throw new Error(`Failed to fetch logs: ${error.message}`);
    }

    // Get unique actions and entity types for filtering
    const { data: actionTypes } = await supabase
      .from('audit_logs')
      .select('action')
      .eq('user_id', user.id);

    const { data: entityTypes } = await supabase
      .from('audit_logs')
      .select('entity_type')
      .eq('user_id', user.id);

    const uniqueActions = Array.from(new Set((actionTypes || []).map((a) => a.action)));
    const uniqueEntityTypes = Array.from(new Set((entityTypes || []).map((e) => e.entity_type)));

    return successResponse({
      logs: logs || [],
      total: count || 0,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil((count || 0) / query.limit),
      filters: {
        actions: uniqueActions,
        entityTypes: uniqueEntityTypes,
      },
    });
  });
}
