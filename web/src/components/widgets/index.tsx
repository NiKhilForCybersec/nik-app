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
  /** Optional accent shown to the right of the label (e.g. a Chip). */
  accent?: React.ReactNode;
  /** Show a subtle radial glow in the corner. Off by default. */
  glow?: boolean;
}> = ({ hue, icon, label, size, onOpen, children, accent, glow }) => {
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
        background: `linear-gradient(135deg, oklch(0.78 0.16 ${hue} / 0.18), oklch(0.55 0.22 ${hue + 40} / 0.06) 60%, transparent 100%)`,
        borderColor: `oklch(0.78 0.16 ${hue} / 0.30)`,
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', minHeight: 0,
      }}
    >
      {glow && (
        <motion.div
          aria-hidden
          animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.12, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: -16, right: -16, width: 70, height: 70, borderRadius: '50%',
            background: `radial-gradient(circle, oklch(0.78 0.16 ${hue} / 0.25) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <Ic size={13} stroke={`oklch(0.92 0.14 ${hue})`} />
          <span style={{ fontSize: 9, color: `oklch(0.85 0.13 ${hue})`, fontFamily: 'var(--font-mono)', letterSpacing: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {label.toUpperCase()}
          </span>
        </div>
        {accent}
      </div>
      <div style={{ flex: 1, minHeight: 0, position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.div>
  );
};

// Helper: large gradient number used by score / streak / hydration heroes.
const HeroNumber: React.FC<{ value: number | string; hue: number; size: WidgetSize; gradient?: [number, number] }> = ({ value, hue, size, gradient }) => {
  const fontSize = size.w === 2 && size.h === 2 ? 60 : size.w === 2 ? 42 : 30;
  const [from, to] = gradient ?? [hue, (hue + 40) % 360];
  return (
    <div
      className="display"
      style={{
        fontSize, fontWeight: 600, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        background: `linear-gradient(135deg, oklch(0.94 0.16 ${from}), oklch(0.7 0.22 ${to}))`,
        WebkitBackgroundClip: 'text', color: 'transparent',
      }}
    >
      {value}
    </div>
  );
};

// Helper: animated progress bar with shimmer.
const ProgressBar: React.FC<{ pct: number; hue: number; height?: number }> = ({ pct, hue, height = 4 }) => {
  return (
    <div style={{ marginTop: 10, height, borderRadius: 99, background: `oklch(0.30 0.04 ${hue} / 0.30)`, overflow: 'hidden', position: 'relative' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, pct * 100))}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ height: '100%', background: `linear-gradient(90deg, oklch(0.78 0.16 ${hue}), oklch(0.65 0.22 ${(hue + 40) % 360}))` }}
      />
    </div>
  );
};

// ── Individual widget components ───────────────────────────

const HydrationToday: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const { data } = useOp(hydrationOps.today, {});
  const total = data?.totalMl ?? 0;
  const goal = data?.goalMl ?? 2000;
  const pct = total / goal;
  const hue = 200;
  return (
    <WidgetShell hue={hue} icon="water" label="Hydration today" size={size} onOpen={onOpen} glow
      accent={<Chip tone="accent" size="sm">{Math.round(Math.min(1, pct) * 100)}%</Chip>}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <HeroNumber value={total} hue={hue} size={size} gradient={[180, 240]} />
        <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>/ {goal} ml</div>
      </div>
      <ProgressBar pct={pct} hue={hue} />
    </WidgetShell>
  );
};

const SleepLastNight: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const { data: nights = [] } = useOp(sleepOps.recent, { limit: 1 });
  const last = nights[0];
  const hours = last?.duration_min ? (last.duration_min / 60).toFixed(1) : '—';
  const score = last?.score ?? null;
  return (
    <WidgetShell hue={260} icon="moon" label="Last night" size={size} onOpen={onOpen}
      accent={score != null ? <Chip tone="default" size="sm">{score}</Chip> : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <HeroNumber value={hours} hue={260} size={size} gradient={[240, 280]} />
        <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>hrs</div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 6, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
        {last ? 'SLEEP TIME' : 'NO DATA · LOG NIGHT →'}
      </div>
    </WidgetShell>
  );
};

const ScoreGauge: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const { data } = useOp(scoreOps.get, {});
  const total = data?.total ?? 0;
  const delta = data?.delta_7d ?? 0;
  const pillarPcts = data?.pillars
    ? [
        (data.pillars.focus?.value ?? 0)  / (data.pillars.focus?.max ?? 1),
        (data.pillars.health?.value ?? 0) / (data.pillars.health?.max ?? 1),
        (data.pillars.mind?.value ?? 0)   / (data.pillars.mind?.max ?? 1),
        (data.pillars.family?.value ?? 0) / (data.pillars.family?.max ?? 1),
      ]
    : [0, 0, 0, 0];
  const pillarHues = [220, 25, 280, 150];
  const deltaColor = delta > 0 ? 'oklch(0.78 0.18 145)' : delta < 0 ? 'oklch(0.78 0.18 25)' : 'var(--fg-3)';
  const deltaText = delta === 0 ? '—' : `${delta > 0 ? '+' : ''}${delta}`;
  return (
    <WidgetShell hue={220} icon="sparkle" label="Nik Score" size={size} onOpen={onOpen} glow
      accent={<span style={{ fontSize: 10, color: deltaColor, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>{deltaText}</span>}
    >
      <HeroNumber value={total} hue={220} size={size} gradient={[200, 280]} />
      <div style={{ display: 'flex', gap: 3, marginTop: 10 }}>
        {pillarPcts.map((p, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: 'oklch(1 0 0 / 0.06)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, p * 100)}%` }}
              transition={{ duration: 0.7, delay: 0.2 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              style={{ height: '100%', background: `oklch(0.85 0.16 ${pillarHues[i]})` }}
            />
          </div>
        ))}
      </div>
      <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 6, letterSpacing: 1 }}>
        FOCUS · HEALTH · MIND · FAMILY
      </div>
    </WidgetShell>
  );
};

