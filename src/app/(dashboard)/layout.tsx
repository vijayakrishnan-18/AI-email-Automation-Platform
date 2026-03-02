import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user has connected email account
  const { data: accounts } = await supabase
    .from('email_accounts')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1);

  // If no connected accounts and not on connect-email page, redirect
  if (!accounts || accounts.length === 0) {
    redirect('/connect-email');
  }

  return <>{children}</>;
}
