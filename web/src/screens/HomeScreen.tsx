/* Nik — Home / dashboard screen (bento widgets, motion-first) */
import React from 'react';
import { motion, useMotionValue, useTransform, useReducedMotion, animate, useSpring } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { ScreenProps } from '../App';
import { getThemeVocab } from '../theme/themes';
import { I } from '../components/icons';
import { XPBar, Avatar, Chip, VoiceOrb, HUDCorner } from '../components/primitives';
import { useOp, useOpMutation } from '../lib/useOp';
import { useAuth } from '../lib/auth';
import { profile as profileOps } from '../contracts/profile';
import { habits as habitsOps } from '../contracts/habits';
import { quests as questsOps } from '../contracts/quests';
import { score as scoreOps } from '../contracts/score';
import { hydration as hydrationOps } from '../contracts/hydration';
import { circle as circleOps } from '../contracts/circle';
import { diary as diaryOps } from '../contracts/diary';
import { events as eventsOps } from '../contracts/events';
import { widgets as widgetsOps } from '../contracts/widgets';
import { WIDGET_TYPES, type WidgetUnit } from '../components/widgets';
import type { WidgetType } from '../contracts/widgets';
import type { ScreenId } from '../types/app-state';

// Map habit-name keywords to dedicated detail screens. When a habit
// has its own dashboard (Hydration, Sleep, Fitness, Reading), tapping
// the Home tile should land there instead of the generic Habits list.
// Keywords are matched case-insensitively against the habit name.
const HABIT_NAME_TO_SCREEN: { match: RegExp; screen: ScreenId }[] = [
  { match: /hydrat|water/i, screen: 'hydration' },
  { match: /sleep/i,        screen: 'sleep' },
  { match: /train|gym|workout|fitness|run|cycle/i, screen: 'fitness' },
  { match: /read|book/i,    screen: 'reading' },
  { match: /meditat/i,      screen: 'focus' },
  { match: /diary|journal|reflect/i, screen: 'diary' },
];

/** mood (1-5) → small emoji glyph for the diary tile. */
function moodEmoji(mood: number | null | undefined): string {
  if (mood == null) return '·';
  if (mood >= 5) return '☀';
  if (mood >= 4) return '◐';
  if (mood >= 3) return '○';
  if (mood >= 2) return '◑';
  return '●';
}

/** "2h ago" / "yesterday" / "Mar 12" relative time string. */
function relTime(iso: string): string {
  const d = new Date(iso);
  const ms = Date.now() - d.getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function habitTargetScreen(name: string): ScreenId {
  for (const { match, screen } of HABIT_NAME_TO_SCREEN) {
    if (match.test(name)) return screen;
  }
  return 'habits';
}

/** Returns a small extra-info string for habits that have a dedicated
 *  dashboard with richer per-day data. Today: hydration only. Add more
 *  here as Sleep / Fitness / Reading earn their own per-day metrics. */
function hydrateExtra(name: string, today: { totalMl: number; goalMl: number } | undefined): string | undefined {
  if (/hydrat|water/i.test(name) && today) {
    return `${today.totalMl} / ${today.goalMl} ml today`;
  }
  return undefined;
}


// Cubic-bezier ease — typed as a fixed-length tuple so framer-motion's
// `Easing` type accepts it (otherwise it widens to `number[]`).
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

// ── Animated number counter (count up from 0 → target) ───────
type CounterProps = {
  to: number;
  duration?: number;
  decimals?: number;
  format?: (n: number) => string;
  reduce?: boolean;
};
const Counter: React.FC<CounterProps> = ({ to, duration = 0.9, decimals = 0, format, reduce }) => {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => {
    const n = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString();
    return format ? format(decimals > 0 ? parseFloat(n) : Math.round(v)) : n;
  });
  React.useEffect(() => {
    if (reduce) {
      mv.set(to);
      return;
    }
    const controls = animate(mv, to, { duration, ease: EASE_OUT });
    return () => controls.stop();
  }, [to, duration, reduce, mv]);
  return <motion.span>{text}</motion.span>;
};