const StreakCounter: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const { data } = useOp(profileOps.get, {});
  const streak = data?.streak ?? 0;
  return (
    <WidgetShell hue={40} icon="flame" label="Streak" size={size} onOpen={onOpen}
      accent={<Chip tone="warn" size="sm">{streak === 0 ? 'NEW' : streak === 1 ? 'D 1' : `D ${streak}`}</Chip>}
    >
      <motion.div
        animate={{ rotate: [0, -4, 4, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3 }}
        style={{ position: 'absolute', top: 38, right: 12, opacity: 0.18 }}
      >
        <I.flame size={48} stroke="oklch(0.85 0.18 40)" />
      </motion.div>
      <HeroNumber value={streak} hue={40} size={size} gradient={[60, 20]} />
      <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
        {streak === 1 ? 'day · personal best' : 'days · personal best'}
      </div>
    </WidgetShell>
  );
};

const NextEvent: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const { data: evts = [] } = useOp(eventsOps.list, { limit: 1 });
  const e = evts[0];
  const hue = 280;
  const when = e?.occurs_at ? new Date(e.occurs_at) : null;
  return (
    <WidgetShell hue={hue} icon="calendar" label={`Next · ${(e?.kind ?? 'event').replace(/_/g, ' ')}`} size={size} onOpen={onOpen}
      accent={when ? <Chip tone="accent" size="sm">{when.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }).toUpperCase()}</Chip> : undefined}
    >
      {e ? (
        <>
          <div className="display" style={{ fontSize: size.w === 2 ? 17 : 14, fontWeight: 500, color: 'var(--fg-1)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
            {e.title}
          </div>
          {e.body && (
            <div style={{ fontSize: 11, color: 'var(--fg-2)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {e.body}
            </div>
          )}
          {e.location && (
            <div style={{ marginTop: 6, fontSize: 10, color: `oklch(0.85 0.16 ${hue})`, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
              📍 {e.location.toUpperCase()}
            </div>
          )}
        </>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 4, lineHeight: 1.4 }}>
          Nothing scheduled. <span style={{ color: `oklch(0.85 0.16 ${hue})` }}>Add an event →</span>
        </div>
      )}
    </WidgetShell>
  );
};

const FamilyPulse: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const { data: members = [] } = useOp(circleOps.list, {});
  const online = members.filter((m) => m.status === 'online').length;
  const hue = 150;
  return (
    <WidgetShell hue={hue} icon="family" label="Family circle" size={size} onOpen={onOpen}
      accent={online > 0 ? <Chip tone="ok" size="sm">{online} ONLINE</Chip> : undefined}
    >
      {members.length > 0 ? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
            <HeroNumber value={members.length} hue={hue} size={size} gradient={[140, 170]} />
            <span style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
              {members.length === 1 ? 'member' : 'members'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: -6, marginTop: 4 }}>
            {members.slice(0, 6).map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
                style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: `linear-gradient(135deg, oklch(0.85 0.18 ${m.hue}), oklch(0.55 0.22 ${m.hue + 30}))`,
                  border: '1.5px solid var(--bg)',
                  fontSize: 11, fontWeight: 600, color: '#06060a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginLeft: i === 0 ? 0 : -6,
                  position: 'relative',
                  boxShadow: m.status === 'online' ? `0 0 0 2px oklch(0.78 0.18 145)` : undefined,
                }}
              >
                {m.name.charAt(0).toUpperCase()}
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 4, lineHeight: 1.4 }}>
          Just you so far. <span style={{ color: `oklch(0.85 0.16 ${hue})` }}>Invite family →</span>
        </div>
      )}
    </WidgetShell>
  );
};

