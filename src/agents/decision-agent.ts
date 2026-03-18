import { createChatCompletion, AI_MODELS, TEMPERATURES } from '@/lib/openai/client';
import type { AIDecisionType, ClassificationResult, AIRule, DecisionResult } from '@/types';
import { z } from 'zod';

const DecisionSchema = z.object({
  decision: z.enum(['AUTO_SEND', 'DRAFT_ONLY', 'NEEDS_APPROVAL', 'ESCALATE', 'NO_ACTION']),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
});

const DECISION_SYSTEM_PROMPT = `You are a decision-making agent for an email management system.

Your task is to decide the appropriate action for an AI-generated email reply.

## Decision Types:
- **AUTO_SEND**: Safe to send automatically (VERY RARE - only for trivial, low-risk responses)
- **DRAFT_ONLY**: Save as draft for user to review and send manually
- **NEEDS_APPROVAL**: Add to approval queue for explicit user approval
- **ESCALATE**: Flag for immediate human attention (legal, complaints, sensitive)
- **NO_ACTION**: No reply needed (spam, newsletters, auto-replies)

## Decision Guidelines:

### AUTO_SEND (use sparingly):
- Only for routine, low-risk responses
- Confidence must be > 0.95
- Category must be transactional or simple support
- NEVER for: sales, legal, personal, complaints, or first-time contacts

### DRAFT_ONLY:
- Standard choice for most emails
- User can review and send at their convenience
- Good for medium-risk responses

### NEEDS_APPROVAL:
- Any response that commits to action
- Customer complaints
- Sales inquiries (important to get right)
- Anything with potential consequences
- When confidence < 0.8

### ESCALATE:
- Legal matters
- Angry or threatening emails
- Compliance issues
- Security concerns
- VIP contacts

### NO_ACTION:
- Spam
- Marketing emails
- Auto-replies (avoid reply loops)
- Newsletters

## Safety First:
When in doubt, choose NEEDS_APPROVAL over DRAFT_ONLY, and DRAFT_ONLY over AUTO_SEND.
Never risk sending something inappropriate automatically.

Respond with JSON:
{
  "decision": "AUTO_SEND|DRAFT_ONLY|NEEDS_APPROVAL|ESCALATE|NO_ACTION",
  "reasoning": "Brief explanation",
  "confidence": 0.0-1.0
}`;

export interface DecisionInput {
  classification: ClassificationResult;
  draftPreview: string;
  userSettings: {
    autoReplyEnabled: boolean;
    requireApprovalAboveConfidence: number;
  };
  matchedRules?: AIRule[];
  emailContext?: {
    senderEmail: string;
    senderName?: string;
    subject: string;
  };
}

