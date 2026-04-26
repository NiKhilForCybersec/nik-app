/* Nik — widget component registry.
 *
 * One entry per WidgetType in the contracts/widgets.ts enum. Each
 * widget is a small, self-contained component that:
 *   • reads its own data via the useOp hook
 *   • accepts size (w, h) + per-instance config
 *   • renders something sensible at every size
 *
 * Adding a new widget = one entry in WIDGET_TYPES below. The
 * WidgetsScreen library + HomeScreen renderer pick it up
 * automatically, and the AI's `widgets.install` tool can immediately
 * place it on the Home canvas.
 */

import React from 'react';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useOp } from '../../lib/useOp';
import {
  hydration as hydrationOps,
  sleep as sleepOps,
  score as scoreOps,
  profile as profileOps,
  habits as habitsOps,
  quests as questsOps,
  events as eventsOps,
  diary as diaryOps,
  circle as circleOps,
  items as itemsOps,
  ItemKind,
} from '../../contracts';
import { Chip } from '../primitives';
import { I } from '../icons';
import type { WidgetType } from '../../contracts/widgets';

// ── Common props every widget receives ─────────────────────

export type WidgetSize = { w: 1 | 2; h: 1 | 2 };

export type WidgetRenderProps<TConfig = Record<string, unknown>> = {
  size: WidgetSize;
  config: TConfig;
  /** Tap handler — typically used to navigate to the dedicated screen. */
  onOpen?: () => void;
};

export type WidgetDef<TConfig = Record<string, unknown>> = {
  /** What the user sees in the picker. */
  label: string;
  /** Sub-text in the picker. */
  description: string;
  /** I[icon] key. */
  icon: keyof typeof I;
  /** Theme hue. */
  hue: number;
  /** Default size when added. */
  defaultSize: WidgetSize;
  /** Allowed sizes — picker restricts the resize chips. */
  allowedSizes: WidgetSize[];
  /** Zod validator + default for per-instance config. */
  configSchema: z.ZodType<TConfig>;
  /** The render component. */
  Component: React.FC<WidgetRenderProps<TConfig>>;
  /** Suggested target screen when the widget is tapped. */
  navTarget?: string;
};

// ── Reusable shell — every widget renders inside this ─────

