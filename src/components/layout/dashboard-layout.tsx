'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, PenSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { createClient, getSafeUser } from '@/lib/supabase/client';
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
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const pathname = usePathname();

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
    } = await getSafeUser(supabase);

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
      } = await getSafeUser(supabase);

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


  const handleSync = async () => {
    await syncNow();
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

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

        <main className="flex-1 overflow-auto relative">
          {children}

          {/* AI Compose Floating Action Button */}
          {pathname !== '/compose' && (
            <div className="absolute bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <Link href="/compose">
                <Button
                  size="lg"
                  className="h-14 rounded-full px-6 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-2 hover:scale-105 transition-all"
                >
                  <Sparkles className="h-5 w-5" />
                  <span className="hidden sm:inline">AI Compose</span>
                  <PenSquare className="h-4 w-4 sm:hidden" />
                </Button>
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
