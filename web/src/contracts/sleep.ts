/* Nik — sleep contract. */

import { z } from 'zod';
import { defineOp } from '../lib/operations';

export const SleepSource = z.enum([
  'manual', 'apple-health', 'google-health', 'oura', 'whoop', 'eight-sleep',
]);

export const Dream = z.object({
  text: z.string(),
  mood: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const SleepNight = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  night_date: z.string(),
  asleep_at: z.string().nullable(),
  woke_at: z.string().nullable(),
  duration_min: z.number().int().nullable(),
  score: z.number().int().nullable(),
  stages: z.record(z.string(), z.unknown()),
  dreams: z.array(Dream),
  hrv_ms: z.number().int().nullable(),
  resting_hr: z.number().int().nullable(),
  wind_down_complete: z.number().nullable(),
  source: SleepSource,
  notes: z.string().nullable(),
  archived_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type SleepNight = z.infer<typeof SleepNight>;

export const sleep = {
  recent: defineOp({
    name: 'sleep.recent',
    description: 'List recent sleep nights, newest first. Used by Sleep screen for the 7-night chart and dream feed.',
    kind: 'query',
    permissions: ['sleep.read'],
    tags: ['sleep', 'health'],
    input: z.object({ limit: z.number().int().positive().max(90).default(14) }).strict(),
    output: z.array(SleepNight),
    handler: async ({ sb, userId }, { limit }) => {
      if (!userId) return [];
      const { data, error } = await sb
        .from('sleep_nights')
        .select('*')
        .eq('user_id', userId)
        .is('archived_at', null)
        .order('night_date', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as SleepNight[];
    },
  }),

  log: defineOp({
    name: 'sleep.log',
    description: 'Log a night of sleep. Use when the user manually adds a night, when AI ingests from Health Kit, or when wind-down completes.',
    kind: 'mutation',
    permissions: ['sleep.write'],
    tags: ['sleep'],
    input: z.object({
      nightDate: z.string(),                 // YYYY-MM-DD
      asleepAt: z.string().optional(),
      wokeAt: z.string().optional(),
      durationMin: z.number().int().min(0).max(1200).optional(),
      score: z.number().int().min(0).max(100).optional(),
      stages: z.record(z.string(), z.unknown()).default({}),
      dreams: z.array(Dream).default([]),
      hrvMs: z.number().int().optional(),
      restingHr: z.number().int().optional(),
      source: SleepSource.default('manual'),
      notes: z.string().optional(),
    }).strict(),
    output: SleepNight,
    handler: async ({ sb, userId }, input) => {
      const { data, error } = await sb
        .from('sleep_nights')
        .upsert(
          {
            user_id: userId,
            night_date: input.nightDate,
            asleep_at: input.asleepAt ?? null,
            woke_at: input.wokeAt ?? null,
            duration_min: input.durationMin ?? null,
            score: input.score ?? null,
            stages: input.stages,
            dreams: input.dreams,
            hrv_ms: input.hrvMs ?? null,
            resting_hr: input.restingHr ?? null,
            source: input.source,
            notes: input.notes ?? null,
          },
          { onConflict: 'user_id,night_date' },
        )
        .select()
        .single();
      if (error) throw error;

      // Derive the matching Sleep habit's done count from last night's
      // duration (in whole hours). Same single-source-of-truth pattern
      // as Hydrate ← hydration_intakes. Best-effort + non-fatal.
      if (userId && input.durationMin) {
        const { data: habit } = await sb
          .from('habits')
          .select('id, target')
          .eq('user_id', userId)
          .ilike('name', '%sleep%')
          .limit(1)
          .maybeSingle();
        if (habit?.id) {
          const hours = Math.min(habit.target, Math.round(input.durationMin / 60));
          await sb.from('habits').update({ done: hours, last_done_at: new Date().toISOString() }).eq('id', habit.id);
        }
      }

      return data as SleepNight;
    },
  }),

  addDream: defineOp({
    name: 'sleep.addDream',
    description: 'Append a dream to a logged night. Use when the user voice-dictates a dream the morning after.',
    kind: 'mutation',
    permissions: ['sleep.write'],
    tags: ['sleep'],
    input: z.object({
      nightId: z.string().uuid(),
      dream: Dream,
    }).strict(),
    output: SleepNight,
    handler: async ({ sb }, { nightId, dream }) => {
      // Read-modify-write the dreams array.
      const { data: night, error: readErr } = await sb
        .from('sleep_nights').select('dreams').eq('id', nightId).single();
      if (readErr) throw readErr;
      const next = [...((night?.dreams as unknown[]) ?? []), dream];
      const { data, error } = await sb
        .from('sleep_nights').update({ dreams: next }).eq('id', nightId).select().single();
      if (error) throw error;
      return data as SleepNight;
    },
  }),
} as const;
