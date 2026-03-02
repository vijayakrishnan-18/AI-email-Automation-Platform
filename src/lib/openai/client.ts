import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// Model configurations for different tasks
export const AI_MODELS = {
  // Fast, cheap model for classification
  classification: 'gpt-4o-mini',
  // More capable model for reply generation
  generation: 'gpt-4o',
  // Embedding model
  embedding: 'text-embedding-3-small',
} as const;

// Temperature settings for deterministic behavior
export const TEMPERATURES = {
  classification: 0.1, // Very deterministic
  decision: 0.1, // Very deterministic
  generation: 0.7, // More creative for natural responses
} as const;

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export async function createEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();

  const response = await client.embeddings.create({
    model: AI_MODELS.embedding,
    input: text,
  });

  return response.data[0].embedding;
}

export async function createChatCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'text' | 'json_object';
  } = {}
): Promise<{ content: string; usage: TokenUsage }> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: options.model || AI_MODELS.classification,
    messages,
    temperature: options.temperature ?? TEMPERATURES.classification,
    max_tokens: options.maxTokens || 1024,
    response_format: options.responseFormat
      ? { type: options.responseFormat }
      : undefined,
  });

  const content = response.choices[0]?.message?.content || '';
  const usage: TokenUsage = {
    prompt_tokens: response.usage?.prompt_tokens || 0,
    completion_tokens: response.usage?.completion_tokens || 0,
    total_tokens: response.usage?.total_tokens || 0,
  };

  return { content, usage };
}
