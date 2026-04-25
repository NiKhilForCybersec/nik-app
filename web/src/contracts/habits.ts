/* Nik — Habits contract.
 *
 * Single source of truth for everything the AI/app/backend can do
 * with habits. Imported by: HabitsScreen, HomeScreen, MCP server,
 * AI agent's tool registry.
 */

import { z } from 'zod';
import { defineOp } from '../lib/operations';

// ── Domain schema ─────────────────────────────────────────
export const HabitIcon = z.enum([
  'water', 'book', 'dumbbell', 'brain', 'flame', 'moon',
  'heart', 'target', 'sparkle',
]);
export type HabitIcon = z.infer<typeof HabitIcon>;

export const HabitSource = z.enum([
  'manual', 'apple-health', 'google-health', 'kindle', 'gps', 'cult-fit',
]);
export type HabitSource = z.infer<typeof HabitSource>;

export const Habit = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1).max(80),
  target: z.number().int().positive(),
  done: z.number().int().min(0),
  unit: z.string().min(1).max(40),
  icon: HabitIcon,
  hue: z.number().int().min(0).max(360),
  streak: z.number().int().min(0).default(0),
  source: HabitSource.default('manual'),
  auto: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Habit = z.infer<typeof Habit>;

// ── Operations ────────────────────────────────────────────
export const habits = {
  list: defineOp({
    name: 'habits.list',
    description: 'List all habits for the current user, ordered by hue then name. Use this when the user asks "what are my habits today" or to show the habits screen.',
    kind: 'query',
    permissions: ['habits.read'],
    tags: ['habits', 'health'],
    input: z.object({}).strict(),
    output: z.array(Habit),
    handler: async ({ sb, userId }) => {
      if (!userId) return [];
      const { data, error } = await sb
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .order('hue', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Habit[];
    },
  }),

  get: defineOp({
    name: 'habits.get',
    description: 'Get one habit by id, including current streak.',
    kind: 'query',
    permissions: ['habits.read'],
    tags: ['habits'],
    input: z.object({ id: z.string().uuid() }).strict(),
    output: Habit.nullable(),
    handler: async ({ sb }, { id }) => {
      const { data, error } = await sb.from('habits').select('*').eq('id', id).single();
      if (error) return null;
      return data as Habit;
    },
  }),

  create: defineOp({
    name: 'habits.create',
    description: 'Create a new habit. Use when the user asks Nik to start tracking something. Choose a sensible icon and hue if not specified.',
    kind: 'mutation',
    permissions: ['habits.write'],
    tags: ['habits'],
    input: z.object({
      name: z.string().min(1).max(80),
      target: z.number().int().positive(),
      unit: z.string().min(1).max(40),
      icon: HabitIcon.default('sparkle'),
      hue: z.number().int().min(0).max(360).default(220),
      source: HabitSource.default('manual'),
    }).strict(),
    output: Habit,
    handler: async ({ sb, userId }, input) => {
      const { data, error } = await sb
        .from('habits')
        .insert({ ...input, user_id: userId, done: 0, streak: 0 })
        .select()
        .single();
      if (error) throw error;
      return data as Habit;
    },
  }),

  bump: defineOp({
    name: 'habits.bump',
    description: 'Increment the done count for a habit by N (default 1). Use when the user logs a rep, says "I drank a glass", "did 10 pushups", etc.',
    kind: 'mutation',
    permissions: ['habits.write'],
    tags: ['habits'],
    input: z.object({
      id: z.string().uuid(),
      by: z.number().int().positive().default(1),
    }).strict(),
    output: Habit,
    handler: async ({ sb }, { id, by }) => {
      const { data, error } = await sb.rpc('habit_bump', { habit_id: id, amount: by });
      if (error) throw error;
      return data as Habit;
    },
  }),

  reset: defineOp({
    name: 'habits.reset',
    description: 'Reset today\'s done count to 0 for a habit. Use when the user undoes their last log.',
    kind: 'mutation',
    permissions: ['habits.write'],
    tags: ['habits'],
    input: z.object({ id: z.string().uuid() }).strict(),
    output: Habit,
    handler: async ({ sb }, { id }) => {
      const { data, error } = await sb
        .from('habits')
        .update({ done: 0 })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Habit;
    },
  }),

  remove: defineOp({
    name: 'habits.remove',
    description: 'Delete a habit. Use only when the user explicitly asks to stop tracking it. Confirm with them first if they\'re mid-conversation.',
    kind: 'mutation',
    permissions: ['habits.write'],
    tags: ['habits'],
    input: z.object({ id: z.string().uuid() }).strict(),
    output: z.object({ ok: z.literal(true) }),
    handler: async ({ sb }, { id }) => {
      const { error } = await sb.from('habits').delete().eq('id', id);
      if (error) throw error;
      return { ok: true } as const;
    },
  }),
} as const;
