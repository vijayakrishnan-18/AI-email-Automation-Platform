import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  requireAuth,
  withErrorHandling,
  successResponse,
  validateBody,
} from '@/lib/api-utils';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

const UpdateSettingsSchema = z.object({
  ai_enabled: z.boolean().optional(),
  auto_reply_enabled: z.boolean().optional(),
  require_approval_above_confidence: z.number().min(0).max(1).optional(),
  default_tone: z.string().max(50).optional(),
  signature: z.string().max(1000).nullable().optional(),
  working_hours_enabled: z.boolean().optional(),
  working_hours_start: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  working_hours_end: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone: z.string().max(50).optional(),
  notification_email: z.boolean().optional(),
  notification_push: z.boolean().optional(),
});

export async function GET() {
  return withErrorHandling(async () => {
    const user = await requireAuth();
    const supabase = createServerSupabaseClient();

    // Get or create settings
    let { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Settings don't exist, create default
      const { data: newSettings, error: createError } = await supabase
        .from('user_settings')
        .insert({ user_id: user.id })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create settings: ${createError.message}`);
      }

      settings = newSettings;
    } else if (error) {
      throw new Error(`Failed to fetch settings: ${error.message}`);
    }

    // Also get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('email, full_name, avatar_url')
      .eq('id', user.id)
      .single();

    // Get connected email accounts
    const { data: emailAccounts } = await supabase
      .from('email_accounts')
      .select('id, email_address, is_active, last_sync_at')
      .eq('user_id', user.id);

    return successResponse({
      settings,
      profile,
      emailAccounts: emailAccounts || [],
    });
  });
}

export async function PATCH(request: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth();
    const supabase = createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();

    const body = await request.json();
    const validatedData = validateBody(UpdateSettingsSchema, body);

    // Safety check: If enabling auto-reply, ensure AI is also enabled
    if (validatedData.auto_reply_enabled === true) {
      const { data: currentSettings } = await supabase
        .from('user_settings')
        .select('ai_enabled')
        .eq('user_id', user.id)
        .single();

      if (!currentSettings?.ai_enabled && validatedData.ai_enabled !== true) {
        validatedData.ai_enabled = true; // Auto-enable AI if auto-reply is enabled
      }
    }

    // Upsert settings
    const { data: settings, error } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: user.id,
          ...validatedData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update settings: ${error.message}`);
    }

    // Audit log for sensitive setting changes
    const sensitiveChanges = ['ai_enabled', 'auto_reply_enabled'];
    const changedSensitive = Object.keys(validatedData).filter((k) =>
      sensitiveChanges.includes(k)
    );

    if (changedSensitive.length > 0) {
      await serviceClient.rpc('create_audit_log', {
        p_user_id: user.id,
        p_action: 'settings_updated',
        p_entity_type: 'settings',
        p_entity_id: settings.id,
        p_details: {
          changes: changedSensitive.reduce(
            (acc, key) => ({
              ...acc,
              [key]: validatedData[key as keyof typeof validatedData],
            }),
            {}
          ),
        },
      });
    }

    return successResponse({ settings });
  });
}
