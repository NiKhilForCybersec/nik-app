/* Nik — generic items contract.
 *
 * Backs ~22 of the 33 SOON dashboards in the More tab. One table,
 * one contract, kind-discriminated. Add a new kind by appending to
 * `ItemKind` — instantly callable by the AI and the MCP server.
 *
 * Today the screens for these kinds still show SOON, but the AI can
 * already create / list / update / archive items in any of them via
 * Chat (and via the Telegram harness once it lands). When a screen
 * gets built, it just calls `useOp(items.list, { kind: 'reading' })`.
 */

import { z } from 'zod';
import { defineOp } from '../lib/operations';

export const ItemKind = z.enum([
  // Health
  'nutrition', 'symptoms', 'doctor',
  // Mind
  'reading', 'learning', 'gratitude', 'goal', 'reflection', 'language_deck',
  // People
  'friend', 'pet', 'birthday', 'contact',
  // Money
  'bill', 'subscription', 'investment', 'receipt',
  // Home & Errands
  'shopping', 'recipe', 'home_maintenance', 'plant', 'wardrobe',
  // Memory
  'trip', 'achievement', 'bucket_list', 'time_capsule', 'photo',
  // Work
  'project', 'side_project', 'career_note',
]);
export type ItemKind = z.infer<typeof ItemKind>;

export const Item = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  kind: ItemKind,
  title: z.string(),
  body: z.string().nullable(),
  meta: z.record(z.string(), z.unknown()),
  status: z.string(),
  position: z.number().int(),
  tags: z.array(z.string()),
  occurs_at: z.string().nullable(),
  remind_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  archived_at: z.string().nullable(),
});
export type Item = z.infer<typeof Item>;

export const items = {
  list: defineOp({
    name: 'items.list',
    description: "List the user's items of a given kind (reading list, shopping list, birthdays, etc.). Optionally filter by status (e.g. 'active', 'done', 'wishlist'). Newest first by default.",
    kind: 'query',
    permissions: ['items.read'],
    tags: ['items'],
    input: z.object({
      kind: ItemKind,
      status: z.string().max(40).optional(),
      includeArchived: z.boolean().default(false),
      limit: z.number().int().positive().max(500).default(100),
    }).strict(),
    output: z.array(Item),
    handler: async ({ sb, userId }, { kind, status, includeArchived, limit }) => {
      if (!userId) return [];
      let q = sb.from('items').select('*').eq('user_id', userId).eq('kind', kind);
      if (status) q = q.eq('status', status);
      if (!includeArchived) q = q.is('archived_at', null);
      const { data, error } = await q.order('position', { ascending: true }).order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  }),

  create: defineOp({
    name: 'items.create',
    description: "Create a new item. Use when the user says \"add X to my reading list\", \"buy milk\", \"my friend Sam's birthday is March 12\", \"track my electricity bill\", etc. Pick the right kind from the enum.",
    kind: 'mutation',
    permissions: ['items.write'],
    tags: ['items'],
    input: z.object({
      kind: ItemKind,
      title: z.string().min(1).max(200),
      body: z.string().max(10000).optional(),
      meta: z.record(z.string(), z.unknown()).default({}),
      status: z.string().max(40).default('active'),
      tags: z.array(z.string()).default([]),
      occursAt: z.string().optional(),
      remindAt: z.string().optional(),
    }).strict(),
    output: Item,
    handler: async ({ sb, userId }, input) => {
      if (!userId) throw new Error('Not signed in');
      const { data, error } = await sb
        .from('items')
        .insert({
          user_id: userId,
          kind: input.kind,
          title: input.title,
          body: input.body ?? null,
          meta: input.meta,
          status: input.status,
          tags: input.tags,
          occurs_at: input.occursAt ?? null,
          remind_at: input.remindAt ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Item;
    },
  }),

  update: defineOp({
    name: 'items.update',
    description: "Update an existing item's fields. Use to mark something done, change a date, edit notes, etc.",
    kind: 'mutation',
    permissions: ['items.write'],
    tags: ['items'],
    input: z.object({
      id: z.string().uuid(),
      title: z.string().max(200).optional(),
      body: z.string().max(10000).nullable().optional(),
      meta: z.record(z.string(), z.unknown()).optional(),
      status: z.string().max(40).optional(),
      tags: z.array(z.string()).optional(),
      occursAt: z.string().nullable().optional(),
      remindAt: z.string().nullable().optional(),
    }).strict(),
    output: Item,
    handler: async ({ sb }, { id, ...input }) => {
      const patch: Record<string, unknown> = {};
      if (input.title !== undefined) patch.title = input.title;
      if (input.body !== undefined) patch.body = input.body;
      if (input.meta !== undefined) patch.meta = input.meta;
      if (input.status !== undefined) patch.status = input.status;
      if (input.tags !== undefined) patch.tags = input.tags;
      if (input.occursAt !== undefined) patch.occurs_at = input.occursAt;
      if (input.remindAt !== undefined) patch.remind_at = input.remindAt;
      const { data, error } = await sb.from('items').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data as Item;
    },
  }),

  archive: defineOp({
    name: 'items.archive',
    description: 'Archive (soft-delete) an item. The user can still recall it; it just stops showing in default lists.',
    kind: 'mutation',
    permissions: ['items.write'],
    tags: ['items'],
    input: z.object({ id: z.string().uuid() }).strict(),
    output: Item,
    handler: async ({ sb }, { id }) => {
      const { data, error } = await sb
        .from('items')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Item;
    },
  }),

  remove: defineOp({
    name: 'items.remove',
    description: 'Permanently delete an item. Use only when the user explicitly asks to delete (not just archive).',
    kind: 'mutation',
    permissions: ['items.write'],
    tags: ['items'],
    input: z.object({ id: z.string().uuid() }).strict(),
    output: z.object({ removed: z.boolean() }),
    handler: async ({ sb }, { id }) => {
      const { error } = await sb.from('items').delete().eq('id', id);
      if (error) throw error;
      return { removed: true };
    },
  }),

  reorder: defineOp({
    name: 'items.reorder',
    description: 'Reorder items in a kind by writing new position values. Pass [{ id, position }] in the desired order.',
    kind: 'mutation',
    permissions: ['items.write'],
    tags: ['items'],
    input: z.object({
      moves: z.array(z.object({ id: z.string().uuid(), position: z.number().int().min(0) })).min(1).max(200),
    }).strict(),
    output: z.object({ updated: z.number().int() }),
    handler: async ({ sb }, { moves }) => {
      // No bulk update in PostgREST; do them in parallel.
      const results = await Promise.all(
        moves.map((m) => sb.from('items').update({ position: m.position }).eq('id', m.id)),
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
      return { updated: moves.length };
    },
  }),
} as const;
