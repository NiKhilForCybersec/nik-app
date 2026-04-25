import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Tile, Chip, Icon, ScreenHeader } from '../components';
import { colors, monoFont, hueColor } from '../theme';
import type { NavProps } from '../router';

// ── Inlined mock data (from prototype family-ops.jsx) ──────────────
type Task = {
  id: string;
  title: string;
  time: string;
  owner: 'arjun' | 'meera';
  pairedWith: 'arjun' | 'meera' | null;
  done: boolean;
  kids: string[];
  recurrence: string;
  category: string;
  gps?: string;
  upcoming?: boolean;
};

const FAMILY_TASKS_SEED: Task[] = [
  { id: 't1', title: 'Breakfast for Kiaan & Anya', time: '07:15', owner: 'meera', pairedWith: 'arjun', done: true, kids: ['kiaan', 'anya'], recurrence: 'Weekdays', category: 'meal' },
  { id: 't2', title: 'School drop-off', time: '08:10', owner: 'arjun', pairedWith: null, done: true, kids: ['kiaan', 'anya'], recurrence: 'Weekdays', category: 'transport', gps: 'Inventure Academy' },
  { id: 't3', title: 'Pack lunchbox', time: '07:45', owner: 'meera', pairedWith: null, done: true, kids: ['kiaan'], recurrence: 'Weekdays', category: 'meal' },
  { id: 't4', title: 'Pick up from school', time: '15:30', owner: 'arjun', pairedWith: null, done: false, kids: ['kiaan', 'anya'], recurrence: 'Weekdays', category: 'transport', gps: 'Inventure Academy', upcoming: true },
  { id: 't5', title: 'Piano class — Kiaan', time: '17:00', owner: 'meera', pairedWith: null, done: false, kids: ['kiaan'], recurrence: 'Every Tuesday', category: 'class' },
  { id: 't6', title: "Anya's swim practice", time: '17:30', owner: 'arjun', pairedWith: null, done: false, kids: ['anya'], recurrence: 'Tue, Thu', category: 'class' },
  { id: 't7', title: 'Grocery run', time: '19:00', owner: 'meera', pairedWith: null, done: false, kids: [], recurrence: 'Every Saturday', category: 'chore' },
  { id: 't8', title: 'Pediatrician — Anya', time: 'Wed 10:00', owner: 'meera', pairedWith: 'arjun', done: false, kids: ['anya'], recurrence: 'Monthly — 2nd Wed', category: 'health' },
];

type Alarm = { id: string; label: string; time: string; kid: string | null; icon: string };
type Cluster = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  schedule: string;
  kidTag: string;
  alarms: Alarm[];
};

const ALARM_CLUSTERS_SEED: Cluster[] = [
  {
    id: 'c1', name: 'School morning', description: 'Everything that fires on a school day',
    active: true, schedule: 'Mon–Fri', kidTag: 'kids',
    alarms: [
      { id: 'a1', label: 'Wake Kiaan', time: '06:45', kid: 'kiaan', icon: 'sparkle' },
      { id: 'a2', label: 'Wake Anya', time: '06:50', kid: 'anya', icon: 'sparkle' },
      { id: 'a3', label: 'Breakfast ready', time: '07:15', kid: null, icon: 'flame' },
      { id: 'a4', label: 'Uniform + bag check', time: '07:45', kid: null, icon: 'check' },
      { id: 'a5', label: 'Leave for school', time: '08:05', kid: null, icon: 'location' },
    ],
  },
  {
    id: 'c2', name: 'After-school pickup', description: 'Pickup + snack routine',
    active: true, schedule: 'Mon–Fri', kidTag: 'kids',
    alarms: [
      { id: 'a6', label: 'Leave for pickup', time: '15:10', kid: null, icon: 'location' },
      { id: 'a7', label: 'Snack prep', time: '16:00', kid: null, icon: 'flame' },
      { id: 'a8', label: 'Homework start', time: '16:30', kid: 'kiaan', icon: 'book' },
    ],
  },
  {
    id: 'c3', name: 'Bedtime routine', description: 'Wind-down for both kids',
    active: true, schedule: 'Daily', kidTag: 'kids',
    alarms: [
      { id: 'a9', label: 'Bath time — Anya', time: '19:30', kid: 'anya', icon: 'water' },
      { id: 'a10', label: 'Story — Anya', time: '20:00', kid: 'anya', icon: 'book' },
      { id: 'a11', label: 'Lights out — Anya', time: '20:30', kid: 'anya', icon: 'moon' },
      { id: 'a12', label: 'Lights out — Kiaan', time: '21:30', kid: 'kiaan', icon: 'moon' },
    ],
  },
];

