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
          void seedSampleScoreIfEmpty(id);
          void seedSampleSleepIfEmpty(id);
          void seedSampleFamilyOpsIfEmpty(id);
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
          void seedSampleScoreIfEmpty(id);
          void seedSampleSleepIfEmpty(id);
          void seedSampleFamilyOpsIfEmpty(id);
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

async function seedSampleScoreIfEmpty(userId: string) {
  // Each of (user_scores, score_events, score_backlog) is checked independently.
  // user_scores has 0 or 1 row per user.
  const { count: snapCount } = await supabase
    .from('user_scores')
    .select('*', { head: true, count: 'exact' })
    .eq('user_id', userId);
  if ((snapCount ?? 0) === 0) await seedScoreSnapshot(userId);

  const { count: evCount } = await supabase
    .from('score_events')
    .select('*', { head: true, count: 'exact' })
    .eq('user_id', userId);
  if ((evCount ?? 0) === 0) await seedScoreEvents(userId);

  const { count: bkCount } = await supabase
    .from('score_backlog')
    .select('*', { head: true, count: 'exact' })
    .eq('user_id', userId);
  if ((bkCount ?? 0) === 0) await seedScoreBacklog(userId);
}

async function seedScoreSnapshot(userId: string) {
  const { error: snapErr } = await supabase.from('user_scores').insert({
    user_id: userId,
    total: 742,
    delta_7d: 28,
    rank: 'Operative II',
    next_rank: 'Operative I',
    next_rank_at: 800,
    pillars: {
      focus:  { value: 218, max: 300, weeklyGoal: 240, trend: [180, 195, 210, 220, 215, 218, 218] },
      health: { value: 195, max: 250, weeklyGoal: 220, trend: [170, 185, 190, 195, 195, 195, 195] },
      mind:   { value: 184, max: 250, weeklyGoal: 200, trend: [150, 160, 170, 175, 180, 184, 184] },
      family: { value: 145, max: 200, weeklyGoal: 170, trend: [130, 135, 140, 142, 144, 145, 145] },
    },
    today_contribution: 18,
  });
  if (snapErr) console.warn('[seed] user_scores insert failed', snapErr);
}

async function seedScoreEvents(userId: string) {
  const day = 86_400_000;
  const now = Date.now();
  const { error: evErr } = await supabase.from('score_events').insert([
    { user_id: userId, occurred_at: new Date(now - 2*3_600_000).toISOString(), delta:  8, source: 'Focus 50min · spec writing', pillar: 'focus' },
    { user_id: userId, occurred_at: new Date(now - 4*3_600_000).toISOString(), delta:  3, source: 'Vitamins logged', pillar: 'health' },
    { user_id: userId, occurred_at: new Date(now - 6*3_600_000).toISOString(), delta:  5, source: 'Diary · morning entry', pillar: 'mind' },
    { user_id: userId, occurred_at: new Date(now - 1*day).toISOString(),       delta: -3, source: 'Missed: family check-in', pillar: 'family' },
    { user_id: userId, occurred_at: new Date(now - 1*day - 4*3_600_000).toISOString(), delta: 4, source: 'Workout · arms day', pillar: 'health' },
  ]);
  if (evErr) console.warn('[seed] score_events insert failed', evErr);
}

async function seedScoreBacklog(userId: string) {
  const { error: bkErr } = await supabase.from('score_backlog').insert([
    { user_id: userId, title: 'Call mom',          missed_label: 'Yesterday',  cost: -3, makeup: 'Call mom today (+5)',      pillar: 'family', dismissable: true, gentle: false },
    { user_id: userId, title: 'Dentist (rebook)',  missed_label: '2 days ago', cost: -2, makeup: 'Book within 48h (+3)',     pillar: 'family', dismissable: true, gentle: false },
    { user_id: userId, title: 'Iron tablet (Sun)', missed_label: 'Sunday',     cost: -1, makeup: 'Take tonight (+2)',        pillar: 'health', dismissable: true, gentle: false },
    { user_id: userId, title: 'Reading 30min',     missed_label: 'Today',      cost:  0, makeup: 'Catch up before bed (+4)', pillar: 'mind',   dismissable: true, gentle: true  },
  ]);
  if (bkErr) console.warn('[seed] score_backlog insert failed', bkErr);
}

