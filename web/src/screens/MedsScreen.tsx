/* Nik — Meds screen: granular medication/supplement scheduling.
   Supports daily, every-N-days, weekly picker, cycled (N on/M off), tapered, PRN, course. */

import React from 'react';
import type { ScreenProps } from '../App';
import { getTheme } from '../theme/themes';
import { I } from '../components/icons';
import { Ring, Chip } from '../components/primitives';
import { AddMedSheet, AiMedChatSheet, MedDetailSheet } from '../components/sheets/MedsSheets';

type Schedule = {
  kind: string;
  time?: string;
  n?: number;
  days?: string[];
  onDays?: number;
  offDays?: number;
  cycleDay?: number;
  startDate?: string;
  perDay?: number;
  times?: string[];
  courseDay?: number;
  currentDose?: number | string;
  unit?: string;
  day?: number;
  maxPerDay?: number;
  minGapHours?: number;
};

type Med = {
  id: string;
  name: string;
  dose: string;
  icon: string;
  schedule: Schedule;
  nextDose: string;
  streak?: number;
  takenToday: boolean | number;
  due?: boolean;
  for: string;
  source: string;
  note?: string;
  courseDay?: number;
  courseOf?: number;
};

const MEDS_SEED: Med[] = [
  {
    id: 'm1', name: 'Vitamin D3', dose: '2000 IU', icon: 'sun',
    schedule: { kind: 'daily', time: '08:00' },
    nextDose: 'Today 08:00', streak: 42, takenToday: true, for: 'self',
    source: 'manual', note: 'With breakfast',
  },
  {
    id: 'm2', name: 'B12 (Methylcobalamin)', dose: '500 mcg', icon: 'pill',
    schedule: { kind: 'every-n-days', n: 3, time: '09:00' },
    nextDose: 'Tomorrow 09:00', streak: 8, takenToday: true, for: 'self',
    source: 'voice', note: 'Extracted from voice: "every 3 days at 9"',
  },
  {
    id: 'm3', name: 'Multi-vitamin', dose: '1 tab', icon: 'pill',
    schedule: { kind: 'daily', time: '08:00' },
    nextDose: 'Today 08:00', streak: 21, takenToday: false, due: true, for: 'self',
    source: 'manual',
  },
  {
    id: 'm4', name: 'Iron + Folate', dose: '65 mg', icon: 'pill',
    schedule: { kind: 'weekly', days: ['sun'], time: '10:00' },
    nextDose: 'Sunday 10:00', streak: 12, takenToday: false, for: 'self',
    source: 'manual', note: 'Avoid with tea/coffee',
  },
  {
    id: 'm5', name: 'Amoxicillin 500mg', dose: '1 cap × 3/day', icon: 'pill',
    schedule: { kind: 'course', startDate: '2026-04-18', perDay: 3, times: ['08:00', '14:00', '20:00'] },
    nextDose: 'Today 14:00', courseDay: 3, courseOf: 7, takenToday: false, for: 'self',
    source: 'prescription', note: "Auto-extracted from Dr. Menon's Rx · Apr 18",
  },
  {
    id: 'm6', name: 'Anya — Montelukast', dose: '4 mg chew', icon: 'pill',
    schedule: { kind: 'daily', time: '20:00' },
    nextDose: 'Today 20:00', streak: 104, takenToday: false, for: 'anya',
    source: 'prescription', note: 'Pediatric · at bedtime',
  },
  {
    id: 'm7', name: 'Omega-3', dose: '1000 mg × 2', icon: 'pill',
    schedule: { kind: 'cycled', onDays: 21, offDays: 7, cycleDay: 14, time: '08:00' },
    nextDose: 'Today 08:00', streak: 14, takenToday: true, for: 'self',
    source: 'manual',
  },
  {
    id: 'm8', name: 'Ibuprofen (PRN)', dose: '400 mg', icon: 'pill',
    schedule: { kind: 'prn', maxPerDay: 3, minGapHours: 6 },
    nextDose: 'As needed', takenToday: 0, for: 'self',
    source: 'manual', note: 'Max 3/day, 6h apart',
  },
];

const scheduleLabel = (s: Schedule): string => {
  if (!s) return 'As needed';
  switch (s.kind) {
    case 'daily': return 'Daily at ' + s.time;
    case 'every-n-days': return `Every ${s.n} days at ${s.time}`;
    case 'weekly': return `${(s.days || []).map(d => d[0].toUpperCase() + d.slice(1, 3)).join(', ')} at ${s.time}`;
    case 'cycled': return `${s.onDays} on / ${s.offDays} off · day ${s.cycleDay}/${s.onDays}`;
    case 'course': return `Course · day ${s.courseDay || 1}/${s.day || 7} · ${s.perDay}× daily`;
    case 'tapered': return `Taper · ${s.currentDose}${s.unit} (day ${s.day})`;
    case 'prn': return `As needed · max ${s.maxPerDay}/day`;
    default: return '';
  }
};

