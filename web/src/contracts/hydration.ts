/* Nik — hydration contract.
 *
 * Append-only intake ledger. Daily totals computed on read. The default
 * goal is 2000 ml/day; eventually this lives in the user profile.
 *
 * When an intake is logged the matching habit (if there's one called
 * "Hydrate" / "Hydration" / "Water") is auto-bumped so the home tile
 * stays in sync. This is opt-in by intent — explicit `bumpHabit: false`
 * disables it.
 */

import { z } from 'zod';
import { defineOp } from '../lib/operations';

export const HydrationIntake = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  ml: z.number().int(),
  occurred_at: z.string(),
  source: z.string(),
  note: z.string().nullable(),
  created_at: z.string(),
});
export type HydrationIntake = z.infer<typeof HydrationIntake>;

const DEFAULT_GOAL_ML = 2000;

export const HydrationToday = z.object({
  date: z.string(),                  // YYYY-MM-DD in user's local zone
  totalMl: z.number().int(),
  goalMl: z.number().int(),
  intakes: z.array(HydrationIntake),
});
export type HydrationToday = z.infer<typeof HydrationToday>;

export const hydration = {
  today: defineOp({
    name: 'hydration.today',
    description: "Get today's hydration: total ml, goal, and the list of intakes since midnight (local time).",
    kind: 'query',
    permissions: ['hydration.read'],
    tags: ['hydration', 'health'],
    input: z.object({}).strict(),
    output: HydrationToday,
    handler: async ({ sb, userId }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const date = today.toISOString().slice(0, 10);
      const empty: HydrationToday = { date, totalMl: 0, goalMl: DEFAULT_GOAL_ML, intakes: [] };
      if (!userId) return empty;
      const { data, error } = await sb
        .from('hydration_intakes')
        .select('*')
        .eq('user_id', userId)
        .gte('occurred_at', today.toISOString())
        .order('occurred_at', { ascending: false });
      if (error) throw error;
      const intakes = (data ?? []) as HydrationIntake[];
      const totalMl = intakes.reduce((s, i) => s + i.ml, 0);
      return { date, totalMl, goalMl: DEFAULT_GOAL_ML, intakes };
    },
  }),

  recent: defineOp({
    name: 'hydration.recent',
    description: 'List recent intake events (newest first), default last 50. Used by the Hydration screen history.',
    kind: 'query',
    permissions: ['hydration.read'],
    tags: ['hydration'],
    input: z.object({
      limit: z.number().int().positive().max(500).default(50),
    }).strict(),
    output: z.array(HydrationIntake),
    handler: async ({ sb, userId }, { limit }) => {
      if (!userId) return [];
      const { data, error } = await sb
        .from('hydration_intakes')
        .select('*')
        .eq('user_id', userId)
        .order('occurred_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as HydrationIntake[];
    },
  }),

  log: defineOp({
    name: 'hydration.log',
    description: 'Log an intake event. Use when the user says "I drank a glass", "log 500ml", "had a bottle", etc. Default 250ml (one glass) when no amount specified.',
    kind: 'mutation',
    permissions: ['hydration.write'],
    tags: ['hydration', 'health'],
    input: z.object({
      ml: z.number().int().min(1).max(5000).default(250),
      occurredAt: z.string().optional(),
      source: z.string().max(40).default('manual'),
      note: z.string().max(200).optional(),
      /** Also bump the matching Hydrate habit (default true). */
      bumpHabit: z.boolean().default(true),
    }).strict(),
    output: HydrationIntake,
    handler: async ({ sb, userId }, input) => {
      if (!userId) throw new Error('Not signed in');
      const { data, error } = await sb
        .from('hydration_intakes')
        .insert({
          user_id: userId,
          ml: input.ml,
          occurred_at: input.occurredAt ?? new Date().toISOString(),
          source: input.source,
          note: input.note ?? null,
        })
        .select()
        .single();
      if (error) throw error;

      // Sync the matching Hydrate habit's done count to today's actual
      // intake count (in glasses, ~250ml each). Recompute every time so
      // the two displays can never drift — habit.done is now a DERIVED
      // mirror of hydration_intakes, not an independent counter.
      if (input.bumpHabit) {
        const { data: habit } = await sb
          .from('habits')
          .select('id, target')
          .eq('user_id', userId)
          .ilike('name', '%hydrat%')
          .limit(1)
          .maybeSingle();
        if (habit?.id) {
          const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
          const { data: todayIntakes } = await sb
            .from('hydration_intakes')
            .select('ml')
            .eq('user_id', userId)
            .gte('occurred_at', startOfDay.toISOString());
          const totalMl = (todayIntakes ?? []).reduce((s, i) => s + (i.ml as number), 0);
          const glasses = Math.min(habit.target, Math.round(totalMl / 250));
          await sb.from('habits').update({ done: glasses, last_done_at: new Date().toISOString() }).eq('id', habit.id);
        }
      }

      return data as HydrationIntake;
    },
  }),

  remove: defineOp({
    name: 'hydration.remove',
    description: 'Delete an intake event (mistake / wrong amount). Re-derives the Hydrate habit\'s done count from the remaining intakes so Home stays in sync.',
    kind: 'mutation',
    permissions: ['hydration.write'],
    tags: ['hydration'],
    input: z.object({ id: z.string().uuid() }).strict(),
    output: z.object({ removed: z.boolean() }),
    handler: async ({ sb, userId }, { id }) => {
      const { error } = await sb.from('hydration_intakes').delete().eq('id', id);
      if (error) throw error;
      // Re-derive the Hydrate habit's done count after removal.
      if (userId) {
        const { data: habit } = await sb
          .from('habits').select('id, target')
          .eq('user_id', userId).ilike('name', '%hydrat%').limit(1).maybeSingle();
        if (habit?.id) {
          const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
          const { data: todayIntakes } = await sb
            .from('hydration_intakes').select('ml')
            .eq('user_id', userId).gte('occurred_at', startOfDay.toISOString());
          const totalMl = (todayIntakes ?? []).reduce((s, i) => s + (i.ml as number), 0);
          const glasses = Math.min(habit.target, Math.round(totalMl / 250));
          await sb.from('habits').update({ done: glasses }).eq('id', habit.id);
        }
      }
      return { removed: true };
    },
  }),
} as const;
