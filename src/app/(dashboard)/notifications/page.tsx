'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  CheckCircle,
  Clock,
  Mail,
  Sparkles,
  Send,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Loader2,
  X,
  Filter,
  Check,
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'approval_pending' | 'approval_processed' | 'email_classified' | 'auto_reply_sent' | 'sync_complete' | 'rule_matched';
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  thread_id?: string;
  email_id?: string;
  draft_id?: string;
}

const notificationIcons: Record<string, React.ReactNode> = {
  approval_pending: <Clock className="h-5 w-5 text-yellow-500" />,
  approval_processed: <CheckCircle className="h-5 w-5 text-green-500" />,
  email_classified: <Sparkles className="h-5 w-5 text-blue-500" />,
  auto_reply_sent: <Send className="h-5 w-5 text-green-500" />,
  sync_complete: <RefreshCw className="h-5 w-5 text-gray-500" />,
  rule_matched: <Filter className="h-5 w-5 text-purple-500" />,
  added_to_approval_queue: <AlertCircle className="h-5 w-5 text-orange-500" />,
  approval_approved: <Check className="h-5 w-5 text-green-500" />,
  approval_rejected: <X className="h-5 w-5 text-red-500" />,
  approval_modified: <CheckCircle className="h-5 w-5 text-blue-500" />,
};

const notificationColors: Record<string, string> = {
  approval_pending: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
  approval_processed: 'border-l-green-500',
  email_classified: 'border-l-blue-500',
  auto_reply_sent: 'border-l-green-500 bg-green-50 dark:bg-green-950/20',
  sync_complete: 'border-l-gray-500',
  rule_matched: 'border-l-purple-500',
  added_to_approval_queue: 'border-l-orange-500',
  approval_approved: 'border-l-green-500',
  approval_rejected: 'border-l-red-500',
  approval_modified: 'border-l-blue-500',
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const type = activeTab === 'all' ? 'all' : activeTab;
      const response = await fetch(`/api/notifications?type=${type}&limit=50`);
      const { data } = await response.json();
      setNotifications(data?.notifications || []);
      setUnreadCount(data?.unread_count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Navigate based on notification type
    if (notification.type === 'approval_pending') {
      router.push('/approvals');
    } else if (notification.thread_id) {
      router.push(`/inbox?thread=${notification.thread_id}`);
    } else if (notification.email_id) {
      router.push(`/inbox?email=${notification.email_id}`);
    }
  };

  const groupNotificationsByDate = (notifications: Notification[]) => {
    const groups: Record<string, Notification[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const notification of notifications) {
      const date = new Date(notification.created_at);
      if (date >= today) {
        groups.today.push(notification);
      } else if (date >= yesterday) {
        groups.yesterday.push(notification);
      } else if (date >= weekAgo) {
        groups.thisWeek.push(notification);
      } else {
        groups.older.push(notification);
      }
    }

    return groups;
  };

  const groupedNotifications = groupNotificationsByDate(notifications);

  const renderNotificationGroup = (title: string, items: Notification[]) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-2">
        <h3 className="px-2 text-xs font-medium uppercase text-muted-foreground">
          {title}
        </h3>
        {items.map((notification) => (
          <Card
            key={notification.id}
            className={`cursor-pointer border-l-4 transition-all hover:shadow-md ${
              notificationColors[notification.type] || 'border-l-gray-500'
            } ${!notification.is_read ? 'bg-accent/50' : ''}`}
            onClick={() => handleNotificationClick(notification)}
          >
            <CardContent className="flex items-start gap-4 p-4">
              <div className="flex-shrink-0 mt-0.5">
                {notificationIcons[notification.type] || <Bell className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{notification.title}</p>
                  {!notification.is_read && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      New
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout title="Notifications">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6" />
            <div>
              <h2 className="text-lg font-semibold">Notifications</h2>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'All caught up!'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchNotifications}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Bell className="h-4 w-4" />
              All
            </TabsTrigger>
            <TabsTrigger value="approvals" className="gap-2">
              <Clock className="h-4 w-4" />
              Approvals
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ai_actions" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI Actions
            </TabsTrigger>
            <TabsTrigger value="sync" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Sync
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <Card>
                <CardContent className="flex h-64 flex-col items-center justify-center gap-4 text-muted-foreground">
                  <Bell className="h-12 w-12" />
                  <div className="text-center">
                    <p className="font-medium">No notifications</p>
                    <p className="text-sm">
                      {activeTab === 'approvals'
                        ? 'No pending approvals'
                        : activeTab === 'ai_actions'
                        ? 'No AI actions yet'
                        : activeTab === 'sync'
                        ? 'No sync events'
                        : "You're all caught up!"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-6 pr-4">
                  {renderNotificationGroup('Today', groupedNotifications.today)}
                  {renderNotificationGroup('Yesterday', groupedNotifications.yesterday)}
                  {renderNotificationGroup('This Week', groupedNotifications.thisWeek)}
                  {renderNotificationGroup('Older', groupedNotifications.older)}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadCount}</div>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0 ? 'Require your attention' : 'All clear'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groupedNotifications.today.length}</div>
              <p className="text-xs text-muted-foreground">
                Notifications today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auto-Replies</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {notifications.filter((n) => n.type === 'auto_reply_sent').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Sent automatically
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
              <p className="text-xs text-muted-foreground">
                All notifications
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
