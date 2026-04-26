/* Nik — Hydration screen.
 *
 * Today's progress + quick-add buttons + intake history. Bumps the
 * matching Hydrate habit automatically when the user logs (handled
 * server-side by hydration.log).
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import type { ScreenProps } from '../App';
import { I } from '../components/icons';
import { Chip, HUDCorner } from '../components/primitives';
import { useOp, useOpMutation } from '../lib/useOp';
import { hydration as hydrationOps } from '../contracts/hydration';
import type { HydrationIntake } from '../contracts/hydration';

const QUICK_ADD = [
  { ml: 250,  label: 'Glass',  icon: 'water' as const },
  { ml: 500,  label: 'Bottle', icon: 'water' as const },
  { ml: 1000, label: 'Litre',  icon: 'water' as const },
];

const HUE = 200; // hydration uses a watery teal-blue

export default function HydrationScreen(_p: ScreenProps) {
  const { data: today } = useOp(hydrationOps.today, {});
  const { data: recent = [] } = useOp(hydrationOps.recent, { limit: 30 });
  const log = useOpMutation(hydrationOps.log);
  const remove = useOpMutation(hydrationOps.remove);
  const qc = useQueryClient();

  const totalMl = today?.totalMl ?? 0;
  const goalMl = today?.goalMl ?? 2000;
  const pct = Math.min(1, totalMl / goalMl);
  const goalGlasses = Math.round(goalMl / 250);
  const doneGlasses = Math.round(totalMl / 250);

  const add = async (ml: number) => {
    await log.mutateAsync({ ml });
    await qc.invalidateQueries({ queryKey: ['hydration.today'] });
    await qc.invalidateQueries({ queryKey: ['hydration.recent'] });
    await qc.invalidateQueries({ queryKey: ['habits.list'] });
  };

  const undo = async (intake: HydrationIntake) => {
    await remove.mutateAsync({ id: intake.id });
    await qc.invalidateQueries({ queryKey: ['hydration.today'] });
    await qc.invalidateQueries({ queryKey: ['hydration.recent'] });
  };

  return (
    <div style={{ padding: '8px 16px 100px', color: 'var(--fg)' }}>
      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)' }}>
            TODAY · {goalMl} ML GOAL
          </div>
          <div className="display" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>
            Hydration
          </div>
        </div>
        <Chip tone={pct >= 1 ? 'ok' : 'accent'} size="lg">
          {doneGlasses} / {goalGlasses} GLASSES
        </Chip>
      </div>

      {/* Big progress hero */}
      <div className="glass scanlines fade-up" style={{
        padding: 22, marginBottom: 18, position: 'relative', overflow: 'hidden',
        background: `linear-gradient(135deg, oklch(0.78 0.16 ${HUE} / 0.18), oklch(0.55 0.22 ${HUE + 60} / 0.08))`,
        borderColor: `oklch(0.78 0.16 ${HUE} / 0.32)`,
      }}>
        <HUDCorner position="tl" /><HUDCorner position="tr" /><HUDCorner position="bl" /><HUDCorner position="br" />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div className="display" style={{ fontSize: 48, fontWeight: 600, color: `oklch(0.92 0.16 ${HUE})`, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {totalMl.toLocaleString()}
          </div>
          <div style={{ fontSize: 16, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
            ML
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 14, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
            of {goalMl.toLocaleString()}
          </div>
        </div>
        <div style={{ marginTop: 14, height: 10, borderRadius: 99, background: 'oklch(1 0 0 / 0.06)', overflow: 'hidden', position: 'relative' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              height: '100%', borderRadius: 99,
              background: `linear-gradient(90deg, oklch(0.78 0.16 ${HUE}), oklch(0.65 0.20 ${HUE + 40}))`,
              boxShadow: `0 0 12px oklch(0.78 0.16 ${HUE} / 0.5)`,
            }}
          />
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>
          {pct >= 1
            ? '✓ Goal hit. Keep going if you like.'
            : `${Math.round(goalMl - totalMl)} ml to go.`}
        </div>
      </div>

      {/* Quick add */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 18 }}>
        {QUICK_ADD.map((q) => {
          const Ic = I[q.icon];
          return (
            <motion.div
              key={q.ml}
              whileTap={{ scale: 0.96 }}
              onClick={() => void add(q.ml)}
              className="glass tap"
              style={{
                padding: 14, borderRadius: 14, textAlign: 'center',
                background: `linear-gradient(135deg, oklch(0.78 0.16 ${HUE} / 0.10), transparent 70%)`,
                borderColor: `oklch(0.78 0.16 ${HUE} / 0.28)`,
              }}
            >
              <Ic size={22} stroke={`oklch(0.92 0.14 ${HUE})`} />
              <div className="display" style={{ fontSize: 18, fontWeight: 600, color: `oklch(0.92 0.16 ${HUE})`, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
                +{q.ml}
              </div>
              <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginTop: 2 }}>
                {q.label.toUpperCase()}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* History */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)' }}>
          HISTORY · {recent.length} EVENTS
        </div>
      </div>
      {recent.length === 0 && (
        <div className="glass" style={{
          padding: 22, textAlign: 'center', color: 'var(--fg-3)',
          fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 0.5,
        }}>
          NO INTAKES YET — TAP ABOVE TO LOG ONE
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {recent.map((i) => (
          <div key={i.id} className="glass fade-up" style={{
            padding: 10, display: 'flex', alignItems: 'center', gap: 10, borderRadius: 10,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: `oklch(0.78 0.16 ${HUE} / 0.18)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <I.water size={13} stroke={`oklch(0.92 0.14 ${HUE})`} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}>
                {i.ml} ml
              </div>
              <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
                {fmtTime(i.occurred_at)} · {i.source}
              </div>
            </div>
            <div onClick={() => void undo(i)} className="tap" style={{
              width: 28, height: 28, borderRadius: 8, opacity: 0.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <I.close size={13} stroke="var(--fg-3)" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return sameDay ? time : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${time}`;
}