export default function MedsScreen({ themeId = 'solo-leveling' }: ScreenProps) {
  // Touch theme (kept for parity with prototype) — currently unused but matches prototype.
  void getTheme(themeId);
  const [meds, setMeds] = React.useState<Med[]>(MEDS_SEED);
  const [filter, setFilter] = React.useState<string>('all');
  const [addOpen, setAddOpen] = React.useState(false);
  const [aiChatOpen, setAiChatOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Med | null>(null);

  const toggleTaken = (id: string) => setMeds(ms => ms.map(m => {
    if (m.id !== id) return m;
    if (m.schedule.kind === 'prn') return { ...m, takenToday: ((m.takenToday as number) || 0) + 1 };
    const wasTaken = !!m.takenToday;
    return { ...m, takenToday: !wasTaken, streak: !wasTaken ? (m.streak || 0) + 1 : Math.max(0, (m.streak || 0) - 1) };
  }));

  const addMed = (newMed: any) => {
    setMeds(ms => [...ms, { id: 'm' + Date.now(), streak: 0, takenToday: false, ...newMed }]);
    setAddOpen(false);
    setAiChatOpen(false);
  };

  const removeMed = (id: string) => setMeds(ms => ms.filter(m => m.id !== id));

  const filtered = meds.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'today') return m.schedule.kind === 'daily' || m.schedule.kind === 'every-n-days' || m.schedule.kind === 'course' || (m.schedule.kind === 'cycled' && (m.schedule.cycleDay ?? 0) <= (m.schedule.onDays ?? 0));
    if (filter === 'self') return m.for === 'self';
    if (filter === 'kids') return m.for !== 'self';
    if (filter === 'course') return m.schedule.kind === 'course' || m.schedule.kind === 'tapered';
    return true;
  });

  const dueCount = meds.filter(m => !m.takenToday && m.schedule.kind !== 'prn').length;
  const takenCount = meds.filter(m => m.takenToday).length;

  return (
    <div style={{ padding: '8px 16px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>MEDS · TODAY</div>
          <div className="display" style={{ fontSize: 26, fontWeight: 'var(--display-weight, 500)' as any, lineHeight: 1.1, marginTop: 4, textTransform: 'var(--display-case, none)' as any, letterSpacing: 'var(--display-tracking, 0)' as any }}>Medications</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div onClick={() => setAiChatOpen(true)} className="tap" style={{ padding: '7px 11px', borderRadius: 99, fontSize: 11, background: 'oklch(0.78 0.16 var(--hue) / 0.18)', border: '1px solid oklch(0.78 0.16 var(--hue) / 0.4)', color: 'oklch(0.9 0.14 var(--hue))', display: 'flex', alignItems: 'center', gap: 5 }}>
            <I.mic size={11}/> AI add
          </div>
        </div>
      </div>

      {/* Summary ring card */}
      <div className="glass fade-up" style={{ padding: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ position: 'relative' }}>
          <Ring size={80} pct={meds.length ? takenCount / (takenCount + dueCount || 1) : 0} sw={5}/>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="display" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1 }}>{takenCount}</div>
            <div style={{ fontSize: 8, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginTop: 2 }}>OF {takenCount + dueCount}</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="display" style={{ fontSize: 15, fontWeight: 500 }}>{dueCount > 0 ? `${dueCount} doses pending` : 'All caught up'}</div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.4, marginTop: 4 }}>
            Next: <b style={{ color: 'oklch(0.9 0.14 var(--hue))' }}>Multi-vitamin</b> · now
          </div>
          <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
            <MiniStat icon="flame" value={42} label="longest streak"/>
            <MiniStat icon="refresh" value={meds.length} label="active"/>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto', paddingBottom: 2 }}>
        {([
          ['all', 'All', meds.length],
          ['today', 'Today', dueCount + takenCount],
          ['self', 'Mine', meds.filter(m => m.for === 'self').length],
          ['kids', 'Kids', meds.filter(m => m.for !== 'self').length],
          ['course', 'Course', meds.filter(m => ['course', 'tapered'].includes(m.schedule.kind)).length],
        ] as const).map(([k, l, n]) => (
          <div key={k} onClick={() => setFilter(k)} className="tap" style={{ padding: '6px 11px', borderRadius: 99, fontSize: 11, whiteSpace: 'nowrap', background: filter === k ? 'oklch(0.78 0.16 var(--hue) / 0.2)' : 'oklch(1 0 0 / 0.04)', border: '1px solid ' + (filter === k ? 'oklch(0.78 0.16 var(--hue) / 0.4)' : 'var(--hairline)'), color: filter === k ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)', display: 'flex', alignItems: 'center', gap: 5 }}>
            {l} <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', opacity: 0.7 }}>{n}</span>
          </div>
        ))}
      </div>

      {/* Med cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(m => <MedCard key={m.id} med={m} onToggle={() => toggleTaken(m.id)} onOpen={() => setSelected(m)}/>)}
      </div>

      {/* Add card */}
      <div onClick={() => setAddOpen(true)} className="tap" style={{ marginTop: 10, padding: 12, borderRadius: 12, border: '1.5px dashed var(--hairline-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--fg-2)', fontSize: 12 }}>
        <I.plus size={14}/> Add medication
      </div>

      {/* Entry method cards */}
      <div style={{ marginTop: 14, fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 6 }}>QUICK ADD</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <MedQuickAddCard icon="camera" title="Scan Rx" sub="Photo of prescription" onClick={() => setAddOpen(true)}/>
        <MedQuickAddCard icon="mic" title="Voice" sub="'B12 every 3 days'" onClick={() => setAiChatOpen(true)}/>
      </div>

      {/* Sheets */}
      {addOpen && <AddMedSheet onClose={() => setAddOpen(false)} onAdd={addMed}/>}
      {aiChatOpen && <AiMedChatSheet onClose={() => setAiChatOpen(false)} onAdd={addMed}/>}
      {selected && <MedDetailSheet med={selected} onClose={() => setSelected(null)} onRemove={() => { removeMed(selected.id); setSelected(null); }}/>}
    </div>
  );
}

