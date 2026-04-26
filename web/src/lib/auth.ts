/* Nik — auth hook.
 *
 * Wraps Supabase auth in a tiny React hook. Exposes the current
 * userId, a `ready` flag, and signIn/signUp/signOut helpers used by
 * AuthScreen + the Profile sign-out button. OAuth (Google/Apple) is
 * deferred — the helper exists but routes to the same password flow
 * for now.
 */

import { useEffect, useState } from 'react';
import { supabase, hasSupabase } from './supabase';

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';
export const DEMO_EMAIL = 'arjun@local.dev';
export const DEMO_PASSWORD = 'localdev';
const isLocalSupabase = (import.meta.env.VITE_SUPABASE_URL ?? '').includes('127.0.0.1');

// useAuth is called by every useOp consumer; without a module-level guard,
// each instance independently fires the seed functions, racing the
// "if empty" check and producing N× duplicate rows. This Set ensures
// each user is seeded at most once per page lifetime.
const seededUsers = new Set<string>();
function seedOnce(userId: string, displayName?: string) {
  if (seededUsers.has(userId)) return;
  seededUsers.add(userId);
  void seedSampleProfileIfEmpty(userId, displayName);
  void seedSampleHabitsIfEmpty(userId);
  void seedSampleEventsIfEmpty(userId);
  void seedSampleDiaryIfEmpty(userId);
  void seedSampleScoreIfEmpty(userId);
  void seedSampleSleepIfEmpty(userId);
  void seedSampleFamilyOpsIfEmpty(userId);
  void seedSampleQuestsIfEmpty(userId);
  void seedSampleCircleIfEmpty(userId, displayName);
}

