'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Star,
  Trash2,
  Archive,
  Mail,
  MailOpen,
  AlertOctagon,
  RotateCcw,
  Loader2,
  RefreshCw,
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

interface EmailFolderListProps {
  folder: 'sent' | 'drafts' | 'starred' | 'spam' | 'trash' | 'all';
  title: string;
  emptyMessage: string;
  showActions?: {
    star?: boolean;
    trash?: boolean;
    spam?: boolean;
    restore?: boolean;
    delete?: boolean;
  };
  onEmailClick?: (email: EmailItem) => void;
}

export function EmailFolderList({
  folder,
  title,
  emptyMessage,
  showActions = {},
  onEmailClick,
}: EmailFolderListProps) {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
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

      // API returns { success, data: { emails } }
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

      // Update local state or refetch
      if (action === 'trash' || action === 'spam' || action === 'delete') {
        setEmails((prev) => prev.filter((e) => e.gmail_message_id !== emailId));
      } else if (action === 'untrash' || action === 'unspam') {
        setEmails((prev) => prev.filter((e) => e.gmail_message_id !== emailId));
      } else if (action === 'star') {
        setEmails((prev) =>
          prev.map((e) =>
            e.gmail_message_id === emailId ? { ...e, is_starred: true } : e
          )
        );
      } else if (action === 'unstar') {
        if (folder === 'starred') {
          setEmails((prev) => prev.filter((e) => e.gmail_message_id !== emailId));
        } else {
          setEmails((prev) =>
            prev.map((e) =>
              e.gmail_message_id === emailId ? { ...e, is_starred: false } : e
            )
          );
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
      case 'star':
        return 'Email starred';
      case 'unstar':
        return 'Star removed';
      case 'trash':
        return 'Moved to trash';
      case 'untrash':
        return 'Restored from trash';
      case 'spam':
        return 'Marked as spam';
      case 'unspam':
        return 'Removed from spam';
      case 'delete':
        return 'Email deleted permanently';
      default:
        return 'Action completed';
    }
  };

  const handleEmailClick = (email: EmailItem) => {
    setSelectedEmail(email.gmail_message_id);
    onEmailClick?.(email);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fetchEmails(true)}
          disabled={refreshing}
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
        </Button>
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
                  selectedEmail === email.gmail_message_id && 'bg-muted',
                  email.is_unread && 'bg-primary/5'
                )}
                onClick={() => handleEmailClick(email)}
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
                    <p
                      className={cn(
                        'truncate text-sm',
                        email.is_unread ? 'font-semibold' : 'font-medium'
                      )}
                    >
                      {folder === 'sent' || folder === 'drafts'
                        ? `To: ${email.to_addresses.join(', ')}`
                        : email.from_name || email.from_address}
                    </p>
                    <span className="flex-shrink-0 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(email.internal_date), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'truncate text-sm',
                      email.is_unread
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {email.subject || '(No Subject)'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {email.snippet}
                  </p>
                </div>

                {/* Actions */}
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
                            onClick={() =>
                              handleAction(
                                email.gmail_message_id,
                                email.is_starred ? 'unstar' : 'star'
                              )
                            }
                          >
                            <Star
                              className={cn(
                                'h-4 w-4',
                                email.is_starred
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted-foreground'
                              )}
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {email.is_starred ? 'Remove star' : 'Star'}
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {showActions.restore && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={actionLoading === email.gmail_message_id}
                            onClick={() =>
                              handleAction(
                                email.gmail_message_id,
                                folder === 'spam' ? 'unspam' : 'untrash'
                              )
                            }
                          >
                            <RotateCcw className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Restore</TooltipContent>
                      </Tooltip>
                    )}

                    {showActions.spam && folder !== 'spam' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={actionLoading === email.gmail_message_id}
                            onClick={() =>
                              handleAction(email.gmail_message_id, 'spam')
                            }
                          >
                            <AlertOctagon className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mark as spam</TooltipContent>
                      </Tooltip>
                    )}

                    {showActions.trash && folder !== 'trash' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={actionLoading === email.gmail_message_id}
                            onClick={() =>
                              handleAction(email.gmail_message_id, 'trash')
                            }
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Move to trash</TooltipContent>
                      </Tooltip>
                    )}

                    {showActions.delete && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            disabled={actionLoading === email.gmail_message_id}
                            onClick={() =>
                              handleAction(email.gmail_message_id, 'delete')
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete permanently</TooltipContent>
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
  );
}
