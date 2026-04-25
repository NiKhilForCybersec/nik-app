/* Nik — Habits screen (motion-first redesign)
   Big hero ring · per-habit animated cards · confetti on completion · AI suggestions */
import React from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useReducedMotion, animate } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { ScreenProps } from '../App';
import { getThemeVocab } from '../theme/themes';
import { I } from '../components/icons';
import { Chip } from '../components/primitives';
import { useOp, useOpMutation } from '../lib/useOp';
import { habits as habitOps, type Habit as DBHabit } from '../contracts/habits';

// Cubic-bezier ease as a fixed-length tuple (framer-motion's `Easing` type
// rejects plain `number[]`).
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Habit = {
  id: string;
  name: string;
  icon: string;
  hue: number;
  done: number;
  target: number;
  unit: string;
  streak: number;
  auto?: boolean;
  source?: string;
};

// ── Variants ─────────────────────────────────────────────────
const containerV: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};
const itemV: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
};

// ── Animated counter (count up) ──────────────────────────────
const Counter: React.FC<{ to: number; duration?: number; suffix?: string; reduce?: boolean }> = ({ to, duration = 0.9, suffix = '', reduce }) => {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => Math.round(v).toString() + suffix);
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

// ── Animated ring (animates dashoffset) ──────────────────────
const AnimatedRing: React.FC<{ size: number; pct: number; sw?: number; hue: number; reduce?: boolean; pulseKey?: number }> = ({ size, pct, sw = 4, hue, reduce, pulseKey }) => {
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const target = c * (1 - Math.max(0, Math.min(1, pct)));
  return (
    <motion.svg
      width={size}
      height={size}
      style={{ overflow: 'visible' }}
      animate={pulseKey !== undefined && !reduce ? { scale: [1, 1.12, 1] } : undefined}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      key={`svg-${pulseKey}`}
    >
      <defs>
        <linearGradient id={`hringGrad-${hue}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={`oklch(0.85 0.16 ${hue})`} />
          <stop offset="100%" stopColor={`oklch(0.65 0.20 ${hue + 60})`} />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={sw} fill="none" className="ring-track" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} strokeWidth={sw} fill="none"
        stroke={`url(#hringGrad-${hue})`}
        strokeDasharray={c}
        strokeLinecap="round"
        initial={reduce ? false : { strokeDashoffset: c }}
        animate={{ strokeDashoffset: target }}
        transition={{ duration: reduce ? 0 : 0.7, ease: EASE_OUT }}
        style={{
          transform: 'rotate(-90deg)', transformOrigin: 'center',
          filter: `drop-shadow(0 0 4px oklch(0.78 0.16 ${hue} / 0.6))`,
        }}
      />
    </motion.svg>
  );
};

// ── Confetti shimmer overlay (transient) ─────────────────────
const ConfettiBurst: React.FC<{ hue: number }> = ({ hue }) => {
  const pieces = Array.from({ length: 10 });
  return (
    <motion.div
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5, overflow: 'hidden', borderRadius: 'inherit' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
    >
      {/* Sweep / shimmer */}
      <motion.div
        initial={{ x: '-110%' }}
        animate={{ x: '120%' }}
        transition={{ duration: 0.7, ease: EASE_OUT }}
        style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: '60%',
          background: `linear-gradient(90deg, transparent, oklch(0.95 0.18 ${hue} / 0.35), transparent)`,
        }}
      />
      {/* Confetti dots */}
      {pieces.map((_, i) => {
        const angle = (i / pieces.length) * Math.PI * 2;
        const dist = 60 + Math.random() * 20;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        const h = i % 2 === 0 ? hue : (hue + 60) % 360;
        return (
          <motion.span
            key={i}
            initial={{ x: 28, y: 28, opacity: 1, scale: 0.4 }}
            animate={{ x: 28 + dx, y: 28 + dy, opacity: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE_OUT }}
            style={{
              position: 'absolute',
              width: 5, height: 5, borderRadius: 99,
              background: `oklch(0.85 0.18 ${h})`,
              boxShadow: `0 0 6px oklch(0.85 0.18 ${h})`,
            }}
          />
        );
      })}
    </motion.div>
  );
};

// ── Sparkline (mini 7-day) ───────────────────────────────────
const SparkLine: React.FC<{ hue: number; seed?: number; reduce?: boolean }> = ({ hue, seed = 0, reduce }) => {
  const points = React.useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const v = 0.4 + ((Math.sin(seed + i * 1.3) + 1) / 2) * 0.6;
      return v;
    });
  }, [seed]);
  const w = 64, h = 18;
  const path = points.map((v, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - v * h;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={w} height={h}>
      <motion.path
        d={path}
        fill="none"
        stroke={`oklch(0.85 0.16 ${hue})`}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0, opacity: 0 }}
        animate={reduce ? undefined : { pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </svg>
  );
};