export function useAuth() {
  const [userId, setUserId] = useState<string | undefined>(
    hasSupabase() ? undefined : DEV_USER_ID,
  );
  const [ready, setReady] = useState(!hasSupabase());

  useEffect(() => {
    if (!hasSupabase()) return;
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const id = data.session?.user.id;
      setUserId(id);
      setReady(true);
      if (id && isLocalSupabase) seedOnce(id, data.session?.user.user_metadata?.name);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      if (cancelled) return;
      const id = sess?.user.id;
      setUserId(id);
      if (id && isLocalSupabase) seedOnce(id, sess?.user.user_metadata?.name);
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  return { userId, ready };
}

/** Sign in with email + password. Falls back to sign-up if the user
 *  doesn't exist (dev convenience — in prod we'd split these flows). */
export async function signInWithPassword(email: string, password: string): Promise<void> {
  if (!hasSupabase()) throw new Error('Supabase not configured');
  const signed = await supabase.auth.signInWithPassword({ email, password });
  if (signed.error || !signed.data.session) {
    // Auto sign-up if user doesn't exist (only on local dev).
    if (isLocalSupabase) {
      const up = await supabase.auth.signUp({
        email, password,
        options: { data: { name: email.split('@')[0] } },
      });
      if (up.error) throw up.error;
      if (!up.data.session) throw new Error('Sign-up succeeded but no session — check email confirmation.');
      return;
    }
    throw signed.error ?? new Error('Sign-in failed');
  }
}

/** Sign in as the local-dev demo user. */
export async function signInAsDemo(): Promise<void> {
  return signInWithPassword(DEMO_EMAIL, DEMO_PASSWORD);
}

/** Sign out of the current session. */
export async function signOut(): Promise<void> {
  if (!hasSupabase()) return;
  await supabase.auth.signOut();
  // Clear the seed-once guard so the next sign-in re-seeds for the new user.
  seededUsers.clear();
}

async function seedSampleHabitsIfEmpty(userId: string) {
  const { count } = await supabase
    .from('habits')
    .select('*', { head: true, count: 'exact' })
    .eq('user_id', userId);
  if ((count ?? 0) > 0) return;

  // Seed STRUCTURE only (habit definitions). Every `done` starts at 0,
  // every `streak` at 0 — values must come from real activity:
  //  • Hydrate     ← derived from hydration_intakes by hydration.log
  //  • Sleep 7h+   ← derived from sleep_nights by the Sleep screen
  //  • Walk 8k     ← will derive from HealthKit when integration ships
  //  • Read/Train/Meditate ← bumped by user (or future focus/fitness logs)
  // Seeding fake "done" values made the dashboard lie about activity.
  const seed = [
    { name: 'Hydrate',       target: 8,    done: 0, unit: 'glasses', icon: 'water',    hue: 200, streak: 0, source: 'manual',       auto: false },
    { name: 'Read',          target: 30,   done: 0, unit: 'min',     icon: 'book',     hue: 280, streak: 0, source: 'manual',       auto: false },
    { name: 'Train',         target: 60,   done: 0, unit: 'min',     icon: 'dumbbell', hue: 30,  streak: 0, source: 'manual',       auto: false },
    { name: 'Meditate',      target: 10,   done: 0, unit: 'min',     icon: 'brain',    hue: 150, streak: 0, source: 'manual',       auto: false },
    { name: 'Walk 8k steps', target: 8000, done: 0, unit: 'steps',   icon: 'flame',    hue: 40,  streak: 0, source: 'apple-health', auto: true  },
    { name: 'Sleep 7h+',     target: 7,    done: 0, unit: 'hrs',     icon: 'moon',     hue: 260, streak: 0, source: 'apple-health', auto: true  },
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
  // Honest empty: every value starts at 0. Real values arrive when the
  // score Edge Function (Layer 2 of the autonomous-agent plan) ingests
  // score_events. Until then, pillars + total stay at 0, and the
  // Score screen reflects "no activity yet."
  const { error: snapErr } = await supabase.from('user_scores').insert({
    user_id: userId,
    total: 0,
    delta_7d: 0,
    rank: 'Newcomer',
    next_rank: 'Operative II',
    next_rank_at: 100,
    pillars: {
      focus:  { value: 0, max: 300, weeklyGoal: 240, trend: [0, 0, 0, 0, 0, 0, 0] },
      health: { value: 0, max: 250, weeklyGoal: 220, trend: [0, 0, 0, 0, 0, 0, 0] },
      mind:   { value: 0, max: 250, weeklyGoal: 200, trend: [0, 0, 0, 0, 0, 0, 0] },
      family: { value: 0, max: 200, weeklyGoal: 170, trend: [0, 0, 0, 0, 0, 0, 0] },
    },
    today_contribution: 0,
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

async function seedSampleProfileIfEmpty(_userId: string, _displayName?: string) {
  // The on-signup trigger has already inserted a minimal profile row
  // with name/title/level=1/xp=0/streak=0/stats={10,10,10,10,10}.
  // We deliberately don't pad it with fake "demo" values anymore —
  // every visible metric must come from real activity, not the seed.
  // (Level / XP / streak / stats become derived once the score Edge
  // Function lands; until then the user starts at zero, honestly.)
}

async function seedSampleQuestsIfEmpty(userId: string) {
  const { count } = await supabase
    .from('quests')
    .select('*', { head: true, count: 'exact' })
    .eq('user_id', userId);
  if ((count ?? 0) > 0) return;
  const seed = [
    { title: 'Complete 60 min workout',     rank: 'B', xp: 180, status: 'done',    progress: 1,    auto: true,  trigger: 'GPS · gym' },
    { title: 'Deep focus — 2 hrs no phone', rank: 'A', xp: 240, status: 'active',  progress: 0.6,  auto: false, trigger: null },
    { title: 'Reply to 3 family messages',  rank: 'C', xp: 60,  status: 'active',  progress: 0.33, auto: false, trigger: null },
    { title: 'Read 30 pages',               rank: 'C', xp: 80,  status: 'active',  progress: 0.73, auto: false, trigger: null },
    { title: 'Meditate before sleep',       rank: 'D', xp: 40,  status: 'pending', progress: null, auto: false, trigger: null },
  ];
  const { error } = await supabase.from('quests').insert(
    seed.map((q) => ({ ...q, user_id: userId, completed_at: q.status === 'done' ? new Date().toISOString() : null })),
  );
  if (error) console.warn('[seed] quests insert failed', error);
}

async function seedSampleCircleIfEmpty(userId: string, displayName?: string) {
  const { count } = await supabase
    .from('circle_members')
    .select('*', { head: true, count: 'exact' })
    .eq('user_id', userId);
  if ((count ?? 0) > 0) return;

  // Locale-neutral demo circle: self + a small family. Names are first
  // initials so the design renders without leaning on any region.
  // Every column listed on every row — Supabase's array-insert null-pads
  // missing columns to null, violating NOT NULL even when the column has
  // a default. See skills/nik-integrate/Gotchas.md.
  const seed = [
    { member_id: 'self',    name: displayName || 'You', role: 'You',     relation: 'self',     age: null, hue: 220, is_self: true,  status: 'online',  share_tier: 'inner',     custom_cats: [], birthday: null, blood_type: null, location: null, last_seen_at: null, profile: { score: 742, streak: 42 }, care_recipient: false },
    { member_id: 'partner', name: 'Partner',            role: 'Partner', relation: 'partner',  age: null, hue: 320, is_self: false, status: 'online',  share_tier: 'inner',     custom_cats: [], birthday: null, blood_type: null, location: null, last_seen_at: null, profile: {}, care_recipient: false },
    { member_id: 'child_a', name: 'Child A',            role: 'Child',   relation: 'child',    age: 8,    hue: 30,  is_self: false, status: 'away',    share_tier: 'kid',       custom_cats: [], birthday: null, blood_type: null, location: null, last_seen_at: null, profile: {}, care_recipient: false },
    { member_id: 'child_b', name: 'Child B',            role: 'Child',   relation: 'child',    age: 12,   hue: 60,  is_self: false, status: 'online',  share_tier: 'kid',       custom_cats: [], birthday: null, blood_type: null, location: null, last_seen_at: null, profile: {}, care_recipient: false },
    { member_id: 'parent',  name: 'Parent',             role: 'Parent',  relation: 'parent',   age: null, hue: 150, is_self: false, status: 'offline', share_tier: 'caregiver', custom_cats: [], birthday: null, blood_type: null, location: null, last_seen_at: null, profile: {}, care_recipient: true  },
  ];
  const { error } = await supabase.from('circle_members').insert(
    seed.map((m) => ({ ...m, user_id: userId })),
  );
  if (error) console.warn('[seed] circle_members insert failed', error);
}
