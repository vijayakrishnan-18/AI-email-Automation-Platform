'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Check,
  X,
  Edit2,
  Loader2,
  AlertCircle,
  Sparkles,
  Clock,
} from 'lucide-react';
import { formatDate, getCategoryColor, getUrgencyColor, formatConfidence } from '@/lib/utils';

interface ApprovalItem {
  id: string;
  status: string;
  created_at: string;
  thread: {
    id: string;
    subject: string;
    snippet: string;
    last_message_at: string;
  };
  email: {
    id: string;
    from_address: string;
    from_name: string | null;
    body_text: string | null;
  };
  draft: {
    id: string;
    subject: string;
    body_text: string;
    tone: string;
  };
  decision: {
    decision: string;
    reasoning: string;
    confidence: number;
  };
  classification: {
    category: string;
    urgency: string;
    confidence: number;
  } | null;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ApprovalItem | null>(null);
  const [editedBody, setEditedBody] = useState('');

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/approvals?status=pending');
      const { data } = await response.json();
      setApprovals(data?.approvals || []);
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string, modifiedBody?: string) => {
    setProcessingId(id);
    try {
      const response = await fetch(`/api/approvals?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: modifiedBody ? 'modify' : 'approve',
          modifiedBody,
        }),
      });

      if (response.ok) {
        setApprovals((prev) => prev.filter((a) => a.id !== id));
        setEditingItem(null);
      }
    } catch (error) {
      console.error('Error approving:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      const response = await fetch(`/api/approvals?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });

      if (response.ok) {
        setApprovals((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (error) {
      console.error('Error rejecting:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const openEditDialog = (item: ApprovalItem) => {
    setEditingItem(item);
    setEditedBody(item.draft.body_text);
  };

  return (
    <DashboardLayout title="Approvals">
      <div className="p-6">
        {/* Header Stats */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>{approvals.length} pending approval{approvals.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Approval List */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : approvals.length === 0 ? (
          <Card>
            <CardContent className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Check className="h-12 w-12" />
              <p>No pending approvals</p>
              <p className="text-sm">All caught up!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {approvals.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-medium">
                        {item.thread.subject}
                      </CardTitle>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          From: {item.email.from_name || item.email.from_address}
                        </span>
                        <span>·</span>
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.classification && (
                        <>
                          <Badge
                            className={getCategoryColor(
                              item.classification.category
                            )}
                          >
                            {item.classification.category}
                          </Badge>
                          <Badge
                            className={getUrgencyColor(item.classification.urgency)}
                          >
                            {item.classification.urgency}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Original Email Preview */}
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Original Email
                    </p>
                    <p className="mt-1 line-clamp-3 text-sm">
                      {item.email.body_text || item.thread.snippet}
                    </p>
                  </div>

                  {/* AI Draft */}
                  <div className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/50">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <p className="text-xs font-medium uppercase text-blue-600 dark:text-blue-400">
                        AI Generated Reply
                      </p>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatConfidence(item.decision.confidence)} confidence
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm">
                      {item.draft.body_text}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.decision.reasoning}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(item.id)}
                      disabled={processingId === item.id}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {processingId === item.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Approve & Send
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => openEditDialog(item)}
                      disabled={processingId === item.id}
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(item.id)}
                      disabled={processingId === item.id}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Reply</DialogTitle>
            <DialogDescription>
              Modify the AI-generated reply before sending.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              className="min-h-[300px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                editingItem && handleApprove(editingItem.id, editedBody)
              }
              disabled={processingId === editingItem?.id}
            >
              {processingId === editingItem?.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Approve & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
