/* Nik — quests contract.
 *
 * Quests are gamified tasks (rank S-D, XP reward, optional progress).
 * Surfaced on Home (active tile, GPS smart card) and listed on the
 * Quests screen. Auto quests are triggered by signals (GPS, calendar,
 * habits); manual quests are user- or AI-created.
 */

import { z } from 'zod';
import { defineOp } from '../lib/operations';

export const QuestRank = z.enum(['S', 'A', 'B', 'C', 'D']);
export const QuestStatus = z.enum(['active', 'done', 'pending', 'dismissed']);

export const Quest = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  rank: QuestRank,
  xp: z.number().int(),
  status: QuestStatus,
  progress: z.number().nullable(),
  auto: z.boolean(),
  trigger: z.string().nullable(),
  created_at: z.string(),
  completed_at: z.string().nullable(),
});
export type Quest = z.infer<typeof Quest>;

export const quests = {
  list: defineOp({
    name: 'quests.list',
    description: 'List quests, newest first. Optionally filter by status (active/done/pending/dismissed).',
    kind: 'query',
    permissions: ['quests.read'],
    tags: ['quests'],
    input: z.object({
      status: QuestStatus.optional(),
      limit: z.number().int().positive().max(100).default(50),
    }).strict(),
    output: z.array(Quest),
    handler: async ({ sb, userId }, { status, limit }) => {
      if (!userId) return [];
      let q = sb.from('quests').select('*').eq('user_id', userId);
      if (status) q = q.eq('status', status);
      const { data, error } = await q.order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return (data ?? []) as Quest[];
    },
  }),

  create: defineOp({
    name: 'quests.create',
    description: 'Create a new quest. Use when the user (or AI) wants to add a task with XP reward.',
    kind: 'mutation',
    permissions: ['quests.write'],
    tags: ['quests'],
    input: z.object({
      title: z.string().min(1).max(200),
      rank: QuestRank.default('C'),
      xp: z.number().int().min(0).default(40),
      progress: z.number().min(0).max(1).optional(),
      auto: z.boolean().default(false),
      trigger: z.string().max(120).optional(),
    }).strict(),
    output: Quest,
    handler: async ({ sb, userId }, input) => {
      if (!userId) throw new Error('Not signed in');
      const { data, error } = await sb
        .from('quests')
        .insert({
          user_id: userId,
          title: input.title,
          rank: input.rank,
          xp: input.xp,
          progress: input.progress ?? null,
          auto: input.auto,
          trigger: input.trigger ?? null,
          status: 'active',
        })
        .select()
        .single();
      if (error) throw error;
      return data as Quest;
    },
  }),

  complete: defineOp({
    name: 'quests.complete',
    description: 'Mark a quest done. Awards its XP at the application layer.',
    kind: 'mutation',
    permissions: ['quests.write'],
    tags: ['quests'],
    input: z.object({ id: z.string().uuid() }).strict(),
    output: Quest,
    handler: async ({ sb }, { id }) => {
      const { data, error } = await sb
        .from('quests')
        .update({ status: 'done', completed_at: new Date().toISOString(), progress: 1 })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Quest;
    },
  }),

  dismiss: defineOp({
    name: 'quests.dismiss',
    description: 'Dismiss a quest without completing it (user said no, or it expired).',
    kind: 'mutation',
    permissions: ['quests.write'],
    tags: ['quests'],
    input: z.object({ id: z.string().uuid() }).strict(),
    output: Quest,
    handler: async ({ sb }, { id }) => {
      const { data, error } = await sb
        .from('quests')
        .update({ status: 'dismissed' })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Quest;
    },
  }),
} as const;
