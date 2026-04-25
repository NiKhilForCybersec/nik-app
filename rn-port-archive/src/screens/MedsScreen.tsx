import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Tile, Chip, Ring, Icon, ScreenHeader } from '../components';
import { colors, monoFont } from '../theme';
import type { NavProps } from '../router';

// ── Inlined mock data (from prototype meds.jsx) ───────────────────
type Schedule =
  | { kind: 'daily'; time: string }
  | { kind: 'every-n-days'; n: number; time: string }
  | { kind: 'weekly'; days: string[]; time: string }
  | { kind: 'cycled'; onDays: number; offDays: number; cycleDay: number; time: string }
  | { kind: 'course'; startDate: string; days: number; perDay: number; times: string[] }
  | { kind: 'tapered'; currentDose: number; unit: string; day: number }
  | { kind: 'prn'; maxPerDay: number; minGapHours: number };

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
  for: 'self' | 'kiaan' | 'anya';
  source: 'manual' | 'voice' | 'prescription';
  note?: string;
  courseDay?: number;
  courseOf?: number;
};

const MEDS_SEED: Med[] = [
  { id: 'm1', name: 'Vitamin D3', dose: '2000 IU', icon: 'sparkle',
    schedule: { kind: 'daily', time: '08:00' }, nextDose: 'Today 08:00',
    streak: 42, takenToday: true, for: 'self', source: 'manual', note: 'With breakfast' },
  { id: 'm2', name: 'B12 (Methylcobalamin)', dose: '500 mcg', icon: 'pill',
    schedule: { kind: 'every-n-days', n: 3, time: '09:00' }, nextDose: 'Tomorrow 09:00',
    streak: 8, takenToday: true, for: 'self', source: 'voice',
    note: 'Extracted from voice: "every 3 days at 9"' },
  { id: 'm3', name: 'Multi-vitamin', dose: '1 tab', icon: 'pill',
    schedule: { kind: 'daily', time: '08:00' }, nextDose: 'Today 08:00',
    streak: 21, takenToday: false, due: true, for: 'self', source: 'manual' },
  { id: 'm4', name: 'Iron + Folate', dose: '65 mg', icon: 'pill',
    schedule: { kind: 'weekly', days: ['sun'], time: '10:00' }, nextDose: 'Sunday 10:00',
    streak: 12, takenToday: false, for: 'self', source: 'manual',
    note: 'Avoid with tea/coffee' },
  { id: 'm5', name: 'Amoxicillin 500mg', dose: '1 cap × 3/day', icon: 'pill',
    schedule: { kind: 'course', startDate: '2026-04-18', days: 7, perDay: 3, times: ['08:00', '14:00', '20:00'] },
    nextDose: 'Today 14:00', courseDay: 3, courseOf: 7, takenToday: false, for: 'self',
    source: 'prescription', note: "Auto-extracted from Dr. Menon's Rx · Apr 18" },
  { id: 'm6', name: 'Anya — Montelukast', dose: '4 mg chew', icon: 'pill',
    schedule: { kind: 'daily', time: '20:00' }, nextDose: 'Today 20:00',
    streak: 104, takenToday: false, for: 'anya', source: 'prescription',
    note: 'Pediatric · at bedtime' },
  { id: 'm7', name: 'Omega-3', dose: '1000 mg × 2', icon: 'pill',
    schedule: { kind: 'cycled', onDays: 21, offDays: 7, cycleDay: 14, time: '08:00' },
    nextDose: 'Today 08:00', streak: 14, takenToday: true, for: 'self', source: 'manual' },
  { id: 'm8', name: 'Ibuprofen (PRN)', dose: '400 mg', icon: 'pill',
    schedule: { kind: 'prn', maxPerDay: 3, minGapHours: 6 }, nextDose: 'As needed',
    takenToday: 0, for: 'self', source: 'manual', note: 'Max 3/day, 6h apart' },
];

const KID_NAMES: Record<string, string> = { kiaan: 'Kiaan', anya: 'Anya' };

const scheduleLabel = (s: Schedule): string => {
  switch (s.kind) {
    case 'daily': return 'Daily at ' + s.time;
    case 'every-n-days': return `Every ${s.n} days at ${s.time}`;
    case 'weekly':
      return `${s.days.map(d => d[0].toUpperCase() + d.slice(1, 3)).join(', ')} at ${s.time}`;
    case 'cycled':
      return `${s.onDays} on / ${s.offDays} off · day ${s.cycleDay}/${s.onDays}`;
    case 'course':
      return `Course · ${s.perDay}× daily`;
    case 'tapered':
      return `Taper · ${s.currentDose}${s.unit} (day ${s.day})`;
    case 'prn':
      return `As needed · max ${s.maxPerDay}/day`;
  }
};

