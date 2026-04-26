/* Nik — menstrual cycle contract.
 *
 * Append-only event ledger. The "current phase" is computed at read
 * time from the most recent period_start (no stored state to drift).
 * Default cycle length 28 days; until we ship a per-user setting we
 * use that average. Symptom + mood logs ride the same ledger.
 *
 * Privacy: every op stays per-user (RLS). Cycle data is in the
 * 'cycle' privacy category — never auto-exposed via circle sharing
 * without explicit consent.
 */

import { z } from 'zod';
import { defineOp } from '../lib/operations';

const DEFAULT_CYCLE_LEN = 28;
const PERIOD_DAYS = 5;

export const CyclePhase = z.enum(['menstrual', 'follicular', 'ovulation', 'luteal', 'unknown']);
export type CyclePhase = z.infer<typeof CyclePhase>;

export const CycleEvent = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  occurred_on: z.string(),
  kind: z.enum(['period_start', 'period_end', 'symptom', 'mood', 'note']),
  payload: z.record(z.string(), z.unknown()),
  created_at: z.string(),
});
export type CycleEvent = z.infer<typeof CycleEvent>;

export const CycleToday = z.object({
  phase: CyclePhase,
  cycleDay: z.number().int().nullable(),
  cycleLength: z.number().int(),
  daysUntilNext: z.number().int().nullable(),
  lastPeriodStart: z.string().nullable(),
  predictedNextStart: z.string().nullable(),
  recentEvents: z.array(CycleEvent),
});
export type CycleToday = z.infer<typeof CycleToday>;

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / 86_400_000);
}
function dateKey(d: Date): string { return d.toISOString().slice(0, 10); }

function inferPhase(cycleDay: number, len: number): CyclePhase {
  if (cycleDay <= PERIOD_DAYS) return 'menstrual';
  // Ovulation around day 14 of a 28-day cycle; scale by length.
  const ovulation = Math.round(len / 2);
  if (cycleDay < ovulation - 1) return 'follicular';
  if (cycleDay <= ovulation + 1) return 'ovulation';
  return 'luteal';
}