export async function makeDecision(
  input: DecisionInput
): Promise<{ result: DecisionResult; tokensUsed: number }> {
  // First, check if any user rules apply
  const matchedRule = findMatchingRule(
    input.classification,
    input.matchedRules || [],
    input.emailContext
  );

  if (matchedRule) {
    // User rule takes precedence
    return {
      result: {
        decision: matchedRule.action,
        reasoning: `Matched user rule: ${matchedRule.name}`,
        confidence: 1.0,
        matched_rule_id: matchedRule.id,
      },
      tokensUsed: 0,
    };
  }

  // If auto-reply is disabled, never auto-send
  if (!input.userSettings.autoReplyEnabled) {
    // Still use AI to decide between DRAFT_ONLY, NEEDS_APPROVAL, ESCALATE, NO_ACTION
    const conservativeDecision = getConservativeDecision(input.classification);
    return {
      result: {
        decision: conservativeDecision.decision,
        reasoning: conservativeDecision.reasoning,
        confidence: conservativeDecision.confidence,
        matched_rule_id: null,
      },
      tokensUsed: 0,
    };
  }

  // Use AI to make the decision
  const userMessage = `Make a decision for this email reply:

CLASSIFICATION:
- Category: ${input.classification.category}
- Urgency: ${input.classification.urgency}
- Safe to Reply: ${input.classification.safe_to_reply}
- Confidence: ${input.classification.confidence}
- Reasoning: ${input.classification.reasoning}

DRAFT PREVIEW (first 500 chars):
${input.draftPreview.slice(0, 500)}

USER SETTINGS:
- Auto-reply enabled: ${input.userSettings.autoReplyEnabled}
- Require approval above confidence: ${input.userSettings.requireApprovalAboveConfidence}

What should be done with this draft?`;

  let content: string;
  let usage: { total_tokens: number };

  try {
    const response = await createChatCompletion(
      [
        { role: 'system', content: DECISION_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      {
        model: AI_MODELS.classification,
        temperature: TEMPERATURES.decision,
        responseFormat: 'json_object',
        maxTokens: 256,
      }
    );
    content = response.content;
    usage = response.usage;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isQuotaError = errorMessage.includes('insufficient_quota') ||
                         errorMessage.includes('rate_limit') ||
                         errorMessage.includes('429');

    if (isQuotaError) {
      throw new Error(`Groq API quota exceeded: ${errorMessage}`);
    }

    // Default to NEEDS_APPROVAL if API fails
    console.error('Decision API error:', error);
    return {
      result: {
        decision: 'NEEDS_APPROVAL',
        reasoning: 'AI decision unavailable - defaulting to approval required',
        confidence: 0.5,
        matched_rule_id: null,
      },
      tokensUsed: 0,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    // Default to NEEDS_APPROVAL if parsing fails
    return {
      result: {
        decision: 'NEEDS_APPROVAL',
        reasoning: 'Failed to parse decision, defaulting to approval required',
        confidence: 0.5,
        matched_rule_id: null,
      },
      tokensUsed: usage.total_tokens,
    };
  }

  const validated = DecisionSchema.safeParse(parsed);

  if (!validated.success) {
    return {
      result: {
        decision: 'NEEDS_APPROVAL',
        reasoning: 'Invalid decision format, defaulting to approval required',
        confidence: 0.5,
        matched_rule_id: null,
      },
      tokensUsed: usage.total_tokens,
    };
  }

  // Apply safety guardrails
  let finalDecision = validated.data.decision;
  let finalReasoning = validated.data.reasoning;

  // Never auto-send if classification confidence is below threshold
  if (
    finalDecision === 'AUTO_SEND' &&
    input.classification.confidence < input.userSettings.requireApprovalAboveConfidence
  ) {
    finalDecision = 'NEEDS_APPROVAL';
    finalReasoning = `Overridden: Classification confidence (${input.classification.confidence}) below threshold (${input.userSettings.requireApprovalAboveConfidence})`;
  }

  // Never auto-send for sensitive categories
  const sensitiveCategories = ['legal', 'personal', 'sales'];
  if (
    finalDecision === 'AUTO_SEND' &&
    sensitiveCategories.includes(input.classification.category)
  ) {
    finalDecision = 'NEEDS_APPROVAL';
    finalReasoning = `Overridden: ${input.classification.category} emails require approval`;
  }

  // Never auto-send if marked as not safe to reply
  if (finalDecision === 'AUTO_SEND' && !input.classification.safe_to_reply) {
    finalDecision = 'NEEDS_APPROVAL';
    finalReasoning = 'Overridden: Email marked as not safe for AI reply';
  }

  return {
    result: {
      decision: finalDecision,
      reasoning: finalReasoning,
      confidence: validated.data.confidence,
      matched_rule_id: null,
    },
    tokensUsed: usage.total_tokens,
  };
}

// Export for use in pipeline to check rules before safe_to_reply skip
export function findMatchingRule(
  classification: ClassificationResult,
  rules: AIRule[],
  emailContext?: { senderEmail: string; senderName?: string; subject: string }
): AIRule | null {
  // Sort by priority (higher first)
  const sortedRules = [...rules]
    .filter((r) => r.is_active)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    if (evaluateConditions(classification, rule.conditions, emailContext)) {
      return rule;
    }
  }

  return null;
}

function evaluateConditions(
  classification: ClassificationResult,
  conditions: AIRule['conditions'],
  emailContext?: { senderEmail: string; senderName?: string; subject: string }
): boolean {
  if (conditions.length === 0) return false;

  return conditions.every((condition) => {
    const fieldValue = getFieldValue(classification, condition.field, emailContext);

    switch (condition.operator) {
      case 'equals':
        // Special case: urgency 'equals high' should also match 'critical'
        // because critical is a higher severity than high
        if (condition.field === 'urgency' && String(condition.value).toLowerCase() === 'high') {
          const urgency = String(fieldValue).toLowerCase();
          return urgency === 'high' || urgency === 'critical';
        }
        return String(fieldValue).toLowerCase() === String(condition.value).toLowerCase();
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.some(
          v => String(v).toLowerCase() === String(fieldValue).toLowerCase()
        );
      default:
        return false;
    }
  });
}

function getFieldValue(
  classification: ClassificationResult,
  field: string,
  emailContext?: { senderEmail: string; senderName?: string; subject: string }
): string | number | boolean {
  switch (field) {
    case 'category':
      return classification.category;
    case 'urgency':
      return classification.urgency;
    case 'confidence':
      return classification.confidence;
    case 'sender_email':
    case 'sender':
      return emailContext?.senderEmail || '';
    case 'sender_name':
      return emailContext?.senderName || '';
    case 'subject':
      return emailContext?.subject || '';
    default:
      return '';
  }
}

function getConservativeDecision(classification: ClassificationResult): {
  decision: AIDecisionType;
  reasoning: string;
  confidence: number;
} {
  // Spam and newsletters: no action
  if (classification.category === 'spam' || classification.category === 'newsletter') {
    return {
      decision: 'NO_ACTION',
      reasoning: 'No reply needed for spam/newsletter',
      confidence: 0.95,
    };
  }

  // Legal: always escalate
  if (classification.category === 'legal') {
    return {
      decision: 'ESCALATE',
      reasoning: 'Legal matters require human attention',
      confidence: 0.95,
    };
  }

  // High urgency or low confidence: needs approval
  if (classification.urgency === 'critical' || classification.urgency === 'high') {
    return {
      decision: 'NEEDS_APPROVAL',
      reasoning: 'High urgency requires approval',
      confidence: 0.9,
    };
  }

  // Not safe to reply: needs approval
  if (!classification.safe_to_reply) {
    return {
      decision: 'NEEDS_APPROVAL',
      reasoning: 'Email requires human review before reply',
      confidence: 0.9,
    };
  }

  // Low confidence: needs approval
  if (classification.confidence < 0.7) {
    return {
      decision: 'NEEDS_APPROVAL',
      reasoning: 'Low classification confidence',
      confidence: 0.8,
    };
  }

  // Default: draft only
  return {
    decision: 'DRAFT_ONLY',
    reasoning: 'Standard processing - saved as draft',
    confidence: 0.85,
  };
}
