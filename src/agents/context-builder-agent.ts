import { createChatCompletion, AI_MODELS, TEMPERATURES } from '@/lib/openai/client';
import type { Email, AIClassification } from '@/types';

const CONTEXT_BUILDER_SYSTEM_PROMPT = `You are a context summarization agent for an email management system.

Your task is to create a concise, relevant context summary that will help another AI agent write an appropriate reply.

## Goals:
1. Extract key information from the thread history
2. Identify the main topic/request
3. Note any specific questions that need answering
4. Highlight relevant details (names, dates, commitments made)
5. Summarize the tone and relationship

## Output Format:
Provide a structured summary that captures:
- MAIN TOPIC: One-line description
- KEY REQUESTS: Bullet points of what the sender wants
- RELEVANT HISTORY: Important context from previous messages
- TONE: Professional/casual/urgent/friendly
- REPLY GUIDELINES: Specific things to address

Keep the summary under 500 tokens to optimize costs.`;

export interface ThreadContext {
  mainTopic: string;
  keyRequests: string[];
  relevantHistory: string;
  tone: string;
  replyGuidelines: string[];
  tokenBudgetUsed: number;
}

export interface ContextBuilderInput {
  currentEmail: {
    from: string;
    fromName: string | null;
    subject: string;
    body: string;
    date: string;
  };
  threadHistory: Array<{
    from: string;
    body: string;
    date: string;
    isIncoming: boolean;
  }>;
  classification: {
    category: string;
    urgency: string;
  };
  userContext?: {
    signature?: string;
    defaultTone?: string;
    name?: string;
    previousReplies?: string[];
  };
}

export async function buildContext(
  input: ContextBuilderInput
): Promise<{ context: ThreadContext; tokensUsed: number }> {
  // Build the message for the AI
  let threadSummary = '';

  // Only include last 5 messages to save tokens
  const recentHistory = input.threadHistory.slice(-5);

  if (recentHistory.length > 0) {
    threadSummary = recentHistory
      .map(
        (msg) =>
          `[${msg.isIncoming ? 'RECEIVED' : 'SENT'} - ${msg.date}]\nFrom: ${msg.from}\n${msg.body.slice(0, 500)}${msg.body.length > 500 ? '...' : ''}`
      )
      .join('\n\n---\n\n');
  }

  const userMessage = `Build context for replying to this email:

CLASSIFICATION: ${input.classification.category} (${input.classification.urgency} urgency)

CURRENT EMAIL:
From: ${input.currentEmail.fromName ? `${input.currentEmail.fromName} <${input.currentEmail.from}>` : input.currentEmail.from}
Subject: ${input.currentEmail.subject}
Date: ${input.currentEmail.date}

Body:
${input.currentEmail.body.slice(0, 2000)}${input.currentEmail.body.length > 2000 ? '...' : ''}

${threadSummary ? `THREAD HISTORY:\n${threadSummary}` : 'No previous thread history.'}

${input.userContext?.defaultTone ? `PREFERRED TONE: ${input.userContext.defaultTone}` : ''}

Provide the context summary in this exact JSON format:
{
  "mainTopic": "string",
  "keyRequests": ["string"],
  "relevantHistory": "string",
  "tone": "string",
  "replyGuidelines": ["string"]
}`;

  let content: string;
  let usage: { total_tokens: number };

  try {
    const response = await createChatCompletion(
      [
        { role: 'system', content: CONTEXT_BUILDER_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      {
        model: AI_MODELS.classification, // Use cheaper model for context building
        temperature: TEMPERATURES.classification,
        responseFormat: 'json_object',
        maxTokens: 512,
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

    // Return basic context if API fails
    console.error('Context builder API error:', error);
    return {
      context: {
        mainTopic: input.currentEmail.subject,
        keyRequests: ['Respond to the email'],
        relevantHistory: 'AI context building unavailable',
        tone: input.userContext?.defaultTone || 'professional',
        replyGuidelines: ['Be helpful and professional'],
        tokenBudgetUsed: 0,
      },
      tokensUsed: 0,
    };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content);
  } catch {
    // Return basic context if parsing fails
    return {
      context: {
        mainTopic: input.currentEmail.subject,
        keyRequests: ['Respond to the email'],
        relevantHistory: 'Unable to summarize history',
        tone: input.userContext?.defaultTone || 'professional',
        replyGuidelines: ['Be helpful and professional'],
        tokenBudgetUsed: usage.total_tokens,
      },
      tokensUsed: usage.total_tokens,
    };
  }

  return {
    context: {
      mainTopic: String(parsed.mainTopic || input.currentEmail.subject),
      keyRequests: Array.isArray(parsed.keyRequests)
        ? parsed.keyRequests.map(String)
        : ['Respond to the email'],
      relevantHistory: String(parsed.relevantHistory || ''),
      tone: String(parsed.tone || 'professional'),
      replyGuidelines: Array.isArray(parsed.replyGuidelines)
        ? parsed.replyGuidelines.map(String)
        : [],
      tokenBudgetUsed: usage.total_tokens,
    },
    tokensUsed: usage.total_tokens,
  };
}

export function estimateTokens(text: string): number {
  // Rough estimation: ~4 chars per token for English text
  return Math.ceil(text.length / 4);
}

export function truncateToTokenBudget(text: string, maxTokens: number): string {
  const estimatedChars = maxTokens * 4;
  if (text.length <= estimatedChars) return text;
  return text.slice(0, estimatedChars) + '...';
}
