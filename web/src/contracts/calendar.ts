/* Nik — calendar contract.
 *
 * Thin wrapper over the events table for calendar-shaped reads + writes.
 * Today / upcoming / range queries filter `events.list` by
 * `kind = 'calendar_event'`. The future Google / Apple Calendar MCP
 * server writes via the same `events.ingest` op every other integration
 * uses — Calendar is just one source feeding the unified events feed.
 */

import { z } from 'zod';
import { defineOp } from '../lib/operations';
import { Event } from './events';

export const calendar = {
  today: defineOp({
    name: 'calendar.today',
    description: "Get today's calendar events (sourced from any integration). Use when the user asks 'what's on today?', 'do I have anything?', etc.",
    kind: 'query',
    permissions: ['events.read'],
    tags: ['calendar', 'events'],
    input: z.object({}).strict(),
    output: z.array(Event),
    handler: async ({ sb, userId }) => {
      if (!userId) return [];
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(start); end.setDate(end.getDate() + 1);
      const { data, error } = await sb
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .eq('kind', 'calendar_event')
        .is('archived_at', null)
        .gte('occurs_at', start.toISOString())
        .lt('occurs_at', end.toISOString())
        .order('occurs_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  }),

  upcoming: defineOp({
    name: 'calendar.upcoming',
    description: 'List upcoming calendar events for the next N days (default 7), oldest first. Use for week-view agenda.',
    kind: 'query',
    permissions: ['events.read'],
    tags: ['calendar', 'events'],
    input: z.object({
      days: z.number().int().positive().max(60).default(7),
      limit: z.number().int().positive().max(200).default(50),
    }).strict(),
    output: z.array(Event),
    handler: async ({ sb, userId }, { days, limit }) => {
      if (!userId) return [];
      const start = new Date();
      const end = new Date(start); end.setDate(end.getDate() + days);
      const { data, error } = await sb
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .eq('kind', 'calendar_event')
        .is('archived_at', null)
        .gte('occurs_at', start.toISOString())
        .lte('occurs_at', end.toISOString())
        .order('occurs_at', { ascending: true })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  }),

  create: defineOp({
    name: 'calendar.create',
    description: 'Create a calendar event manually. Use when the user says "schedule X for tomorrow at 3pm", "add dentist appointment Friday", etc. Auto-stamps kind=calendar_event + source=manual.',
    kind: 'mutation',
    permissions: ['events.write'],
    tags: ['calendar', 'events'],
    input: z.object({
      title: z.string().min(1).max(200),
      occursAt: z.string(),
      body: z.string().max(2000).optional(),
      location: z.string().max(120).optional(),
      durationMin: z.number().int().min(0).max(24 * 60).optional(),
    }).strict(),
    output: Event.nullable(),
    handler: async ({ sb, userId }, input) => {
      if (!userId) throw new Error('Not signed in');
      const { data, error } = await sb
        .from('events')
        .insert({
          user_id: userId,
          kind: 'calendar_event',
          title: input.title,
          body: input.body ?? null,
          occurs_at: input.occursAt,
          location: input.location ?? null,
          payload: input.durationMin ? { duration_min: input.durationMin } : {},
          source_provider: 'manual',
          source_ref: `manual:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  }),
} as const;
