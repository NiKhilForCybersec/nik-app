/* Nik — home widget canvas contract.
 *
 * The Home screen is a customisable bento. Each widget instance lives
 * in `home_widgets` and renders via a typed registry of components
 * (web/src/components/widgets/). The widget UI playground + AI install
 * flow read/write through these ops; the AI's tool catalog gets
 * `widgets.install` automatically so chat-driven "add a hydration
 * widget" works end-to-end.
 *
 * Adding a new widget type:
 *   1. Add it to `WidgetType` enum below
 *   2. Add a render component + Zod configSchema in
 *      web/src/components/widgets/<name>.tsx
 *   3. Register it in the WIDGET_TYPES map (same file)
 * The contract + screens + AI catalog all auto-discover the new entry.
 */

import { z } from 'zod';
import { defineOp } from '../lib/operations';

export const WidgetType = z.enum([
  // Health
  'hydration_today',
  'sleep_last_night',
  'habit_ring',
  'vitals_strip',           // steps · HR · kcal preview (placeholder until HealthKit)
  // Mind / scoring
  'score_gauge',
  'streak_counter',
  'next_quest',
  'active_quest_progress',
  'habits_today',           // today's rituals — N of M done + closest-to-complete
  // People
  'family_pulse',
  // Memory
  'diary_today',
  // Focus
  'focus_starter',          // begin a focus session
  // Calendar / events
  'next_event',
  'today_events',
  // Generic items
  'list_preview',           // configurable: { kind: ItemKind, limit: number }
]);
export type WidgetType = z.infer<typeof WidgetType>;

export const Widget = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  widget_type: WidgetType,
  position: z.number().int(),
  w: z.number().int().min(1).max(2),
  h: z.number().int().min(1).max(3),
  config: z.record(z.string(), z.unknown()),
  archived_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Widget = z.infer<typeof Widget>;

