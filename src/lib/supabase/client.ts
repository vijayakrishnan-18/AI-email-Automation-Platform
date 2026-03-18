import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}

let cachedUserPromise: Promise<any> | null = null;
export async function getSafeUser(supabase: SupabaseClient) {
  if (cachedUserPromise) return cachedUserPromise;
  
  cachedUserPromise = supabase.auth.getUser().catch((err) => {
    cachedUserPromise = null;
    throw err;
  });

  // Clear cache after 2 seconds to allow fresh fetches if needed
  setTimeout(() => {
    cachedUserPromise = null;
  }, 2000);

  return cachedUserPromise;
}

