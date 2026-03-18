'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Inbox,
  Send,
  FileEdit,
  Star,
  AlertOctagon,
  Trash2,
  Archive,
  CheckCircle,
  Sparkles,
  FileText,
  Settings,
  Mail,
  Power,
  PenSquare,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

// Email folders
const emailFolders = [
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'Sent', href: '/sent', icon: Send },
  { name: 'Drafts', href: '/drafts', icon: FileEdit },
  { name: 'Starred', href: '/starred', icon: Star },
  { name: 'Spam', href: '/spam', icon: AlertOctagon },
  { name: 'Trash', href: '/trash', icon: Trash2 },
  { name: 'All Mail', href: '/all-mail', icon: Archive },
];

// AI & Management
const aiNavigation = [
  { name: 'AI Compose', href: '/compose', icon: PenSquare },
  { name: 'Approvals', href: '/approvals', icon: CheckCircle },
  { name: 'AI Rules', href: '/ai-rules', icon: Sparkles },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Logs', href: '/logs', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full w-16 flex-col border-r bg-background">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b">
          <Link href="/inbox" className="flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Mail className="h-5 w-5 text-primary-foreground" />
            </div>
          </Link>
        </div>

        {/* Email Folders */}
        <nav className="flex flex-1 flex-col items-center gap-1 py-4 overflow-y-auto">
          {emailFolders.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      size="icon"
                      className={cn(
                        'h-9 w-9',
                        isActive && 'bg-secondary'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-4 w-4',
                          isActive
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        )}
                      />
                      <span className="sr-only">{item.name}</span>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  {item.name}
                </TooltipContent>
              </Tooltip>
            );
          })}

          {/* Separator */}
          <Separator className="my-2 w-8" />

          {/* AI & Management */}
          {aiNavigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      size="icon"
                      className={cn(
                        'h-9 w-9',
                        isActive && 'bg-secondary'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-4 w-4',
                          isActive
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        )}
                      />
                      <span className="sr-only">{item.name}</span>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  {item.name}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </div>
    </TooltipProvider>
  );
}
