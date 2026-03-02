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

const RuleConditionSchema = z.object({
  field: z.enum(['category', 'urgency', 'sender', 'subject', 'confidence']),
  operator: z.enum(['equals', 'contains', 'greater_than', 'less_than', 'in']),
  value: z.union([z.string(), z.number(), z.array(z.string())]),
});

const CreateRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  is_active: z.boolean().default(true),
  priority: z.number().min(0).max(100).default(0),
  conditions: z.array(RuleConditionSchema).min(1),
  action: z.enum(['AUTO_SEND', 'DRAFT_ONLY', 'NEEDS_APPROVAL', 'ESCALATE', 'NO_ACTION']),
  auto_approve: z.boolean().default(false),
});

const UpdateRuleSchema = CreateRuleSchema.partial();

export async function GET() {
  return withErrorHandling(async () => {
    const user = await requireAuth();
    const supabase = createServerSupabaseClient();

    const { data: rules, error } = await supabase
      .from('ai_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch rules: ${error.message}`);
    }

    return successResponse({ rules: rules || [] });
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth();
    const supabase = createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();

    const body = await request.json();
    const validatedData = validateBody(CreateRuleSchema, body);

    // Check rule limit (e.g., max 50 rules per user)
    const { count } = await supabase
      .from('ai_rules')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count || 0) >= 50) {
      return errorResponse('Maximum number of rules reached (50)', 400);
    }

    const { data: rule, error } = await supabase
      .from('ai_rules')
      .insert({
        user_id: user.id,
        ...validatedData,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create rule: ${error.message}`);
    }

    // Audit log
    await serviceClient.rpc('create_audit_log', {
      p_user_id: user.id,
      p_action: 'rule_created',
      p_entity_type: 'rule',
      p_entity_id: rule.id,
      p_details: { name: rule.name },
    });

    return successResponse({ rule }, 201);
  });
}

export async function PATCH(request: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth();
    const supabase = createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();

    const ruleId = request.nextUrl.searchParams.get('id');
    if (!ruleId) {
      return errorResponse('Rule ID is required', 400);
    }

    const body = await request.json();
    const validatedData = validateBody(UpdateRuleSchema, body);

    // Verify ownership
    const { data: existingRule } = await supabase
      .from('ai_rules')
      .select('id')
      .eq('id', ruleId)
      .eq('user_id', user.id)
      .single();

    if (!existingRule) {
      return errorResponse('Rule not found', 404);
    }

    const { data: rule, error } = await supabase
      .from('ai_rules')
      .update(validatedData)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update rule: ${error.message}`);
    }

    // Audit log
    await serviceClient.rpc('create_audit_log', {
      p_user_id: user.id,
      p_action: 'rule_updated',
      p_entity_type: 'rule',
      p_entity_id: rule.id,
      p_details: { changes: Object.keys(validatedData) },
    });

    return successResponse({ rule });
  });
}

export async function DELETE(request: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth();
    const supabase = createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();

    const ruleId = request.nextUrl.searchParams.get('id');
    if (!ruleId) {
      return errorResponse('Rule ID is required', 400);
    }

    // Verify ownership and delete
    const { error } = await supabase
      .from('ai_rules')
      .delete()
      .eq('id', ruleId)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to delete rule: ${error.message}`);
    }

    // Audit log
    await serviceClient.rpc('create_audit_log', {
      p_user_id: user.id,
      p_action: 'rule_deleted',
      p_entity_type: 'rule',
      p_entity_id: ruleId,
      p_details: {},
    });

    return successResponse({ deleted: true });
  });
}