const DiaryToday: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const { data: entries = [] } = useOp(diaryOps.list, { limit: 1 });
  const e = entries[0];
  const hue = 320;
  const moodEmoji = e?.mood === 5 ? '🌟' : e?.mood === 4 ? '☺' : e?.mood === 3 ? '·' : e?.mood === 2 ? '↘' : e?.mood === 1 ? '⛅' : '·';
  return (
    <WidgetShell hue={hue} icon="book" label={e ? 'Diary · today' : 'Diary · new'} size={size} onOpen={onOpen}
      accent={e?.mood ? <span style={{ fontSize: 14, opacity: 0.8 }}>{moodEmoji}</span> : undefined}
    >
      {e ? (
        <>
          <div className="display" style={{ fontSize: size.w === 2 ? 16 : 13, fontWeight: 500, color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
            {e.title || 'Untitled'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-2)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: size.h === 2 ? 5 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {e.body}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="display" style={{ fontSize: size.w === 2 ? 16 : 13, fontWeight: 500, color: 'var(--fg-1)' }}>
            Write your first entry
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', lineHeight: 1.4 }}>
            Tap to capture a quick reflection.
          </div>
          <div style={{ marginTop: 4, fontSize: 10, color: `oklch(0.85 0.16 ${hue})`, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
            ● NEW →
          </div>
        </div>
      )}
    </WidgetShell>
  );
};

const ActiveQuestProgress: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const { data: list = [] } = useOp(questsOps.list, { status: 'active', limit: 1 });
  const q = list[0];
  const hue = 30;
  return (
    <WidgetShell hue={hue} icon="sword" label="Active quest" size={size} onOpen={onOpen}
      accent={q ? <Chip tone="accent" size="sm">{q.rank}</Chip> : undefined}
    >
      {q ? (
        <>
          <div className="display" style={{ fontSize: size.w === 2 ? 18 : 14, fontWeight: 500, color: 'var(--fg-1)', lineHeight: 1.2, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {q.title}
          </div>
          {q.progress != null && <ProgressBar pct={q.progress as number} hue={hue} />}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
              {q.progress != null ? `${Math.round((q.progress as number) * 100)}% DONE` : 'IN PROGRESS'}
            </span>
            <span style={{ fontSize: 11, color: `oklch(0.85 0.16 ${hue})`, fontFamily: 'var(--font-mono)' }}>
              +{q.xp} XP
            </span>
          </div>
        </>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 4 }}>
          No active quest. <span style={{ color: `oklch(0.85 0.16 ${hue})` }}>Start one →</span>
        </div>
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
      <HeroNumber value={today.length} hue={200} size={size} gradient={[180, 220]} />
      <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>
        {today.length === 0 ? 'no events' : today.length === 1 ? 'event' : 'events'}
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

const HabitsToday: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const { data: habits = [] } = useOp(habitsOps.list, {});
  const done = habits.filter((h) => h.done >= h.target).length;
  const total = habits.length;
  const closest = habits
    .filter((h) => h.done < h.target && h.target > 0)
    .map((h) => ({ h, pct: h.done / h.target }))
    .sort((a, b) => b.pct - a.pct)[0]?.h;
  const hue = 150;
  return (
    <WidgetShell hue={hue} icon="check" label="Today's rituals" size={size} onOpen={onOpen}
      accent={total > 0 && done === total ? <Chip tone="ok" size="sm">ALL DONE</Chip> : <Chip tone="default" size="sm">{done}/{total}</Chip>}
    >
      {closest ? (
        <>
          <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 4 }}>
            CLOSEST · TAP TO COMPLETE
          </div>
          <div className="display" style={{ fontSize: size.w === 2 ? 18 : 14, fontWeight: 500, color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {closest.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
            <span className="display" style={{ fontSize: size.w === 2 ? 24 : 18, fontWeight: 600, color: `oklch(0.92 0.14 ${closest.hue})`, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {closest.done}
            </span>
            <span style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>/ {closest.target} {closest.unit}</span>
          </div>
          <ProgressBar pct={closest.done / closest.target} hue={closest.hue} height={4} />
        </>
      ) : total > 0 && done === total ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <HeroNumber value={done} hue={hue} size={size} gradient={[140, 170]} />
          <div style={{ fontSize: 11, color: `oklch(0.85 0.16 ${hue})`, marginTop: 2 }}>
            All rituals done — nice.
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 4, lineHeight: 1.4 }}>
          No rituals yet. <span style={{ color: `oklch(0.85 0.16 ${hue})` }}>Add one →</span>
        </div>
      )}
    </WidgetShell>
  );
};

const FocusStarter: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  return (
    <WidgetShell hue={140} icon="brain" label="Focus" size={size} onOpen={onOpen} glow>
      <div className="display" style={{ fontSize: size.w === 2 ? 22 : 16, fontWeight: 500, color: 'var(--fg-1)', lineHeight: 1.1 }}>
        Begin a session
      </div>
      <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 4, lineHeight: 1.4 }}>
        Pick a length when you start
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 11, color: 'oklch(0.85 0.16 140)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.78 0.18 140)' }}
        /> START →
      </div>
    </WidgetShell>
  );
};