async function seedSampleSleepIfEmpty(userId: string) {
  const { count } = await supabase
    .from('sleep_nights')
    .select('*', { head: true, count: 'exact' })
    .eq('user_id', userId);
  if ((count ?? 0) > 0) return;

  const day = 86_400_000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

  // 7 nights of sleep, with realistic-ish numbers + a couple dreams.
  const seed = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(today.getTime() - i * day);
    const score = [84, 80, 91, 65, 88, 72, 78][i];
    const totalMin = [444, 420, 480, 360, 462, 408, 432][i];
    const stages = {
      minutes: {
        light: Math.round(totalMin * 0.55),
        deep:  Math.round(totalMin * 0.20),
        rem:   Math.round(totalMin * 0.20),
        awake: Math.round(totalMin * 0.05),
      },
      segments: [
        { stage: 'awake', start: 0,  end: 4   },
        { stage: 'light', start: 4,  end: 32  },
        { stage: 'deep',  start: 32, end: 50  },
        { stage: 'light', start: 50, end: 68  },
        { stage: 'rem',   start: 68, end: 92  },
        { stage: 'awake', start: 92, end: 100 },
      ],
    };
    const dreams = i === 0 ? [
      { text: 'Walked through a library where each book was a different season.', mood: 'curious', tags: ['vivid'] },
    ] : i === 2 ? [
      { text: 'Realized I was dreaming, looked at my hands. Stayed for what felt like an hour.', mood: 'calm', tags: ['lucid'] },
    ] : [];
    const asleep = new Date(date.getTime() - 1 * day + 23.25 * 3_600_000);  // 23:15 the night before
    const woke   = new Date(date.getTime() + 6.75 * 3_600_000);             // 06:45 same morning
    return {
      user_id: userId,
      night_date: fmtDate(date),
      asleep_at: asleep.toISOString(),
      woke_at: woke.toISOString(),
      duration_min: totalMin,
      score,
      stages,
      dreams,
      hrv_ms: 48,
      resting_hr: 56,
      wind_down_complete: 0.8,
      source: 'apple-health',
      notes: null,
    };
  });

  const { error } = await supabase.from('sleep_nights').insert(seed);
  if (error) console.warn('[seed] sleep_nights insert failed', error);
}

async function seedSampleFamilyOpsIfEmpty(userId: string) {
  // Tasks
  const { count: tCount } = await supabase
    .from('family_tasks').select('*', { head: true, count: 'exact' }).eq('user_id', userId);
  if ((tCount ?? 0) === 0) {
    const tasks = [
      { user_id: userId, title: 'Breakfast for kids',  time_of_day: '07:15', owner: 'parent_a', paired_with: 'parent_b', status: 'done',    kids: ['kid_a', 'kid_b'], recurrence: 'weekday', recurrence_payload: {}, geofence_lat: null, geofence_lng: null, geofence_label: null, created_by: 'user', source: null },
      { user_id: userId, title: 'School drop-off',     time_of_day: '08:10', owner: 'parent_a', paired_with: null,        status: 'done',    kids: ['kid_a', 'kid_b'], recurrence: 'weekday', recurrence_payload: {}, geofence_lat: null, geofence_lng: null, geofence_label: 'School', created_by: 'user', source: null },
      { user_id: userId, title: 'Pickup from school',  time_of_day: '15:30', owner: 'parent_b', paired_with: null,        status: 'pending', kids: ['kid_a', 'kid_b'], recurrence: 'weekday', recurrence_payload: {}, geofence_lat: null, geofence_lng: null, geofence_label: 'School', created_by: 'user', source: null },
      { user_id: userId, title: 'Piano practice',       time_of_day: '17:00', owner: 'parent_b', paired_with: null,        status: 'pending', kids: ['kid_a'],          recurrence: 'tue-thu', recurrence_payload: {}, geofence_lat: null, geofence_lng: null, geofence_label: null, created_by: 'user', source: null },
      { user_id: userId, title: 'Bedtime story',        time_of_day: '20:30', owner: 'parent_a', paired_with: null,        status: 'pending', kids: ['kid_b'],          recurrence: 'weekday', recurrence_payload: {}, geofence_lat: null, geofence_lng: null, geofence_label: null, created_by: 'user', source: null },
      { user_id: userId, title: 'Pediatrician appt',    time_of_day: null,    owner: 'parent_a', paired_with: 'parent_b', status: 'pending', kids: ['kid_b'],          recurrence: 'none',    recurrence_payload: {}, geofence_lat: null, geofence_lng: null, geofence_label: null, created_by: 'user', source: null },
    ];
    const { error } = await supabase.from('family_tasks').insert(tasks);
    if (error) console.warn('[seed] family_tasks insert failed', error);
  }

  // Alarms
  const { count: aCount } = await supabase
    .from('family_alarms').select('*', { head: true, count: 'exact' }).eq('user_id', userId);
  if ((aCount ?? 0) === 0) {
    const alarms = [
      {
        user_id: userId, cluster_name: 'School morning',
        active_days: [1,2,3,4,5],
        alarms: [
          { kid: 'kid_a', time: '06:30', label: 'wake' },
          { kid: 'kid_b', time: '06:45', label: 'wake' },
        ],
        voice_phrase: 'Wake the kids at 6:30 and 6:45 on weekdays',
        master_enabled: true,
      },
      {
        user_id: userId, cluster_name: 'Bedtime',
        active_days: [0,1,2,3,4,5,6],
        alarms: [
          { kid: 'kid_b', time: '20:00', label: 'bath' },
          { kid: 'kid_b', time: '20:30', label: 'lights out' },
          { kid: 'kid_a', time: '21:00', label: 'reading' },
          { kid: 'kid_a', time: '21:30', label: 'lights out' },
        ],
        voice_phrase: null,
        master_enabled: true,
      },
    ];
    const { error } = await supabase.from('family_alarms').insert(alarms);
    if (error) console.warn('[seed] family_alarms insert failed', error);
  }
}