type VoiceCmd = { text: string; affects: string; scope: string; kid: string | null; kind?: string };
const VOICE_COMMAND_EXAMPLES: VoiceCmd[] = [
  { text: 'Hey Friday, Kiaan is home today', affects: 'School morning + After-school pickup', scope: 'today', kid: 'kiaan' },
  { text: 'Hey Friday, both kids sick', affects: 'All school-related alarms', scope: 'today', kid: 'both' },
  { text: 'Hey Friday, mute school alarms tomorrow', affects: 'School morning + Pickup', scope: 'tomorrow', kid: null },
  { text: 'Hey Friday, Meera handles pickup today', affects: 'Pickup tasks re-assigned', scope: 'today', kid: null, kind: 'reassign' },
];

const KIDS: Record<string, { name: string; age: number; hue: number }> = {
  kiaan: { name: 'Kiaan', age: 9, hue: 220 },
  anya: { name: 'Anya', age: 6, hue: 320 },
};
const PARENTS: Record<'arjun' | 'meera', { name: string; role: string; hue: number; self?: boolean }> = {
  meera: { name: 'Meera', role: 'Mom', hue: 320 },
  arjun: { name: 'Arjun', role: 'Dad (you)', hue: 220, self: true },
};

type Override = VoiceCmd & { id: string; createdAt: string };

// ── Sub components ────────────────────────────────────────────────
const CoParent = ({ parent, count, done }: { parent: 'arjun' | 'meera'; count: number; done: number }) => {
  const p = PARENTS[parent];
  const pct = count ? done / count : 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
      <LinearGradient
        colors={[hueColor(p.hue, 0.7, 0.18), hueColor(p.hue + 40, 0.55, 0.2)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
          borderWidth: p.self ? 2 : 0, borderColor: colors.accent,
        }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{p.name[0]}</Text>
      </LinearGradient>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 12, color: colors.fg, fontWeight: '500' }}>
          {p.name}{' '}
          <Text style={{ fontSize: 10, color: colors.fg3, fontWeight: '400' }}>· {p.role}</Text>
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
          <View style={{ flex: 1, height: 3, backgroundColor: colors.hairline, borderRadius: 99, overflow: 'hidden' }}>
            <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: hueColor(p.hue, 0.7, 0.18) }} />
          </View>
          <Text style={{ fontSize: 9, fontFamily: monoFont, color: colors.fg3 }}>{done}/{count}</Text>
        </View>
      </View>
    </View>
  );
};

