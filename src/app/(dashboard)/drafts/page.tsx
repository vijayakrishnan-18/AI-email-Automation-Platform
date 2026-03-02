'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { FileEdit, Trash2, Send, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface Draft {
  id: string;
  gmail_draft_id: string;
  to_addresses: string[];
  subject: string;
  snippet: string;
  internal_date: string;
}

export default function DraftsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { toast } = useToast();

  const handleOpenDraft = (draftId: string) => {
    // Navigate to compose page with draft ID
    router.push(`/compose?draft=${draftId}`);
  };

  const fetchDrafts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch('/api/folders?folder=drafts');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch drafts');
      }

      // API wraps response in { success: true, data: { drafts: [...] } }
      setDrafts(result.data?.drafts || []);
    } catch (error) {
      console.error('Error fetching drafts:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load drafts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleDeleteDraft = async (draftId: string) => {
    setActionLoading(draftId);
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, action: 'delete-draft' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete draft');
      }

      setDrafts((prev) => prev.filter((d) => d.gmail_draft_id !== draftId));
      toast({
        title: 'Success',
        description: 'Draft deleted',
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete draft',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
      setDeleteConfirm(null);
    }
  };

  const handleSendDraft = async (draftId: string) => {
    setActionLoading(draftId);
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, action: 'send-draft' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send draft');
      }

      setDrafts((prev) => prev.filter((d) => d.gmail_draft_id !== draftId));
      toast({
        title: 'Success',
        description: 'Email sent successfully',
      });
    } catch (error) {
      console.error('Send error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send draft',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Drafts">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Drafts">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Drafts</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchDrafts(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </Button>
        </div>

        {/* Drafts List */}
        {drafts.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
            <FileEdit className="mb-4 h-12 w-12" />
            <p>No drafts</p>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="divide-y">
              {drafts.map((draft) => (
                <div
                  key={draft.gmail_draft_id}
                  className="flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                  onClick={() => handleOpenDraft(draft.gmail_draft_id)}
                >
                  {/* Draft icon */}
                  <div className="mt-2 flex-shrink-0">
                    <FileEdit className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Draft content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        To: {draft.to_addresses.length > 0 ? draft.to_addresses.join(', ') : '(No recipients)'}
                      </p>
                      <span className="flex-shrink-0 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(draft.internal_date), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {draft.subject || '(No Subject)'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {draft.snippet}
                    </p>
                  </div>

                  {/* Actions */}
                  <TooltipProvider delayDuration={0}>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={actionLoading === draft.gmail_draft_id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendDraft(draft.gmail_draft_id);
                            }}
                          >
                            {actionLoading === draft.gmail_draft_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Send</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            disabled={actionLoading === draft.gmail_draft_id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(draft.gmail_draft_id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete draft</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The draft will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteConfirm && handleDeleteDraft(deleteConfirm)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
