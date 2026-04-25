/* Nik — scheduled intents + long-term memory.
 *
 * Operations the AI uses to remember things and schedule callbacks.
 * "In 2 weeks remind me to X" → intents.schedule(...).
 * "I prefer mornings for hard work" → memory.save({ kind: 'preference', ... }).
 */

import { z } from 'zod';
import { defineOp } from '../lib/operations';

// ── Intent types ─────────────────────────────────────────
export const IntentKind = z.enum([
  'notify',           // push notification with `payload.message`
  'ai_ping',          // Nik AI proactively messages — payload.prompt
  'create_dashboard', // AI created a More tile that activates now
  'check_in',         // ask the user how something went — payload.subject
  'custom',           // catch-all for tools we add later
]);
export type IntentKind = z.infer<typeof IntentKind>;

export const Intent = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  fire_at: z.string(),
  kind: IntentKind,
  payload: z.record(z.string(), z.unknown()),
  status: z.enum(['pending', 'fired', 'cancelled', 'failed']),
  fired_at: z.string().nullable(),
  failure_reason: z.string().nullable(),
  created_by: z.enum(['user', 'ai', 'integration', 'system']),
  source: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Intent = z.infer<typeof Intent>;

// ── Memory types ─────────────────────────────────────────
export const MemoryKind = z.enum(['preference', 'fact', 'goal', 'context']);
export type MemoryKind = z.infer<typeof MemoryKind>;

export const Memory = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  kind: MemoryKind,
  content: z.string(),
  confidence: z.number().min(0).max(1),
  source: z.string().nullable(),
  archived_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Memory = z.infer<typeof Memory>;

// ── Operations ────────────────────────────────────────────
export const intents = {
  schedule: defineOp({
    name: 'intents.schedule',
    description: 'Schedule a callback for a future time. Use when the user says things like "in 2 weeks remind me…", "next Tuesday morning ask me how X went", or "tomorrow at 3pm…". `fireAt` is ISO 8601.',
    kind: 'mutation',
    permissions: ['intents.write'],
    tags: ['intents', 'memory'],
    input: z.object({
      fireAt: z.string(),
      kind: IntentKind,
      payload: z.record(z.string(), z.unknown()).default({}),
      source: z.string().optional(),
    }).strict(),
    output: Intent,
    handler: async ({ sb, userId }, input) => {
      const { data, error } = await sb
        .from('scheduled_intents')
        .insert({
          user_id: userId,
          fire_at: input.fireAt,
          kind: input.kind,
          payload: input.payload,
          created_by: 'ai',
          source: input.source ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Intent;
    },
  }),

  list: defineOp({
    name: 'intents.list',
    description: 'List all pending and recently fired intents for the current user.',
    kind: 'query',
    permissions: ['intents.read'],
    tags: ['intents'],
    input: z.object({}).strict(),
    output: z.array(Intent),
    handler: async ({ sb, userId }) => {
      if (!userId) return [];
      const { data, error } = await sb
        .from('scheduled_intents')
        .select('*')
        .eq('user_id', userId)
        .order('fire_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Intent[];
    },
  }),

  cancel: defineOp({
    name: 'intents.cancel',
    description: 'Cancel a scheduled intent before it fires.',
    kind: 'mutation',
    permissions: ['intents.write'],
    tags: ['intents'],
    input: z.object({ id: z.string().uuid() }).strict(),
    output: Intent,
    handler: async ({ sb }, { id }) => {
      const { data, error } = await sb
        .from('scheduled_intents')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Intent;
    },
  }),
} as const;

export const memory = {
  save: defineOp({
    name: 'memory.save',
    description: 'Remember something across sessions. Use for user preferences ("prefers mornings"), facts ("Mom lives in Pune"), goals ("ship Nik beta"), or recent context ("vacationing in Coorg").',
    kind: 'mutation',
    permissions: ['memory.write'],
    tags: ['memory'],
    input: z.object({
      kind: MemoryKind,
      content: z.string().min(1).max(2000),
      confidence: z.number().min(0).max(1).default(1),
      source: z.string().optional(),
    }).strict(),
    output: Memory,
    handler: async ({ sb, userId }, input) => {
      const { data, error } = await sb
        .from('user_memories')
        .insert({
          user_id: userId,
          kind: input.kind,
          content: input.content,
          confidence: input.confidence,
          source: input.source ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Memory;
    },
  }),

  list: defineOp({
    name: 'memory.list',
    description: 'List all active memories for the current user, optionally filtered by kind.',
    kind: 'query',
    permissions: ['memory.read'],
    tags: ['memory'],
    input: z.object({ kind: MemoryKind.optional() }).strict(),
    output: z.array(Memory),
    handler: async ({ sb, userId }, { kind }) => {
      if (!userId) return [];
      let q = sb
        .from('user_memories')
        .select('*')
        .eq('user_id', userId)
        .is('archived_at', null);
      if (kind) q = q.eq('kind', kind);
      const { data, error } = await q.order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as Memory[];
    },
  }),

  archive: defineOp({
    name: 'memory.archive',
    description: 'Soft-delete a memory the user no longer wants Nik to consider.',
    kind: 'mutation',
    permissions: ['memory.write'],
    tags: ['memory'],
    input: z.object({ id: z.string().uuid() }).strict(),
    output: Memory,
    handler: async ({ sb }, { id }) => {
      const { data, error } = await sb
        .from('user_memories')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Memory;
    },
  }),
} as const;