// ── MED CARD ───────────────────────────────────────
const MedCard: React.FC<{ med: Med; onToggle: () => void; onOpen: () => void }> = ({ med, onToggle, onOpen }) => {
  const Ic = I[med.icon] || I.target;
  const isCourse = med.schedule.kind === 'course';
  const isPRN = med.schedule.kind === 'prn';
  const due = !med.takenToday && !isPRN;
  const kid: { name: string } | null = null; // KIDS lookup not available yet — defer to family-ops port.
  return (
    <div className="glass fade-up" style={{ padding: 12, display: 'flex', alignItems: 'flex-start', gap: 10, position: 'relative', borderColor: due ? 'oklch(0.78 0.16 var(--hue) / 0.25)' : undefined }}>
      {/* Icon + pill shape */}
      <div style={{ width: 42, height: 42, borderRadius: 12, background: `oklch(0.78 0.16 var(--hue) / 0.12)`, border: '1px solid oklch(0.78 0.16 var(--hue) / 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ic size={18} stroke="oklch(0.9 0.14 var(--hue))"/>
      </div>

      <div style={{ flex: 1, minWidth: 0 }} onClick={onOpen}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 2 }}>
          <div className="display" style={{ fontSize: 14, fontWeight: 500 }}>{med.name}</div>
          {kid && <Chip tone="accent" size="sm">{(kid as { name: string }).name.toUpperCase()}</Chip>}
          {isCourse && <Chip tone="warn" size="sm">DAY {med.courseDay}/{med.courseOf}</Chip>}
          {med.source === 'prescription' && <Chip size="sm">Rx</Chip>}
          {med.source === 'voice' && <Chip size="sm">AI</Chip>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-2)', marginBottom: 3 }}>{med.dose}</div>
        <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', flexWrap: 'wrap' }}>
          <span>{scheduleLabel(med.schedule).toUpperCase()}</span>
          {(med.streak ?? 0) > 0 && <span>· 🔥 {med.streak}d</span>}
        </div>
        {med.note && <div style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 4, fontStyle: 'italic' }}>{med.note}</div>}
      </div>

      {/* Action */}
      {isPRN ? (
        <div onClick={onToggle} className="tap" style={{ padding: '7px 10px', borderRadius: 10, background: 'oklch(1 0 0 / 0.05)', border: '1px solid var(--hairline)', fontSize: 11, color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <I.plus size={10}/> Log ({(med.takenToday as number) || 0}/{med.schedule.maxPerDay})
        </div>
      ) : (
        <div onClick={onToggle} className="tap" style={{ width: 36, height: 36, borderRadius: 10, background: med.takenToday ? 'oklch(0.78 0.15 150 / 0.25)' : 'oklch(0.78 0.16 var(--hue) / 0.15)', border: '1px solid ' + (med.takenToday ? 'oklch(0.78 0.15 150 / 0.5)' : 'oklch(0.78 0.16 var(--hue) / 0.4)'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {med.takenToday ? <I.check size={16} stroke="oklch(0.85 0.14 150)"/> : <I.plus size={16} stroke="oklch(0.9 0.14 var(--hue))"/>}
        </div>
      )}
    </div>
  );
};

const MiniStat: React.FC<{ icon: string; value: number; label: string }> = ({ icon, value, label }) => {
  const Ic = I[icon] || I.target;
  return (
    <div style={{ padding: '4px 8px', borderRadius: 99, background: 'oklch(1 0 0 / 0.05)', border: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--fg-2)' }}>
      <Ic size={10}/> <b style={{ color: 'var(--fg)' }}>{value}</b> <span style={{ color: 'var(--fg-3)' }}>{label}</span>
    </div>
  );
};

const MedQuickAddCard: React.FC<{ icon: string; title: string; sub: string; onClick: () => void }> = ({ icon, title, sub, onClick }) => {
  const Ic = I[icon] || I.plus;
  return (
    <div onClick={onClick} className="tap glass" style={{ padding: 11, display: 'flex', alignItems: 'center', gap: 9 }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: 'oklch(0.78 0.16 var(--hue) / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Ic size={14} stroke="oklch(0.9 0.14 var(--hue))"/>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg)' }}>{title}</div>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  );
};
