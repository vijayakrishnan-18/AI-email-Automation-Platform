import { google } from 'googleapis';
import { encrypt, decrypt } from '@/lib/encryption';
import type { GmailTokens } from '@/types';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(state?: string): string {
  const client = createOAuth2Client();

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: state,
  });
}

export async function exchangeCodeForTokens(code: string): Promise<GmailTokens> {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to obtain tokens from Google');
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000,
    scope: tokens.scope || SCOPES.join(' '),
    token_type: tokens.token_type || 'Bearer',
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<GmailTokens> {
  const client = createOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error('Failed to refresh access token');
  }

  return {
    access_token: credentials.access_token,
    refresh_token: refreshToken,
    expiry_date: credentials.expiry_date || Date.now() + 3600 * 1000,
    scope: credentials.scope || SCOPES.join(' '),
    token_type: credentials.token_type || 'Bearer',
  };
}

export async function getUserInfo(accessToken: string) {
  const client = createOAuth2Client();
  client.setCredentials({ access_token: accessToken });

  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const { data } = await oauth2.userinfo.get();

  return {
    email: data.email!,
    name: data.name || null,
    picture: data.picture || null,
  };
}

export function encryptTokens(tokens: GmailTokens): {
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string;
} {
  return {
    accessTokenEncrypted: encrypt(tokens.access_token),
    refreshTokenEncrypted: encrypt(tokens.refresh_token),
  };
}

export function decryptTokens(
  accessTokenEncrypted: string,
  refreshTokenEncrypted: string
): { accessToken: string; refreshToken: string } {
  return {
    accessToken: decrypt(accessTokenEncrypted),
    refreshToken: decrypt(refreshTokenEncrypted),
  };
}

export async function revokeToken(token: string): Promise<void> {
  const client = createOAuth2Client();
  await client.revokeToken(token);
}
