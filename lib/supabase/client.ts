import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Log connection attempts for debugging
  if (typeof window !== 'undefined') {
    console.info('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.info('Supabase client initialized');
  }

  return client;
}
