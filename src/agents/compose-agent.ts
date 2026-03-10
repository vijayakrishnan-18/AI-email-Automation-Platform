import { createChatCompletion, AI_MODELS, TEMPERATURES } from '@/lib/openai/client';
import { z } from 'zod';

const ComposeSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
  tone: z.string(),
});

const COMPOSE_SYSTEM_PROMPT = `You are a versatile email writing assistant. Your job is to write emails based on any user instructions - personal, professional, casual, or formal.

## Your Goals:
1. Extract the recipient email address from the instructions
2. Write an appropriate subject line based on the context
3. Compose the email body based on the user's message/context
4. Match the tone to what the user wants to convey

## Guidelines:
- Write complete, ready-to-send emails
- Use appropriate greeting based on context (formal: "Dear...", casual: "Hi...", etc.)
- Include all information/context the user mentions
- Never use placeholders like [NAME] - work with what you have
- Match the tone and style to the user's intent
- Keep it natural and human-sounding
- Add appropriate sign-off based on tone

## You Can Write ANY Type of Email:
- Personal messages (thank you, congratulations, condolences, catch-up)
- Professional correspondence (inquiries, proposals, introductions)
- Business updates (order confirmations, status updates, announcements)
- Requests (asking for help, information, meetings)
- Follow-ups and reminders
- Apologies and explanations
- Invitations and announcements
- Feedback and reviews
- Literally anything the user asks for!

## Output Format:
Respond with JSON in this exact format:
{
  "to": "recipient@email.com",
  "subject": "Email subject line",
  "body": "Complete email body with greeting and sign-off",
  "tone": "professional|friendly|formal|casual"
}

IMPORTANT:
- The user MUST provide an email address - extract it from their instructions
- If no clear email is found, look for patterns like "send to X" or "email X"
- Write exactly what the user wants to convey - don't add unnecessary fluff
- Be natural and match the user's intended tone
- Do NOT include any email headers (To, From, Subject, Date, Message-Id, etc.) inside the body text. The body should ONLY contain the actual message text.`;

export interface ComposeInput {
  instructions: string;
  senderName?: string;
  senderEmail?: string;
}

export interface ComposeResult {
  to: string;
  subject: string;
  body: string;
  tone: string;
}

export async function composeEmail(
  input: ComposeInput
): Promise<{ result: ComposeResult; tokensUsed: number }> {
  const userMessage = `Write an email based on these instructions:

${input.instructions}

${input.senderName ? `Sign the email as: ${input.senderName}` : ''}
${input.senderEmail ? `Sender's email: ${input.senderEmail}` : ''}

Generate a complete, professional email ready to send.`;

  let content: string;
  let usage: { total_tokens: number };

  try {
    const response = await createChatCompletion(
      [
        { role: 'system', content: COMPOSE_SYSTEM_PROMPT },
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

    console.error('Compose API error:', error);
    throw new Error('Failed to generate email. Please try again.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Failed to parse AI response. Please try again.');
  }

  const validated = ComposeSchema.safeParse(parsed);

  if (!validated.success) {
    throw new Error('Invalid email format generated. Please try again.');
  }

  return {
    result: validated.data,
    tokensUsed: usage.total_tokens,
  };
}
