/* Nik — auth hook.
 *
 * Wraps Supabase auth in a tiny React hook. In local dev (no production
 * URL configured), automatically signs in as the seeded test user
 * (arjun@local.dev / localdev) so the app runs end-to-end without a
 * sign-in screen yet.
 */

import { useEffect, useState } from 'react';
import { supabase, hasSupabase } from './supabase';

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';
const DEV_EMAIL = 'arjun@local.dev';
const DEV_PASSWORD = 'localdev';
const isLocalSupabase = (import.meta.env.VITE_SUPABASE_URL ?? '').includes('127.0.0.1');

export function useAuth() {
  const [userId, setUserId] = useState<string | undefined>(
    hasSupabase() ? undefined : DEV_USER_ID,
  );
  const [ready, setReady] = useState(!hasSupabase());

  useEffect(() => {
    if (!hasSupabase()) return;
    let cancelled = false;

    const ensureSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        setUserId(data.session.user.id);
        setReady(true);
        if (isLocalSupabase) void seedSampleHabitsIfEmpty(data.session.user.id);
        return;
      }
      // Local dev convenience: try sign-in, fall back to sign-up.
      if (isLocalSupabase) {
        let signed = await supabase.auth.signInWithPassword({
          email: DEV_EMAIL, password: DEV_PASSWORD,
        });
        if (signed.error || !signed.data.session) {
          const up = await supabase.auth.signUp({
            email: DEV_EMAIL, password: DEV_PASSWORD,
            options: { data: { name: 'Arjun' } },
          });
          if (up.data.session) {
            signed = { data: { user: up.data.user, session: up.data.session }, error: null };
          }
        }
        if (cancelled) return;
        if (signed.data.session) {
          const id = signed.data.session.user.id;
          setUserId(id);
          // Seed sample habits if none exist yet (idempotent — runs every load
          // but only inserts when the user has zero rows). Easier than racing
          // with sign-up state.
          void seedSampleHabitsIfEmpty(id);
        } else {
          console.warn('[auth] dev sign-in/up failed', signed.error);
          setUserId(DEV_USER_ID);
        }
      } else {
        // Production: leave userId undefined → screens show empty / sign-in CTA.
        setUserId(undefined);
      }
      setReady(true);
    };

    ensureSession();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      if (!cancelled) setUserId(sess?.user.id);
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  return { userId, ready };
}

async function seedSampleHabitsIfEmpty(userId: string) {
  const { count } = await supabase
    .from('habits')
    .select('*', { head: true, count: 'exact' })
    .eq('user_id', userId);
  if ((count ?? 0) > 0) return;

  const seed = [
    { name: 'Hydrate',       target: 8,    done: 6,    unit: 'glasses', icon: 'water',    hue: 200, streak: 12, source: 'manual',       auto: false },
    { name: 'Read',          target: 30,   done: 22,   unit: 'min',     icon: 'book',     hue: 280, streak: 8,  source: 'kindle',       auto: false },
    { name: 'Train',         target: 60,   done: 60,   unit: 'min',     icon: 'dumbbell', hue: 30,  streak: 42, source: 'cult-fit',     auto: true  },
    { name: 'Meditate',      target: 10,   done: 0,    unit: 'min',     icon: 'brain',    hue: 150, streak: 0,  source: 'manual',       auto: false },
    { name: 'Walk 8k steps', target: 8000, done: 5240, unit: 'steps',   icon: 'flame',    hue: 40,  streak: 19, source: 'apple-health', auto: true  },
    { name: 'Sleep 7h+',     target: 7,    done: 7,    unit: 'hrs',     icon: 'moon',     hue: 260, streak: 5,  source: 'apple-health', auto: true  },
  ];
  const { error } = await supabase.from('habits').insert(seed.map(h => ({ ...h, user_id: userId })));
  if (error) console.warn('[seed] habits insert failed', error);
}