// ── HABITS screen ─────────────────────────────────────────
export default function HabitsScreen({ themeId }: ScreenProps) {
  const vocab = getThemeVocab(themeId ?? '');
  const reduce = !!useReducedMotion();
  const V = { habits: vocab.habits, streak: vocab.streak };

  // ── Data layer (registry-backed) ───
  const listQuery = useOp(habitOps.list, {});
  const bumpMut = useOpMutation(habitOps.bump);
  const createMut = useOpMutation(habitOps.create);
  const removeMut = useOpMutation(habitOps.remove);

  const habits: Habit[] = (listQuery.data ?? []).map((h: DBHabit) => ({
    id: h.id,
    name: h.name,
    icon: h.icon,
    hue: h.hue,
    target: h.target,
    done: h.done,
    streak: h.streak,
    unit: h.unit,
    source: h.source,
    auto: h.auto,
  }));

  const [editing, setEditing] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [gpsEnabled, setGpsEnabled] = React.useState(true);
  const [healthEnabled, setHealthEnabled] = React.useState(true);
  const [pulses, setPulses] = React.useState<Record<string, number>>({});
  const [confetti, setConfetti] = React.useState<Record<string, number>>({});
  const [addedSuggestions, setAddedSuggestions] = React.useState<Set<string>>(new Set());

  const bump = (h: Habit) => {
    const wasDone = h.done >= h.target;
    setPulses((p) => ({ ...p, [h.id]: (p[h.id] || 0) + 1 }));
    const willBeDone = h.done + 1 >= h.target;
    if (!wasDone && willBeDone) {
      setConfetti((c) => ({ ...c, [h.id]: (c[h.id] || 0) + 1 }));
    }
    bumpMut.mutate({ id: h.id, by: 1 });
  };
  const remove = (id: string) => removeMut.mutate({ id });
  const totalPct = habits.length ? habits.reduce((s, h) => s + Math.min(1, h.done / h.target), 0) / habits.length : 0;

  const add = (newH: Partial<Habit> & { name: string; icon: string; hue: number; target: number; unit: string }) => {
    createMut.mutate({
      name: newH.name,
      target: newH.target,
      unit: newH.unit,
      icon: newH.icon as any,
      hue: newH.hue,
      source: 'manual',
    });
    setAdding(false);
  };

  const tryAddSuggestion = (n: string, ic: string, hue: number, target: number, unit: string) => {
    if (addedSuggestions.has(n)) return;
    setAddedSuggestions((s) => new Set(s).add(n));
    add({ name: n, icon: ic, hue, target, unit });
  };

  return (
    <motion.div
      variants={containerV}
      initial="hidden"
      animate="show"
      style={{ padding: '8px 16px 100px' }}
    >
      {/* Header */}
      <motion.div variants={itemV} style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            {V.habits.toUpperCase()} · TODAY
          </div>
          <div className="display" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.1, marginTop: 4, letterSpacing: -0.5 }}>
            {V.habits}
          </div>
        </div>
        <motion.div
          onClick={() => setEditing(!editing)}
          whileHover={reduce ? undefined : { scale: 1.04 }}
          whileTap={reduce ? undefined : { scale: 0.95 }}
          className="tap"
          style={{
            padding: '7px 12px', borderRadius: 99, fontSize: 11,
            background: editing ? 'oklch(0.78 0.16 var(--hue) / 0.2)' : 'oklch(1 0 0 / 0.04)',
            border: '1px solid ' + (editing ? 'oklch(0.78 0.16 var(--hue) / 0.5)' : 'var(--hairline)'),
            color: editing ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)',
          }}
        >
          {editing ? 'Done' : 'Edit'}
        </motion.div>
      </motion.div>

      {/* Hero ring */}
      <motion.div
        variants={itemV}
        whileHover={reduce ? undefined : { scale: 1.005 }}
        whileTap={reduce ? undefined : { scale: 0.99 }}
        className="glass scanlines"
        style={{
          padding: 22, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 18,
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue) / 0.18), oklch(0.55 0.22 calc(var(--hue) + 80) / 0.08))',
          borderColor: 'oklch(0.78 0.16 var(--hue) / 0.35)',
        }}
      >
        {/* Soft animated bg blob */}
        <motion.div
          aria-hidden
          animate={reduce ? undefined : { x: [0, 12, 0], y: [0, -8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%',
            background: 'radial-gradient(circle, oklch(0.78 0.16 var(--hue) / 0.25), transparent 70%)',
            filter: 'blur(8px)',
          }}
        />
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <AnimatedRing size={140} pct={totalPct} sw={8} hue={220} reduce={reduce} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="display" style={{ fontSize: 34, fontWeight: 600, lineHeight: 1, fontVariantNumeric: 'tabular-nums', background: 'linear-gradient(135deg, oklch(0.95 0.12 var(--hue)), oklch(0.75 0.18 calc(var(--hue) + 60)))', WebkitBackgroundClip: 'text', color: 'transparent' }}>
              <Counter to={Math.round(totalPct * 100)} reduce={reduce} suffix="%" />
            </div>
            <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginTop: 2 }}>COMPLETE</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: 1.5, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
            TRACKING
          </div>
          <div className="display" style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.2 }}>
            <Counter to={habits.length} reduce={reduce} /> {V.habits.toLowerCase()} today
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.4, marginTop: 6 }}>
            Longest {V.streak.toLowerCase()}:{' '}
            <b style={{ color: 'oklch(0.82 0.17 40)' }}>42 days</b>. Hydrate next.
          </div>
        </div>
      </motion.div>

      {/* Section: integrations */}
      <motion.div variants={itemV} style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)' }}>INTEGRATIONS</div>
        <div className="display" style={{ fontSize: 16, fontWeight: 500, color: 'var(--fg-2)', marginTop: 2 }}>Auto-log from your day</div>
      </motion.div>
      <motion.div
        layout={!reduce}
        variants={itemV}
        style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}
      >
        <IntegrationChip label="GPS" sub="auto-logging" on={gpsEnabled} onToggle={() => setGpsEnabled(!gpsEnabled)} icon="location" reduce={reduce} />
        <IntegrationChip label="Apple Health" sub="12 metrics" on={healthEnabled} onToggle={() => setHealthEnabled(!healthEnabled)} icon="trend" reduce={reduce} />
        <IntegrationChip label="Calendar" sub="time blocks" on={true} icon="calendar" reduce={reduce} />
      </motion.div>

      {/* Section: rituals */}
      <motion.div variants={itemV} style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)' }}>RITUALS</div>
        <div className="display" style={{ fontSize: 16, fontWeight: 500, color: 'var(--fg-2)', marginTop: 2 }}>Tap + to log a rep</div>
      </motion.div>

      {/* Habit list */}
      <motion.div
        variants={containerV}
        initial="hidden"
        animate="show"
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <AnimatePresence initial={false}>
          {habits.map((h, idx) => {
            const HI = I[h.icon] || I.target;
            const pct = Math.min(1, h.done / h.target);
            const done = h.done >= h.target;
            return (
              <motion.div
                key={h.id}
                layout={!reduce}
                variants={itemV}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, x: -30, transition: { duration: 0.25 } }}
                whileHover={reduce ? undefined : { scale: 1.005 }}
                whileTap={reduce ? undefined : { scale: 0.99 }}
                className="glass"
                style={{
                  padding: 14, display: 'flex', alignItems: 'center', gap: 14, position: 'relative',
                  overflow: 'hidden',
                  background: `linear-gradient(135deg, oklch(0.78 0.16 ${h.hue} / 0.08), transparent 70%)`,
                  borderColor: `oklch(0.78 0.16 ${h.hue} / 0.22)`,
                }}
              >
                {/* Confetti overlay */}
                <AnimatePresence>
                  {confetti[h.id] && (
                    <ConfettiBurst key={confetti[h.id]} hue={h.hue} />
                  )}
                </AnimatePresence>

                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <AnimatedRing size={56} pct={pct} sw={4} hue={h.hue} reduce={reduce} pulseKey={pulses[h.id]} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HI size={20} stroke={`oklch(0.9 0.14 ${h.hue})`} />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <div className="display" style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg)' }}>{h.name}</div>
                    <AnimatePresence>
                      {done && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                        >
                          <Chip tone="ok" size="sm">DONE</Chip>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {h.auto && <Chip tone="accent" size="sm">AUTO</Chip>}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ color: `oklch(0.9 0.14 ${h.hue})` }}>{h.done}</span>
                    {' / '}{h.target} {h.unit}
                    {' · '}<span style={{ color: 'oklch(0.82 0.17 40)' }}>{h.streak}d</span>
                    {h.source && <> · <span>{h.source}</span></>}
                  </div>
                  {/* Sparkline */}
                  <div style={{ marginTop: 4, opacity: 0.85 }}>
                    <SparkLine hue={h.hue} seed={idx + 0.3} reduce={reduce} />
                  </div>
                </div>
                {editing ? (
                  <motion.div
                    onClick={() => remove(h.id)}
                    whileHover={reduce ? undefined : { scale: 1.06 }}
                    whileTap={reduce ? undefined : { scale: 0.9 }}
                    className="tap"
                    style={{
                      width: 38, height: 38, borderRadius: 11,
                      background: 'oklch(0.70 0.20 25 / 0.15)',
                      border: '1px solid oklch(0.70 0.20 25 / 0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <I.close size={14} stroke="oklch(0.85 0.15 25)" />
                  </motion.div>
                ) : (
                  <motion.div
                    onClick={() => bump(h)}
                    whileHover={reduce ? undefined : { scale: 1.06 }}
                    whileTap={reduce ? undefined : { scale: 0.88 }}
                    className="tap"
                    style={{
                      width: 38, height: 38, borderRadius: 11,
                      background: done ? `oklch(0.78 0.15 150 / 0.2)` : `oklch(0.78 0.16 ${h.hue} / 0.18)`,
                      border: '1px solid ' + (done ? 'oklch(0.78 0.15 150 / 0.4)' : `oklch(0.78 0.16 ${h.hue} / 0.4)`),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {done
                      ? <I.check size={14} stroke="oklch(0.85 0.14 150)" />
                      : <I.plus size={14} stroke={`oklch(0.9 0.14 ${h.hue})`} />}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Add habit CTA */}
      <motion.div
        variants={itemV}
        onClick={() => setAdding(true)}
        whileHover={reduce ? undefined : { scale: 1.01 }}
        whileTap={reduce ? undefined : { scale: 0.98 }}
        className="tap"
        style={{
          marginTop: 14, padding: 14, borderRadius: 14,
          border: '1.5px dashed var(--hairline-strong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          color: 'var(--fg-2)', fontSize: 13,
        }}
      >
        <I.plus size={16} /> <span>New {V.habits.toLowerCase().slice(0, -1)}</span>
      </motion.div>

      {/* AI suggestions */}
      <motion.div variants={itemV} style={{ marginTop: 24, marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)' }}>NIK SUGGESTS</div>
        <div className="display" style={{ fontSize: 16, fontWeight: 500, color: 'var(--fg-2)', marginTop: 2 }}>Based on your week</div>
      </motion.div>
      <motion.div
        variants={containerV}
        initial="hidden"
        animate="show"
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
      >
        {([
          ['Journal', 'brain', 280, 1, 'entry'],
          ['Stretch', 'target', 40, 15, 'min'],
          ['Sunlight', 'sun', 50, 20, 'min'],
          ['Cold shower', 'water', 200, 1, 'x'],
        ] as const).map(([n, ic, hue, target, unit]) => {
          const added = addedSuggestions.has(n);
          return (
            <motion.div
              key={n}
              variants={itemV}
              onClick={() => tryAddSuggestion(n, ic, hue, target, unit)}
              whileHover={reduce ? undefined : { scale: 1.04, boxShadow: `0 0 14px oklch(0.78 0.16 ${hue} / 0.4)` }}
              whileTap={reduce ? undefined : { scale: 0.95 }}
              className="tap"
              style={{
                padding: '8px 12px', borderRadius: 99, fontSize: 11,
                background: added
                  ? `oklch(0.78 0.15 150 / 0.18)`
                  : `oklch(0.78 0.16 ${hue} / 0.12)`,
                border: '1px solid ' + (added
                  ? `oklch(0.78 0.15 150 / 0.4)`
                  : `oklch(0.78 0.16 ${hue} / 0.35)`),
                color: added ? `oklch(0.85 0.14 150)` : `oklch(0.92 0.14 ${hue})`,
                display: 'flex', alignItems: 'center', gap: 5,
                fontFamily: 'var(--font-mono)', letterSpacing: 0.5,
              }}
            >
              {added ? <I.check size={11} /> : <I.plus size={11} />}
              {n}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Add habit modal */}
      <AnimatePresence>
        {adding && <AddHabitSheet onAdd={add} onClose={() => setAdding(false)} reduce={reduce} />}
      </AnimatePresence>
    </motion.div>
  );
}

type IntegrationChipProps = {
  label: string;
  sub: string;
  on: boolean;
  onToggle?: () => void;
  icon: string;
  reduce?: boolean;
};

export const IntegrationChip: React.FC<IntegrationChipProps> = ({ label, sub, on, onToggle, icon, reduce }) => {
  const Ic = I[icon];
  return (
    <motion.div
      layout={!reduce}
      onClick={onToggle}
      whileHover={reduce || !onToggle ? undefined : { scale: 1.03 }}
      whileTap={reduce || !onToggle ? undefined : { scale: 0.96 }}
      className="tap glass"
      style={{
        padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
        cursor: onToggle ? 'pointer' : 'default',
        background: on ? 'oklch(0.78 0.16 var(--hue) / 0.10)' : undefined,
        borderColor: on ? 'oklch(0.78 0.16 var(--hue) / 0.35)' : undefined,
      }}
    >
      <Ic size={14} stroke={on ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-3)'} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg)' }}>{label}</div>
        <div style={{ fontSize: 8, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>{sub}</div>
      </div>
      <div style={{
        width: 28, height: 16, borderRadius: 99, position: 'relative',
        background: on ? 'oklch(0.78 0.16 var(--hue))' : 'oklch(1 0 0 / 0.1)',
        transition: 'background 0.2s',
      }}>
        <motion.div
          animate={{ left: on ? 14 : 2 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          style={{ position: 'absolute', top: 2, width: 12, height: 12, borderRadius: '50%', background: '#fff' }}
        />
      </div>
    </motion.div>
  );
};

type AddHabitSheetProps = {
  onAdd: (h: { name: string; icon: string; hue: number; target: number; unit: string }) => void;
  onClose: () => void;
  reduce?: boolean;
};

export const AddHabitSheet: React.FC<AddHabitSheetProps> = ({ onAdd, onClose, reduce }) => {
  const [name, setName] = React.useState('');
  const [icon, setIcon] = React.useState('target');
  const [target, setTarget] = React.useState(5);
  const [unit, setUnit] = React.useState('x');
  const icons = ['target', 'water', 'book', 'brain', 'dumbbell', 'flame', 'moon', 'sun'];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'absolute', inset: 0, background: 'var(--scrim)',
        backdropFilter: 'blur(10px)', zIndex: 70, display: 'flex', alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={reduce ? false : { y: '100%' }}
        animate={reduce ? undefined : { y: 0 }}
        exit={reduce ? undefined : { y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{
          width: '100%', background: 'var(--sheet-bg)', border: '1px solid var(--hairline)',
          borderRadius: '24px 24px 0 0', padding: 20, paddingBottom: 40,
        }}
      >
        <div style={{ width: 40, height: 4, background: 'var(--grabber)', borderRadius: 99, margin: '0 auto 16px' }} />
        <div className="display" style={{ fontSize: 18, fontWeight: 600, marginBottom: 14, color: 'var(--sheet-fg)' }}>New habit</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What do you want to build?"
          style={{
            width: '100%', padding: 12, borderRadius: 12, background: 'var(--input-bg)',
            border: '1px solid var(--hairline)', color: 'var(--sheet-fg)',
            fontSize: 13, fontFamily: 'var(--font-body, Inter)', outline: 'none',
            marginBottom: 12, boxSizing: 'border-box',
          }}
        />
        <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>ICON</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {icons.map((i) => {
            const Ic = I[i];
            return (
              <motion.div
                key={i}
                onClick={() => setIcon(i)}
                whileTap={reduce ? undefined : { scale: 0.92 }}
                className="tap"
                style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: icon === i ? 'oklch(0.78 0.16 var(--hue) / 0.25)' : 'oklch(1 0 0 / 0.05)',
                  border: '1px solid ' + (icon === i ? 'oklch(0.78 0.16 var(--hue) / 0.5)' : 'var(--hairline)'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ic size={18} stroke={icon === i ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)'} />
              </motion.div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>TARGET</div>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(+e.target.value)}
              style={{
                width: '100%', padding: 10, borderRadius: 10, background: 'var(--input-bg)',
                border: '1px solid var(--hairline)', color: 'var(--sheet-fg)',
                fontSize: 14, fontFamily: 'var(--font-mono)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>UNIT</div>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              style={{
                width: '100%', padding: 10, borderRadius: 10, background: 'var(--input-bg)',
                border: '1px solid var(--hairline)', color: 'var(--sheet-fg)',
                fontSize: 14, fontFamily: 'var(--font-mono)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
        <motion.div
          onClick={() => name && onAdd({ name, icon, hue: 220, target, unit })}
          whileHover={name && !reduce ? { scale: 1.01 } : undefined}
          whileTap={name && !reduce ? { scale: 0.98 } : undefined}
          className="tap"
          style={{
            padding: 14, borderRadius: 12,
            background: name
              ? 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))'
              : 'oklch(1 0 0 / 0.05)',
            color: name ? '#06060a' : 'var(--fg-3)',
            fontWeight: 600, fontSize: 14, textAlign: 'center',
          }}
        >
          Create
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