export const cycle = {
  today: defineOp({
    name: 'cycle.today',
    description: "Get the current menstrual cycle phase + day count + days until predicted next period. Computed from the user's most recent period_start. Returns phase 'unknown' if no period has been logged yet.",
    kind: 'query',
    permissions: ['cycle.read'],
    tags: ['cycle', 'health'],
    input: z.object({}).strict(),
    output: CycleToday,
    handler: async ({ sb, userId }) => {
      const empty: CycleToday = {
        phase: 'unknown', cycleDay: null, cycleLength: DEFAULT_CYCLE_LEN,
        daysUntilNext: null, lastPeriodStart: null, predictedNextStart: null,
        recentEvents: [],
      };
      if (!userId) return empty;

      // Pull recent events to display + last period_start to compute phase.
      const { data: recent, error: recErr } = await sb
        .from('cycle_events')
        .select('*')
        .eq('user_id', userId)
        .order('occurred_on', { ascending: false })
        .limit(30);
      if (recErr) throw recErr;
      const events = (recent ?? []) as CycleEvent[];

      const lastStart = events.find((e) => e.kind === 'period_start');
      if (!lastStart) return { ...empty, recentEvents: events };

      const startDate = new Date(lastStart.occurred_on + 'T00:00:00');
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const cycleDay = daysBetween(startDate, today) + 1;
      const phase = inferPhase(cycleDay, DEFAULT_CYCLE_LEN);
      const next = new Date(startDate); next.setDate(next.getDate() + DEFAULT_CYCLE_LEN);
      const daysUntilNext = daysBetween(today, next);

      return {
        phase, cycleDay,
        cycleLength: DEFAULT_CYCLE_LEN,
        daysUntilNext: daysUntilNext < 0 ? 0 : daysUntilNext,
        lastPeriodStart: lastStart.occurred_on,
        predictedNextStart: dateKey(next),
        recentEvents: events,
      };
    },
  }),

  history: defineOp({
    name: 'cycle.history',
    description: 'List recent cycle events (period starts/ends, symptoms, moods, notes), newest first.',
    kind: 'query',
    permissions: ['cycle.read'],
    tags: ['cycle'],
    input: z.object({
      limit: z.number().int().positive().max(500).default(60),
    }).strict(),
    output: z.array(CycleEvent),
    handler: async ({ sb, userId }, { limit }) => {
      if (!userId) return [];
      const { data, error } = await sb
        .from('cycle_events')
        .select('*')
        .eq('user_id', userId)
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as CycleEvent[];
    },
  }),

  logPeriodStart: defineOp({
    name: 'cycle.logPeriodStart',
    description: 'Log the first day of a new period. Use when the user says "started today", "period started", "got it today".',
    kind: 'mutation',
    permissions: ['cycle.write'],
    tags: ['cycle', 'health'],
    input: z.object({
      occurredOn: z.string().optional(),
      flow: z.enum(['spotting', 'light', 'medium', 'heavy']).optional(),
    }).strict(),
    output: CycleEvent,
    handler: async ({ sb, userId }, input) => {
      if (!userId) throw new Error('Not signed in');
      const { data, error } = await sb
        .from('cycle_events')
        .insert({
          user_id: userId,
          occurred_on: input.occurredOn ?? dateKey(new Date()),
          kind: 'period_start',
          payload: input.flow ? { flow: input.flow } : {},
        })
        .select()
        .single();
      if (error) throw error;
      return data as CycleEvent;
    },
  }),

  logPeriodEnd: defineOp({
    name: 'cycle.logPeriodEnd',
    description: 'Log the last day of a period (when bleeding stopped).',
    kind: 'mutation',
    permissions: ['cycle.write'],
    tags: ['cycle', 'health'],
    input: z.object({ occurredOn: z.string().optional() }).strict(),
    output: CycleEvent,
    handler: async ({ sb, userId }, input) => {
      if (!userId) throw new Error('Not signed in');
      const { data, error } = await sb
        .from('cycle_events')
        .insert({
          user_id: userId,
          occurred_on: input.occurredOn ?? dateKey(new Date()),
          kind: 'period_end',
          payload: {},
        })
        .select()
        .single();
      if (error) throw error;
      return data as CycleEvent;
    },
  }),

  logSymptom: defineOp({
    name: 'cycle.logSymptom',
    description: 'Log a cycle-related symptom for today (cramps, headache, bloating, fatigue, breast tenderness, acne, mood swing, low energy). Optional severity 1-5.',
    kind: 'mutation',
    permissions: ['cycle.write'],
    tags: ['cycle', 'health'],
    input: z.object({
      symptom: z.string().min(1).max(80),
      severity: z.number().int().min(1).max(5).optional(),
      occurredOn: z.string().optional(),
    }).strict(),
    output: CycleEvent,
    handler: async ({ sb, userId }, input) => {
      if (!userId) throw new Error('Not signed in');
      const { data, error } = await sb
        .from('cycle_events')
        .insert({
          user_id: userId,
          occurred_on: input.occurredOn ?? dateKey(new Date()),
          kind: 'symptom',
          payload: { symptom: input.symptom, ...(input.severity ? { severity: input.severity } : {}) },
        })
        .select()
        .single();
      if (error) throw error;
      return data as CycleEvent;
    },
  }),

  remove: defineOp({
    name: 'cycle.remove',
    description: 'Delete a logged cycle event (mistake, wrong date). Destructive — confirm before deleting period_start since it reshapes the predicted next-period date.',
    kind: 'mutation',
    mutability: 'confirm',
    permissions: ['cycle.write'],
    tags: ['cycle'],
    input: z.object({ id: z.string().uuid() }).strict(),
    output: z.object({ removed: z.boolean() }),
    handler: async ({ sb }, { id }) => {
      const { error } = await sb.from('cycle_events').delete().eq('id', id);
      if (error) throw error;
      return { removed: true };
    },
  }),
} as const;
