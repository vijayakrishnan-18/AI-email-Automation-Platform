import { createServiceRoleClient } from '@/lib/supabase/server';
import { classifyEmail, buildClassificationInput } from './classification-agent';
import { buildContext } from './context-builder-agent';
import { generateReply } from './reply-generation-agent';
import { makeDecision, findMatchingRule } from './decision-agent';
import { GmailClient } from '@/lib/gmail/client';
import type {
  Email,
  EmailThread,
  AIClassification,
  AIDecision,
  AIDraft,
  AIRule,
  UserSettings,
  EmailAccount,
} from '@/types';

export interface PipelineResult {
  classification: AIClassification;
  decision: AIDecision;
  draft: AIDraft | null;
  addedToApprovalQueue: boolean;
  autoSent: boolean;
  totalTokensUsed: number;
  processingTime: number;
}

export interface PipelineInput {
  userId: string;
  emailAccountId: string;
  thread: EmailThread;
  latestEmail: Email;
  threadHistory: Email[];
  userSettings: UserSettings;
  userRules: AIRule[];
  emailAccount?: EmailAccount; // For auto-send functionality
}

export async function processIncomingEmail(
  input: PipelineInput
): Promise<PipelineResult> {
  const startTime = Date.now();
  const supabase = createServiceRoleClient();
  let totalTokensUsed = 0;

  // ========================================
  // STEP 1: CLASSIFICATION
  // ========================================
  const classificationInput = buildClassificationInput(
    input.latestEmail.from_address,
    input.latestEmail.from_name,
    input.latestEmail.subject,
    input.latestEmail.snippet || '',
    input.latestEmail.body_text
  );

  const { result: classificationResult, tokensUsed: classTokens } =
    await classifyEmail(classificationInput);
  totalTokensUsed += classTokens;

  // Save classification to database
  const { data: savedClassification, error: classError } = await supabase
    .from('ai_classifications')
    .insert({
      email_id: input.latestEmail.id,
      category: classificationResult.category,
      urgency: classificationResult.urgency,
      safe_to_reply: classificationResult.safe_to_reply,
      confidence: classificationResult.confidence,
      reasoning: classificationResult.reasoning,
      model_used: 'llama-3.3-70b-versatile',
      tokens_used: classTokens,
    })
    .select()
    .single();

  if (classError) {
    throw new Error(`Failed to save classification: ${classError.message}`);
  }

  // Create audit log for classification
  await supabase.rpc('create_audit_log', {
    p_user_id: input.userId,
    p_action: 'email_classified',
    p_entity_type: 'email',
    p_entity_id: input.latestEmail.id,
    p_details: {
      category: classificationResult.category,
      urgency: classificationResult.urgency,
      confidence: classificationResult.confidence,
    },
  });

  // ========================================
  // STEP 2: CHECK USER RULES FIRST (before safe_to_reply skip)
  // ========================================
  // User rules take precedence over default safe_to_reply behavior
  const emailContext = {
    senderEmail: input.latestEmail.from_address,
    senderName: input.latestEmail.from_name || undefined,
    subject: input.latestEmail.subject,
  };

  const matchedRuleEarly = findMatchingRule(
    classificationResult,
    input.userRules,
    emailContext
  );

  // If a user rule matches, don't skip - let the rule decide the action
  const hasMatchingRule = matchedRuleEarly !== null;

  // ========================================
  // STEP 3: CHECK IF REPLY NEEDED (only if no rule matched)
  // ========================================
  // Skip processing for spam, newsletters ONLY if no user rule overrides
  const noReplyCategories = ['spam', 'newsletter'];
  const shouldSkipByDefault =
    noReplyCategories.includes(classificationResult.category) ||
    !classificationResult.safe_to_reply;

  // Only skip if there's no matching rule that would override the default behavior
  if (shouldSkipByDefault && !hasMatchingRule) {
    // Create NO_ACTION decision
    const { data: noActionDecision } = await supabase
      .from('ai_decisions')
      .insert({
        thread_id: input.thread.id,
        email_id: input.latestEmail.id,
        decision: 'NO_ACTION',
        reasoning: `Category: ${classificationResult.category}, Safe to reply: ${classificationResult.safe_to_reply}`,
        confidence: classificationResult.confidence,
        model_used: 'rule-based',
      })
      .select()
      .single();

    return {
      classification: savedClassification as AIClassification,
      decision: noActionDecision as AIDecision,
      draft: null,
      addedToApprovalQueue: false,
      autoSent: false,
      totalTokensUsed,
      processingTime: Date.now() - startTime,
    };
  }

  // ========================================
  // STEP 4: BUILD CONTEXT
  // ========================================
  const contextInput = {
    currentEmail: {
      from: input.latestEmail.from_address,
      fromName: input.latestEmail.from_name,
      subject: input.latestEmail.subject,
      body: input.latestEmail.body_text || input.latestEmail.snippet || '',
      date: input.latestEmail.internal_date,
    },
    threadHistory: input.threadHistory.map((e) => ({
      from: e.from_address,
      body: e.body_text || e.snippet || '',
      date: e.internal_date,
      isIncoming: e.is_incoming,
    })),
    classification: {
      category: classificationResult.category,
      urgency: classificationResult.urgency,
    },
    userContext: {
      signature: input.userSettings.signature || undefined,
      defaultTone: input.userSettings.default_tone,
      name: input.userSettings.default_from_name || undefined,
    },
  };

  const { context, tokensUsed: contextTokens } = await buildContext(contextInput);
  totalTokensUsed += contextTokens;

  // ========================================
  // STEP 5: GENERATE REPLY
  // ========================================
  const replyInput = {
    originalEmail: {
      from: input.latestEmail.from_address,
      fromName: input.latestEmail.from_name,
      subject: input.latestEmail.subject,
      body: input.latestEmail.body_text || input.latestEmail.snippet || '',
    },
    context,
    userPreferences: {
      signature: input.userSettings.signature || undefined,
      defaultTone: input.userSettings.default_tone,
      name: input.userSettings.default_from_name || undefined,
    },
  };

  const { result: replyResult, tokensUsed: replyTokens } =
    await generateReply(replyInput);
  totalTokensUsed += replyTokens;

  // ========================================
  // STEP 6: MAKE DECISION
  // ========================================
  const decisionInput = {
    classification: classificationResult,
    draftPreview: replyResult.body_text,
    userSettings: {
      autoReplyEnabled: input.userSettings.auto_reply_enabled,
      requireApprovalAboveConfidence:
        input.userSettings.require_approval_above_confidence,
    },
    matchedRules: input.userRules,
    emailContext, // Use the already-computed emailContext from Step 2
  };

  const { result: decisionResult, tokensUsed: decisionTokens } =
    await makeDecision(decisionInput);
  totalTokensUsed += decisionTokens;

  // Save decision to database
  const { data: savedDecision, error: decisionError } = await supabase
    .from('ai_decisions')
    .insert({
      thread_id: input.thread.id,
      email_id: input.latestEmail.id,
      decision: decisionResult.decision,
      reasoning: decisionResult.reasoning,
      confidence: decisionResult.confidence,
      rule_id: decisionResult.matched_rule_id,
      model_used: decisionResult.matched_rule_id ? 'rule-based' : 'llama-3.3-70b-versatile',
    })
    .select()
    .single();

  if (decisionError) {
    throw new Error(`Failed to save decision: ${decisionError.message}`);
  }

  // ========================================
  // STEP 7: SAVE DRAFT
  // ========================================
  const { data: savedDraft, error: draftError } = await supabase
    .from('ai_drafts')
    .insert({
      thread_id: input.thread.id,
      email_id: input.latestEmail.id,
      decision_id: savedDecision.id,
      subject: replyResult.subject,
      body_text: replyResult.body_text,
      body_html: replyResult.body_html,
      tone: replyResult.tone,
      model_used: 'llama-3.3-70b-versatile',
      tokens_used: replyTokens,
    })
    .select()
    .single();

  if (draftError) {
    throw new Error(`Failed to save draft: ${draftError.message}`);
  }

  // ========================================
  // STEP 8: ADD TO APPROVAL QUEUE IF NEEDED
  // ========================================
  let addedToApprovalQueue = false;

  if (
    decisionResult.decision === 'NEEDS_APPROVAL' ||
    decisionResult.decision === 'ESCALATE'
  ) {
    const { error: approvalError } = await supabase.from('approval_queue').insert({
      user_id: input.userId,
      thread_id: input.thread.id,
      email_id: input.latestEmail.id,
      draft_id: savedDraft.id,
      decision_id: savedDecision.id,
      status: 'pending',
    });

    if (approvalError) {
      console.error('Failed to add to approval queue:', approvalError);
    } else {
      addedToApprovalQueue = true;
    }

    // Create audit log
    await supabase.rpc('create_audit_log', {
      p_user_id: input.userId,
      p_action: 'added_to_approval_queue',
      p_entity_type: 'draft',
      p_entity_id: savedDraft.id,
      p_details: {
        decision: decisionResult.decision,
        reasoning: decisionResult.reasoning,
      },
    });
  }

  // ========================================
  // STEP 9: AUTO-SEND IF ENABLED
  // ========================================
  let autoSent = false;

  if (decisionResult.decision === 'AUTO_SEND' && input.emailAccount) {
    try {
      // Create Gmail client
      const gmailClient = new GmailClient(
        input.emailAccount.id,
        input.emailAccount.access_token_encrypted,
        input.emailAccount.refresh_token_encrypted,
        new Date(input.emailAccount.token_expires_at)
      );

      // Send the reply
      await gmailClient.sendMessage(
        input.latestEmail.from_address,
        replyResult.subject,
        replyResult.body_text,
        input.thread.gmail_thread_id
      );

      // Mark draft as sent
      await supabase
        .from('ai_drafts')
        .update({ is_sent: true, sent_at: new Date().toISOString() })
        .eq('id', savedDraft.id);

      autoSent = true;

      // Create audit log for auto-send
      try {
        await supabase.from('audit_logs').insert({
          user_id: input.userId,
          action: 'auto_reply_sent',
          entity_type: 'draft',
          entity_id: savedDraft.id,
          details: {
            to: input.latestEmail.from_address,
            subject: replyResult.subject,
            rule_id: decisionResult.matched_rule_id,
          },
        });
      } catch (auditErr) {
        console.error('Failed to create audit log for auto-send:', auditErr);
      }

      console.log(`Auto-sent reply to ${input.latestEmail.from_address}`);
    } catch (sendError) {
      console.error('Failed to auto-send reply:', sendError);
      // Don't fail the pipeline, just log the error
      // The draft is still saved for manual review
    }
  }

  return {
    classification: savedClassification as AIClassification,
    decision: savedDecision as AIDecision,
    draft: savedDraft as AIDraft,
    addedToApprovalQueue,
    autoSent,
    totalTokensUsed,
    processingTime: Date.now() - startTime,
  };
}

