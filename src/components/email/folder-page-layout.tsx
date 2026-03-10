'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Star,
  Trash2,
  Mail,
  MailOpen,
  AlertOctagon,
  RotateCcw,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface EmailItem {
  id: string;
  gmail_message_id: string;
  gmail_thread_id?: string;
  from_address: string;
  from_name: string | null;
  to_addresses: string[];
  subject: string;
  snippet: string;
  internal_date: string;
  is_unread?: boolean;
  is_starred?: boolean;
  labels?: string[];
}

interface EmailDetails {
  id: string;
  gmail_message_id: string;
  from_address: string;
  from_name: string | null;
  to_addresses: string[];
  cc_addresses?: string[];
  subject: string;
  body_text: string | null;
  body_html: string | null;
  internal_date: string;
  is_starred?: boolean;
}

interface FolderPageLayoutProps {
  folder: 'sent' | 'starred' | 'spam' | 'trash' | 'all';
  title: string;
  emptyMessage: string;
  showActions?: {
    star?: boolean;
    trash?: boolean;
    spam?: boolean;
    restore?: boolean;
    delete?: boolean;
  };
}

export function FolderPageLayout({
  folder,
  title,
  emptyMessage,
  showActions = {},
}: FolderPageLayoutProps) {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailDetails | null>(null);
  const [listVisible, setListVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEmails = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(`/api/folders?folder=${folder}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch emails');
      }

      setEmails(result.data?.emails || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load emails',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [folder, toast]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const fetchEmailDetails = async (messageId: string) => {
    setLoadingEmail(true);

    // Optimistically mark the email as read in the list view immediately
    setEmails(currentEmails =>
      currentEmails.map(e =>
        e.gmail_message_id === messageId ? { ...e, is_unread: false } : e
      )
    );

    try {
      const response = await fetch(`/api/folders/message?id=${messageId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch email');
      }

      setSelectedEmail(result.data);
    } catch (error) {
      console.error('Error fetching email:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load email',
        variant: 'destructive',
      });
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleAction = async (
    emailId: string,
    action: 'star' | 'unstar' | 'trash' | 'untrash' | 'spam' | 'unspam' | 'read' | 'unread' | 'delete'
  ) => {
    setActionLoading(emailId);
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: emailId, action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Action failed');
      }

      // Update local state
      if (action === 'trash' || action === 'spam' || action === 'delete') {
        setEmails((prev) => prev.filter((e) => e.gmail_message_id !== emailId));
        if (selectedEmail?.gmail_message_id === emailId) {
          setSelectedEmail(null);
        }
      } else if (action === 'untrash' || action === 'unspam') {
        setEmails((prev) => prev.filter((e) => e.gmail_message_id !== emailId));
        if (selectedEmail?.gmail_message_id === emailId) {
          setSelectedEmail(null);
        }
      } else if (action === 'star') {
        setEmails((prev) =>
          prev.map((e) =>
            e.gmail_message_id === emailId ? { ...e, is_starred: true } : e
          )
        );
        if (selectedEmail?.gmail_message_id === emailId) {
          setSelectedEmail({ ...selectedEmail, is_starred: true });
        }
      } else if (action === 'unstar') {
        if (folder === 'starred') {
          setEmails((prev) => prev.filter((e) => e.gmail_message_id !== emailId));
          if (selectedEmail?.gmail_message_id === emailId) {
            setSelectedEmail(null);
          }
        } else {
          setEmails((prev) =>
            prev.map((e) =>
              e.gmail_message_id === emailId ? { ...e, is_starred: false } : e
            )
          );
          if (selectedEmail?.gmail_message_id === emailId) {
            setSelectedEmail({ ...selectedEmail, is_starred: false });
          }
        }
      }

      toast({
        title: 'Success',
        description: getActionMessage(action),
      });
    } catch (error) {
      console.error('Action error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Action failed',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getActionMessage = (action: string): string => {
    switch (action) {
      case 'star': return 'Email starred';
      case 'unstar': return 'Star removed';
      case 'trash': return 'Moved to trash';
      case 'untrash': return 'Restored from trash';
      case 'spam': return 'Marked as spam';
      case 'unspam': return 'Removed from spam';
      case 'delete': return 'Email deleted permanently';
      default: return 'Action completed';
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Email List Panel */}
      {listVisible && (
      <div className={cn(
        'flex flex-col border-r transition-all duration-300',
        selectedEmail ? 'w-96 hidden md:flex' : 'w-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchEmails(true)}
              disabled={refreshing}
              title="Refresh"
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setListVisible(false); setSelectedEmail(null); }}
              title="Close list"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* Email List */}
        {emails.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
            <Mail className="mb-4 h-12 w-12" />
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="divide-y">
              {emails.map((email) => (
                <div
                  key={email.gmail_message_id}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50',
                    selectedEmail?.gmail_message_id === email.gmail_message_id && 'bg-muted',
                    email.is_unread && 'bg-primary/5'
                  )}
                  onClick={() => fetchEmailDetails(email.gmail_message_id)}
                >
                  {/* Unread indicator */}
                  <div className="mt-2 flex-shrink-0">
                    {email.is_unread ? (
                      <Mail className="h-4 w-4 text-primary" />
                    ) : (
                      <MailOpen className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Email content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn(
                        'truncate text-sm',
                        email.is_unread ? 'font-semibold' : 'font-medium'
                      )}>
                        {folder === 'sent'
                          ? `To: ${email.to_addresses?.join(', ') || '(No recipients)'}`
                          : email.from_name || email.from_address}
                      </p>
                      <span className="flex-shrink-0 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(email.internal_date), { addSuffix: true })}
                      </span>
                    </div>
                    <p className={cn(
                      'truncate text-sm',
                      email.is_unread ? 'font-medium text-foreground' : 'text-muted-foreground'
                    )}>
                      {email.subject || '(No Subject)'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {email.snippet}
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <TooltipProvider delayDuration={0}>
                    <div
                      className="flex flex-shrink-0 items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {showActions.star && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={actionLoading === email.gmail_message_id}
                              onClick={() => handleAction(
                                email.gmail_message_id,
                                email.is_starred ? 'unstar' : 'star'
                              )}
                            >
                              <Star className={cn(
                                'h-4 w-4',
                                email.is_starred
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted-foreground'
                              )} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {email.is_starred ? 'Remove star' : 'Star'}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TooltipProvider>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
      )}

      {/* If list is hidden, show a narrow side-strip with restore button */}
      {!listVisible && (
        <div className="flex flex-col items-center justify-start border-r pt-4 px-2 w-14 gap-4 bg-muted/20">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setListVisible(true)}
            title="Show email list"
          >
            <Mail className="h-5 w-5 text-primary" />
          </Button>
        </div>
      )}

      {/* Email Viewer */}
      {selectedEmail && (
        <div className="flex flex-1 flex-col">
          {loadingEmail ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Email Header */}
              <div className="border-b p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {showActions.star && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleAction(
                          selectedEmail.gmail_message_id,
                          selectedEmail.is_starred ? 'unstar' : 'star'
                        )}
                      >
                        <Star className={cn(
                          'h-5 w-5',
                          selectedEmail.is_starred
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        )} />
                      </Button>
                    )}
                    {showActions.restore && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleAction(
                          selectedEmail.gmail_message_id,
                          folder === 'spam' ? 'unspam' : 'untrash'
                        )}
                      >
                        <RotateCcw className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    )}
                    {showActions.trash && folder !== 'trash' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleAction(selectedEmail.gmail_message_id, 'trash')}
                      >
                        <Trash2 className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    )}
                    {showActions.delete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleAction(selectedEmail.gmail_message_id, 'delete')}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                  {/* Close (X) button for the right panel */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedEmail(null)}
                    title="Close email"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <h1 className="mb-2 text-xl font-semibold">
                  {selectedEmail.subject || '(No Subject)'}
                </h1>

                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {selectedEmail.from_name || selectedEmail.from_address}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEmail.from_address}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      To: {selectedEmail.to_addresses?.join(', ')}
                    </p>
                    {selectedEmail.cc_addresses && selectedEmail.cc_addresses.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Cc: {selectedEmail.cc_addresses.join(', ')}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedEmail.internal_date), 'PPpp')}
                  </p>
                </div>
              </div>

              {/* Email Body */}
              <ScrollArea className="flex-1 p-4">
                {selectedEmail.body_html ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                  />
                ) : (
                  <div className="whitespace-pre-wrap text-sm">
                    {selectedEmail.body_text || 'No content'}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </div>
      )}
    </div>
  );
}