const TaskRow = ({ t, suppressed, onToggle, onReassign }: {
  t: Task; suppressed: boolean; onToggle: () => void; onReassign: () => void;
}) => {
  const owner = PARENTS[t.owner];
  const paired = t.pairedWith ? PARENTS[t.pairedWith] : null;
  const timeMain = t.time.split(' ').pop() || t.time;
  const timePrefix = t.time.includes(' ') ? t.time.split(' ').slice(0, -1).join(' ') : null;
  return (
    <Tile style={{ padding: 12, opacity: suppressed ? 0.45 : 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View style={{ width: 54, alignItems: 'flex-end', paddingTop: 2 }}>
          <Text style={{
            fontSize: 13, fontWeight: '600', fontFamily: monoFont,
            color: t.upcoming ? colors.accent : colors.fg,
            textDecorationLine: suppressed ? 'line-through' : 'none',
          }}>{timeMain}</Text>
          {timePrefix && (
            <Text style={{ fontSize: 9, color: colors.fg3, fontFamily: monoFont, letterSpacing: 0.5 }}>
              {timePrefix.toUpperCase()}
            </Text>
          )}
        </View>
        <Pressable onPress={() => !suppressed && onToggle()} style={{
          width: 22, height: 22, borderRadius: 7, borderWidth: 1.5,
          borderColor: t.done ? 'rgba(52,211,153,0.7)' : colors.hairlineStrong,
          backgroundColor: t.done ? 'rgba(52,211,153,0.25)' : 'transparent',
          alignItems: 'center', justifyContent: 'center', marginTop: 2,
        }}>
          {t.done && <Icon name="check" size={12} color={colors.ok} />}
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <Text style={{
              fontSize: 13, fontWeight: '500', color: colors.fg,
              textDecorationLine: suppressed ? 'line-through' : 'none',
            }}>{t.title}</Text>
            {suppressed && <Chip tone="warn" size="sm">SKIPPED</Chip>}
            {t.upcoming && !suppressed && !t.done && <Chip tone="accent" size="sm">NEXT</Chip>}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            <Text style={{ fontSize: 10, color: colors.fg3, fontFamily: monoFont }}>
              {t.recurrence.toUpperCase()}
            </Text>
            {t.gps && <Text style={{ fontSize: 10, color: colors.fg3, fontFamily: monoFont }}>· {t.gps}</Text>}
            {t.kids.length > 0 && (
              <Text style={{ fontSize: 10, color: colors.fg3, fontFamily: monoFont }}>
                · {t.kids.map(k => KIDS[k].name).join(', ')}
              </Text>
            )}
          </View>
        </View>
        <Pressable onPress={onReassign} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <LinearGradient
            colors={[hueColor(owner.hue, 0.7, 0.18), hueColor(owner.hue + 40, 0.55, 0.2)]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{
              width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
              borderWidth: owner.self ? 2 : 0, borderColor: colors.accent, zIndex: 2,
            }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>{owner.name[0]}</Text>
          </LinearGradient>
          {paired && (
            <LinearGradient
              colors={[hueColor(paired.hue, 0.7, 0.18), hueColor(paired.hue + 40, 0.55, 0.2)]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{
                width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                marginLeft: -8, borderWidth: 2, borderColor: colors.bg,
              }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 10 }}>{paired.name[0]}</Text>
            </LinearGradient>
          )}
        </Pressable>
      </View>
    </Tile>
  );
};

// ── Main screen ────────────────────────────────────────────────────
export default function FamilyOpsScreen({ onBack, onNav }: NavProps) {
  const [tab, setTab] = useState<'tasks' | 'alarms' | 'rules'>('tasks');
  const [tasks, setTasks] = useState<Task[]>(FAMILY_TASKS_SEED);
  const [clusters, setClusters] = useState<Cluster[]>(ALARM_CLUSTERS_SEED);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [filter, setFilter] = useState<'all' | 'arjun' | 'meera' | 'kids'>('all');

  const doneCount = tasks.filter(t => t.done).length;

  const isSuppressed = (t: Task) =>
    overrides.some(ov => {
      if (ov.kind === 'reassign') return false;
      if (ov.kid === 'both') return t.kids.length > 0;
      if (ov.kid) return t.kids.includes(ov.kid);
      return false;
    });

  const isClusterSuppressed = (c: Cluster) =>
    overrides.some(ov => {
      if (ov.kind === 'reassign') return false;
      if (ov.affects.toLowerCase().includes(c.name.toLowerCase().split(' ')[0])) return true;
      if (ov.kid === 'both' && c.kidTag === 'kids') return true;
      if (ov.kid && c.alarms.some(a => a.kid === ov.kid)) return true;
      return false;
    });

  const toggleTask = (id: string) =>
    setTasks(ts => ts.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  const reassign = (id: string) =>
    setTasks(ts => ts.map(t => (t.id === id ? { ...t, owner: t.owner === 'arjun' ? 'meera' : 'arjun' } : t)));
  const toggleCluster = (id: string) =>
    setClusters(cs => cs.map(c => (c.id === id ? { ...c, active: !c.active } : c)));

  const applyVoiceCommand = (cmd: VoiceCmd) => {
    const id = 'ov_' + Date.now();
    const ov: Override = {
      id, ...cmd,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setOverrides(o => [ov, ...o]);
  };
  const clearOverride = (id: string) => setOverrides(o => o.filter(x => x.id !== id));

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'arjun' || filter === 'meera') return t.owner === filter;
    if (filter === 'kids') return t.kids.length > 0;
    return true;
  });

  const grouped: Record<string, Task[]> = {};
  tasks.forEach(t => {
    if (!grouped[t.recurrence]) grouped[t.recurrence] = [];
    grouped[t.recurrence].push(t);
  });

  const tabs: Array<['tasks' | 'alarms' | 'rules', string, string]> = [
    ['tasks', 'Tasks', `${doneCount}/${tasks.length}`],
    ['alarms', 'Alarms', String(clusters.filter(c => c.active).length)],
    ['rules', 'Rules', String(tasks.filter(t => t.recurrence).length)],
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 100 }}>
      <ScreenHeader title="Family Ops" subtitle="Family · Operations" onBack={onBack} />

      <View style={{ paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 12, color: colors.fg2, marginBottom: 12 }}>
          Dual-parent tasks · alarm clusters · voice overrides
        </Text>

        {/* Co-parent bar */}
        <Tile style={{ padding: 10, marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <CoParent parent="arjun" count={tasks.filter(t => t.owner === 'arjun').length}
              done={tasks.filter(t => t.owner === 'arjun' && t.done).length} />
            <View style={{ width: 1, height: 30, backgroundColor: colors.hairline }} />
            <CoParent parent="meera" count={tasks.filter(t => t.owner === 'meera').length}
              done={tasks.filter(t => t.owner === 'meera' && t.done).length} />
            <Pressable onPress={() => applyVoiceCommand(VOICE_COMMAND_EXAMPLES[0])}>
              <LinearGradient
                colors={[colors.accent, colors.accent2]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{
                  paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10,
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                }}>
                <Icon name="mic" size={12} color="#06060a" />
                <Text style={{ color: '#06060a', fontSize: 11, fontWeight: '700' }}>Hey Friday</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Tile>

        {/* Active overrides */}
        {overrides.map(ov => (
          <Tile key={ov.id} style={{
            marginBottom: 8, padding: 10,
            backgroundColor: colors.warnSoft, borderColor: 'rgba(251,191,36,0.4)',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{
                width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(251,191,36,0.25)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="mic" size={14} color={colors.warn} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: colors.warn }}>{ov.text}</Text>
                <Text style={{ fontSize: 10, color: colors.fg3, fontFamily: monoFont, marginTop: 2 }}>
                  {ov.scope.toUpperCase()} · SET {ov.createdAt}
                </Text>
              </View>
              <Pressable onPress={() => clearOverride(ov.id)} style={{
                width: 26, height: 26, borderRadius: 8, backgroundColor: colors.surface,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="close" size={12} color={colors.fg2} />
              </Pressable>
            </View>
          </Tile>
        ))}

        {/* Tabs */}
        <View style={{
          flexDirection: 'row', gap: 4, marginBottom: 12, padding: 4, borderRadius: 12,
          backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline,
        }}>
          {tabs.map(([k, lbl, badge]) => (
            <Pressable key={k} onPress={() => setTab(k)} style={{
              flex: 1, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8,
              backgroundColor: tab === k ? colors.accentSoft : 'transparent',
              alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
            }}>
              <Text style={{
                fontSize: 12, fontWeight: tab === k ? '600' : '400',
                color: tab === k ? colors.accent : colors.fg2,
              }}>{lbl}</Text>
              <View style={{
                paddingHorizontal: 5, paddingVertical: 1, borderRadius: 99,
                backgroundColor: tab === k ? colors.accentSoft : colors.surface,
              }}>
                <Text style={{
                  fontSize: 9, fontFamily: monoFont,
                  color: tab === k ? colors.accent : colors.fg3,
                }}>{badge}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* TASKS TAB */}
        {tab === 'tasks' && (
          <View>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {([['all', 'All'], ['arjun', 'Mine'], ['meera', 'Meera'], ['kids', 'Kid tasks']] as const).map(([k, l]) => (
                <Pressable key={k} onPress={() => setFilter(k)} style={{
                  paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99,
                  backgroundColor: filter === k ? colors.accentSoft : colors.surface,
                  borderWidth: 1, borderColor: filter === k ? colors.accentBorder : colors.hairline,
                }}>
                  <Text style={{ fontSize: 11, color: filter === k ? colors.accent : colors.fg2 }}>{l}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ gap: 8 }}>
              {filteredTasks.map(t => (
                <TaskRow key={t.id} t={t} suppressed={isSuppressed(t)}
                  onToggle={() => toggleTask(t.id)} onReassign={() => reassign(t.id)} />
              ))}
            </View>
            <View style={{
              marginTop: 10, padding: 12, borderRadius: 12,
              borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.hairlineStrong,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Icon name="plus" size={14} color={colors.fg2} />
              <Text style={{ color: colors.fg2, fontSize: 12 }}>Add task with recurrence</Text>
            </View>
          </View>
        )}

        {/* ALARMS TAB */}
        {tab === 'alarms' && (
          <View>
            <Tile
              onPress={() => applyVoiceCommand(VOICE_COMMAND_EXAMPLES[0])}
              style={{ padding: 14, marginBottom: 12, backgroundColor: colors.accentSoft, borderColor: colors.accentBorder }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <LinearGradient
                  colors={[colors.accent, colors.accent2]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="mic" size={18} color="#06060a" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: colors.fg }}>
                    "Hey Friday, Kiaan is home today"
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.fg2, marginTop: 2 }}>
                    One voice command → suppresses 8 alarms across 2 clusters, just for today.
                  </Text>
                </View>
                <Icon name="chevR" size={14} color={colors.fg3} />
              </View>
            </Tile>

            <View style={{ gap: 10 }}>
              {clusters.map(c => {
                const suppressed = isClusterSuppressed(c);
                return (
                  <Tile key={c.id} style={{ padding: 14, opacity: suppressed ? 0.5 : 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={{ fontSize: 15, fontWeight: '500', color: colors.fg }}>{c.name}</Text>
                          {suppressed && <Chip tone="warn" size="sm">MUTED TODAY</Chip>}
                        </View>
                        <Text style={{ fontSize: 10, color: colors.fg3, fontFamily: monoFont, letterSpacing: 1, marginTop: 2 }}>
                          {c.schedule.toUpperCase()} · {c.alarms.length} ALARMS
                        </Text>
                      </View>
                      <Pressable onPress={() => toggleCluster(c.id)} style={{
                        width: 38, height: 22, borderRadius: 99,
                        backgroundColor: c.active && !suppressed ? colors.accent : colors.hairline,
                      }}>
                        <View style={{
                          position: 'absolute', top: 2,
                          left: c.active && !suppressed ? 18 : 2,
                          width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff',
                        }} />
                      </Pressable>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {c.alarms.map(a => {
                        const kid = a.kid ? KIDS[a.kid] : null;
                        return (
                          <View key={a.id} style={{
                            paddingHorizontal: 9, paddingVertical: 7, borderRadius: 9,
                            backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline,
                            flexDirection: 'row', alignItems: 'center', gap: 7, minWidth: 140, flexGrow: 1,
                          }}>
                            <Icon name={a.icon} size={12} color={colors.fg2} />
                            <View style={{ minWidth: 0, flex: 1 }}>
                              <Text style={{ fontSize: 10, color: colors.fg, fontWeight: '500' }} numberOfLines={1}>
                                {a.label}
                              </Text>
                              <Text style={{ fontSize: 9, color: colors.fg3, fontFamily: monoFont }}>
                                {a.time}{kid ? ' · ' + kid.name : ''}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </Tile>
                );
              })}
            </View>
          </View>
        )}

        {/* RULES TAB */}
        {tab === 'rules' && (
          <View>
            <Text style={{ fontSize: 10, color: colors.fg3, fontFamily: monoFont, letterSpacing: 1.5, marginBottom: 8 }}>
              RECURRENCE · GROUPED BY RULE
            </Text>
            <View style={{ gap: 10 }}>
              {Object.entries(grouped).map(([rule, ts]) => (
                <Tile key={rule} style={{ padding: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Icon name="refresh" size={14} color={colors.accent} />
                      <Text style={{ fontSize: 13, fontWeight: '500', color: colors.fg }}>{rule}</Text>
                    </View>
                    <Chip size="sm">{String(ts.length)}</Chip>
                  </View>
                  <View style={{ gap: 3 }}>
                    {ts.map(t => (
                      <View key={t.id} style={{ paddingLeft: 22, flexDirection: 'row', gap: 6 }}>
                        <Text style={{ color: colors.fg3, fontFamily: monoFont, fontSize: 10 }}>{t.time}</Text>
                        <Text style={{ fontSize: 11, color: colors.fg2 }}>{t.title}</Text>
                      </View>
                    ))}
                  </View>
                </Tile>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
