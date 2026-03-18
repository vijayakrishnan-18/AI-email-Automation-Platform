import { google, gmail_v1 } from 'googleapis';
import { createOAuth2Client, refreshAccessToken, decryptTokens, encryptTokens } from './oauth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Email, EmailThread, EmailParticipant, EmailAttachment } from '@/types';

export class GmailClient {
  private gmail: gmail_v1.Gmail;
  private emailAccountId: string;
  private accessToken: string;
  private refreshToken: string;
  private tokenExpiresAt: Date;

  constructor(
    emailAccountId: string,
    accessTokenEncrypted: string,
    refreshTokenEncrypted: string,
    tokenExpiresAt: Date
  ) {
    this.emailAccountId = emailAccountId;
    this.tokenExpiresAt = tokenExpiresAt;

    const { accessToken, refreshToken } = decryptTokens(
      accessTokenEncrypted,
      refreshTokenEncrypted
    );

    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      access_token: this.accessToken,
      refresh_token: this.refreshToken,
    });

    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  }

  private async ensureValidToken(): Promise<void> {
    // Refresh if token expires in less than 5 minutes
    if (new Date() >= new Date(this.tokenExpiresAt.getTime() - 5 * 60 * 1000)) {
      const newTokens = await refreshAccessToken(this.refreshToken);
      this.accessToken = newTokens.access_token;

      // Update tokens in database
      const { accessTokenEncrypted, refreshTokenEncrypted } = encryptTokens(newTokens);
      const supabase = createServiceRoleClient();

      await supabase
        .from('email_accounts')
        .update({
          access_token_encrypted: accessTokenEncrypted,
          refresh_token_encrypted: refreshTokenEncrypted,
          token_expires_at: new Date(newTokens.expiry_date).toISOString(),
        })
        .eq('id', this.emailAccountId);

      // Update OAuth2 client
      const oauth2Client = createOAuth2Client();
      oauth2Client.setCredentials({
        access_token: this.accessToken,
        refresh_token: this.refreshToken,
      });
      this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      this.tokenExpiresAt = new Date(newTokens.expiry_date);
    }
  }

  async getProfile(): Promise<{ emailAddress: string; historyId: string }> {
    await this.ensureValidToken();
    const { data } = await this.gmail.users.getProfile({ userId: 'me' });
    return {
      emailAddress: data.emailAddress!,
      historyId: data.historyId!,
    };
  }

  async listThreads(
    options: {
      maxResults?: number;
      pageToken?: string;
      q?: string;
      labelIds?: string[];
    } = {}
  ): Promise<{
    threads: gmail_v1.Schema$Thread[];
    nextPageToken?: string;
  }> {
    await this.ensureValidToken();

    const { data } = await this.gmail.users.threads.list({
      userId: 'me',
      maxResults: options.maxResults || 20,
      pageToken: options.pageToken,
      q: options.q,
      labelIds: options.labelIds,
    });

    return {
      threads: data.threads || [],
      nextPageToken: data.nextPageToken || undefined,
    };
  }

  async getThread(threadId: string, format: 'minimal' | 'metadata' | 'full' = 'metadata'): Promise<gmail_v1.Schema$Thread> {
    await this.ensureValidToken();
    const { data } = await this.gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format,
    });
    return data;
  }

  async getMessage(messageId: string, format: 'minimal' | 'metadata' | 'full' = 'full'): Promise<gmail_v1.Schema$Message> {
    await this.ensureValidToken();
    const { data } = await this.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format,
    });
    return data;
  }

  async listMessages(
    options: {
      maxResults?: number;
      pageToken?: string;
      q?: string;
      labelIds?: string[];
    } = {}
  ): Promise<{
    messages: gmail_v1.Schema$Message[];
    nextPageToken?: string;
  }> {
    await this.ensureValidToken();

    const { data } = await this.gmail.users.messages.list({
      userId: 'me',
      maxResults: options.maxResults || 20,
      pageToken: options.pageToken,
      q: options.q,
      labelIds: options.labelIds,
    });

    return {
      messages: data.messages || [],
      nextPageToken: data.nextPageToken || undefined,
    };
  }

  async modifyMessage(
    messageId: string,
    addLabelIds: string[] = [],
    removeLabelIds: string[] = []
  ): Promise<gmail_v1.Schema$Message> {
    await this.ensureValidToken();
    const { data } = await this.gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds,
        removeLabelIds,
      },
    });
    return data;
  }

  async trashMessage(messageId: string): Promise<gmail_v1.Schema$Message> {
    await this.ensureValidToken();
    const { data } = await this.gmail.users.messages.trash({
      userId: 'me',
      id: messageId,
    });
    return data;
  }

  async untrashMessage(messageId: string): Promise<gmail_v1.Schema$Message> {
    await this.ensureValidToken();
    const { data } = await this.gmail.users.messages.untrash({
      userId: 'me',
      id: messageId,
    });
    return data;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.ensureValidToken();
    await this.gmail.users.messages.delete({
      userId: 'me',
      id: messageId,
    });
  }

  async listDrafts(
    options: {
      maxResults?: number;
      pageToken?: string;
    } = {}
  ): Promise<{
    drafts: gmail_v1.Schema$Draft[];
    nextPageToken?: string;
  }> {
    await this.ensureValidToken();
    const { data } = await this.gmail.users.drafts.list({
      userId: 'me',
      maxResults: options.maxResults || 20,
      pageToken: options.pageToken,
    });
    return {
      drafts: data.drafts || [],
      nextPageToken: data.nextPageToken || undefined,
    };
  }

  async getDraft(draftId: string, format: 'minimal' | 'full' | 'raw' | 'metadata' = 'full'): Promise<gmail_v1.Schema$Draft> {
    await this.ensureValidToken();
    const { data } = await this.gmail.users.drafts.get({
      userId: 'me',
      id: draftId,
      format,
    });
    return data;
  }

  async deleteDraft(draftId: string): Promise<void> {
    await this.ensureValidToken();
    await this.gmail.users.drafts.delete({
      userId: 'me',
      id: draftId,
    });
  }

  async sendDraft(draftId: string): Promise<gmail_v1.Schema$Message> {
    await this.ensureValidToken();
    const { data } = await this.gmail.users.drafts.send({
      userId: 'me',
      requestBody: {
        id: draftId,
      },
    });
    return data;
  }

  async sendMessage(to: string, subject: string, body: string, threadId?: string): Promise<gmail_v1.Schema$Message> {
    await this.ensureValidToken();

    const profile = await this.getProfile();
    const htmlBody = body.replace(/\n/g, '<br>');

    const headers = [
      `From: ${profile.emailAddress}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      threadId ? `In-Reply-To: ${threadId}` : null,
      threadId ? `References: ${threadId}` : null,
      'Content-Type: text/html; charset=utf-8',
    ]
      .filter(Boolean)
      .join('\r\n');

    const email = `${headers}\r\n\r\n${htmlBody}`;

    // Standard Base64Url encoding for Gmail API
    const encodedMessage = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const { data } = await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId,
      },
    });

    return data;
  }

  async createDraft(to: string, subject: string, body: string, threadId?: string): Promise<gmail_v1.Schema$Draft> {
    await this.ensureValidToken();

    const profile = await this.getProfile();
    const htmlBody = body.replace(/\n/g, '<br>');

    const headers = [
      `From: ${profile.emailAddress}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      threadId ? `In-Reply-To: ${threadId}` : null,
      threadId ? `References: ${threadId}` : null,
      'Content-Type: text/html; charset=utf-8',
    ]
      .filter(Boolean)
      .join('\r\n');

    const email = `${headers}\r\n\r\n${htmlBody}`;

    // Standard Base64Url encoding for Gmail API
    const encodedMessage = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const { data } = await this.gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: encodedMessage,
          threadId,
        },
      },
    });

    return data;
  }

  async modifyLabels(
    messageId: string,
    addLabelIds: string[] = [],
    removeLabelIds: string[] = []
  ): Promise<gmail_v1.Schema$Message> {
    await this.ensureValidToken();
    const { data } = await this.gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds,
        removeLabelIds,
      },
    });
    return data;
  }

  async markAsRead(messageId: string): Promise<void> {
    await this.modifyLabels(messageId, [], ['UNREAD']);
  }

  async markAsUnread(messageId: string): Promise<void> {
    await this.modifyLabels(messageId, ['UNREAD'], []);
  }

  async archive(messageId: string): Promise<void> {
    await this.modifyLabels(messageId, [], ['INBOX']);
  }

  async getHistory(startHistoryId: string): Promise<gmail_v1.Schema$History[]> {
    await this.ensureValidToken();
    const { data } = await this.gmail.users.history.list({
      userId: 'me',
      startHistoryId,
      historyTypes: ['messageAdded', 'labelAdded', 'labelRemoved'],
    });
    return data.history || [];
  }

  async setupWatch(topicName: string): Promise<{ historyId: string; expiration: string }> {
    await this.ensureValidToken();
    const { data } = await this.gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName,
        labelIds: ['INBOX'],
      },
    });
    return {
      historyId: data.historyId!,
      expiration: data.expiration!,
    };
  }

  async stopWatch(): Promise<void> {
    await this.ensureValidToken();
    await this.gmail.users.stop({ userId: 'me' });
  }
}

