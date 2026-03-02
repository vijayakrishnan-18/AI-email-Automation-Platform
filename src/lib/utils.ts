import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function extractNameFromEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex === -1) return email;
  const localPart = email.slice(0, atIndex);
  return localPart
    .replace(/[._-]/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    sales: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    support: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    personal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    legal: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    spam: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    newsletter: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    transactional: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
    other: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300',
  };
  return colors[category] || colors.other;
}

export function getUrgencyColor(urgency: string): string {
  const colors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    critical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };
  return colors[urgency] || colors.low;
}

export function getDecisionColor(decision: string): string {
  const colors: Record<string, string> = {
    AUTO_SEND: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    DRAFT_ONLY: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    NEEDS_APPROVAL: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    ESCALATE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    NO_ACTION: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };
  return colors[decision] || colors.NO_ACTION;
}

export function getApprovalStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    modified: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  };
  return colors[status] || colors.pending;
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
