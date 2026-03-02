'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseAutoSyncOptions {
  enabled?: boolean;
  onSyncComplete?: (results: SyncResult[]) => void;
  onSyncError?: (error: Error) => void;
}

interface SyncResult {
  account: string;
  newThreads: number;
  newEmails: number;
  processed: number;
  success: boolean;
  error?: string;
}

interface UseAutoSyncReturn {
  isSyncing: boolean;
  lastSyncAt: Date | null;
  syncNow: () => Promise<void>;
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (enabled: boolean) => void;
  syncIntervalMinutes: number;
}

// Get sync interval from environment variable (default: 5 minutes)
const SYNC_INTERVAL_MINUTES = parseInt(
  process.env.NEXT_PUBLIC_AUTO_SYNC_INTERVAL || '5',
  10
);

export function useAutoSync(options: UseAutoSyncOptions = {}): UseAutoSyncReturn {
  const { enabled = true, onSyncComplete, onSyncError } = options;

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(enabled);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);
  const hasInitialSyncRef = useRef(false);
  const { toast } = useToast();

  // Store callbacks in refs to avoid dependency issues
  const onSyncCompleteRef = useRef(onSyncComplete);
  const onSyncErrorRef = useRef(onSyncError);

  useEffect(() => {
    onSyncCompleteRef.current = onSyncComplete;
    onSyncErrorRef.current = onSyncError;
  }, [onSyncComplete, onSyncError]);

  const performSync = useCallback(async () => {
    // Prevent concurrent syncs using ref (more reliable than state)
    if (isSyncingRef.current) return;

    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Sync failed');
      }

      setLastSyncAt(new Date());

      const results = result.data?.results || [];
      onSyncCompleteRef.current?.(results);

      // Show toast only for new emails
      const totalNewEmails = results.reduce(
        (sum: number, r: SyncResult) => sum + (r.newEmails || 0),
        0
      );

      if (totalNewEmails > 0) {
        toast({
          title: 'Sync Complete',
          description: `${totalNewEmails} new email${totalNewEmails > 1 ? 's' : ''} found`,
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      const err = error instanceof Error ? error : new Error('Sync failed');
      onSyncErrorRef.current?.(err);

      // Don't show toast for rate limit errors during auto-sync
      if (!err.message.includes('Rate limit')) {
        toast({
          title: 'Sync Error',
          description: err.message,
          variant: 'destructive',
        });
      }
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [toast]);

  // Manual sync function
  const syncNow = useCallback(async () => {
    await performSync();
  }, [performSync]);

  // Set up auto-sync interval - only runs once on mount if enabled
  useEffect(() => {
    if (!autoSyncEnabled || SYNC_INTERVAL_MINUTES <= 0) {
      return;
    }

    // Only do initial sync once
    if (!hasInitialSyncRef.current) {
      hasInitialSyncRef.current = true;
      performSync();
    }

    // Set up interval for subsequent syncs
    const intervalMs = SYNC_INTERVAL_MINUTES * 60 * 1000;
    intervalRef.current = setInterval(() => {
      performSync();
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoSyncEnabled, performSync]);

  return {
    isSyncing,
    lastSyncAt,
    syncNow,
    autoSyncEnabled,
    setAutoSyncEnabled,
    syncIntervalMinutes: SYNC_INTERVAL_MINUTES,
  };
}
