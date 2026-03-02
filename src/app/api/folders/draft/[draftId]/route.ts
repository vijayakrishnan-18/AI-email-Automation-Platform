import { NextRequest } from 'next/server';
import {
  requireAuth,
  withErrorHandling,
  successResponse,
  errorResponse,
} from '@/lib/api-utils';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { GmailClient } from '@/lib/gmail/client';

// GET - Fetch a single draft with full body content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  return withErrorHandling(async () => {
    const user = await requireAuth();
    const supabase = createServerSupabaseClient();
    const { draftId } = await params;

    if (!draftId) {
      return errorResponse('Draft ID is required', 400);
    }

    // Get user's email account
    const { data: emailAccount, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (accountError || !emailAccount) {
      return errorResponse('No active email account found', 400);
    }

    // Create Gmail client
    const gmailClient = new GmailClient(
      emailAccount.id,
      emailAccount.access_token_encrypted,
      emailAccount.refresh_token_encrypted,
      new Date(emailAccount.token_expires_at)
    );

    try {
      const fullDraft = await gmailClient.getDraft(draftId, 'full');
      const message = fullDraft.message;

      if (!message) {
        return errorResponse('Draft message not found', 404);
      }

      // Extract headers
      const headers = message.payload?.headers || [];
      const getHeader = (name: string): string | undefined => {
        const header = headers.find(
          (h: { name?: string | null }) => h.name?.toLowerCase() === name.toLowerCase()
        );
        return header?.value || undefined;
      };

      // Parse To addresses
      const toHeader = getHeader('To') || '';
      const toAddresses = toHeader
        ? toHeader.split(',').map((addr) => {
            const match = addr.match(/<([^>]+)>/);
            return match ? match[1].trim() : addr.trim();
          })
        : [];

      // Extract body content
      let bodyText = '';
      let bodyHtml = '';

      const extractBody = (part: any): void => {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          bodyText = Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.parts) {
          part.parts.forEach(extractBody);
        }
      };

      if (message.payload) {
        // Check if body is directly on payload (simple messages)
        if (message.payload.body?.data) {
          const mimeType = message.payload.mimeType;
          const decoded = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
          if (mimeType === 'text/html') {
            bodyHtml = decoded;
          } else {
            bodyText = decoded;
          }
        }
        // Check for multipart content
        if (message.payload.parts) {
          extractBody(message.payload);
        }
      }

      // Use plain text if available, otherwise strip HTML
      let body = bodyText;
      if (!body && bodyHtml) {
        // Simple HTML to text conversion
        body = bodyHtml
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>/gi, '\n\n')
          .replace(/<\/div>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim();
      }

      return successResponse({
        draft: {
          id: fullDraft.id,
          gmail_draft_id: fullDraft.id,
          gmail_message_id: message.id,
          to: toAddresses.join(', '),
          to_addresses: toAddresses,
          subject: getHeader('Subject') || '',
          body: body,
          body_html: bodyHtml,
          snippet: message.snippet || '',
          thread_id: message.threadId,
          internal_date: message.internalDate
            ? new Date(parseInt(message.internalDate)).toISOString()
            : new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error fetching draft:', error);
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to fetch draft',
        500
      );
    }
  });
}
