'use client';

import { useState } from 'react';
import { formatDate, getCategoryColor, getUrgencyColor, formatConfidence } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Check,
  X,
  Edit2,
  Sparkles,
  Send,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Reply,
  Loader2,
} from 'lucide-react';

interface Email {
  id: string;
  from_address: string;
  from_name: string | null;
  subject: string;
  body_text: string | null;
  body_html: string | null;
  internal_date: string;
  is_incoming: boolean;
}

interface EmailViewerProps {
  thread: {
    id: string;
    subject: string;
    emails: Email[];
    classification?: {
      category: string;
      urgency: string;
      safe_to_reply: boolean;
      confidence: number;
      reasoning: string;
    } | null;
    decision?: {
      decision: string;
      reasoning: string;
      confidence: number;
    } | null;
    draft?: {
      id: string;
      subject: string;
      body_text: string;
      tone: string;
    } | null;
    approval?: {
      id: string;
      status: string;
    } | null;
  };
  onApprove?: (draftId: string, modifiedBody?: string) => void;
  onReject?: (draftId: string, notes?: string) => void;
  onReplySent?: () => void;
}

export function EmailViewer({ thread, onApprove, onReject, onReplySent }: EmailViewerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDraft, setEditedDraft] = useState(thread.draft?.body_text || '');
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(
    new Set([thread.emails[thread.emails.length - 1]?.id])
  );

  // Manual reply state
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Get the last incoming email to reply to
  const lastIncomingEmail = [...thread.emails].reverse().find(e => e.is_incoming);
  const replyTo = lastIncomingEmail?.from_address || thread.emails[0]?.from_address;
  const replySubject = thread.subject.startsWith('Re:') ? thread.subject : `Re: ${thread.subject}`;

  const handleSendManualReply = async () => {
    if (!replyBody.trim() || !replyTo) return;

    setIsSending(true);
    setSendError(null);

    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: thread.id,
          to: replyTo,
          subject: replySubject,
          body: replyBody,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      // Clear composer and notify parent
      setReplyBody('');
      setShowReplyComposer(false);
      onReplySent?.();
    } catch (error) {
      console.error('Send error:', error);
      setSendError(error instanceof Error ? error.message : 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const toggleEmail = (emailId: string) => {
    setExpandedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(emailId)) {
        next.delete(emailId);
      } else {
        next.add(emailId);
      }
      return next;
    });
  };

  const handleApprove = () => {
    if (thread.draft && onApprove) {
      if (isEditing && editedDraft !== thread.draft.body_text) {
        onApprove(thread.draft.id, editedDraft);
      } else {
        onApprove(thread.draft.id);
      }
    }
  };

  const handleReject = () => {
    if (thread.draft && onReject) {
      onReject(thread.draft.id);
    }
  };

  const resetDraft = () => {
    setEditedDraft(thread.draft?.body_text || '');
    setIsEditing(false);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">{thread.subject}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {thread.classification && (
            <>
              <Badge className={getCategoryColor(thread.classification.category)}>
                {thread.classification.category}
              </Badge>
              <Badge className={getUrgencyColor(thread.classification.urgency)}>
                {thread.classification.urgency}
              </Badge>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                {formatConfidence(thread.classification.confidence)} confidence
              </span>
            </>
          )}
        </div>
      </div>

      {/* Email Thread */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {thread.emails.map((email, index) => {
            const isExpanded = expandedEmails.has(email.id);
            const isLatest = index === thread.emails.length - 1;
            const senderName =
              email.from_name || email.from_address.split('@')[0];

            return (
              <Card key={email.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer p-4"
                  onClick={() => toggleEmail(email.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {senderName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{senderName}</p>
                        <p className="text-xs text-muted-foreground">
                          {email.from_address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(email.internal_date)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="p-4 pt-0">
                    <div className="whitespace-pre-wrap text-sm">
                      {email.body_text || 'No content'}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}

          {/* AI Analysis Card */}
          {thread.classification && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  {thread.classification.reasoning}
                </p>
                {thread.decision && (
                  <p className="mt-2 text-sm">
                    <strong>Decision:</strong> {thread.decision.decision}
                    <br />
                    <span className="text-muted-foreground">
                      {thread.decision.reasoning}
                    </span>
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* AI Draft Card */}
          {thread.draft && (
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Send className="h-4 w-4" />
                    AI Generated Reply
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit2 className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={resetDraft}>
                        <RotateCcw className="mr-1 h-4 w-4" />
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {isEditing ? (
                  <Textarea
                    value={editedDraft}
                    onChange={(e) => setEditedDraft(e.target.value)}
                    className="min-h-[200px] bg-background"
                  />
                ) : (
                  <div className="whitespace-pre-wrap text-sm">
                    {thread.draft.body_text}
                  </div>
                )}

                {/* Action Buttons */}
                {thread.approval?.status === 'pending' && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={handleApprove}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {isEditing ? 'Approve & Send (Modified)' : 'Approve & Send'}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      className="flex-1"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Manual Reply Composer */}
          {showReplyComposer && (
            <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/50">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Reply className="h-4 w-4" />
                    Reply to {replyTo}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowReplyComposer(false);
                      setReplyBody('');
                      setSendError(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Subject</label>
                  <Input value={replySubject} disabled className="bg-muted" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Message</label>
                  <Textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Type your reply..."
                    className="min-h-[150px] bg-background"
                    disabled={isSending}
                  />
                </div>
                {sendError && (
                  <p className="text-sm text-red-600">{sendError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSendManualReply}
                    disabled={isSending || !replyBody.trim()}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isSending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {isSending ? 'Sending...' : 'Send Reply'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReplyComposer(false);
                      setReplyBody('');
                      setSendError(null);
                    }}
                    disabled={isSending}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Reply Button - Fixed at bottom */}
      {!showReplyComposer && (
        <div className="border-t p-4">
          <Button
            onClick={() => setShowReplyComposer(true)}
            className="w-full"
            variant="outline"
          >
            <Reply className="mr-2 h-4 w-4" />
            Reply Manually
          </Button>
        </div>
      )}
    </div>
  );
}
