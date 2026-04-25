/* Nik — events + integrations contract.
 *
 * Generic feed every external integration MCP server (Gmail, Calendar,
 * WhatsApp, HealthKit, etc.) writes into. Screens read from here instead
 * of from per-source tables — decouples display from origin.
 */

import { z } from 'zod';
import { defineOp } from '../lib/operations';

export const EventKind = z.enum([
  'movie_ticket',
  'flight_booking',
  'hotel_booking',
  'restaurant_booking',
  'calendar_event',
  'gmail_thread',
  'gmail_receipt',
  'birthday_reminder',
  'bill_due',
  'subscription_renewal',
  'whatsapp_message',
  'sms_otp',
  'package_delivery',
  'manual',
  'other',
]);
export type EventKind = z.infer<typeof EventKind>;

export const Event = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  kind: EventKind,
  title: z.string(),
  body: z.string().nullable(),
  occurs_at: z.string().nullable(),
  location: z.string().nullable(),
  payload: z.record(z.string(), z.unknown()),
  source_provider: z.string().nullable(),
  source_ref: z.string().nullable(),
  source_url: z.string().nullable(),
  integration_id: z.string().uuid().nullable(),
  read: z.boolean(),
  pinned: z.boolean(),
  archived_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Event = z.infer<typeof Event>;

export const events = {
  list: defineOp({
    name: 'events.list',
    description: 'List recent events the user has received from any integration. Use to answer "what\'s on this week", "did anything come in from email", "show me my upcoming bookings".',
    kind: 'query',
    permissions: ['events.read'],
    tags: ['events'],
    input: z.object({
      kind: EventKind.optional(),
      since: z.string().optional(),  // ISO 8601
      limit: z.number().int().positive().max(200).default(50),
    }).strict(),
    output: z.array(Event),
    handler: async ({ sb, userId }, { kind, since, limit }) => {
      if (!userId) return [];
      let q = sb
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .is('archived_at', null);
      if (kind)  q = q.eq('kind', kind);
      if (since) q = q.gte('occurs_at', since);
      const { data, error } = await q
        .order('occurs_at', { ascending: false, nullsFirst: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as Event[];
    },
  }),

  ingest: defineOp({
    name: 'events.ingest',
    description: 'Insert an event into the user\'s feed. Used by integration MCP servers (Gmail, Calendar, WhatsApp). Set `source_provider` + `source_ref` so we dedupe re-ingestions.',
    kind: 'mutation',
    permissions: ['events.write'],
    tags: ['events', 'integrations'],
    input: z.object({
      kind: EventKind,
      title: z.string().min(1).max(200),
      body: z.string().optional(),
      occursAt: z.string().optional(),
      location: z.string().optional(),
      payload: z.record(z.string(), z.unknown()).default({}),
      sourceProvider: z.string().optional(),
      sourceRef: z.string().optional(),
      sourceUrl: z.string().optional(),
    }).strict(),
    output: Event.nullable(),
    handler: async ({ sb, userId }, input) => {
      const { data, error } = await sb
        .from('events')
        .upsert(
          {
            user_id: userId,
            kind: input.kind,
            title: input.title,
            body: input.body ?? null,
            occurs_at: input.occursAt ?? null,
            location: input.location ?? null,
            payload: input.payload,
            source_provider: input.sourceProvider ?? null,
            source_ref: input.sourceRef ?? null,
            source_url: input.sourceUrl ?? null,
          },
          { onConflict: 'user_id,source_provider,source_ref', ignoreDuplicates: false },
        )
        .select()
        .single();
      if (error) {
        // Dedupe collision is fine — return null instead of throwing.
        if (error.code === '23505') return null;
        throw error;
      }
      return data as Event;
    },
  }),

  markRead: defineOp({
    name: 'events.markRead',
    description: 'Mark an event read after the user has seen it.',
    kind: 'mutation',
    permissions: ['events.write'],
    tags: ['events'],
    input: z.object({ id: z.string().uuid(), read: z.boolean().default(true) }).strict(),
    output: Event,
    handler: async ({ sb }, { id, read }) => {
      const { data, error } = await sb.from('events').update({ read }).eq('id', id).select().single();
      if (error) throw error;
      return data as Event;
    },
  }),

  pin: defineOp({
    name: 'events.pin',
    description: 'Pin an event so it stays surfaced on Home / Brief.',
    kind: 'mutation',
    permissions: ['events.write'],
    tags: ['events'],
    input: z.object({ id: z.string().uuid(), pinned: z.boolean().default(true) }).strict(),
    output: Event,
    handler: async ({ sb }, { id, pinned }) => {
      const { data, error } = await sb.from('events').update({ pinned }).eq('id', id).select().single();
      if (error) throw error;
      return data as Event;
    },
  }),

  archive: defineOp({
    name: 'events.archive',
    description: 'Archive (soft-delete) an event the user no longer wants to see.',
    kind: 'mutation',
    permissions: ['events.write'],
    tags: ['events'],
    input: z.object({ id: z.string().uuid() }).strict(),
    output: Event,
    handler: async ({ sb }, { id }) => {
      const { data, error } = await sb
        .from('events')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Event;
    },
  }),
} as const;
