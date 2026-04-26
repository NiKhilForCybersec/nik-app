/* Nik — menstrual cycle screen.
 *
 * Hero card shows current phase + cycle day + days-until-next.
 * Quick-log buttons for period start/end + symptoms. History list
 * grouped by date. Reads via cycle.today / cycle.history; writes
 * via cycle.logPeriodStart / End / Symptom + cycle.remove.
 *
 * Health-sensitive — never auto-shared via the family circle.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import type { ScreenProps } from '../App';
import { I } from '../components/icons';
import { Chip, HUDCorner } from '../components/primitives';
import { useOp, useOpMutation } from '../lib/useOp';
import { cycle as cycleOps } from '../contracts/cycle';
import type { CycleEvent, CyclePhase } from '../contracts/cycle';

const HUE = 320;

const PHASE_META: Record<CyclePhase, { label: string; copy: string; hue: number }> = {
  menstrual:  { label: 'Menstrual',  copy: 'Take it easy. Rest is real work.',                 hue: 25  },
  follicular: { label: 'Follicular', copy: 'Energy building. A good time to plan and start.',  hue: 60  },
  ovulation:  { label: 'Ovulation',  copy: 'Peak energy + drive. Lean into it.',               hue: 150 },
  luteal:     { label: 'Luteal',     copy: 'Wind down. Listen to the small signals.',          hue: 280 },
  unknown:    { label: 'Unknown',    copy: 'Log a period start to begin tracking.',            hue: 220 },
};

const QUICK_SYMPTOMS = [
  'cramps', 'headache', 'bloating', 'fatigue',
  'breast tenderness', 'acne', 'mood swing', 'low energy',
];

export default function CycleScreen(_p: ScreenProps) {
  const { data: today } = useOp(cycleOps.today, {});
  const logStart = useOpMutation(cycleOps.logPeriodStart);
  const logEnd = useOpMutation(cycleOps.logPeriodEnd);
  const logSymptom = useOpMutation(cycleOps.logSymptom);
  const remove = useOpMutation(cycleOps.remove);
  const qc = useQueryClient();

  const phase = today?.phase ?? 'unknown';
  const meta = PHASE_META[phase];
  const phaseHue = meta.hue;

  const refresh = () => qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith('cycle.') });

  const onStart = async () => { await logStart.mutateAsync({}); await refresh(); };
  const onEnd = async () => { await logEnd.mutateAsync({}); await refresh(); };
  const onSymptom = async (s: string) => { await logSymptom.mutateAsync({ symptom: s }); await refresh(); };
  const onRemove = async (e: CycleEvent) => { await remove.mutateAsync({ id: e.id }); await refresh(); };

  const events = today?.recentEvents ?? [];
  const grouped = React.useMemo(() => {
    const map = new Map<string, CycleEvent[]>();
    for (const e of events) {
      if (!map.has(e.occurred_on)) map.set(e.occurred_on, []);
      map.get(e.occurred_on)!.push(e);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [events]);

  return (
    <div style={{ padding: '8px 16px 100px', color: 'var(--fg)' }}>
      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)' }}>
            {today?.cycleLength ?? 28}-DAY AVERAGE
          </div>
          <div className="display" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>
            Cycle
          </div>
        </div>
        <Chip tone="default" size="sm">PRIVATE</Chip>
      </div>

      {/* Phase hero */}
      <div className="glass scanlines fade-up" style={{
        padding: 20, marginBottom: 16, position: 'relative', overflow: 'hidden',
        background: `linear-gradient(135deg, oklch(0.78 0.16 ${phaseHue} / 0.18), oklch(0.55 0.22 ${phaseHue + 60} / 0.08))`,
        borderColor: `oklch(0.78 0.16 ${phaseHue} / 0.32)`,
      }}>
        <HUDCorner position="tl" /><HUDCorner position="tr" /><HUDCorner position="bl" /><HUDCorner position="br" />
        <div style={{ fontSize: 10, color: `oklch(0.92 0.16 ${phaseHue})`, letterSpacing: 2, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
          PHASE · {meta.label.toUpperCase()}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
          <div className="display" style={{ fontSize: 48, fontWeight: 600, color: `oklch(0.92 0.16 ${phaseHue})`, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {today?.cycleDay ?? '—'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
            day {today?.cycleDay ? `of ${today.cycleLength}` : ''}
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--fg-2)', marginBottom: 12, lineHeight: 1.5 }}>
          {meta.copy}
        </div>
        {today?.daysUntilNext != null && (
          <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>
            Next period in {today.daysUntilNext} day{today.daysUntilNext === 1 ? '' : 's'}
            {today.predictedNextStart && ` · ${fmtDate(today.predictedNextStart)}`}
          </div>
        )}
      </div>

      {/* Quick log row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <motion.div
          whileTap={{ scale: 0.96 }}
          onClick={onStart}
          className="glass tap"
          style={{
            flex: 1, padding: 12, borderRadius: 12, textAlign: 'center',
            background: `linear-gradient(135deg, oklch(0.78 0.16 25 / 0.15), transparent 70%)`,
            borderColor: `oklch(0.78 0.16 25 / 0.35)`,
          }}
        >
          <div style={{ fontSize: 10, color: 'oklch(0.9 0.16 25)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}>
            PERIOD STARTED
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg)', marginTop: 4 }}>Today</div>
        </motion.div>
        <motion.div
          whileTap={{ scale: 0.96 }}
          onClick={onEnd}
          className="glass tap"
          style={{
            flex: 1, padding: 12, borderRadius: 12, textAlign: 'center',
            background: `linear-gradient(135deg, oklch(0.78 0.16 200 / 0.10), transparent 70%)`,
            borderColor: `oklch(0.78 0.16 200 / 0.28)`,
          }}
        >
          <div style={{ fontSize: 10, color: 'oklch(0.9 0.14 200)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}>
            ENDED
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg)', marginTop: 4 }}>Today</div>
        </motion.div>
      </div>

      {/* Symptoms */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
          LOG A SYMPTOM
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {QUICK_SYMPTOMS.map((s) => (
            <div
              key={s}
              onClick={() => void onSymptom(s)}
              className="tap"
              style={{
                padding: '7px 12px', borderRadius: 99, fontSize: 12,
                background: `oklch(0.78 0.16 ${HUE} / 0.10)`,
                border: `1px solid oklch(0.78 0.16 ${HUE} / 0.3)`,
                color: 'var(--fg-2)',
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
          HISTORY · {events.length} ENTRIES
        </div>
        {grouped.length === 0 && (
          <div className="glass" style={{
            padding: 18, textAlign: 'center', color: 'var(--fg-3)',
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 0.5,
          }}>
            NO ENTRIES YET — TAP ABOVE TO LOG
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {grouped.map(([dateKey, items]) => (
            <div key={dateKey}>
              <div style={{ fontSize: 11, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5, marginBottom: 5 }}>
                {fmtDateHeader(dateKey)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {items.map((e) => <Row key={e.id} event={e} onRemove={() => onRemove(e)} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const KIND_LABEL: Record<CycleEvent['kind'], { label: string; hue: number; icon: keyof typeof I }> = {
  period_start: { label: 'period started', hue: 25,  icon: 'flame' },
  period_end:   { label: 'period ended',   hue: 200, icon: 'check' },
  symptom:      { label: 'symptom',        hue: 320, icon: 'heart' },
  mood:         { label: 'mood',           hue: 280, icon: 'sparkle' },
  note:         { label: 'note',           hue: 220, icon: 'book' },
};

const Row: React.FC<{ event: CycleEvent; onRemove: () => void }> = ({ event, onRemove }) => {
  const meta = KIND_LABEL[event.kind];
  const Ic = I[meta.icon];
  const detail = event.kind === 'symptom'
    ? String((event.payload as { symptom?: string }).symptom ?? '')
    : event.kind === 'period_start'
    ? `period started${(event.payload as { flow?: string }).flow ? ` · ${(event.payload as { flow?: string }).flow}` : ''}`
    : meta.label;
  return (
    <div className="glass fade-up" style={{
      padding: 8, display: 'flex', alignItems: 'center', gap: 10, borderRadius: 8,
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: 7,
        background: `oklch(0.78 0.16 ${meta.hue} / 0.18)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Ic size={11} stroke={`oklch(0.92 0.16 ${meta.hue})`} />
      </div>
      <div style={{ flex: 1, fontSize: 12, color: 'var(--fg-2)', textTransform: 'lowercase' }}>
        {detail}
      </div>
      <div onClick={onRemove} className="tap" style={{
        width: 26, height: 26, borderRadius: 7, opacity: 0.5,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <I.close size={12} stroke="var(--fg-3)" />
      </div>
    </div>
  );
};

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function fmtDateHeader(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return 'TODAY';
  if (diff === 1) return 'YESTERDAY';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();
}
