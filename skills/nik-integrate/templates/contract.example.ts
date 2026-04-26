/* Example contract — copy + adapt this shape per feature.
 *
 * Pattern: one file per domain (habits.ts, score.ts, calendar.ts).
 * Each file declares its types + ops in one place. Imported by the
 * registry index, by React hooks, and by the MCP server — never by
 * hand-rolled fetch calls.
 */

import { z } from 'zod';
import { defineOp } from '../lib/operations';

// ── Domain types (Zod = single source of truth, infer TS types) ──
export const Note = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().max(120),
  body: z.string(),
  pinned: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Note = z.infer<typeof Note>;

// ── Operations ─────────────────────────────────────────
export const notes = {
  list: defineOp({
    name: 'notes.list',
    description: 'List all notes for the current user, pinned first.',
    kind: 'query',
    permissions: ['notes.read'],
    tags: ['notes'],
    input: z.object({
      limit: z.number().int().positive().max(200).default(50),
    }).strict(),
    output: z.array(Note),
    handler: async ({ sb, userId }, { limit }) => {
      if (!userId) return [];
      const { data, error } = await sb
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('pinned', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as Note[];
    },
  }),

  create: defineOp({
    name: 'notes.create',
    description: 'Create a new note. AI calls this when the user says "remind me…", "save this…", or dictates a thought.',
    kind: 'mutation',
    permissions: ['notes.write'],
    tags: ['notes'],
    input: z.object({
      title: z.string().min(1).max(120),
      body: z.string().min(1),
      pinned: z.boolean().default(false),
    }).strict(),
    output: Note,
    handler: async ({ sb, userId }, input) => {
      const { data, error } = await sb
        .from('notes')
        .insert({ user_id: userId, ...input })
        .select()
        .single();
      if (error) throw error;
      return data as Note;
    },
  }),

  pin: defineOp({
    name: 'notes.pin',
    description: 'Pin or unpin a note.',
    kind: 'mutation',
    permissions: ['notes.write'],
    tags: ['notes'],
    input: z.object({
      id: z.string().uuid(),
      pinned: z.boolean().default(true),
    }).strict(),
    output: Note,
    handler: async ({ sb }, { id, pinned }) => {
      const { data, error } = await sb
        .from('notes')
        .update({ pinned })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Note;
    },
  }),
} as const;
