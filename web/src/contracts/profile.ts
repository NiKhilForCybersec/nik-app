/* Nik — profile contract.
 *
 * One row per user. Hero card stats (level/xp/streak), 5-pillar RPG
 * stats, the "About me" rows on the Profile screen. Created lazily by
 * the client on first login.
 */

import { z } from 'zod';
import { defineOp } from '../lib/operations';

export const ProfileStats = z.object({
  STR: z.number().int(),
  INT: z.number().int(),
  DEX: z.number().int(),
  VIT: z.number().int(),
  FOC: z.number().int(),
});
export type ProfileStats = z.infer<typeof ProfileStats>;

export const Profile = z.object({
  id: z.string().uuid(),
  name: z.string(),
  title: z.string(),
  level: z.number().int(),
  xp: z.number().int(),
  xp_max: z.number().int(),
  streak: z.number().int(),
  stats: ProfileStats,
  age: z.number().int().nullable(),
  height_cm: z.number().int().nullable(),
  weight_kg: z.number().int().nullable(),
  goal: z.string().nullable(),
  persona: z.string(),
  voice: z.string(),
  joined_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Profile = z.infer<typeof Profile>;

export const profile = {
  get: defineOp({
    name: 'profile.get',
    description: 'Get the current user\'s profile (name, level, xp, streak, stats). Used by Home hero card and Profile screen.',
    kind: 'query',
    permissions: ['profile.read'],
    tags: ['profile'],
    input: z.object({}).strict(),
    output: Profile.nullable(),
    handler: async ({ sb, userId }) => {
      if (!userId) return null;
      const { data, error } = await sb
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  }),

  update: defineOp({
    name: 'profile.update',
    description: 'Update profile fields (name, age, goal, persona, voice). Use when the user edits their profile.',
    kind: 'mutation',
    permissions: ['profile.write'],
    tags: ['profile'],
    input: z.object({
      name: z.string().max(80).optional(),
      title: z.string().max(80).optional(),
      age: z.number().int().min(1).max(120).nullable().optional(),
      heightCm: z.number().int().min(30).max(300).nullable().optional(),
      weightKg: z.number().int().min(1).max(500).nullable().optional(),
      goal: z.string().max(200).nullable().optional(),
      persona: z.string().max(80).optional(),
      voice: z.string().max(80).optional(),
    }).strict(),
    output: Profile,
    handler: async ({ sb, userId }, input) => {
      if (!userId) throw new Error('Not signed in');
      const patch: Record<string, unknown> = {};
      if (input.name !== undefined) patch.name = input.name;
      if (input.title !== undefined) patch.title = input.title;
      if (input.age !== undefined) patch.age = input.age;
      if (input.heightCm !== undefined) patch.height_cm = input.heightCm;
      if (input.weightKg !== undefined) patch.weight_kg = input.weightKg;
      if (input.goal !== undefined) patch.goal = input.goal;
      if (input.persona !== undefined) patch.persona = input.persona;
      if (input.voice !== undefined) patch.voice = input.voice;
      const { data, error } = await sb
        .from('profiles')
        .update(patch)
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return data as Profile;
    },
  }),
} as const;
