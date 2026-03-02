'use client';

import { cn, formatDate, truncate, getCategoryColor, getUrgencyColor } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sparkles, AlertCircle, CheckCircle } from 'lucide-react';

interface EmailListItemProps {
  thread: {
    id: string;
    subject: string;
    snippet: string;
    last_message_at: string;
    is_unread: boolean;
    participants: Array<{ email: string; name: string | null; type: string }>;
  };
  classification?: {
    category: string;
    urgency: string;
    confidence: number;
  } | null;
  decision?: {
    decision: string;
  } | null;
  approval?: {
    status: string;
  } | null;
  isSelected: boolean;
  onClick: () => void;
}

export function EmailListItem({
  thread,
  classification,
  decision,
  approval,
  isSelected,
  onClick,
}: EmailListItemProps) {
  const sender = thread.participants.find((p) => p.type === 'from');
  const senderName = sender?.name || sender?.email?.split('@')[0] || 'Unknown';
  const senderInitial = senderName.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        'flex cursor-pointer items-start gap-4 border-b p-4 transition-colors hover:bg-muted/50',
        isSelected && 'bg-muted',
        thread.is_unread && 'bg-blue-50/50 dark:bg-blue-950/20'
      )}
      onClick={onClick}
    >
      {/* Sender Avatar */}
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback
          className={cn(
            'text-sm font-medium',
            thread.is_unread ? 'bg-primary text-primary-foreground' : ''
          )}
        >
          {senderInitial}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Header Row */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'truncate text-sm',
              thread.is_unread ? 'font-semibold' : 'font-medium'
            )}
          >
            {senderName}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatDate(thread.last_message_at)}
          </span>
        </div>

        {/* Subject */}
        <p
          className={cn(
            'truncate text-sm',
            thread.is_unread ? 'font-medium' : 'text-muted-foreground'
          )}
        >
          {thread.subject}
        </p>

        {/* Snippet */}
        <p className="truncate text-xs text-muted-foreground">
          {truncate(thread.snippet, 100)}
        </p>

        {/* Badges */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {/* Category Badge */}
          {classification && (
            <Badge
              variant="outline"
              className={cn('text-xs', getCategoryColor(classification.category))}
            >
              {classification.category}
            </Badge>
          )}

          {/* Urgency Badge */}
          {classification && classification.urgency !== 'low' && (
            <Badge
              variant="outline"
              className={cn('text-xs', getUrgencyColor(classification.urgency))}
            >
              {classification.urgency}
            </Badge>
          )}

          {/* Confidence */}
          {classification && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              {Math.round(classification.confidence * 100)}%
            </span>
          )}

          {/* Approval Status */}
          {approval?.status === 'pending' && (
            <Badge variant="warning" className="text-xs">
              <AlertCircle className="mr-1 h-3 w-3" />
              Needs Approval
            </Badge>
          )}

          {/* Has AI Draft */}
          {decision?.decision === 'DRAFT_ONLY' && !approval && (
            <Badge variant="info" className="text-xs">
              <CheckCircle className="mr-1 h-3 w-3" />
              Draft Ready
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
