import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  requireAuth,
  withErrorHandling,
  successResponse,
  errorResponse,
} from '@/lib/api-utils';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { GmailClient } from '@/lib/gmail/client';

const QuerySchema = z.object({
  folder: z.enum(['sent', 'drafts', 'starred', 'spam', 'trash', 'all']),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

// Gmail label IDs
const FOLDER_LABELS: Record<string, string[]> = {
  sent: ['SENT'],
  drafts: ['DRAFT'],
  starred: ['STARRED'],
  spam: ['SPAM'],
  trash: ['TRASH'],
  all: [], // No filter, get all
};

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth();
    const supabase = createServerSupabaseClient();

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = QuerySchema.parse(searchParams);

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
      // Handle drafts separately
      if (query.folder === 'drafts') {
        const draftsResponse = await gmailClient.listDrafts({
          maxResults: query.limit,
        });

        const draftDetails = await Promise.all(
          (draftsResponse.drafts || []).map(async (draft) => {
            try {
              const fullDraft = await gmailClient.getDraft(draft.id!, 'full');
              const message = fullDraft.message;

              return {
                id: fullDraft.id,
                gmail_draft_id: fullDraft.id,
                gmail_message_id: message?.id,
                to_addresses: parseAddresses(getHeader(message, 'To') || ''),
                subject: getHeader(message, 'Subject') || '(No Subject)',
                snippet: message?.snippet || '',
                internal_date: message?.internalDate
                  ? new Date(parseInt(message.internalDate)).toISOString()
                  : new Date().toISOString(),
              };
            } catch (err) {
              console.error('Error fetching draft:', draft.id, err);
              return null;
            }
          })
        );

        const validDrafts = draftDetails.filter(Boolean);

        return successResponse({
          drafts: validDrafts,
          folder: query.folder,
          page: query.page,
          limit: query.limit,
          hasMore: (draftsResponse.drafts?.length || 0) >= query.limit,
        });
      }

      // Build label query
      const labels = FOLDER_LABELS[query.folder];

      // Fetch messages from Gmail
      // For sent folder, use only the SENT label (don't combine with q parameter)
      const messages = await gmailClient.listMessages({
        maxResults: query.limit,
        labelIds: labels.length > 0 ? labels : undefined,
      });

      // Get full message details
      const emailDetails = await Promise.all(
        (messages.messages || []).slice(0, query.limit).map(async (msg) => {
          try {
            const fullMessage = await gmailClient.getMessage(msg.id!);
            const fromParsed = parseFromAddress(getHeader(fullMessage, 'From') || '');

            return {
              id: fullMessage.id,
              gmail_message_id: fullMessage.id,
              gmail_thread_id: fullMessage.threadId,
              snippet: fullMessage.snippet || '',
              subject: getHeader(fullMessage, 'Subject') || '(No Subject)',
              from_address: fromParsed.address,
              from_name: fromParsed.name,
              to_addresses: parseAddresses(getHeader(fullMessage, 'To') || ''),
              internal_date: fullMessage.internalDate
                ? new Date(parseInt(fullMessage.internalDate)).toISOString()
                : new Date().toISOString(),
              labels: fullMessage.labelIds || [],
              is_unread: fullMessage.labelIds?.includes('UNREAD') || false,
              is_starred: fullMessage.labelIds?.includes('STARRED') || false,
            };
          } catch (err) {
            console.error('Error fetching message:', msg.id, err);
            return null;
          }
        })
      );

      const validEmails = emailDetails.filter(Boolean);

      return successResponse({
        emails: validEmails,
        folder: query.folder,
        page: query.page,
        limit: query.limit,
        hasMore: (messages.messages?.length || 0) >= query.limit,
      });
    } catch (error) {
      console.error('Error fetching folder:', error);
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to fetch emails',
        500
      );
    }
  });
}

function parseFromAddress(from: string): { address: string; name: string | null } {
  const match = from.match(/(?:"?([^"]*)"?\s)?<?([^\s<>]+@[^\s<>]+)>?/);
  if (match) {
    return { name: match[1] || null, address: match[2] };
  }
  return { name: null, address: from };
}

function parseAddresses(header: string): string[] {
  if (!header) return [];
  return header.split(',').map((addr) => {
    const match = addr.match(/<([^>]+)>/);
    return match ? match[1].trim() : addr.trim();
  });
}

function getHeader(message: any, name: string): string | undefined {
  const headers = message?.payload?.headers || [];
  const header = headers.find(
    (h: { name: string }) => h.name.toLowerCase() === name.toLowerCase()
  );
  return header?.value;
}

// POST - Move email to folder (star, trash, spam, etc.) or draft actions
const ActionSchema = z.object({
  messageId: z.string().optional(),
  draftId: z.string().optional(),
  action: z.enum([
    'star', 'unstar', 'trash', 'untrash', 'spam', 'unspam',
    'read', 'unread', 'delete', 'delete-draft', 'send-draft'
  ]),
});

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAuth();
    const supabase = createServerSupabaseClient();

    const body = await request.json();
    const { messageId, draftId, action } = ActionSchema.parse(body);

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
      // Handle draft-specific actions
      if (action === 'delete-draft' && draftId) {
        await gmailClient.deleteDraft(draftId);
        return successResponse({ success: true, action });
      }

      if (action === 'send-draft' && draftId) {
        const result = await gmailClient.sendDraft(draftId);
        return successResponse({ success: true, action, messageId: result.id });
      }

      // Handle permanent delete
      if (action === 'delete' && messageId) {
        await gmailClient.deleteMessage(messageId);
        return successResponse({ success: true, action });
      }

      // Handle label modifications
      if (!messageId) {
        return errorResponse('Message ID is required', 400);
      }

      let addLabels: string[] = [];
      let removeLabels: string[] = [];

      switch (action) {
        case 'star':
          addLabels = ['STARRED'];
          break;
        case 'unstar':
          removeLabels = ['STARRED'];
          break;
        case 'trash':
          addLabels = ['TRASH'];
          removeLabels = ['INBOX'];
          break;
        case 'untrash':
          removeLabels = ['TRASH'];
          addLabels = ['INBOX'];
          break;
        case 'spam':
          addLabels = ['SPAM'];
          removeLabels = ['INBOX'];
          break;
        case 'unspam':
          removeLabels = ['SPAM'];
          addLabels = ['INBOX'];
          break;
        case 'read':
          removeLabels = ['UNREAD'];
          break;
        case 'unread':
          addLabels = ['UNREAD'];
          break;
      }

      await gmailClient.modifyMessage(messageId, addLabels, removeLabels);

      return successResponse({ success: true, action });
    } catch (error) {
      console.error('Error modifying message:', error);
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to modify email',
        500
      );
    }
  });
}
