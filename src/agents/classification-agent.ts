import { createChatCompletion, AI_MODELS, TEMPERATURES } from '@/lib/groq/client';
import type { ClassificationResult, EmailCategory, Urgency } from '@/types';
import { z } from 'zod';

const ClassificationSchema = z.object({
  category: z.enum([
    'sales',
    'support',
    'personal',
    'legal',
    'spam',
    'newsletter',
    'transactional',
    'other',
  ]),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  safe_to_reply: z.boolean(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

const CLASSIFICATION_SYSTEM_PROMPT = `You are an expert email classification agent for a professional email management system.

Your task is to analyze incoming emails and classify them accurately.

## Classification Categories:
- **sales**: Sales inquiries, product questions, pricing requests, demos, proposals
- **support**: Customer support requests, bug reports, technical issues, complaints
- **personal**: Personal communications, networking, casual conversations
- **legal**: Legal notices, compliance, contracts, terms of service, privacy matters
- **spam**: Unsolicited marketing, phishing attempts, suspicious content
- **newsletter**: Subscribed newsletters, digests, regular updates
- **transactional**: Receipts, confirmations, shipping updates, account notifications
- **other**: Anything that doesn't fit the above categories

## Urgency Levels:
- **critical**: Requires immediate attention (security issues, legal deadlines, angry customers)
- **high**: Should be addressed today (time-sensitive requests, important clients)
- **medium**: Should be addressed within 2-3 days (standard inquiries)
- **low**: Can be addressed when convenient (newsletters, FYI emails)

## Safety Assessment:
Determine if it's safe for an AI to draft a reply:
- Set safe_to_reply=false for: legal matters, complaints requiring escalation, sensitive personal topics, unclear intent, potential scams
- Set safe_to_reply=true for: routine inquiries, simple questions, standard support requests

## Confidence Score:
- 0.9-1.0: Very confident in classification
- 0.7-0.89: Confident but some ambiguity
- 0.5-0.69: Moderate confidence, human review recommended
- Below 0.5: Low confidence, classification uncertain

Respond ONLY with valid JSON matching this schema:
{
  "category": "sales|support|personal|legal|spam|newsletter|transactional|other",
  "urgency": "low|medium|high|critical",
  "safe_to_reply": true|false,
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of your classification decision"
}`;

export interface ClassificationInput {
  from: string;
  fromName: string | null;
  subject: string;
  snippet: string;
  bodyPreview: string; // First 1000 chars of body
  threadContext?: string; // Summary of previous messages
}

export async function classifyEmail(
  input: ClassificationInput
): Promise<{ result: ClassificationResult; tokensUsed: number }> {
  const userMessage = `Classify this email:

FROM: ${input.fromName ? `${input.fromName} <${input.from}>` : input.from}
SUBJECT: ${input.subject}

PREVIEW:
${input.snippet}

BODY (first 1000 chars):
${input.bodyPreview}

${input.threadContext ? `THREAD CONTEXT:\n${input.threadContext}` : ''}`;

  let content: string;
  let usage: { total_tokens: number };

  try {
    const response = await createChatCompletion(
      [
        { role: 'system', content: CLASSIFICATION_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      {
        model: AI_MODELS.classification,
        temperature: TEMPERATURES.classification,
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
      // Re-throw quota errors so they can be handled at a higher level
      throw new Error(`Groq API quota exceeded: ${errorMessage}`);
    }

    // For other errors, return a safe fallback
    console.error('Classification API error:', error);
    return {
      result: {
        category: 'other',
        urgency: 'medium',
        safe_to_reply: false,
        confidence: 0.1,
        reasoning: 'AI classification unavailable - API error',
      },
      tokensUsed: 0,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    // Fallback to safe defaults if parsing fails
    return {
      result: {
        category: 'other',
        urgency: 'medium',
        safe_to_reply: false,
        confidence: 0.3,
        reasoning: 'Failed to parse classification response',
      },
      tokensUsed: usage.total_tokens,
    };
  }

  const validated = ClassificationSchema.safeParse(parsed);

  if (!validated.success) {
    return {
      result: {
        category: 'other',
        urgency: 'medium',
        safe_to_reply: false,
        confidence: 0.3,
        reasoning: 'Invalid classification response format',
      },
      tokensUsed: usage.total_tokens,
    };
  }

  return {
    result: validated.data,
    tokensUsed: usage.total_tokens,
  };
}

export function buildClassificationInput(
  from: string,
  fromName: string | null,
  subject: string,
  snippet: string,
  bodyText: string | null
): ClassificationInput {
  return {
    from,
    fromName,
    subject,
    snippet,
    bodyPreview: bodyText?.slice(0, 1000) || snippet,
  };
}
