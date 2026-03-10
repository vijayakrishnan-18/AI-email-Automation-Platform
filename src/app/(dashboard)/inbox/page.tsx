'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { EmailListItem } from '@/components/email/email-list-item';
import { EmailViewer } from '@/components/email/email-viewer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, Inbox, Loader2, X, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Thread {
  id: string;
  subject: string;
  snippet: string;
  last_message_at: string;
  is_unread: boolean;
  status: string;
  participants: Array<{ email: string; name: string | null; type: string }>;
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
}

interface ThreadWithDetails {
  id: string;
  subject: string;
  emails: Array<{
    id: string;
    from_address: string;
    from_name: string | null;
    subject: string;
    body_text: string | null;
    body_html: string | null;
    internal_date: string;
    is_incoming: boolean;
  }>;
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
}

export default function InboxPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ThreadWithDetails | null>(
    null
  );
  const [listVisible, setListVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Fetch threads when category filter changes
  useEffect(() => {
    fetchThreads();
  }, [categoryFilter]);

  // Debounced search - triggers after user stops typing for 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== '') {
        fetchThreads();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchThreads = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter && categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/threads?${params}`);
      const { data } = await response.json();
      setThreads(data?.threads || []);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchThreadDetails = async (threadId: string) => {
    setIsLoadingThread(true);
    
    // Optimistically mark the thread as read in the list view immediately
    setThreads(currentThreads => 
      currentThreads.map(t => 
        t.id === threadId ? { ...t, is_unread: false } : t
      )
    );

    try {
      const response = await fetch(`/api/threads/${threadId}`);
      const { data } = await response.json();
      setSelectedThread(data);
    } catch (error) {
      console.error('Error fetching thread details:', error);
    } finally {
      setIsLoadingThread(false);
    }
  };

  const handleApprove = async (draftId: string, modifiedBody?: string) => {
    try {
      const response = await fetch(`/api/approvals?id=${selectedThread?.approval?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: modifiedBody ? 'modify' : 'approve',
          modifiedBody,
        }),
      });

      if (response.ok) {
        // Refresh data
        if (selectedThread) {
          fetchThreadDetails(selectedThread.id);
        }
        fetchThreads();
      }
    } catch (error) {
      console.error('Error approving:', error);
    }
  };

  const handleReject = async (draftId: string) => {
    try {
      const response = await fetch(`/api/approvals?id=${selectedThread?.approval?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });

      if (response.ok) {
        if (selectedThread) {
          fetchThreadDetails(selectedThread.id);
        }
        fetchThreads();
      }
    } catch (error) {
      console.error('Error rejecting:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchThreads();
  };

  return (
    <DashboardLayout title="Inbox" showSync>
      <div className="flex h-full">
        {/* Email List Panel */}
        {listVisible && (
        <div className={cn(
          "flex flex-col border-r transition-all duration-300",
          selectedThread ? "w-96 hidden md:flex" : "w-full"
        )}>
          {/* Search and Filters */}
          <div className="flex items-center gap-2 border-b p-4">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </form>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] shrink-0">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="newsletter">Newsletter</SelectItem>
                <SelectItem value="transactional">Transactional</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Thread List */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : threads.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <Inbox className="h-12 w-12" />
                <p>No emails found</p>
              </div>
            ) : (
              threads.map((thread) => (
                <EmailListItem
                  key={thread.id}
                  thread={thread}
                  classification={thread.classification}
                  decision={thread.decision}
                  approval={thread.approval}
                  isSelected={selectedThread?.id === thread.id}
                  onClick={() => fetchThreadDetails(thread.id)}
                />
              ))
            )}
          </ScrollArea>
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
        {selectedThread && (
        <div className="flex-1 flex flex-col relative w-full overflow-hidden">
          {/* Close button for entire thread viewer */}
          <div className="absolute top-2 right-4 z-10">
             <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedThread(null)}
                title="Close email"
                className="text-muted-foreground hover:text-foreground bg-background/50 backdrop-blur-sm"
              >
                <X className="h-5 w-5" />
              </Button>
          </div>
          {isLoadingThread ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <EmailViewer
              thread={selectedThread}
              onApprove={handleApprove}
              onReject={handleReject}
              onReplySent={() => {
                // Refresh thread details and list after sending
                fetchThreadDetails(selectedThread.id);
                fetchThreads();
              }}
            />
          )}
        </div>
        )}
      </div>
    </DashboardLayout>
  );
}
