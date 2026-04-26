/* Nik — Family Ops: household-coordination dashboard.
   Bento sections, gradient hero, glass cards, per-section accent hue.
   Matches the language of MoreScreen.tsx. */
import { useMemo, useState, type FC, type ReactNode } from 'react';
import type { ScreenProps } from '../App';
import { I } from '../components/icons';
import { Chip, Ring, Avatar, HUDCorner } from '../components/primitives';
import { useOp, useOpMutation } from '../lib/useOp';
import { familyOps as familyOpsContract } from '../contracts/familyOps';

// ── MOCK DATA (preserved) ──────────────────────────────────
const FAMILY_TASKS_SEED: Array<Record<string, any>> = [
  { id: 't1', title: 'Breakfast for Kiaan & Anya', time: '07:15', owner: 'meera', pairedWith: 'arjun', done: true,  kids: ['kiaan', 'anya'], recurrence: 'Weekdays',         category: 'meal' },
  { id: 't2', title: 'School drop-off',             time: '08:10', owner: 'arjun', pairedWith: null,    done: true,  kids: ['kiaan', 'anya'], recurrence: 'Weekdays',         category: 'transport', gps: 'Inventure Academy' },
  { id: 't3', title: 'Pack lunchbox',               time: '07:45', owner: 'meera', pairedWith: null,    done: true,  kids: ['kiaan'],         recurrence: 'Weekdays',         category: 'meal' },
  { id: 't4', title: 'Pick up from school',         time: '15:30', owner: 'arjun', pairedWith: null,    done: false, kids: ['kiaan', 'anya'], recurrence: 'Weekdays',         category: 'transport', gps: 'Inventure Academy', upcoming: true },
  { id: 't5', title: 'Piano class — Kiaan',         time: '17:00', owner: 'meera', pairedWith: null,    done: false, kids: ['kiaan'],         recurrence: 'Every Tuesday',    category: 'class' },
  { id: 't6', title: "Anya's swim practice",        time: '17:30', owner: 'arjun', pairedWith: null,    done: false, kids: ['anya'],          recurrence: 'Tue, Thu',         category: 'class' },
  { id: 't7', title: 'Grocery run',                 time: '19:00', owner: 'meera', pairedWith: null,    done: false, kids: [],                recurrence: 'Every Saturday',   category: 'chore' },
  { id: 't8', title: 'Pediatrician — Anya',         time: 'Wed 10:00', owner: 'meera', pairedWith: 'arjun', done: false, kids: ['anya'],     recurrence: 'Monthly — 2nd Wed', category: 'health' },
];

const ALARM_CLUSTERS_SEED: Array<Record<string, any>> = [
  {
    id: 'c1', name: 'School morning', description: 'Everything that fires on a school day',
    active: true, schedule: 'Mon–Fri', kidTag: 'kids',
    voicePhrase: '"Hey Friday, school morning ON"',
    alarms: [
      { id: 'a1', label: 'Wake Kiaan',         time: '06:45', kid: 'kiaan', icon: 'sun' },
      { id: 'a2', label: 'Wake Anya',          time: '06:50', kid: 'anya',  icon: 'sun' },
      { id: 'a3', label: 'Breakfast ready',    time: '07:15', kid: null,    icon: 'flame' },
      { id: 'a4', label: 'Uniform + bag check', time: '07:45', kid: null,   icon: 'check' },
      { id: 'a5', label: 'Leave for school',   time: '08:05', kid: null,    icon: 'location' },
    ],
  },
  {
    id: 'c2', name: 'After-school pickup', description: 'Pickup + snack routine',
    active: true, schedule: 'Mon–Fri', kidTag: 'kids',
    voicePhrase: '"Hey Friday, set pickup routine"',
    alarms: [
      { id: 'a6', label: 'Leave for pickup', time: '15:10', kid: null,    icon: 'location' },
      { id: 'a7', label: 'Snack prep',       time: '16:00', kid: null,    icon: 'flame' },
      { id: 'a8', label: 'Homework start',   time: '16:30', kid: 'kiaan', icon: 'book' },
    ],
  },
  {
    id: 'c3', name: 'Bedtime routine', description: 'Wind-down for both kids',
    active: true, schedule: 'Daily', kidTag: 'kids',
    voicePhrase: '"Hey Friday, bedtime routine"',
    alarms: [
      { id: 'a9',  label: 'Bath time — Anya',   time: '19:30', kid: 'anya',  icon: 'water' },
      { id: 'a10', label: 'Story — Anya',       time: '20:00', kid: 'anya',  icon: 'book' },
      { id: 'a11', label: 'Lights out — Anya',  time: '20:30', kid: 'anya',  icon: 'moon' },
      { id: 'a12', label: 'Lights out — Kiaan', time: '21:30', kid: 'kiaan', icon: 'moon' },
    ],
  },
];

