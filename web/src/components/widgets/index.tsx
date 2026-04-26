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

export type WidgetUnit = 1 | 2 | 3;
export type WidgetSize = { w: WidgetUnit; h: WidgetUnit };

// Tier system — every widget should branch its render on this so
// sizing feels consistent across the app. Picked over per-widget
// custom branching because some widgets used to scale at "2x2 only",
// others at "any wide size", etc., which was inconsistent.
//
//   mini  = 1×1
//   wide  = 2×1, 3×1   (extra horizontal, no extra vertical)
//   tall  = 1×2, 1×3   (extra vertical, no extra horizontal)
//   hero  = 2×2, 2×3, 3×2, 3×3   (room in both directions)
//
export type WidgetTier = 'mini' | 'wide' | 'tall' | 'hero';
export const getTier = (size: WidgetSize): WidgetTier => {
  if (size.w === 1 && size.h === 1) return 'mini';
  if (size.w >= 2 && size.h === 1) return 'wide';
  if (size.w === 1 && size.h >= 2) return 'tall';
  return 'hero';
};
// Cells the widget covers — useful for "show N items" decisions.
export const cellArea = (size: WidgetSize) => size.w * size.h;

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
  /** Every shape the widget will accept (kept for API compat). */
  allowedSizes: WidgetSize[];
  /**
   * Sizes that look great for this widget. Picker greys-out the
   * other cells in the resize dock — they're still tappable, just
   * marked as "not recommended" so the user / AI knows.
   */
  recommendedSizes: WidgetSize[];
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
        // Fill the parent's height when wrapped (e.g. EditCanvas
        // SortableItem) so the visual footprint matches direct grid
        // placement (ReadOnlyCanvas). Without this the shell sized
        // to its content and left a gap inside the wrapper.
        height: '100%', boxSizing: 'border-box',
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
  const intakes = (data?.intakes ?? []) as { ml: number; occurred_at: string }[];
  const tier = getTier(size);
  // Hydration content tiers:
  //   mini  (1×1)  → number + bar
  //   wide  (2-3 × 1) → + horizontal cup row
  //   tall  (1 × 2-3) → + vertical cup stack + recent intakes
  //   hero  (≥2 × ≥2) → + cup row + timeline
  const showCups = tier !== 'mini';
  const showIntakes = (tier === 'hero' || tier === 'tall') && intakes.length > 0;
  return (
    <WidgetShell hue={hue} icon="water" label="Hydration today" size={size} onOpen={onOpen} glow
      accent={<Chip tone="accent" size="sm">{Math.round(Math.min(1, pct) * 100)}%</Chip>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <HeroNumber value={total} hue={hue} size={size} gradient={[180, 240]} />
            <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>/ {goal} ml</div>
          </div>
          <ProgressBar pct={pct} hue={hue} />
        </div>
        {/* Cups: horizontal at wide/hero, vertical at tall */}
        {showCups && tier !== 'tall' && (
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: 8 }).map((_, i) => {
              const filled = i < Math.round(pct * 8);
              return (
                <div key={i} style={{
                  flex: 1, height: 14, borderRadius: 4,
                  background: filled ? `linear-gradient(180deg, oklch(0.78 0.16 ${hue}), oklch(0.6 0.20 ${hue + 30}))` : `oklch(0.78 0.16 ${hue} / 0.10)`,
                  border: `1px solid oklch(0.78 0.16 ${hue} / ${filled ? 0.6 : 0.25})`,
                }} />
              );
            })}
          </div>
        )}
        {showCups && tier === 'tall' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            {Array.from({ length: 8 }).map((_, i) => {
              const filled = i < Math.round(pct * 8);
              return (
                <div key={i} style={{
                  flex: 1, minHeight: 8, borderRadius: 4,
                  background: filled ? `linear-gradient(90deg, oklch(0.78 0.16 ${hue}), oklch(0.6 0.20 ${hue + 30}))` : `oklch(0.78 0.16 ${hue} / 0.10)`,
                  border: `1px solid oklch(0.78 0.16 ${hue} / ${filled ? 0.6 : 0.25})`,
                }} />
              );
            })}
          </div>
        )}
        {showIntakes && (
          <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--hairline)' }}>
            <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 6 }}>
              RECENT · {intakes.length} TODAY
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {intakes.slice(0, size.h === 3 ? 8 : 5).map((iv, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <span style={{ color: `oklch(0.85 0.14 ${hue})`, fontFamily: 'var(--font-mono)', minWidth: 38 }}>
                    {iv.ml}ml
                  </span>
                  <span style={{ color: 'var(--fg-3)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                    {new Date(iv.occurred_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </WidgetShell>
  );
};

const SleepLastNight: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const tier = getTier(size);
  const { data: nights = [] } = useOp(sleepOps.recent, { limit: tier === 'hero' || tier === 'tall' ? 7 : 1 });
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
      {/* Wide / hero: 7-night sparkline. */}
      {(tier === 'wide' || tier === 'hero' || tier === 'tall') && nights.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--hairline)' }}>
          <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 6 }}>
            LAST {nights.length} NIGHTS
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 36 }}>
            {nights.slice().reverse().map((n) => {
              const pct = Math.min(1, (n.duration_min ?? 0) / 540);
              return (
                <div key={n.id} style={{
                  flex: 1, height: `${Math.max(8, pct * 100)}%`, borderRadius: 3,
                  background: `linear-gradient(180deg, oklch(0.85 0.18 260), oklch(0.55 0.22 280))`,
                  opacity: 0.4 + pct * 0.6,
                }} />
              );
            })}
          </div>
        </div>
      )}
      {/* Hero: stages breakdown for last night. */}
      {tier === 'hero' && last?.stages && (
        <div style={{ marginTop: 8, fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
          {last.hrv_ms != null && <span>HRV {last.hrv_ms}ms · </span>}
          {last.resting_hr != null && <span>HR {last.resting_hr}</span>}
        </div>
      )}
    </WidgetShell>
  );
};

