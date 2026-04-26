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
  const seed = [
    {
      kind: 'movie_ticket', title: 'Inception · IMAX',
      body: 'PVR Forum, Bengaluru · Row F, seats 12-13',
      occurs_at: new Date(now + 2 * day + 19 * 3_600_000).toISOString(),
      location: 'PVR Forum Mall, Bengaluru',
      payload: { booking_ref: 'PVR4UF82', screen: 'Audi 3', seats: ['F12', 'F13'] },
      source_provider: 'gmail', source_ref: 'gmail:msg_movie_inception',
    },
    {
      kind: 'flight_booking', title: 'IndiGo 6E-271 BLR → DEL',
      body: 'Departs 06:55 · Terminal 2 · PNR JKL9PQ',
      occurs_at: new Date(now + 5 * day + 6 * 3_600_000).toISOString(),
      location: 'Bengaluru International Airport',
      payload: { airline: 'IndiGo', pnr: 'JKL9PQ', seat: '14A' },
      source_provider: 'gmail', source_ref: 'gmail:msg_flight_jkl9pq',
    },
    {
      kind: 'calendar_event', title: 'Design review with Priya',
      body: 'Recurring · Conference Room 3',
      occurs_at: new Date(now + 3_600_000).toISOString(),
      location: 'Conference Room 3',
      payload: { attendees: ['priya@', 'arjun@'], duration_min: 45 },
      source_provider: 'calendar', source_ref: 'cal:evt_design_review_today',
    },
    {
      kind: 'restaurant_booking', title: 'Toit · 7:30pm',
      body: 'Table for 2 · anniversary dinner',
      occurs_at: new Date(now + 1 * day + 19 * 3_600_000 + 30 * 60_000).toISOString(),
      location: 'Toit Brewpub, 100 Feet Road, Indiranagar',
      payload: { party_size: 2, occasion: 'anniversary' },
      source_provider: 'gmail', source_ref: 'gmail:msg_toit_booking',
    },
    {
      kind: 'bill_due', title: 'Tata Power · ₹3,420',
      body: 'Auto-pay enabled · debits Apr 28',
      occurs_at: new Date(now + 3 * day).toISOString(),
      payload: { amount: 3420, currency: 'INR', auto: true },
      source_provider: 'gmail', source_ref: 'gmail:msg_tata_power_apr',
    },
    {
      kind: 'birthday_reminder', title: "Anya's birthday · in 6 weeks",
      body: 'June 9 · she\'s asking for art supplies',
      occurs_at: new Date(now + 42 * day).toISOString(),
      payload: { person: 'Anya', age_turning: 9, gift_ideas: ['art set', 'sketchbook'] },
      source_provider: 'gmail', source_ref: 'gmail:msg_anya_bday_2026',
    },
    {
      kind: 'package_delivery', title: 'Amazon · arriving today',
      body: 'Standing desk converter · out for delivery',
      occurs_at: new Date(now + 5 * 3_600_000).toISOString(),
      payload: { courier: 'Amazon Logistics', tracking: 'AMZN-XQ8829' },
      source_provider: 'gmail', source_ref: 'gmail:msg_amazon_xq8829',
    },
  ];
  const { error } = await supabase.from('events').insert(
    seed.map((e) => ({ ...e, user_id: userId })),
  );
  if (error) console.warn('[seed] events insert failed', error);
}