// Helper functions to parse Gmail API responses

export function parseGmailThread(thread: gmail_v1.Schema$Thread): Partial<EmailThread> {
  const messages = thread.messages || [];
  const lastMessage = messages[messages.length - 1];
  const firstMessage = messages[0];

  const participants: EmailParticipant[] = [];
  const seenEmails = new Set<string>();

  messages.forEach((msg) => {
    const headers = msg.payload?.headers || [];
    const from = headers.find((h) => h.name?.toLowerCase() === 'from')?.value || '';
    const to = headers.find((h) => h.name?.toLowerCase() === 'to')?.value || '';
    const cc = headers.find((h) => h.name?.toLowerCase() === 'cc')?.value || '';

    const parseAddress = (addr: string): { email: string; name: string | null } => {
      const match = addr.match(/(?:"?([^"]*)"?\s)?<?([^\s<>]+@[^\s<>]+)>?/);
      if (match) {
        return { name: match[1] || null, email: match[2] };
      }
      return { name: null, email: addr };
    };

    const addParticipant = (addr: string, type: EmailParticipant['type']) => {
      const { email, name } = parseAddress(addr);
      if (email && !seenEmails.has(email)) {
        seenEmails.add(email);
        participants.push({ email, name, type });
      }
    };

    if (from) addParticipant(from, 'from');
    to.split(',').forEach((addr) => addr.trim() && addParticipant(addr.trim(), 'to'));
    cc.split(',').forEach((addr) => addr.trim() && addParticipant(addr.trim(), 'cc'));
  });

  const getHeader = (msg: gmail_v1.Schema$Message, name: string): string => {
    return msg.payload?.headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';
  };

  return {
    gmail_thread_id: thread.id!,
    subject: getHeader(firstMessage, 'subject') || '(No Subject)',
    snippet: thread.snippet || '',
    last_message_at: lastMessage?.internalDate
      ? new Date(parseInt(lastMessage.internalDate)).toISOString()
      : new Date().toISOString(),
    message_count: messages.length,
    is_unread: messages.some((m) => m.labelIds?.includes('UNREAD')),
    labels: Array.from(new Set(messages.flatMap((m) => m.labelIds || []))),
    participants,
  };
}