const ScoreGauge: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const { data } = useOp(scoreOps.get, {});
  const total = data?.total ?? 0;
  const delta = data?.delta_7d ?? 0;
  const pillarLabels = ['Focus', 'Health', 'Mind', 'Family'] as const;
  const pillarKeys = ['focus', 'health', 'mind', 'family'] as const;
  const pillarHues = [220, 25, 280, 150];
  const pillars = pillarKeys.map((k, i) => ({
    label: pillarLabels[i],
    hue: pillarHues[i],
    value: ((data?.pillars as Record<string, { value: number }> | undefined)?.[k]?.value) ?? 0,
    max: ((data?.pillars as Record<string, { max: number }> | undefined)?.[k]?.max) ?? 1,
  }));
  const deltaColor = delta > 0 ? 'oklch(0.78 0.18 145)' : delta < 0 ? 'oklch(0.78 0.18 25)' : 'var(--fg-3)';
  const deltaText = delta === 0 ? '—' : `${delta > 0 ? '+' : ''}${delta}`;
  const tier = getTier(size);
  const expanded = tier === 'hero' || tier === 'tall';
  return (
    <WidgetShell hue={220} icon="sparkle" label="Nik Score" size={size} onOpen={onOpen} glow
      accent={<span style={{ fontSize: 10, color: deltaColor, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>{deltaText}</span>}
    >
      <HeroNumber value={total} hue={220} size={size} gradient={[200, 280]} />
      {/* Compact pillar bars at small sizes */}
      {!expanded && (
        <>
          <div style={{ display: 'flex', gap: 3, marginTop: 10 }}>
            {pillars.map((p, i) => (
              <div key={p.label} style={{ flex: 1, height: 4, borderRadius: 99, background: 'oklch(1 0 0 / 0.06)', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (p.value / p.max) * 100)}%` }}
                  transition={{ duration: 0.7, delay: 0.2 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  style={{ height: '100%', background: `oklch(0.85 0.16 ${p.hue})` }}
                />
              </div>
            ))}
          </div>
          <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 6, letterSpacing: 1 }}>
            FOCUS · HEALTH · MIND · FAMILY
          </div>
        </>
      )}
      {/* Full pillar list at hero / tall sizes */}
      {expanded && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pillars.map((p, i) => (
            <div key={p.label}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
                  {p.label.toUpperCase()}
                </span>
                <span style={{ fontSize: 11, color: `oklch(0.92 0.14 ${p.hue})`, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                  {p.value} <span style={{ color: 'var(--fg-3)' }}>/ {p.max}</span>
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: 'oklch(1 0 0 / 0.06)', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (p.value / p.max) * 100)}%` }}
                  transition={{ duration: 0.7, delay: 0.2 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  style={{ height: '100%', background: `linear-gradient(90deg, oklch(0.85 0.16 ${p.hue}), oklch(0.65 0.20 ${p.hue + 30}))` }}
                />
              </div>
            </div>
          ))}
          <div style={{ fontSize: 10, color: deltaColor, fontFamily: 'var(--font-mono)', marginTop: 4, letterSpacing: 1 }}>
            {delta === 0 ? 'NO 7-DAY CHANGE' : `${delta > 0 ? '+' : ''}${delta} THIS WEEK`}
          </div>
        </div>
      )}
    </WidgetShell>
  );
};

const StreakCounter: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const { data } = useOp(profileOps.get, {});
  const streak = data?.streak ?? 0;
  const isWide = size.w >= 2 || size.h >= 2;
  // Last 7 days dots — placeholder pattern; will derive from
  // habits ledger once we wire that.
  const last7 = Array.from({ length: 7 }).map((_, i) => i < streak);
  return (
    <WidgetShell hue={40} icon="flame" label="Streak" size={size} onOpen={onOpen}
      accent={<Chip tone="warn" size="sm">{streak === 0 ? 'NEW' : `D ${streak}`}</Chip>}
    >
      <motion.div
        animate={{ rotate: [0, -4, 4, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3 }}
        style={{ position: 'absolute', top: 38, right: 12, opacity: 0.16 }}
      >
        <I.flame size={size.w >= 2 && size.h >= 2 ? 96 : 48} stroke="oklch(0.85 0.18 40)" />
      </motion.div>
      <HeroNumber value={streak} hue={40} size={size} gradient={[60, 20]} />
      <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
        {streak === 1 ? 'day · personal best' : 'days · personal best'}
      </div>
      {isWide && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--hairline)' }}>
          <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 6 }}>
            LAST 7 DAYS
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {last7.map((on, i) => (
              <div key={i} style={{
                flex: 1, height: 18, borderRadius: 4,
                background: on
                  ? 'linear-gradient(180deg, oklch(0.85 0.18 40), oklch(0.65 0.22 25))'
                  : 'oklch(0.78 0.16 40 / 0.10)',
                border: `1px solid oklch(0.78 0.16 40 / ${on ? 0.6 : 0.20})`,
              }} />
            ))}
          </div>
        </div>
      )}
    </WidgetShell>
  );
};