// ── Smooth live ticker (interpolates to new value) ───────────
const SmoothNumber: React.FC<{ value: number; format?: (n: number) => string; reduce?: boolean }> = ({ value, format, reduce }) => {
  const mv = useSpring(value, { stiffness: 80, damping: 20, mass: 0.8 });
  const out = useTransform(mv, (v) => (format ? format(Math.round(v)) : Math.round(v).toString()));
  React.useEffect(() => {
    if (reduce) mv.jump(value);
    else mv.set(value);
  }, [value, reduce, mv]);
  return <motion.span>{out}</motion.span>;
};

// ── Variants for stagger entrance ─────────────────────────────
const containerV: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const itemV: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
};

// Word-by-word reveal for greeting
const wordContainer: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const wordItem: Variants = {
  hidden: { opacity: 0, y: 12, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: EASE_OUT } },
};

export default function HomeScreen({ onNav, onVoice, intensity = 'medium', themeId }: ScreenProps) {
  const { data: profile } = useOp(profileOps.get, {});
  const { data: habitsList = [] } = useOp(habitsOps.list, {});
  const { data: activeQuests = [] } = useOp(questsOps.list, { status: 'active', limit: 5 });
  const { data: score } = useOp(scoreOps.get, {});
  const { data: hydrationToday } = useOp(hydrationOps.today, {});
  const { data: circleMembers = [] } = useOp(circleOps.list, {});
  const { data: diaryEntries = [] } = useOp(diaryOps.list, { limit: 1 });
  const { data: upcomingEvents = [] } = useOp(eventsOps.list, { limit: 5 });

  const u = {
    name: (profile?.name?.trim() || 'Friend'),
    title: profile?.title ?? 'Operative II',
    level: profile?.level ?? 1,
    xp: profile?.xp ?? 0,
    xpMax: profile?.xp_max ?? 1000,
    streak: profile?.streak ?? 0,
    stats: profile?.stats ?? { STR: 10, INT: 10, DEX: 10, VIT: 10, FOC: 10 },
  };

  const vocab = getThemeVocab(themeId ?? '');
  const reduce = !!useReducedMotion();
  const V = {
    greet: vocab.greet,
    hud_label: vocab.hudLabel,
    user_title: u.title || vocab.userTitle,
    level_word: vocab.levelWord,
    quest: vocab.quest,
    emergent: vocab.emergent,
  };

  // Header date/weather — date is real, weather is a placeholder until
  // the weather integration lands.
  const today = React.useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  }, []);
  const weather = '—';

  // The animated EKG sparkline below uses `tick` as a time source so
  // the line animates even when there's no real data — it's a visual
  // indicator that the panel WOULD be live once HealthKit ingests.
  // The numbers themselves are NO LONGER fake — see vitals tile.
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1200);
    return () => clearInterval(id);
  }, []);

  // Pick the highlight habit (closest to complete but not done, else most-streaked)
  const highlight = React.useMemo(() => {
    if (!habitsList.length) return undefined;
    const open = habitsList.filter((h) => h.done < h.target);
    if (open.length) {
      return open.slice().sort((a, b) => (b.done / b.target) - (a.done / a.target))[0];
    }
    return habitsList.slice().sort((a, b) => b.streak - a.streak)[0];
  }, [habitsList]);
  const restHabits = habitsList.filter((h) => h.id !== highlight?.id);
  const doneCount = habitsList.filter((h) => h.done >= h.target).length;

  const greetWords = `${V.greet} ${u.name}`.trim().split(/\s+/);
  const featuredQuest = activeQuests[0];

  return (
    <motion.div
      variants={containerV}
      initial="hidden"
      animate="show"
      style={{ padding: '8px 16px 100px', color: 'var(--fg)' }}
    >
      {/* Greeting + live location */}
      <motion.div variants={itemV} style={{ paddingTop: 8, marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.78 0.15 150)', boxShadow: '0 0 6px oklch(0.78 0.15 150)' }}
          />
          {today.toUpperCase()} · {weather}
        </div>
        <motion.div
          className="display"
          variants={reduce ? undefined : wordContainer}
          initial={reduce ? false : 'hidden'}
          animate={reduce ? undefined : 'show'}
          style={{ fontSize: 30, fontWeight: 400, lineHeight: 1.15, letterSpacing: -0.5, display: 'flex', flexWrap: 'wrap', gap: '0 0.32em' }}
        >
          {greetWords.map((w, i) => {
            const isName = i === greetWords.length - 1 && greetWords.length > 1;
            return (
              <motion.span
                key={i + w}
                variants={reduce ? undefined : wordItem}
                style={isName ? {
                  fontWeight: 600,
                  background: 'linear-gradient(90deg, oklch(0.9 0.12 var(--hue)), oklch(0.75 0.18 calc(var(--hue) + 60)))',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                } : undefined}
              >
                {w}
              </motion.span>
            );
          })}
        </motion.div>
      </motion.div>

      {/* HUD card — level & stats */}
      {intensity !== ('light' as any) && (
        <motion.div
          variants={itemV}
          whileHover={reduce ? undefined : { scale: 1.005 }}
          whileTap={reduce ? undefined : { scale: 0.99 }}
          className="glass scanlines"
          style={{ padding: 16, marginBottom: 22, position: 'relative', overflow: 'hidden' }}
        >
          <HUDCorner position="tl" /><HUDCorner position="tr" />
          <HUDCorner position="bl" /><HUDCorner position="br" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', letterSpacing: 1.5 }}>{V.hud_label}</div>
              <div className="display" style={{ fontSize: 18, fontWeight: 600 }}>{V.user_title}</div>
            </div>
            <motion.div
              initial={reduce ? false : { scale: 0.6, opacity: 0, rotate: -10 }}
              animate={reduce ? undefined : { scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.25, type: 'spring', stiffness: 220, damping: 18 }}
              style={{
                width: 56, height: 56, borderRadius: 14,
                background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 80)))',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: '#06060a', fontFamily: 'var(--font-display)',
                boxShadow: '0 0 20px oklch(0.78 0.16 var(--hue) / 0.5), inset 0 1px 0 oklch(1 0 0 / 0.3)',
              }}
            >
              <div style={{ fontSize: 9, opacity: 0.6, letterSpacing: 1 }}>{V.level_word}</div>
              <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                <Counter to={u.level} reduce={reduce} duration={0.7} />
              </div>
            </motion.div>
          </div>
          <XPBar cur={u.xp} max={u.xpMax} level={u.level} compact />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
            {Object.entries(u.stats).map(([k, v]) => (
              <div key={k} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ color: 'var(--fg-3)', letterSpacing: 1 }}>{k}</div>
                <div style={{ color: 'oklch(0.9 0.1 var(--hue))', fontSize: 13, fontWeight: 600, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                  <Counter to={Number(v)} reduce={reduce} duration={0.65} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* DYNAMIC WIDGET CANVAS — driven by home_widgets table.
          Renders the user's chosen widgets in their chosen order/size.
          On first visit (empty list) we auto-seed defaults so Home is
          never blank. Configurable via WidgetsScreen (Phase 2). */}
      <DynamicWidgetCanvas onNav={onNav} />
      {/* Ask Nik prompt */}
      <motion.div
        variants={itemV}
        onClick={() => onNav('chat')}
        whileHover={reduce ? undefined : { scale: 1.01 }}
        whileTap={reduce ? undefined : { scale: 0.98 }}
        className="glass tap"
        style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}
      >
        <VoiceOrb size={40} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: 'var(--fg)' }}>Ask Nik anything…</div>
          <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>TAP · OR SAY "HEY NIK"</div>
        </div>
        <motion.div
          onClick={(e) => { e.stopPropagation(); onVoice(); }}
          whileTap={reduce ? undefined : { scale: 0.9 }}
          whileHover={reduce ? undefined : { scale: 1.05 }}
          className="tap"
          style={{
            width: 36, height: 36, borderRadius: 12,
            background: 'oklch(0.78 0.16 var(--hue) / 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid oklch(0.78 0.16 var(--hue) / 0.4)',
          }}
        >
          <I.mic size={16} stroke="oklch(0.9 0.14 var(--hue))" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ── Highlight habit (the pinned, larger tile) ────────────────