const VOICE_COMMAND_EXAMPLES: Array<Record<string, any>> = [
  { text: 'Hey Friday, Kiaan is home today',          affects: 'School morning + After-school pickup',  scope: 'today',    kid: 'kiaan' },
  { text: 'Hey Friday, both kids sick',               affects: 'All school-related alarms',             scope: 'today',    kid: 'both' },
  { text: 'Hey Friday, mute school alarms tomorrow',  affects: 'School morning + Pickup',               scope: 'tomorrow', kid: null },
  { text: 'Hey Friday, Meera handles pickup today',   affects: 'Pickup tasks re-assigned',              scope: 'today',    kid: null, kind: 'reassign' },
];

const KIDS: Record<string, any> = {
  kid_a: { name: 'Kid 1', age: 9, hue: 220, emoji: '1' },
  kid_b: { name: 'Kid 2', age: 6, hue: 320, emoji: '2' },
  // legacy keys (kept so in-file MOCK seed still renders before DB seeds):
  kiaan: { name: 'Kid 1', age: 9, hue: 220, emoji: '1' },
  anya:  { name: 'Kid 2', age: 6, hue: 320, emoji: '2' },
};
const PARENTS: Record<string, any> = {
  parent_a: { name: 'You',     role: 'You',     hue: 220, self: true },
  parent_b: { name: 'Partner', role: 'Partner', hue: 320 },
  // legacy keys (kept so in-file MOCK seed still renders before DB seeds):
  arjun:    { name: 'You',     role: 'You',     hue: 220, self: true },
  meera:    { name: 'Partner', role: 'Partner', hue: 320 },
};

const RECURRENCE_RULES: Array<Record<string, any>> = [
  { id: 'r1', label: 'Weekdays',          icon: 'calendar', pattern: 'Mon · Tue · Wed · Thu · Fri', count: 3, hue: 150 },
  { id: 'r2', label: 'Every Tuesday',     icon: 'refresh',  pattern: 'Weekly · Tue',                count: 1, hue: 200 },
  { id: 'r3', label: 'Tue · Thu',         icon: 'refresh',  pattern: 'Weekly · 2 days',             count: 1, hue: 200 },
  { id: 'r4', label: 'Every Saturday',    icon: 'sun',      pattern: 'Weekly · Sat',                count: 1, hue: 60  },
  { id: 'r5', label: 'Monthly — 2nd Wed', icon: 'clock',    pattern: 'Monthly · nth weekday',       count: 1, hue: 280 },
];

// ── Per-section accent hues ────────────────────────────────
const HUE = { tasks: 220, alarms: 30, voice: 280, rules: 150, hero: 220 };

// ── Section header ─────────────────────────────────────────
const SectionHead: FC<{ title: string; subtitle: string; right?: ReactNode }> = ({ title, subtitle, right }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
    <div>
      <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)' }}>
        {title.toUpperCase()}
      </div>
      <div className="display" style={{ fontSize: 16, fontWeight: 500, color: 'var(--fg-2)', marginTop: 2 }}>
        {subtitle}
      </div>
    </div>
    {right}
  </div>
);

