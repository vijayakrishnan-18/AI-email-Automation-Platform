'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

function ConnectEmailContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<
    Array<{ email_address: string; is_active: boolean }>
  >([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const supabase = createClient();

  useEffect(() => {
    const fetchAccounts = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: accounts } = await supabase
          .from('email_accounts')
          .select('email_address, is_active')
          .eq('user_id', user.id);

        if (accounts) {
          setConnectedAccounts(accounts);
        }
      }
    };

    fetchAccounts();
  }, [supabase]);

  const handleConnectGmail = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/gmail');
      const { data } = await response.json();

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Error connecting Gmail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'access_denied':
        return 'You denied access to your Gmail account. Please try again and allow access.';
      case 'missing_parameters':
        return 'Missing required parameters. Please try again.';
      case 'state_expired':
        return 'The connection request expired. Please try again.';
      case 'session_mismatch':
        return 'Session mismatch. Please log in again.';
      case 'callback_failed':
        return 'Failed to connect your account. Please try again.';
      default:
        return errorCode ? `Error: ${errorCode}` : null;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary">
            <Mail className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Connect Your Email</CardTitle>
          <CardDescription>
            Connect your Gmail account to enable AI-powered email management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{getErrorMessage(error)}</span>
            </div>
          )}

          {connectedAccounts.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Connected Accounts</p>
              {connectedAccounts.map((account) => (
                <div
                  key={account.email_address}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <span className="text-sm">{account.email_address}</span>
                  {account.is_active ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleConnectGmail}
            disabled={isLoading}
            className="w-full"
            variant={connectedAccounts.length > 0 ? 'outline' : 'default'}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            {connectedAccounts.length > 0
              ? 'Connect Another Gmail Account'
              : 'Connect Gmail Account'}
          </Button>

          {connectedAccounts.length > 0 && (
            <Button
              variant="default"
              className="w-full"
              onClick={() => router.push('/inbox')}
            >
              Continue to Inbox
            </Button>
          )}

          <p className="text-center text-xs text-muted-foreground">
            We only request the minimum permissions needed to read and send
            emails on your behalf. Your credentials are encrypted and stored
            securely.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConnectEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <ConnectEmailContent />
    </Suspense>
  );
}
