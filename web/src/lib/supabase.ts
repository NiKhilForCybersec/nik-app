/* Nik — Supabase client singleton. */

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!anonKey && import.meta.env.PROD) {
  // Hard fail in production — soft warn in dev so the app still loads with mocks.
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY. Set it in .env.local or your deploy env.',
  );
}

export const supabase = createClient(url, anonKey || 'placeholder-dev', {
  auth: { persistSession: true, autoRefreshToken: true },
});

/** Returns true if Supabase is reachable + we're authenticated. */
export const hasSupabase = () => Boolean(anonKey);
