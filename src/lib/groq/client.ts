import Groq from 'groq-sdk';

let groqClient: Groq | null = null;

export function getOpenAIClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

// Model configurations for different tasks
// All tasks use llama-3.3-70b-versatile on Groq
export const AI_MODELS = {
  // Fast model for classification
  classification: 'llama-3.3-70b-versatile',
  // Capable model for reply generation
  generation: 'llama-3.3-70b-versatile',
  // Groq does not offer embeddings; this key is kept for type compatibility
  embedding: 'not-supported',
} as const;

// Temperature settings for deterministic behavior
export const TEMPERATURES = {
  classification: 0.1, // Very deterministic
  decision: 0.1,       // Very deterministic
  generation: 0.7,     // More creative for natural responses
} as const;

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * NOTE: Groq does not provide an embeddings API.
 * This function is kept for interface compatibility but will throw if called.
 * It was never used in the codebase previously.
 */
export async function createEmbedding(_text: string): Promise<number[]> {
  throw new Error(
    'Embeddings are not supported by the Groq API. ' +
    'If you need embeddings, consider using a dedicated embeddings service.'
  );
}

export async function createChatCompletion(
  messages: Groq.Chat.ChatCompletionMessageParam[],
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