// ── Main screen ────────────────────────────────────────────
export default function FamilyOpsScreen({ onNav }: ScreenProps) {
  void onNav;
  const tasksQ = useOp(familyOpsContract.tasks, {});
  const alarmsQ = useOp(familyOpsContract.alarms, {});
  const toggleTaskMut = useOpMutation(familyOpsContract.toggleTask);
  const toggleAlarmMut = useOpMutation(familyOpsContract.toggleAlarmCluster);

  // Map DB rows → the existing UI shape so the rich render pipeline
  // doesn't need restructuring.
  const tasks: Array<Record<string, any>> = (tasksQ.data ?? []).length
    ? (tasksQ.data ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        time: t.time_of_day ?? '',
        owner: t.owner,
        pairedWith: t.paired_with,
        done: t.status === 'done',
        kids: t.kids,
        recurrence: t.recurrence,
        category: 'family',
        gps: t.geofence_label ?? undefined,
      }))
    : FAMILY_TASKS_SEED;
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const fmtDays = (days: number[]): string => {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && days.every((d) => d >= 1 && d <= 5)) return 'Mon\u2013Fri';
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
    return days.map((d) => dayNames[d]).join(', ');
  };
  const clusters: Array<Record<string, any>> = (alarmsQ.data ?? []).length
    ? (alarmsQ.data ?? []).map((c) => ({
        id: c.id,
        name: c.cluster_name,
        description: '',
        active: c.master_enabled,
        schedule: fmtDays(c.active_days),
        kidTag: 'kids',
        voicePhrase: c.voice_phrase ? `"${c.voice_phrase}"` : '',
        alarms: c.alarms.map((a, i) => ({
          id: `${c.id}-${i}`,
          label: a.label ?? a.kid ?? 'alarm',
          time: a.time,
          kid: a.kid,
          icon: 'clock',
        })),
      }))
    : ALARM_CLUSTERS_SEED;

  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);

  const toggleTask = (id: string) => {
    const t = tasks.find(x => x.id === id);
    if (!t || !t.id || typeof t.id !== 'string' || t.id.length < 30) return; // local mock IDs are short — skip mutation
    toggleTaskMut.mutate({ id: t.id, status: t.done ? 'pending' : 'done' });
  };
  const toggleCluster = (id: string) => {
    const c = clusters.find(x => x.id === id);
    if (!c || !c.id || typeof c.id !== 'string' || c.id.length < 30) return;
    toggleAlarmMut.mutate({ id: c.id, enabled: !c.active });
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.done).length;
    // "You" = whichever parent identifier the seed/DB uses for the current user.
    const youKey = tasks.find(t => PARENTS[t.owner]?.self)?.owner ?? 'parent_a';
    const partnerKey = Object.keys(PARENTS).find(k => k !== youKey && !PARENTS[k].self) ?? 'parent_b';
    const arjunCount = tasks.filter(t => t.owner === youKey).length;
    const meeraCount = tasks.filter(t => t.owner === partnerKey).length;
    const heavier = arjunCount >= meeraCount ? youKey : partnerKey;
    const next = tasks.find(t => !t.done);
    return { total, done, pct: total ? done / total : 0, arjunCount, meeraCount, heavier, next, youKey };
  }, [tasks]);

  const markMineDone = () => {
    const youOpen = tasks.filter(t => t.owner === stats.youKey && !t.done);
    youOpen.forEach(t => toggleTaskMut.mutate({ id: t.id, status: 'done' }));
  };

  return (
    <div style={{ padding: '8px 16px 100px', color: 'var(--fg)', position: 'relative' }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)' }}>
          TODAY · {new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
        </div>
        <div className="display" style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.05, marginTop: 4, letterSpacing: -0.5 }}>
          Family ops
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 6, lineHeight: 1.5 }}>
          You've got <b style={{ color: `oklch(0.9 0.14 ${PARENTS[stats.youKey]?.hue ?? 220})` }}>{stats.arjunCount} on your plate</b>,
          {' '}your partner has <b style={{ color: `oklch(0.9 0.14 ${PARENTS.parent_b.hue})` }}>{stats.meeraCount}</b>. Kids' day moves through {clusters.filter(c => c.active).length} routines.
        </div>
      </div>

      {/* ── HERO: Today's pulse ───────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <SectionHead title="Pulse" subtitle="Today, at a glance" />
        <PulseHero
          stats={stats}
          onMarkMine={markMineDone}
          onReassign={() =>
            setTasks(ts =>
              ts.map(t => (t.owner === 'arjun' && !t.done ? { ...t, owner: 'meera' } : t)),
            )
          }
        />
      </div>

      {/* ── Today's tasks bento ───────────────────────────── */}
      <div style={{ marginBottom: 24, ['--hue' as any]: HUE.tasks }}>
        <SectionHead
          title="Tasks"
          subtitle="What needs to happen today"
          right={
            <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
              {stats.done}/{stats.total}
            </div>
          }
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {tasks.map(t => (
            <TaskCard key={t.id} task={t} onToggle={() => toggleTask(t.id)} />
          ))}
        </div>
      </div>

      {/* ── Alarm clusters bento ──────────────────────────── */}
      <div style={{ marginBottom: 24, ['--hue' as any]: HUE.alarms }}>
        <SectionHead
          title="Alarms"
          subtitle="Routines that fire automatically"
          right={
            <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
              {clusters.filter(c => c.active).length}/{clusters.length} ON
            </div>
          }
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {clusters.map(c => (
            <ClusterCard
              key={c.id}
              cluster={c}
              expanded={expandedCluster === c.id}
              onToggle={() => toggleCluster(c.id)}
              onExpand={() => setExpandedCluster(x => (x === c.id ? null : c.id))}
            />
          ))}
        </div>
      </div>

      {/* ── Voice setups ──────────────────────────────────── */}
      <div style={{ marginBottom: 24, ['--hue' as any]: HUE.voice }}>
        <SectionHead title="Voice" subtitle="Phrases that worked" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {VOICE_COMMAND_EXAMPLES.map((cmd, i) => (
            <VoiceCard key={i} cmd={cmd} />
          ))}
        </div>
      </div>

      {/* ── Recurrence rules bento ────────────────────────── */}
      <div style={{ marginBottom: 24, ['--hue' as any]: HUE.rules }}>
        <SectionHead title="Rules" subtitle="Recurrence patterns in play" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {RECURRENCE_RULES.map(r => (
            <RuleTile key={r.id} rule={r} />
          ))}
        </div>
      </div>

      {/* ── Quick actions strip ───────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <ActionChip icon="mic"      label="Voice add"     hue={HUE.voice} />
        <ActionChip icon="plus"     label="Manual task"   hue={HUE.tasks} />
        <ActionChip icon="calendar" label="Plan tomorrow" hue={HUE.rules} />
      </div>
    </div>
  );
}

// ── Pulse hero card ────────────────────────────────────────
type PulseHeroProps = {
  stats: { total: number; done: number; pct: number; arjunCount: number; meeraCount: number; heavier: string; next: any };
  onMarkMine: () => void;
  onReassign: () => void;
};
const PulseHero: FC<PulseHeroProps> = ({ stats, onMarkMine, onReassign }) => {
  const heavier = PARENTS[stats.heavier];
  const heavierCount = stats.heavier === 'arjun' ? stats.arjunCount : stats.meeraCount;
  const lighter = PARENTS[stats.heavier === 'arjun' ? 'meera' : 'arjun'];
  const lighterCount = stats.heavier === 'arjun' ? stats.meeraCount : stats.arjunCount;

  return (
    <div className="glass fade-up scanlines" style={{
      padding: 16, borderRadius: 18, position: 'relative', overflow: 'hidden',
      background: `linear-gradient(135deg, oklch(0.78 0.16 ${HUE.hero} / 0.22), oklch(0.55 0.22 ${HUE.hero + 60} / 0.12))`,
      borderColor: `oklch(0.78 0.16 ${HUE.hero} / 0.4)`,
      ['--hue' as any]: HUE.hero,
    }}>
      <HUDCorner position="tl" color={`oklch(0.85 0.16 ${HUE.hero})`} />
      <HUDCorner position="tr" color={`oklch(0.85 0.16 ${HUE.hero})`} />
      <HUDCorner position="bl" color={`oklch(0.85 0.16 ${HUE.hero})`} />
      <HUDCorner position="br" color={`oklch(0.85 0.16 ${HUE.hero})`} />

      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
        {/* Big ring */}
        <div style={{ position: 'relative', width: 92, height: 92, flexShrink: 0 }}>
          <Ring size={92} pct={stats.pct} sw={6}>
            <text x="46" y="46" textAnchor="middle" dominantBaseline="middle"
              style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, fill: 'var(--fg)' }}>
              {Math.round(stats.pct * 100)}%
            </text>
            <text x="46" y="62" textAnchor="middle" dominantBaseline="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--fg-3)', letterSpacing: 1 }}>
              {stats.done}/{stats.total} DONE
            </text>
          </Ring>
        </div>

        {/* Right: counts + heavier-plate split */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="display" style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.2, marginBottom: 6 }}>
            {stats.next ? `Next up — ${stats.next.title}` : 'All caught up'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5, marginBottom: 10 }}>
            {stats.next ? `${stats.next.time} · ${PARENTS[stats.next.owner].name.toUpperCase()}` : 'Whole family green'}
          </div>

          {/* Plate split */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PlatePill parent={heavier} count={heavierCount} heavy />
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>vs</div>
            <PlatePill parent={lighter} count={lighterCount} />
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div onClick={onMarkMine} className="tap" style={{
          flex: 1, padding: '10px 12px', borderRadius: 12, textAlign: 'center',
          background: `linear-gradient(135deg, oklch(0.78 0.16 ${HUE.hero}), oklch(0.55 0.22 ${HUE.hero + 60}))`,
          color: '#06060a', fontSize: 12, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          boxShadow: `0 0 16px oklch(0.78 0.16 ${HUE.hero} / 0.4)`,
        }}>
          <I.check size={13} stroke="#06060a" /> Mark mine done
        </div>
        <div onClick={onReassign} className="tap" style={{
          flex: 1, padding: '10px 12px', borderRadius: 12, textAlign: 'center',
          background: 'oklch(1 0 0 / 0.06)', border: '1px solid var(--hairline-strong)',
          color: 'var(--fg)', fontSize: 12, fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <I.refresh size={13} stroke="var(--fg-2)" /> Reassign
        </div>
      </div>
    </div>
  );
};

const PlatePill: FC<{ parent: any; count: number; heavy?: boolean }> = ({ parent, count, heavy }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '4px 10px 4px 4px', borderRadius: 99,
    background: heavy ? `oklch(0.7 0.18 ${parent.hue} / 0.18)` : 'oklch(1 0 0 / 0.05)',
    border: `1px solid ${heavy ? `oklch(0.7 0.18 ${parent.hue} / 0.45)` : 'var(--hairline)'}`,
  }}>
    <Avatar name={parent.name} size={22} hue={parent.hue} ring={parent.self} />
    <div style={{ fontSize: 11, color: 'var(--fg)', fontWeight: 500 }}>
      {parent.name} <span style={{ color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>· {count}</span>
    </div>
  </div>
);

// ── Task card ──────────────────────────────────────────────
const TaskCard: FC<{ task: Record<string, any>; onToggle: () => void }> = ({ task, onToggle }) => {
  const owner = PARENTS[task.owner];
  const paired = task.pairedWith ? PARENTS[task.pairedWith] : null;
  const both = !!paired;
  const time = task.time.split(' ').pop();
  const dayPrefix = task.time.includes(' ') ? task.time.split(' ').slice(0, -1).join(' ') : null;

  return (
    <div onClick={onToggle} className="glass tap fade-up" style={{
      padding: 12, borderRadius: 14, minWidth: 0,
      display: 'flex', flexDirection: 'column', gap: 8,
      opacity: task.done ? 0.65 : 1,
      borderColor: task.upcoming
        ? `oklch(0.78 0.16 ${HUE.tasks} / 0.4)`
        : `oklch(0.78 0.16 ${HUE.tasks} / 0.18)`,
      background: task.done
        ? 'oklch(1 0 0 / 0.02)'
        : `linear-gradient(135deg, oklch(0.78 0.16 ${HUE.tasks} / 0.06), transparent 70%)`,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Top row: time + badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          {dayPrefix && (
            <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 1 }}>
              {dayPrefix.toUpperCase()}
            </div>
          )}
          <div className="display" style={{
            fontSize: 22, fontWeight: 500, lineHeight: 1, fontFamily: 'var(--font-mono)',
            color: task.upcoming ? `oklch(0.95 0.14 ${HUE.tasks})` : 'var(--fg)',
          }}>
            {time}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexDirection: 'column', alignItems: 'flex-end' }}>
          {task.upcoming && !task.done && <Chip tone="accent" size="sm">NEXT</Chip>}
          {both && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '2px 6px', borderRadius: 99,
              background: 'oklch(1 0 0 / 0.06)',
              border: '1px solid var(--hairline)',
              fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 0.5, color: 'var(--fg-2)',
            }}>BOTH</div>
          )}
          {task.done && <Chip tone="ok" size="sm">DONE</Chip>}
        </div>
      </div>

      {/* Title */}
      <div style={{
        fontSize: 12, fontWeight: 500, color: 'var(--fg)', lineHeight: 1.3,
        textDecoration: task.done ? 'line-through' : 'none',
        textDecorationColor: 'var(--fg-3)',
      }}>
        {task.title}
      </div>

      {/* Meta row: avatars + chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
        {/* Owner stack */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar name={owner.name} size={20} hue={owner.hue} ring={owner.self} />
          {paired && (
            <div style={{ marginLeft: -6, border: '2px solid var(--bg, #14141c)', borderRadius: '50%' }}>
              <Avatar name={paired.name} size={20} hue={paired.hue} />
            </div>
          )}
        </div>

        {/* Kid avatars */}
        {task.kids.map((k: string) => (
          <div key={k} title={KIDS[k].name}>
            <Avatar name={KIDS[k].name} size={18} hue={KIDS[k].hue} />
          </div>
        ))}

        {/* GPS chip */}
        {task.gps && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '2px 6px', borderRadius: 99,
            background: 'oklch(1 0 0 / 0.05)',
            border: '1px solid var(--hairline)',
            fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-2)',
          }}>
            <I.location size={9} stroke="var(--fg-3)" />
            <span style={{ maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.gps}</span>
          </div>
        )}

        {/* Recurrence pill */}
        <div style={{
          padding: '2px 6px', borderRadius: 99,
          background: `oklch(0.78 0.16 ${HUE.rules} / 0.12)`,
          border: `1px solid oklch(0.78 0.16 ${HUE.rules} / 0.3)`,
          fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 0.5,
          color: `oklch(0.9 0.14 ${HUE.rules})`,
        }}>
          {task.recurrence}
        </div>
      </div>
    </div>
  );
};

