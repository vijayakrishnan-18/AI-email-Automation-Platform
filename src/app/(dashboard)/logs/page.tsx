'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  email_classified: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  email_sync: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  approval_approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  approval_rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  approval_modified: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  rule_created: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  rule_updated: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  rule_deleted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  settings_updated: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  email_account_connected: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  added_to_approval_queue: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [availableActions, setAvailableActions] = useState<string[]>([]);

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '50' });
      if (actionFilter && actionFilter !== 'all') {
        params.append('action', actionFilter);
      }

      const response = await fetch(`/api/logs?${params}`);
      const { data } = await response.json();

      setLogs(data?.logs || []);
      setTotalPages(data?.totalPages || 1);
      setAvailableActions(data?.filters?.actions || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDetails = (details: Record<string, unknown>) => {
    if (!details || Object.keys(details).length === 0) return null;

    return Object.entries(details)
      .map(([key, value]) => {
        if (typeof value === 'object') {
          return `${key}: ${JSON.stringify(value)}`;
        }
        return `${key}: ${value}`;
      })
      .join(', ');
  };

  return (
    <DashboardLayout title="Audit Logs">
      <div className="flex h-full flex-col p-6">
        {/* Filters */}
        <div className="mb-4 flex items-center gap-4">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {availableActions.map((action) => (
                <SelectItem key={action} value={action}>
                  {formatAction(action)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Logs List */}
        <Card className="flex-1">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <CardContent className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
              <FileText className="h-12 w-12" />
              <p>No logs found</p>
            </CardContent>
          ) : (
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="divide-y">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            ACTION_COLORS[log.action] ||
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {formatAction(log.action)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          on {log.entity_type}
                        </span>
                      </div>
                      {formatDetails(log.details) && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatDetails(log.details)}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
