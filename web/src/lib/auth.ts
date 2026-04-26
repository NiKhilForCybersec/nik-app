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
        const id = data.session.user.id;
        setUserId(id);
        setReady(true);
        if (isLocalSupabase) {
          void seedSampleHabitsIfEmpty(id);
          void seedSampleEventsIfEmpty(id);
          void seedSampleDiaryIfEmpty(id);
        }
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
          if (up.data.session && up.data.user) {
            signed = {
              data: { user: up.data.user, session: up.data.session },
              error: null,
            };
          }
        }
        if (cancelled) return;
        if (signed.data.session) {
          const id = signed.data.session.user.id;
          setUserId(id);
          // Seed sample data if missing — idempotent; only inserts when empty.
          void seedSampleHabitsIfEmpty(id);
          void seedSampleEventsIfEmpty(id);
          void seedSampleDiaryIfEmpty(id);
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

async function seedSampleEventsIfEmpty(userId: string) {
  const { count } = await supabase
    .from('events')
    .select('*', { head: true, count: 'exact' })
    .eq('user_id', userId);
  if ((count ?? 0) > 0) return;

  const now = Date.now();
  const day = 86_400_000;
  // Locale-neutral demo data. Real ingestion comes from per-user
  // integration MCP servers (Gmail / Calendar / etc.) once those land.
  const seed = [
    {
      kind: 'calendar_event', title: 'Team standup',
      body: 'Recurring · 30 min',
      occurs_at: new Date(now + 3_600_000).toISOString(),
      location: 'Video call',
      payload: { duration_min: 30 },
      source_provider: 'calendar', source_ref: 'cal:evt_standup_today',
    },
    {
      kind: 'movie_ticket', title: 'Movie · IMAX 7:00 PM',
      body: 'Two seats · row F',
      occurs_at: new Date(now + 2 * day + 19 * 3_600_000).toISOString(),
      location: 'Cinema',
      payload: { seats: ['F12', 'F13'] },
      source_provider: 'gmail', source_ref: 'gmail:msg_movie_imax',
    },
    {
      kind: 'flight_booking', title: 'Flight to NYC',
      body: 'Departs 06:55 · Terminal 2',
      occurs_at: new Date(now + 5 * day + 6 * 3_600_000).toISOString(),
      location: 'Airport',
      payload: { duration_hours: 4 },
      source_provider: 'gmail', source_ref: 'gmail:msg_flight_nyc',
    },
    {
      kind: 'restaurant_booking', title: 'Dinner reservation',
      body: 'Table for 2 · 7:30 PM',
      occurs_at: new Date(now + 1 * day + 19 * 3_600_000 + 30 * 60_000).toISOString(),
      location: 'Local restaurant',
      payload: { party_size: 2 },
      source_provider: 'gmail', source_ref: 'gmail:msg_restaurant_book',
    },
    {
      kind: 'bill_due', title: 'Electricity bill',
      body: 'Auto-pay enabled',
      occurs_at: new Date(now + 3 * day).toISOString(),
      payload: { auto: true },
      source_provider: 'gmail', source_ref: 'gmail:msg_electric_bill',
    },
    {
      kind: 'birthday_reminder', title: "A friend's birthday · in 6 weeks",
      body: 'They mentioned wanting a new book',
      occurs_at: new Date(now + 42 * day).toISOString(),
      payload: {},
      source_provider: 'gmail', source_ref: 'gmail:msg_friend_bday',
    },
    {
      kind: 'package_delivery', title: 'Package arriving today',
      body: 'Out for delivery',
      occurs_at: new Date(now + 5 * 3_600_000).toISOString(),
      payload: { tracking: 'TRK-XQ8829' },
      source_provider: 'gmail', source_ref: 'gmail:msg_package_today',
    },
  ];
  const { error } = await supabase.from('events').insert(
    seed.map((e) => ({ ...e, user_id: userId })),
  );
  if (error) console.warn('[seed] events insert failed', error);
}

async function seedSampleDiaryIfEmpty(userId: string) {
  const { count } = await supabase
    .from('diary_entries')
    .select('*', { head: true, count: 'exact' })
    .eq('user_id', userId);
  if ((count ?? 0) > 0) return;

  const day = 86_400_000;
  const now = Date.now();
  const seed = [
    {
      title: 'Long morning, finally',
      body: 'Slept past the alarm and didn\'t feel guilty about it. Finally felt like a Saturday.',
      occurred_at: new Date(now).toISOString(),
      mood: 4, tags: ['family', 'rest'],
      pillar: 'mind',
    },
    {
      title: 'Stuck on the spec',
      body: 'The architecture diagram for the new sync engine refuses to land. Three rewrites in. Tomorrow I block 9–11 with no slack.',
      occurred_at: new Date(now - 1 * day).toISOString(),
      mood: 2, tags: ['work', 'frustration'],
      pillar: 'focus',
    },
    {
      title: 'First proper rooftop in months',
      body: 'Beer and a long catch-up with an old friend. Worth the no-coffee headache tomorrow.',
      occurred_at: new Date(now - 2 * day).toISOString(),
      mood: 5, tags: ['friends'],
      pillar: 'mind',
    },
    {
      title: 'Workout day',
      body: 'Felt strong. Bench at 70kg for 5 reps. Coach says next week we add another set.',
      occurred_at: new Date(now - 3 * day).toISOString(),
      mood: 4, tags: ['fitness'],
      pillar: 'health',
    },
  ];
  const { error } = await supabase.from('diary_entries').insert(
    seed.map((e) => ({ ...e, user_id: userId, photo_urls: [], tags: e.tags ?? [] })),
  );
  if (error) console.warn('[seed] diary insert failed', error);
}
