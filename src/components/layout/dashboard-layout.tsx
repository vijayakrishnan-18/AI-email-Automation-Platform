'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { createClient } from '@/lib/supabase/client';
import { useAutoSync } from '@/hooks/use-auto-sync';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  showSync?: boolean;
}

export function DashboardLayout({
  children,
  title,
  showSync = false,
}: DashboardLayoutProps) {
  const [user, setUser] = useState<{
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState(0);

  // Auto-sync hook
  const { isSyncing, syncNow, lastSyncAt, syncIntervalMinutes } = useAutoSync({
    enabled: true,
    onSyncComplete: (results) => {
      // Refresh pending approvals count after sync
      refreshPendingApprovals();
    },
  });

  const refreshPendingApprovals = async () => {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      const { count } = await supabase
        .from('approval_queue')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authUser.id)
        .eq('status', 'pending');

      setPendingApprovals(count || 0);
    }
  };

  useEffect(() => {
    const supabase = createClient();
    const fetchUserData = async () => {
      // Get auth user
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        // Get user profile
        const { data: profile } = await supabase
          .from('users')
          .select('email, full_name, avatar_url')
          .eq('id', authUser.id)
          .single();

        if (profile) {
          setUser(profile);
        }

        // Get settings
        const { data: settings } = await supabase
          .from('user_settings')
          .select('ai_enabled')
          .eq('user_id', authUser.id)
          .single();

        if (settings) {
          setAiEnabled(settings.ai_enabled);
        }

        // Get pending approvals count
        const { count } = await supabase
          .from('approval_queue')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authUser.id)
          .eq('status', 'pending');

        setPendingApprovals(count || 0);
      }
    };

    fetchUserData();
  }, []);

  const handleToggleAI = async () => {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      const newValue = !aiEnabled;
      setAiEnabled(newValue);

      await supabase
        .from('user_settings')
        .upsert({
          user_id: authUser.id,
          ai_enabled: newValue,
        })
        .eq('user_id', authUser.id);
    }
  };

  const handleSync = async () => {
    await syncNow();
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar aiEnabled={aiEnabled} onToggleAI={handleToggleAI} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title={title}
          user={user}
          onSync={showSync ? handleSync : undefined}
          isSyncing={isSyncing}
          pendingApprovals={pendingApprovals}
          lastSyncAt={lastSyncAt}
          syncIntervalMinutes={syncIntervalMinutes}
        />

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