// ── Cluster card (alarms) ──────────────────────────────────
type ClusterCardProps = {
  cluster: Record<string, any>;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
};
const ClusterCard: FC<ClusterCardProps> = ({ cluster, expanded, onToggle, onExpand }) => {
  const visible = expanded ? cluster.alarms : cluster.alarms.slice(0, 3);
  return (
    <div className="glass fade-up" style={{
      padding: 14, borderRadius: 14,
      opacity: cluster.active ? 1 : 0.6,
      borderColor: cluster.active
        ? `oklch(0.78 0.16 ${HUE.alarms} / 0.3)`
        : 'var(--hairline)',
      background: cluster.active
        ? `linear-gradient(135deg, oklch(0.78 0.16 ${HUE.alarms} / 0.08), transparent 70%)`
        : undefined,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: `oklch(0.78 0.16 ${HUE.alarms} / 0.18)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: cluster.active ? `0 0 12px oklch(0.78 0.16 ${HUE.alarms} / 0.3)` : 'none',
        }}>
          <I.bell size={16} stroke={`oklch(0.92 0.14 ${HUE.alarms})`} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="display" style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg)' }}>
            {cluster.name}
          </div>
          <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginTop: 1 }}>
            {cluster.schedule.toUpperCase()} · {cluster.alarms.length} ALARMS
          </div>
        </div>
        {/* Master toggle */}
        <div onClick={onToggle} className="tap" style={{
          width: 38, height: 22, borderRadius: 99,
          background: cluster.active ? `oklch(0.78 0.16 ${HUE.alarms})` : 'oklch(1 0 0 / 0.1)',
          position: 'relative', flexShrink: 0,
          boxShadow: cluster.active ? `0 0 10px oklch(0.78 0.16 ${HUE.alarms} / 0.5)` : 'none',
          transition: 'background 0.2s',
        }}>
          <div style={{
            position: 'absolute', top: 2, left: cluster.active ? 18 : 2,
            width: 18, height: 18, borderRadius: '50%', background: '#fff',
            transition: 'left 0.2s',
          }} />
        </div>
      </div>

      {/* Voice phrase */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '6px 10px', borderRadius: 10,
        background: `oklch(0.78 0.16 ${HUE.voice} / 0.08)`,
        border: `1px solid oklch(0.78 0.16 ${HUE.voice} / 0.2)`,
        marginBottom: 10,
      }}>
        <I.mic size={11} stroke={`oklch(0.9 0.14 ${HUE.voice})`} />
        <div style={{ fontSize: 11, color: `oklch(0.9 0.14 ${HUE.voice})`, fontStyle: 'italic', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {cluster.voicePhrase}
        </div>
      </div>

      {/* Alarm preview list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {visible.map((a: any) => {
          const Ic = (I as any)[a.icon] || I.bell;
          const kid = a.kid ? KIDS[a.kid] : null;
          return (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 8px', borderRadius: 8,
              background: 'oklch(1 0 0 / 0.03)',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6,
                background: `oklch(0.78 0.16 ${HUE.alarms} / 0.12)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Ic size={11} stroke={`oklch(0.9 0.14 ${HUE.alarms})`} />
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 11, color: 'var(--fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {a.label}
                </div>
                {kid && <Avatar name={kid.name} size={14} hue={kid.hue} />}
              </div>
              <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                {a.time}
              </div>
            </div>
          );
        })}
      </div>

      {cluster.alarms.length > 3 && (
        <div onClick={onExpand} className="tap" style={{
          marginTop: 8, padding: 6, textAlign: 'center',
          fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: 1,
          color: `oklch(0.9 0.14 ${HUE.alarms})`,
        }}>
          {expanded ? 'COLLAPSE ↑' : `SHOW ${cluster.alarms.length - 3} MORE ↓`}
        </div>
      )}
    </div>
  );
};