export function parseGmailMessage(message: gmail_v1.Schema$Message): Partial<Email> {
  const headers = message.payload?.headers || [];
  const getHeader = (name: string): string =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

  const parseAddresses = (header: string): string[] => {
    if (!header) return [];
    return header.split(',').map((addr) => {
      const match = addr.match(/<([^>]+)>/);
      return match ? match[1].trim() : addr.trim();
    });
  };

  const parseFromAddress = (from: string): { address: string; name: string | null } => {
    const match = from.match(/(?:"?([^"]*)"?\s)?<?([^\s<>]+@[^\s<>]+)>?/);
    if (match) {
      return { name: match[1] || null, address: match[2] };
    }
    return { name: null, address: from };
  };

  const { address: fromAddress, name: fromName } = parseFromAddress(getHeader('from'));

  // Parse body
  let bodyText = '';
  let bodyHtml = '';

  const extractBody = (part: gmail_v1.Schema$MessagePart): void => {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      bodyText = Buffer.from(part.body.data, 'base64').toString('utf-8');
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf-8');
    } else if (part.parts) {
      part.parts.forEach(extractBody);
    }
  };

  if (message.payload) {
    extractBody(message.payload);
  }

  // Parse attachments
  const attachments: EmailAttachment[] = [];
  const extractAttachments = (part: gmail_v1.Schema$MessagePart): void => {
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        id: part.body.attachmentId,
        filename: part.filename,
        mime_type: part.mimeType || 'application/octet-stream',
        size: part.body.size || 0,
      });
    }
    if (part.parts) {
      part.parts.forEach(extractAttachments);
    }
  };

  if (message.payload) {
    extractAttachments(message.payload);
  }

  return {
    gmail_message_id: message.id!,
    from_address: fromAddress,
    from_name: fromName,
    to_addresses: parseAddresses(getHeader('to')),
    cc_addresses: parseAddresses(getHeader('cc')),
    subject: getHeader('subject') || '(No Subject)',
    snippet: message.snippet || '',
    body_text: bodyText || null,
    body_html: bodyHtml || null,
    headers: Object.fromEntries(headers.map((h) => [h.name!, h.value!])),
    internal_date: message.internalDate
      ? new Date(parseInt(message.internalDate)).toISOString()
      : new Date().toISOString(),
    is_incoming: !message.labelIds?.includes('SENT'),
    attachments,
  };
}
