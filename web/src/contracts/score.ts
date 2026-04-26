/* Nik — score contract.
 *
 * Score is computed from underlying signals (habit completions, focus
 * sessions, diary entries, etc.) and stored as a snapshot per user
 * with an append-only event ledger. The screen reads the snapshot
 * (O(1)); analytics read the ledger (O(N)).
 */

import { z } from 'zod';
import { defineOp } from '../lib/operations';

export const Pillar = z.enum(['focus', 'health', 'mind', 'family']);

export const PillarState = z.object({
  value: z.number().int(),
  max: z.number().int(),
  weeklyGoal: z.number().int(),
  trend: z.array(z.number()),  // last 7 days
});

export const UserScore = z.object({
  user_id: z.string().uuid(),
  total: z.number().int(),
  delta_7d: z.number().int(),
  rank: z.string(),
  next_rank: z.string().nullable(),
  next_rank_at: z.number().int().nullable(),
  pillars: z.object({
    focus:  PillarState,
    health: PillarState,
    mind:   PillarState,
    family: PillarState,
  }),
  today_contribution: z.number().int(),
  updated_at: z.string(),
});
export type UserScore = z.infer<typeof UserScore>;

export const ScoreEvent = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  occurred_at: z.string(),
  delta: z.number().int(),
  source: z.string(),
  pillar: Pillar,
  ref_kind: z.string().nullable(),
  ref_id: z.string().uuid().nullable(),
  created_at: z.string(),
});
export type ScoreEvent = z.infer<typeof ScoreEvent>;

export const BacklogItem = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  missed_label: z.string(),
  cost: z.number().int(),
  makeup: z.string().nullable(),
  pillar: Pillar,
  dismissable: z.boolean(),
  gentle: z.boolean(),
  resolved_at: z.string().nullable(),
  created_at: z.string(),
});
export type BacklogItem = z.infer<typeof BacklogItem>;

export const score = {
  get: defineOp({
    name: 'score.get',
    description: 'Get the current Nik Score snapshot — total, 7-day delta, rank, per-pillar values + trends. Used by the Score screen and the AI when answering "how am I doing?".',
    kind: 'query',
    permissions: ['score.read'],
    tags: ['score'],
    input: z.object({}).strict(),
    output: UserScore.nullable(),
    handler: async ({ sb, userId }) => {
      if (!userId) return null;
      const { data, error } = await sb
        .from('user_scores')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data as UserScore | null;
    },
  }),

  recent: defineOp({
    name: 'score.recent',
    description: 'List recent score events (the ledger) — what added or subtracted points and why.',
    kind: 'query',
    permissions: ['score.read'],
    tags: ['score'],
    input: z.object({
      limit: z.number().int().positive().max(200).default(20),
    }).strict(),
    output: z.array(ScoreEvent),
    handler: async ({ sb, userId }, { limit }) => {
      if (!userId) return [];
      const { data, error } = await sb
        .from('score_events')
        .select('*')
        .eq('user_id', userId)
        .order('occurred_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as ScoreEvent[];
    },
  }),

  backlog: defineOp({
    name: 'score.backlog',
    description: 'List unresolved backlog items — missed tasks the user can make up. Used by Score screen + AI to nudge gently.',
    kind: 'query',
    permissions: ['score.read'],
    tags: ['score'],
    input: z.object({}).strict(),
    output: z.array(BacklogItem),
    handler: async ({ sb, userId }) => {
      if (!userId) return [];
      const { data, error } = await sb
        .from('score_backlog')
        .select('*')
        .eq('user_id', userId)
        .is('resolved_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as BacklogItem[];
    },
  }),

  resolveBacklog: defineOp({
    name: 'score.resolveBacklog',
    description: 'Mark a backlog item resolved (user did the makeup quest, or dismissed it).',
    kind: 'mutation',
    permissions: ['score.write'],
    tags: ['score'],
    input: z.object({ id: z.string().uuid() }).strict(),
    output: BacklogItem,
    handler: async ({ sb }, { id }) => {
      const { data, error } = await sb
        .from('score_backlog')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as BacklogItem;
    },
  }),
} as const;