// ── Voice card ─────────────────────────────────────────────
const VoiceCard: FC<{ cmd: Record<string, any> }> = ({ cmd }) => (
  <div className="glass fade-up" style={{
    padding: 12, borderRadius: 14,
    display: 'flex', alignItems: 'center', gap: 10,
    background: `linear-gradient(135deg, oklch(0.78 0.16 ${HUE.voice} / 0.08), transparent 70%)`,
    borderColor: `oklch(0.78 0.16 ${HUE.voice} / 0.22)`,
  }}>
    <div style={{
      width: 34, height: 34, borderRadius: 11,
      background: `oklch(0.78 0.16 ${HUE.voice} / 0.2)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      boxShadow: `0 0 10px oklch(0.78 0.16 ${HUE.voice} / 0.3)`,
    }}>
      <I.mic size={15} stroke={`oklch(0.95 0.14 ${HUE.voice})`} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, color: 'var(--fg)', fontWeight: 500, fontStyle: 'italic' }}>
        "{cmd.text}"
      </div>
      <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2, letterSpacing: 0.5 }}>
        {cmd.scope.toUpperCase()} · {cmd.affects}
      </div>
    </div>
    {cmd.kind === 'reassign' ? (
      <Chip tone="warn" size="sm">REASSIGN</Chip>
    ) : (
      <Chip tone="accent" size="sm">MUTE</Chip>
    )}
  </div>
);

// ── Recurrence rule tile ───────────────────────────────────
const RuleTile: FC<{ rule: Record<string, any> }> = ({ rule }) => {
  const Ic = (I as any)[rule.icon] || I.refresh;
  return (
    <div className="glass fade-up" style={{
      padding: 12, borderRadius: 14, minWidth: 0,
      display: 'flex', gap: 10, alignItems: 'center',
      borderColor: `oklch(0.78 0.16 ${rule.hue} / 0.18)`,
      background: `linear-gradient(135deg, oklch(0.78 0.16 ${rule.hue} / 0.06), transparent 70%)`,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: `oklch(0.78 0.16 ${rule.hue} / 0.18)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Ic size={15} stroke={`oklch(0.92 0.14 ${rule.hue})`} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {rule.label}
          </div>
          <div style={{
            fontSize: 9, padding: '1px 5px', borderRadius: 99,
            background: `oklch(0.78 0.16 ${rule.hue} / 0.2)`,
            color: `oklch(0.92 0.14 ${rule.hue})`,
            fontFamily: 'var(--font-mono)', flexShrink: 0,
          }}>
            ×{rule.count}
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {rule.pattern}
        </div>
      </div>
    </div>
  );
};

// ── Quick action chip ──────────────────────────────────────
const ActionChip: FC<{ icon: string; label: string; hue: number }> = ({ icon, label, hue }) => {
  const Ic = (I as any)[icon] || I.plus;
  return (
    <div className="glass tap fade-up" style={{
      flex: 1, padding: '10px 8px', borderRadius: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      background: `linear-gradient(135deg, oklch(0.78 0.16 ${hue} / 0.14), oklch(0.55 0.22 ${hue + 60} / 0.06))`,
      borderColor: `oklch(0.78 0.16 ${hue} / 0.32)`,
    }}>
      <Ic size={14} stroke={`oklch(0.92 0.14 ${hue})`} />
      <div style={{ fontSize: 11, fontWeight: 500, color: `oklch(0.92 0.14 ${hue})`, whiteSpace: 'nowrap' }}>
        {label}
      </div>
    </div>
  );
};