const VitalsStrip: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  // Honest empty until HealthKit lands. The static Home block had
  // sine-wave animations + seeded numbers — both lying. We show "—"
  // and a tag so the user knows why.
  return (
    <WidgetShell hue={20} icon="flame" label="Vitals" size={size} onOpen={onOpen}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
        <div>
          <div style={{ color: 'var(--fg-3)', letterSpacing: 1 }}>STEPS</div>
          <div className="display" style={{ fontSize: 18, fontWeight: 500, color: 'var(--fg-2)' }}>—</div>
          <div style={{ color: 'var(--fg-3)' }}>/ 8k</div>
        </div>
        <div>
          <div style={{ color: 'var(--fg-3)', letterSpacing: 1 }}>HEART</div>
          <div className="display" style={{ fontSize: 18, fontWeight: 500, color: 'var(--fg-2)' }}>—</div>
          <div style={{ color: 'var(--fg-3)' }}>BPM</div>
        </div>
        <div>
          <div style={{ color: 'var(--fg-3)', letterSpacing: 1 }}>KCAL</div>
          <div className="display" style={{ fontSize: 18, fontWeight: 500, color: 'var(--fg-2)' }}>—</div>
          <div style={{ color: 'var(--fg-3)' }}>/ 2.2k</div>
        </div>
      </div>
      <div style={{ marginTop: 6, fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
        NO HEALTHKIT YET
      </div>
    </WidgetShell>
  );
};

// ── Registry ───────────────────────────────────────────────

const noConfig = z.object({}).strict() as unknown as z.ZodType<Record<string, unknown>>;

// Every widget supports every size on the 2-col grid by default.
// `allowedSizes` is kept for any future widget that genuinely cannot
// render at a given size; default opens everything so users + the AI
// aren't artificially boxed in. See docs/Policy.md → "Widget grid".
const ALL_SIZES: WidgetSize[] = [
  { w: 1, h: 1 },
  { w: 2, h: 1 },
  { w: 1, h: 2 },
  { w: 2, h: 2 },
];

export const WIDGET_TYPES: Record<WidgetType, WidgetDef<any>> = {
  hydration_today: {
    label: 'Hydration today',
    description: 'Today\'s ml + goal + progress bar.',
    icon: 'water', hue: 200,
    defaultSize: { w: 1, h: 1 },
    allowedSizes: ALL_SIZES,
    configSchema: noConfig,
    Component: HydrationToday,
    navTarget: 'hydration',
  },
  sleep_last_night: {
    label: 'Sleep last night',
    description: 'Hours slept + score.',
    icon: 'moon', hue: 260,
    defaultSize: { w: 1, h: 1 },
    allowedSizes: ALL_SIZES,
    configSchema: noConfig,
    Component: SleepLastNight,
    navTarget: 'sleep',
  },
  habit_ring: {
    label: 'Habit ring',
    description: 'A specific habit\'s progress (configurable).',
    icon: 'check', hue: 150,
    defaultSize: { w: 1, h: 1 },
    allowedSizes: ALL_SIZES,
    configSchema: z.object({ habitId: z.string().uuid().optional() }) as unknown as z.ZodType<Record<string, unknown>>,
    Component: HabitRing,
    navTarget: 'habits',
  },
  score_gauge: {
    label: 'Nik Score',
    description: 'Current pillar-aggregated score + 7-day delta.',
    icon: 'sparkle', hue: 220,
    defaultSize: { w: 1, h: 1 },
    allowedSizes: ALL_SIZES,
    configSchema: noConfig,
    Component: ScoreGauge,
    navTarget: 'score',
  },
  streak_counter: {
    label: 'Streak',
    description: 'Days in a row with at least one habit completed.',
    icon: 'flame', hue: 40,
    defaultSize: { w: 1, h: 1 },
    allowedSizes: ALL_SIZES,
    configSchema: noConfig,
    Component: StreakCounter,
  },
  next_quest: {
    label: 'Next quest',
    description: 'The next pending quest by rank.',
    icon: 'sparkle', hue: 260,
    defaultSize: { w: 1, h: 1 },
    allowedSizes: ALL_SIZES,
    configSchema: noConfig,
    Component: NextQuest,
    navTarget: 'quests',
  },
  active_quest_progress: {
    label: 'Active quest',
    description: 'Current active quest with progress + XP.',
    icon: 'sword', hue: 30,
    defaultSize: { w: 2, h: 1 },
    allowedSizes: ALL_SIZES,
    configSchema: noConfig,
    Component: ActiveQuestProgress,
    navTarget: 'quests',
  },
  family_pulse: {
    label: 'Family pulse',
    description: 'Members + online count + avatars.',
    icon: 'family', hue: 150,
    defaultSize: { w: 2, h: 1 },
    allowedSizes: ALL_SIZES,
    configSchema: noConfig,
    Component: FamilyPulse,
    navTarget: 'circle',
  },
  diary_today: {
    label: 'Diary today',
    description: 'Most recent entry preview.',
    icon: 'book', hue: 320,
    defaultSize: { w: 2, h: 1 },
    allowedSizes: ALL_SIZES,
    configSchema: noConfig,
    Component: DiaryToday,
    navTarget: 'diary',
  },
  next_event: {
    label: 'Next event',
    description: 'The next thing on your calendar.',
    icon: 'calendar', hue: 280,
    defaultSize: { w: 2, h: 1 },
    allowedSizes: ALL_SIZES,
    configSchema: noConfig,
    Component: NextEvent,
    navTarget: 'calendar',
  },
  today_events: {
    label: 'Today\'s events',
    description: 'Count of events scheduled today.',
    icon: 'calendar', hue: 200,
    defaultSize: { w: 1, h: 1 },
    allowedSizes: ALL_SIZES,
    configSchema: noConfig,
    Component: TodayEvents,
    navTarget: 'calendar',
  },
  habits_today: {
    label: "Today's rituals",
    description: 'Habits done · closest to complete · progress.',
    icon: 'check', hue: 150,
    defaultSize: { w: 2, h: 1 },
    allowedSizes: ALL_SIZES,
    configSchema: noConfig,
    Component: HabitsToday,
    navTarget: 'habits',
  },
  focus_starter: {
    label: 'Focus session',
    description: 'Begin a deep-work block.',
    icon: 'brain', hue: 220,
    defaultSize: { w: 2, h: 1 },
    allowedSizes: ALL_SIZES,
    configSchema: noConfig,
    Component: FocusStarter,
    navTarget: 'focus',
  },
  vitals_strip: {
    label: 'Vitals',
    description: 'Steps · heart · kcal (HealthKit when available).',
    icon: 'flame', hue: 20,
    defaultSize: { w: 2, h: 1 },
    allowedSizes: ALL_SIZES,
    configSchema: noConfig,
    Component: VitalsStrip,
    navTarget: 'fitness',
  },
  list_preview: {
    label: 'List preview',
    description: 'Top items from any list (reading, shopping, etc.).',
    icon: 'grid', hue: 280,
    defaultSize: { w: 2, h: 1 },
    allowedSizes: ALL_SIZES,
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