export async function reprocessEmail(
  emailId: string,
  userId: string
): Promise<PipelineResult> {
  const supabase = createServiceRoleClient();

  // Fetch all required data
  const { data: email, error: emailError } = await supabase
    .from('emails')
    .select(
      `
      *,
      thread:email_threads!inner(
        *,
        email_account:email_accounts!inner(*)
      )
    `
    )
    .eq('id', emailId)
    .single();

  if (emailError || !email) {
    throw new Error('Email not found');
  }

  // Verify ownership
  if (email.thread.email_account.user_id !== userId) {
    throw new Error('Unauthorized');
  }

  // Fetch thread history
  const { data: threadEmails } = await supabase
    .from('emails')
    .select('*')
    .eq('thread_id', email.thread_id)
    .order('internal_date', { ascending: true });

  // Fetch user settings
  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Fetch user rules
  const { data: rules } = await supabase
    .from('ai_rules')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('priority', { ascending: false });

  // Delete existing classification, decision, and draft for this email
  await supabase.from('ai_classifications').delete().eq('email_id', emailId);

  const { data: existingDecisions } = await supabase
    .from('ai_decisions')
    .select('id')
    .eq('email_id', emailId);

  if (existingDecisions) {
    for (const decision of existingDecisions) {
      await supabase.from('ai_drafts').delete().eq('decision_id', decision.id);
      await supabase.from('approval_queue').delete().eq('decision_id', decision.id);
    }
    await supabase.from('ai_decisions').delete().eq('email_id', emailId);
  }

  // Run pipeline
  return processIncomingEmail({
    userId,
    emailAccountId: email.thread.email_account_id,
    thread: email.thread,
    latestEmail: email,
    threadHistory: threadEmails || [],
    userSettings: settings || getDefaultSettings(userId),
    userRules: rules || [],
  });
}

function getDefaultSettings(userId: string): UserSettings {
  return {
    id: '',
    user_id: userId,
    ai_enabled: true,
    auto_reply_enabled: false,
    require_approval_above_confidence: 0.8,
    default_tone: 'professional',
    default_from_name: null,
    signature: null,
    working_hours_enabled: false,
    working_hours_start: '09:00',
    working_hours_end: '17:00',
    timezone: 'UTC',
    notification_email: true,
    notification_push: false,
    created_at: '',
    updated_at: '',
  };
}