const HighlightHabit: React.FC<{ habit: any; onTap: () => void; reduce: boolean; extra?: string }> = ({ habit, onTap, reduce, extra }) => {
  const HI = I[habit.icon] || I.target;
  const pct = Math.min(1, habit.done / habit.target);
  return (
    <motion.div
      variants={itemV}
      onClick={onTap}
      whileHover={reduce ? undefined : { scale: 1.01 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      className="glass tap"
      style={{
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, oklch(0.78 0.16 ${habit.hue} / 0.22), oklch(0.55 0.22 ${habit.hue + 60} / 0.10))`,
        borderColor: `oklch(0.78 0.16 ${habit.hue} / 0.4)`,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <motion.div
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        animate={reduce ? undefined : { scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 20 }}
        style={{ position: 'relative', flexShrink: 0 }}
      >
        <AnimatedRing size={72} pct={pct} sw={5} hue={habit.hue} reduce={reduce} delay={0.2} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HI size={26} stroke={`oklch(0.92 0.14 ${habit.hue})`} />
        </div>
      </motion.div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 2 }}>
          PINNED · CLOSEST TO COMPLETE
        </div>
        <div className="display" style={{ fontSize: 18, fontWeight: 500, color: 'var(--fg)', lineHeight: 1.15 }}>
          {habit.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
          <b style={{ color: `oklch(0.92 0.14 ${habit.hue})` }}>{habit.done}</b>
          <span style={{ color: 'var(--fg-3)' }}> / {habit.target} {habit.unit}</span>
        </div>
        {extra && (
          <div style={{ fontSize: 11, color: `oklch(0.92 0.14 ${habit.hue})`, fontFamily: 'var(--font-mono)', letterSpacing: 0.5, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
            {extra}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          <Chip tone="warn" size="sm">{habit.streak}d STREAK</Chip>
          {habit.source && (
            <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>
              {habit.source}
            </div>
          )}
          {!habit.source && (
            <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>
              Manual
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ── Smaller habit tile ───────────────────────────────────────
const HabitMiniTile: React.FC<{ habit: any; onTap: () => void; reduce: boolean }> = ({ habit, onTap, reduce }) => {
  const HI = I[habit.icon] || I.target;
  const pct = Math.min(1, habit.done / habit.target);
  const done = habit.done >= habit.target;
  return (
    <motion.div
      variants={itemV}
      onClick={onTap}
      whileHover={reduce ? undefined : { scale: 1.02 }}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      className="glass tap"
      style={{
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: `linear-gradient(135deg, oklch(0.78 0.16 ${habit.hue} / 0.08), transparent 70%)`,
        borderColor: `oklch(0.78 0.16 ${habit.hue} / 0.18)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative' }}>
          <AnimatedRing size={42} pct={pct} sw={3} hue={habit.hue} reduce={reduce} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HI size={16} stroke={`oklch(0.9 0.14 ${habit.hue})`} />
          </div>
        </div>
        {done && <Chip tone="ok" size="sm">DONE</Chip>}
        {!done && habit.auto && <Chip tone="accent" size="sm">AUTO</Chip>}
      </div>
      <div>
        <div className="display" style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)', lineHeight: 1.2 }}>
          {habit.name}
        </div>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
          {habit.done.toLocaleString()} / {habit.target.toLocaleString()} {habit.unit}
        </div>
        {habit.source && (
          <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2, letterSpacing: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {habit.source}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ── Animated ring (animates dashoffset on mount) ─────────────
type AnimatedRingProps = {
  size: number;
  pct: number;
  sw?: number;
  hue: number;
  reduce?: boolean;
  delay?: number;
};
export const AnimatedRing: React.FC<AnimatedRingProps> = ({ size, pct, sw = 4, hue, reduce, delay = 0 }) => {
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const target = c * (1 - Math.max(0, Math.min(1, pct)));
  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`ringDyn-${hue}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={`oklch(0.85 0.16 ${hue})`} />
          <stop offset="100%" stopColor={`oklch(0.65 0.20 ${hue + 60})`} />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={sw} fill="none" className="ring-track" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} strokeWidth={sw} fill="none"
        stroke={`url(#ringDyn-${hue})`}
        strokeDasharray={c}
        strokeLinecap="round"
        initial={reduce ? false : { strokeDashoffset: c }}
        animate={{ strokeDashoffset: reduce ? target : target }}
        transition={{ duration: reduce ? 0 : 0.7, ease: EASE_OUT, delay }}
        style={{
          transform: 'rotate(-90deg)', transformOrigin: 'center',
          filter: `drop-shadow(0 0 4px oklch(0.78 0.16 ${hue} / 0.6))`,
        }}
      />
    </svg>
  );
};

type LiveStatProps = {
  label: string;
  value: React.ReactNode;
  unit?: string;
  target?: string;
  hue?: number;
  pulse?: boolean;
};

export const LiveStat: React.FC<LiveStatProps> = ({ label, value, unit, target, hue = 220, pulse }) => (
  <div style={{ padding: '8px 10px', borderRadius: 10, background: `oklch(0.78 0.16 ${hue} / 0.08)`, border: `1px solid oklch(0.78 0.16 ${hue} / 0.2)` }}>
    <div style={{ fontSize: 8, color: 'var(--fg-3)', letterSpacing: 1, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
      <motion.div
        className="display"
        animate={pulse ? { opacity: [1, 0.65, 1] } : undefined}
        transition={pulse ? { duration: 1.2, repeat: Infinity } : undefined}
        style={{ fontSize: 17, fontWeight: 600, color: `oklch(0.9 0.14 ${hue})`, fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </motion.div>
      {unit && <div style={{ fontSize: 8, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{unit}</div>}
    </div>
    {target && <div style={{ fontSize: 8, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>/ {target}</div>}
  </div>
);

// ── Dynamic widget canvas ──────────────────────────────────
//
// Reads home_widgets via useOp; if empty on first load, auto-resets
// to the default starter set so Home is never blank for new users.
// Each row is one row in the DB; reorder / resize / config-edit live
// in WidgetsScreen (Phase 2).

const DynamicWidgetCanvas: React.FC<{ onNav: (s: ScreenId) => void }> = ({ onNav }) => {
  const { userId } = useAuth();
  const { data: widgets = [], isLoading, isFetched } = useOp(widgetsOps.list, {});
  const reset = useOpMutation(widgetsOps.reset);
  const [hasReset, setHasReset] = React.useState(false);

  // Auto-seed defaults on first visit. Only after auth is ready AND
  // the query has actually run (isFetched), otherwise we'd flip hasReset
  // before userId arrives and never recover.
  React.useEffect(() => {
    if (userId && isFetched && widgets.length === 0 && !hasReset) {
      setHasReset(true);
      void reset.mutateAsync({});
    }
  }, [userId, isFetched, widgets.length, hasReset, reset]);

  if (isLoading || widgets.length === 0) return null;

  return (
    <section style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)' }}>
            YOUR CANVAS · {widgets.length} WIDGETS
          </div>
          <div className="display" style={{ fontSize: 16, fontWeight: 500, color: 'var(--fg-2)', marginTop: 2 }}>
            Live snapshot.
          </div>
        </div>
        <div onClick={() => onNav('widgets')} className="tap" style={{
          fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          EDIT <I.chevR size={12} stroke="var(--fg-3)" />
        </div>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 8,
        // `dense` packing closes 1×1-shaped holes by pulling later
        // small widgets up — no empty cells in the canvas.
        gridAutoFlow: 'row dense',
        gridAutoRows: 'minmax(110px, auto)',
      }}>
        {widgets.map((w) => {
          const def = WIDGET_TYPES[w.widget_type as WidgetType];
          if (!def) return null;
          const Render = def.Component;
          return (
            <Render
              key={w.id}
              size={{ w: w.w as WidgetUnit, h: w.h as WidgetUnit }}
              config={w.config}
              onOpen={def.navTarget ? () => onNav(def.navTarget as ScreenId) : undefined}
            />
          );
        })}
      </div>
    </section>
  );
};