export const WidgetShell: React.FC<{
  hue: number;
  icon: keyof typeof I;
  label: string;
  size: WidgetSize;
  onOpen?: () => void;
  children: React.ReactNode;
}> = ({ hue, icon, label, size, onOpen, children }) => {
  const Ic = I[icon] ?? I.sparkle;
  const isLarge = size.w === 2 || size.h === 2;
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      className={onOpen ? 'glass tap' : 'glass'}
      style={{
        padding: isLarge ? 14 : 12,
        gridColumn: `span ${size.w}`,
        gridRow:    `span ${size.h}`,
        background: `linear-gradient(135deg, oklch(0.78 0.16 ${hue} / 0.10), transparent 70%)`,
        borderColor: `oklch(0.78 0.16 ${hue} / 0.22)`,
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', minHeight: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <Ic size={12} stroke={`oklch(0.92 0.14 ${hue})`} />
          <span style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {label.toUpperCase()}
          </span>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </motion.div>
  );
};

// ── Individual widget components ───────────────────────────

const HydrationToday: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const { data } = useOp(hydrationOps.today, {});
  const total = data?.totalMl ?? 0;
  const goal = data?.goalMl ?? 2000;
  const pct = Math.min(1, total / goal);
  return (
    <WidgetShell hue={200} icon="water" label="Hydration today" size={size} onOpen={onOpen}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <div className="display" style={{ fontSize: size.w === 2 ? 32 : 22, fontWeight: 600, color: 'oklch(0.92 0.14 200)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {total}
        </div>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>/ {goal} ml</div>
      </div>
      <div style={{ marginTop: 8, height: 4, borderRadius: 99, background: 'oklch(1 0 0 / 0.06)', overflow: 'hidden' }}>
        <div style={{ width: `${pct * 100}%`, height: '100%', background: 'linear-gradient(90deg, oklch(0.78 0.16 200), oklch(0.65 0.20 240))' }} />
      </div>
    </WidgetShell>
  );
};

const SleepLastNight: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const { data: nights = [] } = useOp(sleepOps.recent, { limit: 1 });
  const last = nights[0];
  const hours = last?.duration_min ? (last.duration_min / 60).toFixed(1) : '—';
  const score = last?.score ?? null;
  return (
    <WidgetShell hue={260} icon="moon" label="Last night" size={size} onOpen={onOpen}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <div className="display" style={{ fontSize: size.w === 2 ? 32 : 22, fontWeight: 600, color: 'oklch(0.92 0.14 260)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {hours}
        </div>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>hrs</div>
      </div>
      {score != null && (
        <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 6 }}>
          Score <b style={{ color: 'oklch(0.92 0.14 260)' }}>{score}</b>
        </div>
      )}
    </WidgetShell>
  );
};

const ScoreGauge: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const { data } = useOp(scoreOps.get, {});
  const total = data?.total ?? 0;
  const delta = data?.delta_7d ?? 0;
  return (
    <WidgetShell hue={220} icon="sparkle" label="Nik Score" size={size} onOpen={onOpen}>
      <div className="display" style={{ fontSize: size.w === 2 ? 38 : 26, fontWeight: 500, color: 'oklch(0.94 0.12 220)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {total}
      </div>
      <div style={{ fontSize: 10, color: delta > 0 ? 'oklch(0.85 0.16 150)' : delta < 0 ? 'oklch(0.85 0.18 25)' : 'var(--fg-3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
        {delta === 0 ? '— this week' : `${delta > 0 ? '+' : ''}${delta} this week`}
      </div>
    </WidgetShell>
  );
};

const StreakCounter: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const { data } = useOp(profileOps.get, {});
  const streak = data?.streak ?? 0;
  return (
    <WidgetShell hue={40} icon="flame" label="Streak" size={size} onOpen={onOpen}>
      <div className="display" style={{ fontSize: size.w === 2 ? 38 : 28, fontWeight: 600, color: 'oklch(0.9 0.16 40)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {streak}
      </div>
      <div style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
        {streak === 1 ? 'day' : 'days'}
      </div>
    </WidgetShell>
  );
};

const NextEvent: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const { data: evts = [] } = useOp(eventsOps.list, { limit: 1 });
  const e = evts[0];
  return (
    <WidgetShell hue={280} icon="calendar" label="Next" size={size} onOpen={onOpen}>
      {e ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {e.title}
          </div>
          {e.occurs_at && (
            <div style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
              {new Date(e.occurs_at).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
            </div>
          )}
        </>
      ) : (
        <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>Nothing scheduled</div>
      )}
    </WidgetShell>
  );
};

const FamilyPulse: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const { data: members = [] } = useOp(circleOps.list, {});
  const online = members.filter((m) => m.status === 'online').length;
  return (
    <WidgetShell hue={150} icon="family" label="Family" size={size} onOpen={onOpen}>
      <div className="display" style={{ fontSize: size.w === 2 ? 28 : 22, fontWeight: 500, color: 'oklch(0.92 0.14 150)', lineHeight: 1 }}>
        {members.length} <span style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>members · {online} online</span>
      </div>
      {members.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
          {members.slice(0, 5).map((m) => (
            <div key={m.id} style={{
              width: 22, height: 22, borderRadius: '50%',
              background: `oklch(0.78 0.16 ${m.hue} / 0.4)`,
              border: '1px solid var(--hairline)',
              fontSize: 10, color: 'var(--fg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{m.name.charAt(0)}</div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
};

const DiaryToday: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const { data: entries = [] } = useOp(diaryOps.list, { limit: 1 });
  const e = entries[0];
  return (
    <WidgetShell hue={320} icon="book" label="Diary" size={size} onOpen={onOpen}>
      {e ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {e.title || 'Untitled'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 4, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {e.body}
          </div>
        </>
      ) : (
        <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>Write your first entry</div>
      )}
    </WidgetShell>
  );
};

const ActiveQuestProgress: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const { data: list = [] } = useOp(questsOps.list, { status: 'active', limit: 1 });
  const q = list[0];
  return (
    <WidgetShell hue={30} icon="sword" label="Active quest" size={size} onOpen={onOpen}>
      {q ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {q.title}
          </div>
          {q.progress != null && (
            <div style={{ marginTop: 6, height: 3, background: 'oklch(1 0 0 / 0.06)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(q.progress as number) * 100}%`, background: `oklch(0.78 0.16 30)` }} />
            </div>
          )}
          <div style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
            +{q.xp} XP · {q.rank}
          </div>
        </>
      ) : (
        <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>No active quest</div>
      )}
    </WidgetShell>
  );
};

const HabitRing: React.FC<WidgetRenderProps<{ habitId?: string }>> = ({ size, config, onOpen }) => {
  const { data: habits = [] } = useOp(habitsOps.list, {});
  const habit = config.habitId
    ? habits.find((h) => h.id === config.habitId)
    : habits[0];
  if (!habit) return <WidgetShell hue={200} icon="check" label="Habit" size={size} onOpen={onOpen}><div style={{ fontSize: 11, color: 'var(--fg-3)' }}>No habit linked</div></WidgetShell>;
  const pct = Math.min(1, habit.done / habit.target);
  return (
    <WidgetShell hue={habit.hue} icon="check" label={habit.name} size={size} onOpen={onOpen}>
      <div className="display" style={{ fontSize: size.w === 2 ? 28 : 22, fontWeight: 500, color: `oklch(0.92 0.14 ${habit.hue})`, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {habit.done} <span style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>/ {habit.target} {habit.unit}</span>
      </div>
      <div style={{ marginTop: 8, height: 4, borderRadius: 99, background: 'oklch(1 0 0 / 0.06)', overflow: 'hidden' }}>
        <div style={{ width: `${pct * 100}%`, height: '100%', background: `oklch(0.78 0.16 ${habit.hue})` }} />
      </div>
    </WidgetShell>
  );
};

const NextQuest: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const { data: list = [] } = useOp(questsOps.list, { status: 'pending', limit: 1 });
  const q = list[0];
  return (
    <WidgetShell hue={260} icon="sparkle" label="Next quest" size={size} onOpen={onOpen}>
      {q ? (
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{q.title}</div>
      ) : (
        <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>Nothing pending</div>
      )}
    </WidgetShell>
  );
};

const TodayEvents: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const { data: evts = [] } = useOp(eventsOps.list, { limit: 5 });
  const today = evts.filter((e) => {
    if (!e.occurs_at) return false;
    const d = new Date(e.occurs_at);
    return d.toDateString() === new Date().toDateString();
  });
  return (
    <WidgetShell hue={200} icon="calendar" label="Today" size={size} onOpen={onOpen}>
      <div className="display" style={{ fontSize: size.w === 2 ? 28 : 20, fontWeight: 500, color: 'oklch(0.92 0.14 200)', lineHeight: 1 }}>
        {today.length}
      </div>
      <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
        {today.length === 1 ? 'event' : 'events'}
      </div>
    </WidgetShell>
  );
};

const ListPreview: React.FC<WidgetRenderProps<{ kind?: string; limit?: number }>> = ({ size, config, onOpen }) => {
  const kind = (config.kind ?? 'reading') as z.infer<typeof ItemKind>;
  const { data: items = [] } = useOp(itemsOps.list, { kind, limit: config.limit ?? 4 });
  return (
    <WidgetShell hue={280} icon="grid" label={kind} size={size} onOpen={onOpen}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.slice(0, 4).map((item) => (
          <div key={item.id} style={{ fontSize: 11, color: item.status === 'done' ? 'var(--fg-3)' : 'var(--fg-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: item.status === 'done' ? 'line-through' : 'none' }}>
            {item.title}
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>Empty list</div>
        )}
      </div>
    </WidgetShell>
  );
};

// ── Registry ───────────────────────────────────────────────

const noConfig = z.object({}).strict() as unknown as z.ZodType<Record<string, unknown>>;

export const WIDGET_TYPES: Record<WidgetType, WidgetDef<any>> = {
  hydration_today: {
    label: 'Hydration today',
    description: 'Today\'s ml + goal + progress bar.',
    icon: 'water', hue: 200,
    defaultSize: { w: 1, h: 1 },
    allowedSizes: [{ w: 1, h: 1 }, { w: 2, h: 1 }],
    configSchema: noConfig,
    Component: HydrationToday,
    navTarget: 'hydration',
  },
  sleep_last_night: {
    label: 'Sleep last night',
    description: 'Hours slept + score.',
    icon: 'moon', hue: 260,
    defaultSize: { w: 1, h: 1 },
    allowedSizes: [{ w: 1, h: 1 }, { w: 2, h: 1 }],
    configSchema: noConfig,
    Component: SleepLastNight,
    navTarget: 'sleep',
  },
  habit_ring: {
    label: 'Habit ring',
    description: 'A specific habit\'s progress (configurable).',
    icon: 'check', hue: 150,
    defaultSize: { w: 1, h: 1 },
    allowedSizes: [{ w: 1, h: 1 }, { w: 2, h: 1 }],
    configSchema: z.object({ habitId: z.string().uuid().optional() }) as unknown as z.ZodType<Record<string, unknown>>,
    Component: HabitRing,
    navTarget: 'habits',
  },
  score_gauge: {
    label: 'Nik Score',
    description: 'Current pillar-aggregated score + 7-day delta.',
    icon: 'sparkle', hue: 220,
    defaultSize: { w: 1, h: 1 },
    allowedSizes: [{ w: 1, h: 1 }, { w: 2, h: 1 }, { w: 2, h: 2 }],
    configSchema: noConfig,
    Component: ScoreGauge,
    navTarget: 'score',
  },
  streak_counter: {
    label: 'Streak',
    description: 'Days in a row with at least one habit completed.',
    icon: 'flame', hue: 40,
    defaultSize: { w: 1, h: 1 },
    allowedSizes: [{ w: 1, h: 1 }],
    configSchema: noConfig,
    Component: StreakCounter,
  },
  next_quest: {
    label: 'Next quest',
    description: 'The next pending quest by rank.',
    icon: 'sparkle', hue: 260,
    defaultSize: { w: 1, h: 1 },
    allowedSizes: [{ w: 1, h: 1 }, { w: 2, h: 1 }],
    configSchema: noConfig,
    Component: NextQuest,
    navTarget: 'quests',
  },
  active_quest_progress: {
    label: 'Active quest',
    description: 'Current active quest with progress + XP.',
    icon: 'sword', hue: 30,
    defaultSize: { w: 2, h: 1 },
    allowedSizes: [{ w: 1, h: 1 }, { w: 2, h: 1 }],
    configSchema: noConfig,
    Component: ActiveQuestProgress,
    navTarget: 'quests',
  },
  family_pulse: {
    label: 'Family pulse',
    description: 'Members + online count + avatars.',
    icon: 'family', hue: 150,
    defaultSize: { w: 2, h: 1 },
    allowedSizes: [{ w: 1, h: 1 }, { w: 2, h: 1 }],
    configSchema: noConfig,
    Component: FamilyPulse,
    navTarget: 'circle',
  },
  diary_today: {
    label: 'Diary today',
    description: 'Most recent entry preview.',
    icon: 'book', hue: 320,
    defaultSize: { w: 2, h: 1 },
    allowedSizes: [{ w: 1, h: 1 }, { w: 2, h: 1 }, { w: 2, h: 2 }],
    configSchema: noConfig,
    Component: DiaryToday,
    navTarget: 'diary',
  },
  next_event: {
    label: 'Next event',
    description: 'The next thing on your calendar.',
    icon: 'calendar', hue: 280,
    defaultSize: { w: 2, h: 1 },
    allowedSizes: [{ w: 1, h: 1 }, { w: 2, h: 1 }],
    configSchema: noConfig,
    Component: NextEvent,
    navTarget: 'calendar',
  },
  today_events: {
    label: 'Today\'s events',
    description: 'Count of events scheduled today.',
    icon: 'calendar', hue: 200,
    defaultSize: { w: 1, h: 1 },
    allowedSizes: [{ w: 1, h: 1 }],
    configSchema: noConfig,
    Component: TodayEvents,
    navTarget: 'calendar',
  },
  list_preview: {
    label: 'List preview',
    description: 'Top items from any list (reading, shopping, etc.).',
    icon: 'grid', hue: 280,
    defaultSize: { w: 2, h: 1 },
    allowedSizes: [{ w: 1, h: 1 }, { w: 2, h: 1 }, { w: 2, h: 2 }],
    configSchema: z.object({
      kind: z.string().default('reading'),
      limit: z.number().int().min(1).max(10).default(4),
    }) as unknown as z.ZodType<Record<string, unknown>>,
    Component: ListPreview,
  },
};

export function getWidgetDef(type: WidgetType): WidgetDef | undefined {
  return WIDGET_TYPES[type];
}
