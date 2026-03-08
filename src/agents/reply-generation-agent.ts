import { createChatCompletion, AI_MODELS, TEMPERATURES } from '@/lib/openai/client';
import type { ThreadContext } from './context-builder-agent';
import type { DraftGenerationResult } from '@/types';
import { z } from 'zod';

const ReplySchema = z.object({
  subject: z.string(),
  body: z.string(),
  tone: z.string(),
});

const REPLY_GENERATION_SYSTEM_PROMPT = `You are a professional email reply writer for a busy professional.

## Your Goals:
1. Write clear, concise, professional replies
2. Address all questions and requests in the original email
3. Match the appropriate tone (professional, friendly, formal)
4. Be helpful without being overly verbose
5. Never make up information or commit to things not mentioned
6. If something is unclear, phrase your response to acknowledge this

## Writing Guidelines:
- Keep replies concise but complete
- Use proper greeting and sign-off appropriate to the relationship
- Break up long responses with paragraphs
- If you need to ask clarifying questions, do so politely
- Never include placeholders like [NAME] or [COMPANY] - either know it or work around it
- Do not include a signature (the user has their own)
- Do not make promises or commitments that weren't explicitly approved

## IMPORTANT:
- Never hallucinate facts, dates, or details
- If you don't have enough context to answer something, acknowledge it
- Be direct and get to the point quickly
- Match the formality level of the incoming email

Respond with JSON in this exact format:
{
  "subject": "Re: Original Subject",
  "body": "The email body text",
  "tone": "professional|friendly|formal|casual"
}`;

export interface ReplyGenerationInput {
  originalEmail: {
    from: string;
    fromName: string | null;
    subject: string;
    body: string;
  };
  context: ThreadContext;
  userPreferences: {
    signature?: string;
    defaultTone?: string;
    name?: string;
  };
}

export async function generateReply(
  input: ReplyGenerationInput
): Promise<{ result: DraftGenerationResult; tokensUsed: number }> {
  const senderName = input.originalEmail.fromName || input.originalEmail.from.split('@')[0];

  const userMessage = `Write a reply to this email:

FROM: ${senderName} <${input.originalEmail.from}>
SUBJECT: ${input.originalEmail.subject}

ORIGINAL EMAIL:
${input.originalEmail.body.slice(0, 3000)}${input.originalEmail.body.length > 3000 ? '...' : ''}

CONTEXT SUMMARY:
- Main Topic: ${input.context.mainTopic}
- Key Requests: ${input.context.keyRequests.join('; ')}
- Relevant History: ${input.context.relevantHistory || 'None'}
- Recommended Tone: ${input.context.tone}
- Reply Guidelines: ${input.context.replyGuidelines.join('; ')}

${input.userPreferences.name ? `REPLY AS: ${input.userPreferences.name}` : ''}
${input.userPreferences.defaultTone ? `PREFERRED TONE: ${input.userPreferences.defaultTone}` : ''}

Generate a professional reply that addresses all the key requests.`;

  let content: string;
  let usage: { total_tokens: number };

  try {
    const response = await createChatCompletion(
      [
        { role: 'system', content: REPLY_GENERATION_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      {
        model: AI_MODELS.generation,
        temperature: TEMPERATURES.generation,
        responseFormat: 'json_object',
        maxTokens: 1024,
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

    // Return fallback if API fails
    console.error('Reply generation API error:', error);
    return {
      result: {
        subject: `Re: ${input.originalEmail.subject}`,
        body_text: 'AI reply generation is currently unavailable. Please draft this response manually.',
        body_html: null,
        tone: 'professional',
        tokens_used: 0,
      },
      tokensUsed: 0,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return {
      result: {
        subject: `Re: ${input.originalEmail.subject}`,
        body_text: 'I apologize, but I was unable to generate a proper reply. Please draft this response manually.',
        body_html: null,
        tone: 'professional',
        tokens_used: usage.total_tokens,
      },
      tokensUsed: usage.total_tokens,
    };
  }

  const validated = ReplySchema.safeParse(parsed);

  if (!validated.success) {
    return {
      result: {
        subject: `Re: ${input.originalEmail.subject}`,
        body_text: 'I apologize, but I was unable to generate a proper reply. Please draft this response manually.',
        body_html: null,
        tone: 'professional',
        tokens_used: usage.total_tokens,
      },
      tokensUsed: usage.total_tokens,
    };
  }

  // Add signature if provided
  let finalBody = validated.data.body;
  if (input.userPreferences.signature) {
    finalBody = `${finalBody}\n\n${input.userPreferences.signature}`;
  }

  // Ensure subject has "Re:" prefix
  const subject = validated.data.subject.startsWith('Re:')
    ? validated.data.subject
    : `Re: ${input.originalEmail.subject}`;

  return {
    result: {
      subject,
      body_text: finalBody,
      body_html: null, // Plain text only for now
      tone: validated.data.tone,
      tokens_used: usage.total_tokens,
    },
    tokensUsed: usage.total_tokens,
  };
}

export async function regenerateWithFeedback(
  input: ReplyGenerationInput,
  previousDraft: string,
  feedback: string
): Promise<{ result: DraftGenerationResult; tokensUsed: number }> {
  const senderName = input.originalEmail.fromName || input.originalEmail.from.split('@')[0];

  const userMessage = `Revise this email reply based on feedback:

ORIGINAL EMAIL FROM: ${senderName}
SUBJECT: ${input.originalEmail.subject}

PREVIOUS DRAFT:
${previousDraft}

USER FEEDBACK:
${feedback}

Generate an improved reply that addresses the feedback while maintaining professionalism.`;

  let content: string;
  let usage: { total_tokens: number };

  try {
    const response = await createChatCompletion(
      [
        { role: 'system', content: REPLY_GENERATION_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      {
        model: AI_MODELS.generation,
        temperature: TEMPERATURES.generation,
        responseFormat: 'json_object',
        maxTokens: 1024,
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

    // Return previous draft if API fails
    console.error('Reply regeneration API error:', error);
    return {
      result: {
        subject: `Re: ${input.originalEmail.subject}`,
        body_text: previousDraft,
        body_html: null,
        tone: 'professional',
        tokens_used: 0,
      },
      tokensUsed: 0,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return {
      result: {
        subject: `Re: ${input.originalEmail.subject}`,
        body_text: previousDraft, // Return previous draft if regeneration fails
        body_html: null,
        tone: 'professional',
        tokens_used: usage.total_tokens,
      },
      tokensUsed: usage.total_tokens,
    };
  }

  const validated = ReplySchema.safeParse(parsed);

  if (!validated.success) {
    return {
      result: {
        subject: `Re: ${input.originalEmail.subject}`,
        body_text: previousDraft,
        body_html: null,
        tone: 'professional',
        tokens_used: usage.total_tokens,
      },
      tokensUsed: usage.total_tokens,
    };
  }

  let finalBody = validated.data.body;
  if (input.userPreferences.signature) {
    finalBody = `${finalBody}\n\n${input.userPreferences.signature}`;
  }

  return {
    result: {
      subject: validated.data.subject,
      body_text: finalBody,
      body_html: null,
      tone: validated.data.tone,
      tokens_used: usage.total_tokens,
    },
    tokensUsed: usage.total_tokens,
  };
}