export const widgets = {
  list: defineOp({
    name: 'widgets.list',
    description: 'List the user\'s active home-screen widgets in display order. Used by HomeScreen to render the canvas + by WidgetsScreen to show the current layout.',
    kind: 'query',
    permissions: ['widgets.read'],
    tags: ['widgets', 'home'],
    input: z.object({}).strict(),
    output: z.array(Widget),
    handler: async ({ sb, userId }) => {
      if (!userId) return [];
      const { data, error } = await sb
        .from('home_widgets')
        .select('*')
        .eq('user_id', userId)
        .is('archived_at', null)
        .order('position', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Widget[];
    },
  }),

  install: defineOp({
    name: 'widgets.install',
    description: 'Add a widget to the home screen. Use when the user (or AI) asks "add a <kind> widget", "show my hydration on home", "put a streak counter at the top". Default size 1×1; pass w/h to override. Position defaults to end of grid.',
    kind: 'mutation',
    permissions: ['widgets.write'],
    tags: ['widgets', 'home'],
    input: z.object({
      widgetType: WidgetType,
      position: z.number().int().min(0).optional(),
      w: z.number().int().min(1).max(2).default(1),
      h: z.number().int().min(1).max(3).default(1),
      config: z.record(z.string(), z.unknown()).default({}),
    }).strict(),
    output: Widget,
    handler: async ({ sb, userId }, input) => {
      if (!userId) throw new Error('Not signed in');
      let position = input.position;
      if (position == null) {
        const { data } = await sb
          .from('home_widgets')
          .select('position')
          .eq('user_id', userId)
          .is('archived_at', null)
          .order('position', { ascending: false })
          .limit(1)
          .maybeSingle();
        position = data ? (data.position as number) + 1 : 0;
      }
      const { data, error } = await sb
        .from('home_widgets')
        .insert({
          user_id: userId,
          widget_type: input.widgetType,
          position,
          w: input.w,
          h: input.h,
          config: input.config,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Widget;
    },
  }),

  move: defineOp({
    name: 'widgets.move',
    description: 'Reorder a widget. Pass the new position; widgets at or after that index shift down by one.',
    kind: 'mutation',
    permissions: ['widgets.write'],
    tags: ['widgets', 'home'],
    input: z.object({
      id: z.string().uuid(),
      position: z.number().int().min(0),
    }).strict(),
    output: Widget,
    handler: async ({ sb }, { id, position }) => {
      const { data, error } = await sb
        .from('home_widgets')
        .update({ position })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Widget;
    },
  }),

  resize: defineOp({
    name: 'widgets.resize',
    description: 'Resize a widget to a new (w, h) in grid units (1×1 / 2×1 / 1×2 / 2×2).',
    kind: 'mutation',
    permissions: ['widgets.write'],
    tags: ['widgets', 'home'],
    input: z.object({
      id: z.string().uuid(),
      w: z.number().int().min(1).max(2),
      h: z.number().int().min(1).max(3),
    }).strict(),
    output: Widget,
    handler: async ({ sb }, { id, w, h }) => {
      const { data, error } = await sb
        .from('home_widgets')
        .update({ w, h })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Widget;
    },
  }),

  configure: defineOp({
    name: 'widgets.configure',
    description: "Update a widget's per-instance config (e.g. show/hide elements, override goal, link to a specific habit). Shape depends on widget_type — see the type's configSchema.",
    kind: 'mutation',
    permissions: ['widgets.write'],
    tags: ['widgets', 'home'],
    input: z.object({
      id: z.string().uuid(),
      config: z.record(z.string(), z.unknown()),
    }).strict(),
    output: Widget,
    handler: async ({ sb }, { id, config }) => {
      const { data, error } = await sb
        .from('home_widgets')
        .update({ config })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Widget;
    },
  }),

  remove: defineOp({
    name: 'widgets.remove',
    description: 'Remove a widget from the home screen (soft-delete via archived_at). Pair this with widgets.install to restore.',
    kind: 'mutation',
    mutability: 'confirm',
    permissions: ['widgets.write'],
    tags: ['widgets', 'home'],
    input: z.object({ id: z.string().uuid() }).strict(),
    output: Widget,
    handler: async ({ sb }, { id }) => {
      const { data, error } = await sb
        .from('home_widgets')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Widget;
    },
  }),

  reset: defineOp({
    name: 'widgets.reset',
    description: 'Restore the default starter set of widgets (archives current ones first). Use when the user asks "reset my home" or first-run.',
    kind: 'mutation',
    mutability: 'confirm',
    permissions: ['widgets.write'],
    tags: ['widgets', 'home'],
    input: z.object({}).strict(),
    output: z.object({ installed: z.number().int() }),
    handler: async ({ sb, userId }) => {
      if (!userId) throw new Error('Not signed in');
      // Archive current
      await sb
        .from('home_widgets')
        .update({ archived_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('archived_at', null);
      // Install defaults — sensible starter canvas matching the
      // existing static Home layout shape.
      // Default canvas is now a full Home replacement — every "static
      // bento" block on the old Home is here as a widget so the
      // playground is the single source of truth for what the user sees.
      const defaults: { widget_type: WidgetType; w: 1 | 2; h: 1 | 2; config: Record<string, unknown> }[] = [
        { widget_type: 'habits_today',           w: 2, h: 1, config: {} },
        { widget_type: 'streak_counter',         w: 1, h: 1, config: {} },
        { widget_type: 'score_gauge',            w: 1, h: 1, config: {} },
        { widget_type: 'hydration_today',        w: 1, h: 1, config: {} },
        { widget_type: 'sleep_last_night',       w: 1, h: 1, config: {} },
        { widget_type: 'active_quest_progress',  w: 2, h: 1, config: {} },
        { widget_type: 'focus_starter',          w: 2, h: 1, config: {} },
        { widget_type: 'next_event',             w: 2, h: 1, config: {} },
        { widget_type: 'family_pulse',           w: 2, h: 1, config: {} },
        { widget_type: 'diary_today',            w: 2, h: 1, config: {} },
        { widget_type: 'vitals_strip',           w: 2, h: 1, config: {} },
      ];
      const rows = defaults.map((d, i) => ({ ...d, user_id: userId, position: i }));
      const { error: insErr, data } = await sb.from('home_widgets').insert(rows).select();
      if (insErr) throw insErr;
      return { installed: data?.length ?? 0 };
    },
  }),
} as const;
