'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw, LogOut, User as UserIcon, Bell, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ui/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { createClient } from '@/lib/supabase/client';
import { getInitials } from '@/lib/utils';

interface HeaderProps {
  title: string;
  user?: {
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  onSync?: () => void;
  isSyncing?: boolean;
  pendingApprovals?: number;
  lastSyncAt?: Date | null;
  syncIntervalMinutes?: number;
}

export function Header({
  title,
  user,
  onSync,
  isSyncing = false,
  pendingApprovals = 0,
  lastSyncAt,
  syncIntervalMinutes,
}: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      {/* Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Sync button with auto-sync info */}
        {onSync && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSync}
                  disabled={isSyncing}
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}
                  />
                  {isSyncing ? 'Syncing...' : 'Sync'}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <div className="flex flex-col gap-1">
                  {lastSyncAt && (
                    <span>Last sync: {formatDistanceToNow(lastSyncAt, { addSuffix: true })}</span>
                  )}
                  {syncIntervalMinutes && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Auto-sync every {syncIntervalMinutes} min
                    </span>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Notifications */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => router.push('/notifications')}
              >
                <Bell className="h-5 w-5" />
                {pendingApprovals > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                    {pendingApprovals > 9 ? '9+' : pendingApprovals}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span>
                {pendingApprovals > 0
                  ? `${pendingApprovals} pending approval${pendingApprovals > 1 ? 's' : ''}`
                  : 'No new notifications'}
              </span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <ThemeToggle />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={user?.avatar_url || undefined}
                  alt={user?.full_name || 'User'}
                />
                <AvatarFallback>
                  {getInitials(user?.full_name || user?.email)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.full_name || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