const NextEvent: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const isLarge = size.w >= 2 && size.h >= 2;
  const { data: evts = [] } = useOp(eventsOps.list, { limit: isLarge ? 5 : 1 });
  const e = evts[0];
  const hue = 280;
  const when = e?.occurs_at ? new Date(e.occurs_at) : null;
  return (
    <WidgetShell hue={hue} icon="calendar" label={`Next · ${(e?.kind ?? 'event').replace(/_/g, ' ')}`} size={size} onOpen={onOpen}
      accent={when ? <Chip tone="accent" size="sm">{when.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }).toUpperCase()}</Chip> : undefined}
    >
      {e ? (
        <>
          <div className="display" style={{ fontSize: size.w >= 2 ? (isLarge ? 18 : 17) : 14, fontWeight: 500, color: 'var(--fg-1)', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
            {e.title}
          </div>
          {e.body && (
            <div style={{ fontSize: 11, color: 'var(--fg-2)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: isLarge ? 4 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {e.body}
            </div>
          )}
          {e.location && (
            <div style={{ marginTop: 6, fontSize: 10, color: `oklch(0.85 0.16 ${hue})`, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
              📍 {e.location.toUpperCase()}
            </div>
          )}
          {/* Hero size: show the next 3-4 events stacked */}
          {isLarge && evts.length > 1 && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--hairline)' }}>
              <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 6 }}>
                UPCOMING · {evts.length - 1} MORE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {evts.slice(1, size.h === 3 ? 5 : 3).map((ev) => {
                  const t = ev.occurs_at ? new Date(ev.occurs_at) : null;
                  return (
                    <div key={ev.id} style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 11 }}>
                      <span style={{ color: `oklch(0.85 0.14 ${hue})`, fontFamily: 'var(--font-mono)', minWidth: 60, fontSize: 9 }}>
                        {t ? t.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : '—'}
                      </span>
                      <span style={{ color: 'var(--fg-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.title}
                      </span>
                    </div>
                  );
                })}
              </div>
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
  const isLarge = size.w >= 2 && size.h >= 2;
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
          {/* Compact stacked avatars at small sizes */}
          {!isLarge && (
            <div style={{ display: 'flex', marginTop: 4 }}>
              {members.slice(0, 6).map((m, i) => (
                <div key={m.id} style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: `linear-gradient(135deg, oklch(0.85 0.18 ${m.hue}), oklch(0.55 0.22 ${m.hue + 30}))`,
                  border: '1.5px solid var(--bg)',
                  fontSize: 11, fontWeight: 600, color: '#06060a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginLeft: i === 0 ? 0 : -6,
                  boxShadow: m.status === 'online' ? `0 0 0 2px oklch(0.78 0.18 145)` : undefined,
                }}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          )}
          {/* Full member list at hero sizes */}
          {isLarge && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflow: 'hidden' }}>
              {members.slice(0, size.h === 3 ? 8 : 5).map((m) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, oklch(0.85 0.18 ${m.hue}), oklch(0.55 0.22 ${m.hue + 30}))`,
                    fontSize: 12, fontWeight: 600, color: '#06060a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: m.status === 'online' ? `0 0 0 2px oklch(0.78 0.18 145)` : undefined,
                  }}>
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.name}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, textTransform: 'uppercase' }}>
                      {m.relation} · {m.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
  const tier = getTier(size);
  const limit = tier === 'hero' ? 5 : tier === 'tall' ? 3 : 1;
  const { data: list = [] } = useOp(questsOps.list, { status: 'active', limit });
  const q = list[0];
  const hue = 30;
  const titleSize = tier === 'hero' ? 22 : tier === 'wide' ? 18 : tier === 'tall' ? 16 : 14;
  return (
    <WidgetShell hue={hue} icon="sword" label="Active quest" size={size} onOpen={onOpen}
      accent={q ? <Chip tone="accent" size="sm">{q.rank}</Chip> : undefined}
    >
      {q ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 4 }}>
          <div className="display" style={{
            fontSize: titleSize, fontWeight: 500, color: 'var(--fg-1)', lineHeight: 1.25, marginBottom: 6,
            overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: tier === 'mini' || tier === 'wide' ? 'nowrap' : 'normal',
            display: tier === 'mini' || tier === 'wide' ? 'block' : '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
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
          {/* Hero / tall: stack other active quests below. */}
          {(tier === 'hero' || tier === 'tall') && list.length > 1 && (
            <div style={{ marginTop: 6, paddingTop: 8, borderTop: '1px solid var(--hairline)' }}>
              <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 6 }}>
                ALSO ACTIVE · {list.length - 1}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {list.slice(1).map((other) => (
                  <div key={other.id}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                      <span style={{ color: 'var(--fg-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {other.title}
                      </span>
                      <span style={{ color: `oklch(0.85 0.14 ${hue})`, fontFamily: 'var(--font-mono)', fontSize: 9, marginLeft: 6 }}>
                        {other.rank}
                      </span>
                    </div>
                    {other.progress != null && (
                      <div style={{ height: 2, borderRadius: 99, background: 'oklch(1 0 0 / 0.06)', overflow: 'hidden' }}>
                        <div style={{ width: `${(other.progress as number) * 100}%`, height: '100%', background: `oklch(0.85 0.16 ${hue})` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: tier === 'hero' ? 14 : 12, color: 'var(--fg-3)', marginTop: 4 }}>
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
  if (!habit) return (
    <WidgetShell hue={200} icon="check" label="Habit" size={size} onOpen={onOpen}>
      <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>No habit linked.</div>
    </WidgetShell>
  );
  const tier = getTier(size);
  const pct = Math.min(1, habit.done / habit.target);
  const Ic = I[habit.icon as keyof typeof I] ?? I.check;
  const isDone = habit.done >= habit.target;
  // Ring radius scales with tier — hero gets a much bigger ring.
  const r = tier === 'hero' ? 50 : tier === 'wide' || tier === 'tall' ? 32 : 22;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  const ringSize = r * 2 + 8;
  return (
    <WidgetShell hue={habit.hue} icon={habit.icon as keyof typeof I} label={habit.name} size={size} onOpen={onOpen}
      accent={isDone ? <Chip tone="ok" size="sm">DONE</Chip> : <Chip tone="default" size="sm">{Math.round(pct * 100)}%</Chip>}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Ring */}
        <div style={{ position: 'relative', width: ringSize, height: ringSize, flexShrink: 0 }}>
          <svg width={ringSize} height={ringSize} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
            <circle cx={ringSize/2} cy={ringSize/2} r={r} fill="none"
              stroke={`oklch(0.78 0.16 ${habit.hue} / 0.18)`} strokeWidth="3" />
            <motion.circle cx={ringSize/2} cy={ringSize/2} r={r} fill="none"
              stroke={`oklch(0.85 0.18 ${habit.hue})`}
              strokeWidth="3" strokeLinecap="round"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic size={r-4} stroke={`oklch(0.92 0.14 ${habit.hue})`} />
          </div>
        </div>
        {/* Numbers */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="display" style={{ fontSize: size.w === 2 ? 24 : 20, fontWeight: 600, color: `oklch(0.92 0.14 ${habit.hue})`, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {habit.done}
          </div>
          <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            / {habit.target} {habit.unit}
          </div>
          {habit.streak > 0 && (
            <div style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, color: 'oklch(0.85 0.18 40)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
              <I.flame size={9} stroke="oklch(0.85 0.18 40)" /> {habit.streak}D
            </div>
          )}
        </div>
      </div>
    </WidgetShell>
  );
};

const NextQuest: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const tier = getTier(size);
  const limit = tier === 'hero' ? 5 : tier === 'tall' ? 3 : 1;
  const { data: list = [] } = useOp(questsOps.list, { status: 'pending', limit });
  const q = list[0];
  const hue = 260;
  // Title font scales with tier so a 3×3 box doesn't show 13px text floating.
  const titleSize = tier === 'hero' ? 22 : tier === 'wide' ? 17 : tier === 'tall' ? 15 : 13;
  return (
    <WidgetShell hue={hue} icon="sparkle" label="Next quest" size={size} onOpen={onOpen} glow
      accent={q ? <Chip tone="accent" size="sm">{q.rank}</Chip> : undefined}
    >
      {q ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 4 }}>
          <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 4 }}>
            QUEUED · NEXT UP
          </div>
          <div className="display" style={{
            fontSize: titleSize, fontWeight: 500, color: 'var(--fg-1)', lineHeight: 1.25, marginBottom: 6,
            overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: tier === 'mini' || tier === 'wide' ? 'nowrap' : 'normal',
            display: tier === 'mini' || tier === 'wide' ? 'block' : '-webkit-box',
            WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
          }}>
            {q.title}
          </div>
          {(tier === 'hero' || tier === 'tall') && list.length > 1 && (
            <div style={{ marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 2 }}>
                AFTER · {list.length - 1} QUEUED
              </div>
              {list.slice(1, limit).map((other) => (
                <div key={other.id} style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 11 }}>
                  <span style={{ color: `oklch(0.85 0.14 ${hue})`, fontFamily: 'var(--font-mono)', minWidth: 14, fontSize: 9 }}>{other.rank}</span>
                  <span style={{ color: 'var(--fg-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {other.title}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 6 }}>
            <span style={{ fontSize: 10, color: `oklch(0.85 0.16 ${hue})`, fontFamily: 'var(--font-mono)' }}>
              +{q.xp ?? 0} XP
            </span>
            <motion.span
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              style={{ fontSize: 11, color: `oklch(0.85 0.16 ${hue})`, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}
            >
              START →
            </motion.span>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: tier === 'hero' ? 14 : 12, color: 'var(--fg-3)', marginTop: 4, lineHeight: 1.4 }}>
          Nothing pending. <span style={{ color: `oklch(0.85 0.16 ${hue})` }}>Plan a quest →</span>
        </div>
      )}
    </WidgetShell>
  );
};

const TodayEvents: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const tier = getTier(size);
  const { data: evts = [] } = useOp(eventsOps.list, { limit: tier === 'hero' ? 6 : tier === 'tall' ? 4 : 5 });
  const today = evts.filter((e) => {
    if (!e.occurs_at) return false;
    const d = new Date(e.occurs_at);
    return d.toDateString() === new Date().toDateString();
  });
  return (
    <WidgetShell hue={200} icon="calendar" label="Today" size={size} onOpen={onOpen}
      accent={today.length > 0 ? <Chip tone="default" size="sm">{today.length}</Chip> : undefined}
    >
      {today.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 4 }}>
          <HeroNumber value={today.length} hue={200} size={size} gradient={[180, 240]} />
          <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 4, letterSpacing: 1 }}>
            {today.length === 1 ? 'EVENT' : 'EVENTS'}
          </div>
          {/* Mini / wide: just one "NEXT" preview line */}
          {tier !== 'hero' && tier !== 'tall' && today[0] && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--hairline)', fontSize: 11 }}>
              <div style={{ color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1, marginBottom: 2 }}>
                NEXT · {today[0].occurs_at ? new Date(today[0].occurs_at).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' }).toUpperCase() : ''}
              </div>
              <div style={{ color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {today[0].title}
              </div>
            </div>
          )}
          {/* Hero / tall: full agenda */}
          {(tier === 'hero' || tier === 'tall') && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
              <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}>
                AGENDA
              </div>
              {today.map((e) => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 11 }}>
                  <span style={{ color: 'oklch(0.85 0.14 200)', fontFamily: 'var(--font-mono)', minWidth: 48, fontSize: 10 }}>
                    {e.occurs_at ? new Date(e.occurs_at).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' }) : '—'}
                  </span>
                  <span style={{ color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <HeroNumber value={'—'} hue={200} size={size} gradient={[180, 240]} />
          <div style={{ fontSize: tier === 'hero' ? 13 : 11, color: 'var(--fg-3)', marginTop: 6, lineHeight: 1.4 }}>
            Nothing today. <span style={{ color: 'oklch(0.85 0.14 200)' }}>Add an event →</span>
          </div>
        </>
      )}
    </WidgetShell>
  );
};

const ListPreview: React.FC<WidgetRenderProps<{ kind?: string; limit?: number }>> = ({ size, config, onOpen }) => {
  const kind = (config.kind ?? 'reading') as z.infer<typeof ItemKind>;
  const tier = getTier(size);
  const fetchLimit = tier === 'hero' ? 12 : tier === 'tall' ? 8 : 5;
  const { data: items = [] } = useOp(itemsOps.list, { kind, limit: config.limit ?? fetchLimit });
  const open = items.filter((i) => i.status !== 'done');
  const done = items.filter((i) => i.status === 'done').length;
  const hue = 280;
  // Lines vary with tier: mini=2, wide=3, tall=6, hero(2x2)=5, hero(2x3/3x3)=10
  const lines = tier === 'mini' ? 2 : tier === 'wide' ? 3 : tier === 'tall' ? 6 : (size.h === 3 ? 10 : 5);
  return (
    <WidgetShell hue={hue} icon="grid" label={kind} size={size} onOpen={onOpen}
      accent={items.length > 0 ? <Chip tone="default" size="sm">{open.length} OPEN</Chip> : undefined}
    >
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 4, lineHeight: 1.4 }}>
          Empty {kind} list. <span style={{ color: `oklch(0.85 0.16 ${hue})` }}>Add an item →</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.slice(0, lines).map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 + i * 0.04 }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}
            >
              <span style={{
                width: 14, height: 14, borderRadius: 4,
                border: `1.5px solid oklch(0.78 0.16 ${hue} / ${item.status === 'done' ? 0.4 : 0.7})`,
                background: item.status === 'done' ? `oklch(0.78 0.16 ${hue} / 0.18)` : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {item.status === 'done' && <I.check size={9} stroke={`oklch(0.92 0.14 ${hue})`} sw={2.4} />}
              </span>
              <span style={{
                color: item.status === 'done' ? 'var(--fg-3)' : 'var(--fg-1)',
                textDecoration: item.status === 'done' ? 'line-through' : 'none',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
              }}>
                {item.title}
              </span>
            </motion.div>
          ))}
          {items.length > lines && (
            <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginTop: 2 }}>
              + {items.length - lines} MORE · {done} DONE
            </div>
          )}
        </div>
      )}
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
  const isLarge = size.w >= 2 && size.h >= 2;
  return (
    <WidgetShell hue={hue} icon="check" label="Today's rituals" size={size} onOpen={onOpen}
      accent={total > 0 && done === total ? <Chip tone="ok" size="sm">ALL DONE</Chip> : <Chip tone="default" size="sm">{done}/{total}</Chip>}
    >
      {/* Hero size — full habit list with rings */}
      {isLarge && habits.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflow: 'hidden' }}>
          {habits.slice(0, size.h === 3 ? 8 : 5).map((h) => {
            const Ic = I[h.icon as keyof typeof I] ?? I.check;
            const pct = Math.min(1, h.done / h.target);
            const isComplete = h.done >= h.target;
            return (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                  background: `oklch(0.78 0.16 ${h.hue} / ${isComplete ? 0.30 : 0.15})`,
                  border: `1px solid oklch(0.78 0.16 ${h.hue} / ${isComplete ? 0.6 : 0.30})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ic size={12} stroke={`oklch(0.92 0.14 ${h.hue})`} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.name}
                    </span>
                    <span style={{ fontSize: 10, color: `oklch(0.85 0.14 ${h.hue})`, fontFamily: 'var(--font-mono)', flexShrink: 0, marginLeft: 6 }}>
                      {h.done}/{h.target}
                    </span>
                  </div>
                  <div style={{ height: 3, borderRadius: 99, background: 'oklch(1 0 0 / 0.06)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct * 100}%`, height: '100%', background: `oklch(0.85 0.16 ${h.hue})` }} />
                  </div>
                </div>
              </div>
            );
          })}
          {habits.length > (size.h === 3 ? 8 : 5) && (
            <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, textAlign: 'center', marginTop: 2 }}>
              + {habits.length - (size.h === 3 ? 8 : 5)} more
            </div>
          )}
        </div>
      ) : closest ? (
        <>
          <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 4 }}>
            CLOSEST · TAP TO COMPLETE
          </div>
          <div className="display" style={{ fontSize: size.w >= 2 ? 18 : 14, fontWeight: 500, color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {closest.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
            <span className="display" style={{ fontSize: size.w >= 2 ? 24 : 18, fontWeight: 600, color: `oklch(0.92 0.14 ${closest.hue})`, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
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
  const presets = [25, 50, 90];
  return (
    <WidgetShell hue={140} icon="brain" label="Focus" size={size} onOpen={onOpen} glow
      accent={<motion.div
        animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.4, repeat: Infinity }}
        style={{ width: 8, height: 8, borderRadius: 99, background: 'oklch(0.78 0.18 140)', boxShadow: '0 0 8px oklch(0.78 0.18 140)' }}
      />}
    >
      <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 4 }}>
        DEEP WORK · NO PHONE
      </div>
      <div className="display" style={{ fontSize: size.w === 2 ? 22 : 16, fontWeight: 500, color: 'var(--fg-1)', lineHeight: 1.1 }}>
        Begin a session
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        {presets.map((m) => (
          <div key={m} style={{
            padding: '4px 8px', borderRadius: 6, fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: 0.5,
            background: 'oklch(0.78 0.16 140 / 0.15)',
            border: '1px solid oklch(0.78 0.16 140 / 0.30)',
            color: 'oklch(0.92 0.14 140)',
          }}>
            {m}M
          </div>
        ))}
      </div>
    </WidgetShell>
  );
};

