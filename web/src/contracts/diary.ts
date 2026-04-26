/* Nik — diary contract. */

import { z } from 'zod';
import { defineOp } from '../lib/operations';

export const Pillar = z.enum(['focus', 'health', 'mind', 'family']);
export type Pillar = z.infer<typeof Pillar>;

export const DiaryEntry = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().nullable(),
  body: z.string(),
  occurred_at: z.string(),
  mood: z.number().int().min(1).max(5).nullable(),
  tags: z.array(z.string()),
  location: z.string().nullable(),
  photo_urls: z.array(z.string()),
  voice_url: z.string().nullable(),
  voice_seconds: z.number().int().nullable(),
  score_delta: z.number().int(),
  pillar: Pillar.nullable(),
  archived_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type DiaryEntry = z.infer<typeof DiaryEntry>;

export const diary = {
  list: defineOp({
    name: 'diary.list',
    description: 'List recent diary entries, newest first. Optionally filter by pillar or mood threshold.',
    kind: 'query',
    permissions: ['diary.read'],
    tags: ['diary', 'mind'],
    input: z.object({
      pillar: Pillar.optional(),
      minMood: z.number().int().min(1).max(5).optional(),
      limit: z.number().int().positive().max(200).default(50),
    }).strict(),
    output: z.array(DiaryEntry),
    handler: async ({ sb, userId }, { pillar, minMood, limit }) => {
      if (!userId) return [];
      let q = sb
        .from('diary_entries')
        .select('*')
        .eq('user_id', userId)
        .is('archived_at', null);
      if (pillar)  q = q.eq('pillar', pillar);
      if (minMood) q = q.gte('mood', minMood);
      const { data, error } = await q.order('occurred_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return (data ?? []) as DiaryEntry[];
    },
  }),

  create: defineOp({
    name: 'diary.create',
    description: 'Write a new diary entry. Use when the user voice-dictates or types a reflection.',
    kind: 'mutation',
    permissions: ['diary.write'],
    tags: ['diary'],
    input: z.object({
      title: z.string().max(120).optional(),
      body: z.string().min(1).max(50000),
      occurredAt: z.string().optional(),
      mood: z.number().int().min(1).max(5).optional(),
      tags: z.array(z.string()).default([]),
      location: z.string().optional(),
      photoUrls: z.array(z.string().url()).default([]),
      voiceUrl: z.string().url().optional(),
      voiceSeconds: z.number().int().positive().optional(),
      pillar: Pillar.optional(),
    }).strict(),
    output: DiaryEntry,
    handler: async ({ sb, userId }, input) => {
      const { data, error } = await sb
        .from('diary_entries')
        .insert({
          user_id: userId,
          title: input.title ?? null,
          body: input.body,
          occurred_at: input.occurredAt ?? new Date().toISOString(),
          mood: input.mood ?? null,
          tags: input.tags,
          location: input.location ?? null,
          photo_urls: input.photoUrls,
          voice_url: input.voiceUrl ?? null,
          voice_seconds: input.voiceSeconds ?? null,
          pillar: input.pillar ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as DiaryEntry;
    },
  }),

  update: defineOp({
    name: 'diary.update',
    description: 'Edit an existing diary entry.',
    kind: 'mutation',
    permissions: ['diary.write'],
    tags: ['diary'],
    input: z.object({
      id: z.string().uuid(),
      title: z.string().max(120).optional(),
      body: z.string().max(50000).optional(),
      mood: z.number().int().min(1).max(5).nullable().optional(),
      tags: z.array(z.string()).optional(),
      pillar: Pillar.nullable().optional(),
    }).strict(),
    output: DiaryEntry,
    handler: async ({ sb }, { id, ...patch }) => {
      const { data, error } = await sb.from('diary_entries').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data as DiaryEntry;
    },
  }),

  archive: defineOp({
    name: 'diary.archive',
    description: 'Archive (soft-delete) a diary entry.',
    kind: 'mutation',
    permissions: ['diary.write'],
    tags: ['diary'],
    input: z.object({ id: z.string().uuid() }).strict(),
    output: DiaryEntry,
    handler: async ({ sb }, { id }) => {
      const { data, error } = await sb
        .from('diary_entries')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as DiaryEntry;
    },
  }),
} as const;