// ── Sub components ────────────────────────────────────────────────
const MiniStat = ({ icon, value, label }: { icon: string; value: number; label: string }) => (
  <View style={{
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  }}>
    <Icon name={icon} size={10} color={colors.fg2} />
    <Text style={{ fontSize: 10, color: colors.fg, fontWeight: '700' }}>{value}</Text>
    <Text style={{ fontSize: 10, color: colors.fg3 }}>{label}</Text>
  </View>
);

const MedQuickAddCard = ({ icon, title, sub }: { icon: string; title: string; sub: string }) => (
  <Tile style={{ padding: 11, flex: 1 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
      <View style={{
        width: 30, height: 30, borderRadius: 9, backgroundColor: colors.accentSoft,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={14} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, fontWeight: '500', color: colors.fg }}>{title}</Text>
        <Text style={{ fontSize: 10, color: colors.fg3, fontFamily: monoFont, marginTop: 1 }}>{sub}</Text>
      </View>
    </View>
  </Tile>
);

const MedCard = ({ med, onToggle }: { med: Med; onToggle: () => void }) => {
  const isCourse = med.schedule.kind === 'course';
  const isPRN = med.schedule.kind === 'prn';
  const due = !med.takenToday && !isPRN;
  const kidName = med.for !== 'self' ? KID_NAMES[med.for] : null;
  const taken = typeof med.takenToday === 'boolean' ? med.takenToday : med.takenToday > 0;
  const prnCount = typeof med.takenToday === 'number' ? med.takenToday : 0;
  const prnMax = med.schedule.kind === 'prn' ? med.schedule.maxPerDay : 0;
  return (
    <Tile style={{ padding: 12, borderColor: due ? colors.accentBorder : colors.hairline }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View style={{
          width: 42, height: 42, borderRadius: 12,
          backgroundColor: colors.accentSoft,
          borderWidth: 1, borderColor: colors.accentBorder,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={med.icon} size={18} color={colors.accent} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 2 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.fg }}>{med.name}</Text>
            {kidName && <Chip tone="accent" size="sm">{kidName.toUpperCase()}</Chip>}
            {isCourse && (
              <Chip tone="warn" size="sm">DAY {med.courseDay}/{med.courseOf}</Chip>
            )}
            {med.source === 'prescription' && <Chip size="sm">RX</Chip>}
            {med.source === 'voice' && <Chip size="sm">AI</Chip>}
          </View>
          <Text style={{ fontSize: 11, color: colors.fg2, marginBottom: 3 }}>{med.dose}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Text style={{ fontSize: 10, color: colors.fg3, fontFamily: monoFont }}>
              {scheduleLabel(med.schedule).toUpperCase()}
            </Text>
            {med.streak && med.streak > 0 && (
              <Text style={{ fontSize: 10, color: colors.fg3, fontFamily: monoFont }}>
                · {med.streak}d streak
              </Text>
            )}
          </View>
          {med.note && (
            <Text style={{ fontSize: 10, color: colors.fg3, marginTop: 4, fontStyle: 'italic' }}>
              {med.note}
            </Text>
          )}
        </View>
        {isPRN ? (
          <Pressable onPress={onToggle} style={{
            paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10,
            backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline,
            flexDirection: 'row', alignItems: 'center', gap: 4,
          }}>
            <Icon name="plus" size={10} color={colors.fg} />
            <Text style={{ fontSize: 11, color: colors.fg }}>
              Log ({prnCount}/{prnMax})
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={onToggle} style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: taken ? colors.okSoft : colors.accentSoft,
            borderWidth: 1, borderColor: taken ? 'rgba(52,211,153,0.5)' : colors.accentBorder,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={taken ? 'check' : 'plus'} size={16}
              color={taken ? colors.ok : colors.accent} />
          </Pressable>
        )}
      </View>
    </Tile>
  );
};

// ── Main screen ────────────────────────────────────────────────────
export default function MedsScreen({ onBack }: NavProps) {
  const [meds, setMeds] = useState<Med[]>(MEDS_SEED);
  const [filter, setFilter] = useState<'all' | 'today' | 'self' | 'kids' | 'course'>('all');

  const toggleTaken = (id: string) =>
    setMeds(ms =>
      ms.map(m => {
        if (m.id !== id) return m;
        if (m.schedule.kind === 'prn') {
          const cur = typeof m.takenToday === 'number' ? m.takenToday : 0;
          return { ...m, takenToday: cur + 1 };
        }
        const wasTaken = !!m.takenToday;
        return {
          ...m,
          takenToday: !wasTaken,
          streak: !wasTaken ? (m.streak || 0) + 1 : Math.max(0, (m.streak || 0) - 1),
        };
      })
    );

  const filtered = meds.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'today') {
      return ['daily', 'every-n-days', 'course', 'cycled'].includes(m.schedule.kind);
    }
    if (filter === 'self') return m.for === 'self';
    if (filter === 'kids') return m.for !== 'self';
    if (filter === 'course') return m.schedule.kind === 'course' || m.schedule.kind === 'tapered';
    return true;
  });

  const dueCount = meds.filter(m => !m.takenToday && m.schedule.kind !== 'prn').length;
  const takenCount = meds.filter(m => !!m.takenToday).length;
  const ringPct = (takenCount + dueCount) > 0 ? takenCount / (takenCount + dueCount) : 0;

  const filters: Array<['all' | 'today' | 'self' | 'kids' | 'course', string, number]> = [
    ['all', 'All', meds.length],
    ['today', 'Today', dueCount + takenCount],
    ['self', 'Mine', meds.filter(m => m.for === 'self').length],
    ['kids', 'Kids', meds.filter(m => m.for !== 'self').length],
    ['course', 'Course', meds.filter(m => ['course', 'tapered'].includes(m.schedule.kind)).length],
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 100 }}>
      <ScreenHeader
        title="Medications"
        subtitle="Meds · Today"
        onBack={onBack}
        right={
          <View style={{
            paddingHorizontal: 11, paddingVertical: 7, borderRadius: 99,
            backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accentBorder,
            flexDirection: 'row', alignItems: 'center', gap: 5, marginRight: 16,
          }}>
            <Icon name="mic" size={11} color={colors.accent} />
            <Text style={{ fontSize: 11, color: colors.accent }}>AI add</Text>
          </View>
        }
      />

      <View style={{ paddingHorizontal: 16 }}>
        {/* Summary ring card */}
        <Tile style={{ padding: 16, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View>
              <Ring size={80} pct={ringPct} sw={5} hue={280} />
              <View style={{
                position: 'absolute', width: 80, height: 80,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 22, fontWeight: '700', color: colors.fg, lineHeight: 24 }}>
                  {takenCount}
                </Text>
                <Text style={{
                  fontSize: 8, color: colors.fg3, fontFamily: monoFont, letterSpacing: 1, marginTop: 2,
                }}>OF {takenCount + dueCount}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: colors.fg }}>
                {dueCount > 0 ? `${dueCount} doses pending` : 'All caught up'}
              </Text>
              <Text style={{ fontSize: 12, color: colors.fg2, marginTop: 4 }}>
                Next: <Text style={{ color: colors.accent, fontWeight: '700' }}>Multi-vitamin</Text> · now
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                <MiniStat icon="flame" value={42} label="longest streak" />
                <MiniStat icon="refresh" value={meds.length} label="active" />
              </View>
            </View>
          </View>
        </Tile>

        {/* Filters */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {filters.map(([k, l, n]) => (
            <Pressable key={k} onPress={() => setFilter(k)} style={{
              paddingHorizontal: 11, paddingVertical: 6, borderRadius: 99,
              backgroundColor: filter === k ? colors.accentSoft : colors.surface,
              borderWidth: 1, borderColor: filter === k ? colors.accentBorder : colors.hairline,
              flexDirection: 'row', alignItems: 'center', gap: 5,
            }}>
              <Text style={{ fontSize: 11, color: filter === k ? colors.accent : colors.fg2 }}>
                {l}
              </Text>
              <Text style={{ fontSize: 9, fontFamily: monoFont, opacity: 0.7,
                color: filter === k ? colors.accent : colors.fg2 }}>{n}</Text>
            </Pressable>
          ))}
        </View>

        {/* Med cards */}
        <View style={{ gap: 8 }}>
          {filtered.map(m => (
            <MedCard key={m.id} med={m} onToggle={() => toggleTaken(m.id)} />
          ))}
        </View>

        {/* Add card */}
        <View style={{
          marginTop: 10, padding: 12, borderRadius: 12,
          borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.hairlineStrong,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <Icon name="plus" size={14} color={colors.fg2} />
          <Text style={{ color: colors.fg2, fontSize: 12 }}>Add medication</Text>
        </View>

        {/* Quick add */}
        <Text style={{
          marginTop: 14, marginBottom: 6,
          fontSize: 10, color: colors.fg3, fontFamily: monoFont, letterSpacing: 1.5,
        }}>QUICK ADD</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <MedQuickAddCard icon="camera" title="Scan Rx" sub="Photo of prescription" />
          <MedQuickAddCard icon="mic" title="Voice" sub="'B12 every 3 days'" />
        </View>
      </View>
    </ScrollView>
  );
}