const VitalsStrip: React.FC<WidgetRenderProps> = ({ size, onOpen }) => {
  const cells: { label: string; sub: string; hue: number; icon: keyof typeof I }[] = [
    { label: 'STEPS', sub: '/ 8k',  hue: 30,  icon: 'flame' },
    { label: 'HEART', sub: 'BPM',   hue: 0,   icon: 'heart' },
    { label: 'KCAL',  sub: '/ 2.2k', hue: 40, icon: 'flame' },
  ];
  return (
    <WidgetShell hue={20} icon="flame" label="Vitals" size={size} onOpen={onOpen}
      accent={<Chip tone="warn" size="sm">DEMO</Chip>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {cells.map((c) => {
          const Ic = I[c.icon] ?? I.sparkle;
          return (
            <div key={c.label} style={{
              padding: 8, borderRadius: 10,
              background: `linear-gradient(160deg, oklch(0.78 0.16 ${c.hue} / 0.10), transparent 80%)`,
              border: `1px solid oklch(0.78 0.16 ${c.hue} / 0.20)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Ic size={9} stroke={`oklch(0.92 0.14 ${c.hue})`} />
                <span style={{ fontSize: 8, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.2 }}>{c.label}</span>
              </div>
              <div className="display" style={{ fontSize: size.w === 2 ? 22 : 16, fontWeight: 600, color: `oklch(0.85 0.14 ${c.hue})`, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                —
              </div>
              <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                {c.sub}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 8, fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
        <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 5, height: 5, borderRadius: 99, background: 'oklch(0.78 0.18 25)', display: 'inline-block' }} />
        NO HEALTHKIT YET · CONNECT →
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
// 2 × 3 = 6 valid shapes on the mobile-first 2-col grid. Width is
// capped at 2 because a 3-wide cell becomes ~33% of viewport on a
// phone, too small for legible content. Height goes up to 3 so
// users can build tall, info-dense widgets.
const ALL_SIZES: WidgetSize[] = [
  { w: 1, h: 1 }, { w: 2, h: 1 },
  { w: 1, h: 2 }, { w: 2, h: 2 },
  { w: 1, h: 3 }, { w: 2, h: 3 },
];

export const WIDGET_TYPES: Record<WidgetType, WidgetDef<any>> = {
  hydration_today: {
    label: 'Hydration today',
    description: 'Today\'s ml + goal + progress bar.',
    icon: 'water', hue: 200,
    defaultSize: { w: 1, h: 1 },
    allowedSizes: ALL_SIZES,
    recommendedSizes: [{ w: 1, h: 1 }, { w: 2, h: 1 }, { w: 2, h: 2 }, { w: 3, h: 2 }],
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
    recommendedSizes: [{ w: 1, h: 1 }, { w: 2, h: 1 }, { w: 2, h: 2 }],
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
    recommendedSizes: [{ w: 1, h: 1 }, { w: 2, h: 1 }, { w: 2, h: 2 }],
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
    recommendedSizes: [{ w: 1, h: 1 }, { w: 2, h: 1 }, { w: 2, h: 2 }, { w: 3, h: 2 }, { w: 3, h: 3 }],
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
    recommendedSizes: [{ w: 1, h: 1 }, { w: 2, h: 1 }, { w: 2, h: 2 }],
    configSchema: noConfig,
    Component: StreakCounter,
  },
  next_quest: {
    label: 'Next quest',
    description: 'The next pending quest by rank.',
    icon: 'sparkle', hue: 260,
    defaultSize: { w: 1, h: 1 },
    allowedSizes: ALL_SIZES,
    recommendedSizes: [{ w: 2, h: 1 }, { w: 3, h: 1 }, { w: 2, h: 2 }, { w: 3, h: 2 }],
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
    recommendedSizes: [{ w: 2, h: 1 }, { w: 3, h: 1 }, { w: 2, h: 2 }, { w: 3, h: 2 }],
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
    recommendedSizes: [{ w: 2, h: 1 }, { w: 3, h: 1 }, { w: 2, h: 2 }, { w: 3, h: 2 }, { w: 3, h: 3 }],
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
    recommendedSizes: [{ w: 2, h: 1 }, { w: 3, h: 1 }, { w: 2, h: 2 }, { w: 3, h: 2 }, { w: 3, h: 3 }],
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
    recommendedSizes: [{ w: 2, h: 1 }, { w: 3, h: 1 }, { w: 2, h: 2 }, { w: 3, h: 2 }],
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
    recommendedSizes: [{ w: 1, h: 1 }, { w: 2, h: 1 }, { w: 2, h: 2 }],
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
    recommendedSizes: [{ w: 2, h: 1 }, { w: 3, h: 1 }, { w: 2, h: 2 }, { w: 3, h: 2 }, { w: 2, h: 3 }, { w: 3, h: 3 }],
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
    recommendedSizes: [{ w: 2, h: 1 }, { w: 3, h: 1 }, { w: 2, h: 2 }],
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
    recommendedSizes: [{ w: 2, h: 1 }, { w: 3, h: 1 }, { w: 3, h: 2 }],
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
    recommendedSizes: [{ w: 2, h: 1 }, { w: 3, h: 1 }, { w: 2, h: 2 }, { w: 3, h: 2 }, { w: 2, h: 3 }, { w: 3, h: 3 }],
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
