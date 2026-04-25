/* Nik — Family Ops: dual-parent task assignment, alarm clusters with voice overrides,
   granular recurrence rules. Big demo screen. */

// ── MOCK DATA ───────────────────────────────────────
const FAMILY_TASKS_SEED = [
  { id: 't1', title: 'Breakfast for Kiaan & Anya', time: '07:15', owner: 'meera', pairedWith: 'arjun', done: true, kids: ['kiaan', 'anya'], recurrence: 'Weekdays', category: 'meal' },
  { id: 't2', title: 'School drop-off', time: '08:10', owner: 'arjun', pairedWith: null, done: true, kids: ['kiaan', 'anya'], recurrence: 'Weekdays', category: 'transport', gps: 'Inventure Academy' },
  { id: 't3', title: 'Pack lunchbox', time: '07:45', owner: 'meera', pairedWith: null, done: true, kids: ['kiaan'], recurrence: 'Weekdays', category: 'meal' },
  { id: 't4', title: 'Pick up from school', time: '15:30', owner: 'arjun', pairedWith: null, done: false, kids: ['kiaan', 'anya'], recurrence: 'Weekdays', category: 'transport', gps: 'Inventure Academy', upcoming: true },
  { id: 't5', title: 'Piano class — Kiaan', time: '17:00', owner: 'meera', pairedWith: null, done: false, kids: ['kiaan'], recurrence: 'Every Tuesday', category: 'class' },
  { id: 't6', title: 'Anya\'s swim practice', time: '17:30', owner: 'arjun', pairedWith: null, done: false, kids: ['anya'], recurrence: 'Tue, Thu', category: 'class' },
  { id: 't7', title: 'Grocery run', time: '19:00', owner: 'meera', pairedWith: null, done: false, kids: [], recurrence: 'Every Saturday', category: 'chore' },
  { id: 't8', title: 'Pediatrician — Anya', time: 'Wed 10:00', owner: 'meera', pairedWith: 'arjun', done: false, kids: ['anya'], recurrence: 'Monthly — 2nd Wed', category: 'health' },
];

const ALARM_CLUSTERS_SEED = [
  {
    id: 'c1',
    name: 'School morning',
    description: 'Everything that fires on a school day',
    active: true,
    schedule: 'Mon–Fri',
    kidTag: 'kids',
    alarms: [
      { id: 'a1', label: 'Wake Kiaan', time: '06:45', kid: 'kiaan', icon: 'sun' },
      { id: 'a2', label: 'Wake Anya', time: '06:50', kid: 'anya', icon: 'sun' },
      { id: 'a3', label: 'Breakfast ready', time: '07:15', kid: null, icon: 'flame' },
      { id: 'a4', label: 'Uniform + bag check', time: '07:45', kid: null, icon: 'check' },
      { id: 'a5', label: 'Leave for school', time: '08:05', kid: null, icon: 'location' },
    ],
  },
  {
    id: 'c2',
    name: 'After-school pickup',
    description: 'Pickup + snack routine',
    active: true,
    schedule: 'Mon–Fri',
    kidTag: 'kids',
    alarms: [
      { id: 'a6', label: 'Leave for pickup', time: '15:10', kid: null, icon: 'location' },
      { id: 'a7', label: 'Snack prep', time: '16:00', kid: null, icon: 'flame' },
      { id: 'a8', label: 'Homework start', time: '16:30', kid: 'kiaan', icon: 'book' },
    ],
  },
  {
    id: 'c3',
    name: 'Bedtime routine',
    description: 'Wind-down for both kids',
    active: true,
    schedule: 'Daily',
    kidTag: 'kids',
    alarms: [
      { id: 'a9', label: 'Bath time — Anya', time: '19:30', kid: 'anya', icon: 'water' },
      { id: 'a10', label: 'Story — Anya', time: '20:00', kid: 'anya', icon: 'book' },
      { id: 'a11', label: 'Lights out — Anya', time: '20:30', kid: 'anya', icon: 'moon' },
      { id: 'a12', label: 'Lights out — Kiaan', time: '21:30', kid: 'kiaan', icon: 'moon' },
    ],
  },
];

const VOICE_COMMAND_EXAMPLES = [
  { text: 'Hey Friday, Kiaan is home today', affects: 'School morning + After-school pickup', scope: 'today', kid: 'kiaan' },
  { text: 'Hey Friday, both kids sick', affects: 'All school-related alarms', scope: 'today', kid: 'both' },
  { text: 'Hey Friday, mute school alarms tomorrow', affects: 'School morning + Pickup', scope: 'tomorrow', kid: null },
  { text: 'Hey Friday, Meera handles pickup today', affects: 'Pickup tasks re-assigned', scope: 'today', kid: null, kind: 'reassign' },
];

window.FAMILY_TASKS_SEED = FAMILY_TASKS_SEED;
window.ALARM_CLUSTERS_SEED = ALARM_CLUSTERS_SEED;
window.VOICE_COMMAND_EXAMPLES = VOICE_COMMAND_EXAMPLES;

// ── Kid + parent info ──────────────────────────────
const KIDS = {
  kiaan: { name: 'Kiaan', age: 9, hue: 220, emoji: 'K' },
  anya: { name: 'Anya', age: 6, hue: 320, emoji: 'A' },
};
const PARENTS = {
  meera: { name: 'Meera', role: 'Mom', hue: 320 },
  arjun: { name: 'Arjun', role: 'Dad (you)', hue: 220, self: true },
};
window.KIDS = KIDS;
window.PARENTS = PARENTS;

// ── Main screen ────────────────────────────────────
const FamilyOpsScreen = ({ onNav, aesthetic = 'hybrid' }) => {
  const V = (typeof getVocab === 'function') ? getVocab(aesthetic) : { quests: 'Tasks', habits: 'Habits' };
  const [tab, setTab] = React.useState('tasks'); // tasks | alarms | rules
  const [tasks, setTasks] = React.useState(FAMILY_TASKS_SEED);
  const [clusters, setClusters] = React.useState(ALARM_CLUSTERS_SEED);
  const [overrides, setOverrides] = React.useState([]); // list of one-shot voice overrides
  const [voiceDemoOpen, setVoiceDemoOpen] = React.useState(false);
  const [newRuleOpen, setNewRuleOpen] = React.useState(false);
  const [liveNotif, setLiveNotif] = React.useState(null);

  // Apply a voice override (suppresses alarms / reassigns tasks)
  const applyVoiceCommand = (cmd) => {
    const id = 'ov_' + Date.now();
    const ov = { id, ...cmd, createdAt: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) };
    setOverrides(o => [ov, ...o]);
    setVoiceDemoOpen(false);
    // Fire a live toast demo
    setLiveNotif({
      title: 'Voice command applied',
      body: cmd.affects + ' — ' + cmd.scope,
      icon: 'mic',
    });
    setTimeout(() => setLiveNotif(null), 4500);
  };

  const clearOverride = (id) => setOverrides(o => o.filter(x => x.id !== id));

  const doneCount = tasks.filter(t => t.done).length;
  const pct = tasks.length ? doneCount / tasks.length : 0;

  return (
    <div style={{ padding: '8px 16px 80px', position: 'relative' }}>
      {/* Header */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>FAMILY · OPERATIONS</div>
          <div className="display" style={{ fontSize: 26, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>Family Ops</div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 4 }}>
            Dual-parent tasks · alarm clusters · voice overrides
          </div>
        </div>
        <div onClick={() => onNav?.('family')} className="tap" style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid var(--hairline-strong)', background: 'oklch(1 0 0 / 0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 64, flexShrink: 0 }}>
          <I.family size={16}/>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: 0.5, color: 'var(--fg-2)' }}>CIRCLE</div>
        </div>
      </div>

      {/* Co-parent bar */}
      <div className="glass fade-up" style={{ padding: 10, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
        <CoParent parent="arjun" count={tasks.filter(t => t.owner === 'arjun').length} done={tasks.filter(t => t.owner === 'arjun' && t.done).length}/>
        <div style={{ width: 1, height: 30, background: 'var(--hairline)' }}/>
        <CoParent parent="meera" count={tasks.filter(t => t.owner === 'meera').length} done={tasks.filter(t => t.owner === 'meera' && t.done).length}/>
        <div style={{ flex: 1 }}/>
        <div onClick={() => setVoiceDemoOpen(true)} className="tap" style={{ padding: '7px 10px', borderRadius: 10, background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))', color: '#06060a', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
          <I.mic size={12}/> Hey Friday
        </div>
      </div>

      {/* Active overrides banner */}
      {overrides.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {overrides.map(ov => (
            <div key={ov.id} className="fade-up" style={{ padding: '10px 12px', marginBottom: 6, borderRadius: 12, background: 'oklch(0.75 0.18 40 / 0.12)', border: '1px solid oklch(0.75 0.18 40 / 0.4)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'oklch(0.75 0.18 40 / 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I.mic size={14} stroke="oklch(0.85 0.17 40)"/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'oklch(0.9 0.15 40)' }}>{ov.text}</div>
                <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                  {ov.scope.toUpperCase()} · AFFECTS: {ov.affects} · SET {ov.createdAt}
                </div>
              </div>
              <div onClick={() => clearOverride(ov.id)} className="tap" style={{ width: 26, height: 26, borderRadius: 8, background: 'oklch(1 0 0 / 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I.close size={12} stroke="var(--fg-2)"/>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, padding: 4, borderRadius: 12, background: 'oklch(1 0 0 / 0.04)', border: '1px solid var(--hairline)' }}>
        {[['tasks', 'Tasks', doneCount + '/' + tasks.length], ['alarms', 'Alarms', clusters.filter(c=>c.active).length], ['rules', 'Rules', tasks.filter(t=>t.recurrence).length]].map(([k, lbl, badge]) => (
          <div key={k} onClick={() => setTab(k)} className="tap" style={{ flex: 1, padding: '8px 10px', borderRadius: 8, textAlign: 'center', background: tab === k ? 'oklch(0.78 0.16 var(--hue) / 0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: tab === k ? 600 : 400, color: tab === k ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)' }}>{lbl}</div>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', padding: '1px 5px', borderRadius: 99, background: tab === k ? 'oklch(0.78 0.16 var(--hue) / 0.25)' : 'oklch(1 0 0 / 0.05)', color: tab === k ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-3)' }}>{badge}</div>
          </div>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'tasks' && <TasksTab tasks={tasks} setTasks={setTasks} overrides={overrides} onAdd={() => setNewRuleOpen(true)}/>}
      {tab === 'alarms' && <AlarmsTab clusters={clusters} setClusters={setClusters} overrides={overrides} onVoice={() => setVoiceDemoOpen(true)}/>}
      {tab === 'rules' && <RulesTab tasks={tasks} onAdd={() => setNewRuleOpen(true)}/>}

      {/* Sheets */}
      {voiceDemoOpen && <VoiceCommandSheet onClose={() => setVoiceDemoOpen(false)} onApply={applyVoiceCommand}/>}
      {newRuleOpen && <RecurrenceBuilderSheet onClose={() => setNewRuleOpen(false)} onSave={(r) => { setNewRuleOpen(false); setLiveNotif({ title: 'Rule saved', body: r.title + ' · ' + r.recurrenceLabel, icon: 'check' }); setTimeout(() => setLiveNotif(null), 3500); }}/>}
      {liveNotif && <LiveToast notif={liveNotif}/>}
    </div>
  );
};

// ── Co-parent pill ─────────────────────────────────
const CoParent = ({ parent, count, done }) => {
  const p = PARENTS[parent];
  const pct = count ? done / count : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, oklch(0.7 0.18 ${p.hue}), oklch(0.55 0.2 ${p.hue + 40}))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#fff', border: p.self ? '2px solid oklch(0.9 0.14 var(--hue))' : 'none' }}>
          {p.name[0]}
        </div>
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg)' }}>{p.name} <span style={{ fontSize: 10, color: 'var(--fg-3)', fontWeight: 400 }}>· {p.role}</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
          <div style={{ flex: 1, height: 3, background: 'oklch(1 0 0 / 0.08)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: (pct * 100) + '%', height: '100%', background: `linear-gradient(90deg, oklch(0.7 0.18 ${p.hue}), oklch(0.6 0.2 ${p.hue + 40}))`, borderRadius: 99 }}/>
          </div>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)' }}>{done}/{count}</div>
        </div>
      </div>
    </div>
  );
};

// ── TASKS TAB ──────────────────────────────────────
const TasksTab = ({ tasks, setTasks, overrides, onAdd }) => {
  const [filter, setFilter] = React.useState('all'); // all | arjun | meera | kids
  const toggle = (id) => setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const reassign = (id) => setTasks(ts => ts.map(t => t.id === id ? { ...t, owner: t.owner === 'arjun' ? 'meera' : 'arjun' } : t));

  const isSuppressed = (t) => {
    return overrides.some(ov => {
      if (ov.kind === 'reassign') return false;
      if (ov.kid === 'both') return t.kids.length > 0;
      if (ov.kid) return t.kids.includes(ov.kid);
      return false;
    });
  };

  const filtered = tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'arjun' || filter === 'meera') return t.owner === filter;
    if (filter === 'kids') return t.kids.length > 0;
    return true;
  });

  return (
    <div>
      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto', paddingBottom: 2 }}>
        {[['all', 'All'], ['arjun', 'Mine'], ['meera', 'Meera'], ['kids', 'Kid tasks']].map(([k, l]) => (
          <div key={k} onClick={() => setFilter(k)} className="tap" style={{ padding: '6px 12px', borderRadius: 99, fontSize: 11, whiteSpace: 'nowrap', background: filter === k ? 'oklch(0.78 0.16 var(--hue) / 0.2)' : 'oklch(1 0 0 / 0.04)', border: '1px solid ' + (filter === k ? 'oklch(0.78 0.16 var(--hue) / 0.4)' : 'var(--hairline)'), color: filter === k ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)' }}>
            {l}
          </div>
        ))}
      </div>

      {/* Today timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(t => {
          const owner = PARENTS[t.owner];
          const paired = t.pairedWith ? PARENTS[t.pairedWith] : null;
          const suppressed = isSuppressed(t);
          return (
            <div key={t.id} className="glass fade-up" style={{ padding: 12, display: 'flex', alignItems: 'flex-start', gap: 10, position: 'relative', opacity: suppressed ? 0.45 : 1, textDecoration: suppressed ? 'line-through' : 'none' }}>
              {/* Time column */}
              <div style={{ width: 54, textAlign: 'right', paddingTop: 2 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.upcoming ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg)', fontFamily: 'var(--font-mono)' }}>{t.time.split(' ').pop()}</div>
                {t.time.includes(' ') && <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>{t.time.split(' ').slice(0, -1).join(' ').toUpperCase()}</div>}
              </div>

              {/* Checkbox */}
              <div onClick={() => !suppressed && toggle(t.id)} className="tap" style={{ width: 22, height: 22, borderRadius: 7, border: '1.5px solid ' + (t.done ? 'oklch(0.78 0.15 150 / 0.7)' : 'var(--hairline-strong)'), background: t.done ? 'oklch(0.78 0.15 150 / 0.25)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                {t.done && <I.check size={12} stroke="oklch(0.85 0.14 150)"/>}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                  <div className="display" style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                  {suppressed && <Chip tone="warn" size="sm">SKIPPED</Chip>}
                  {t.upcoming && !suppressed && !t.done && <Chip tone="accent" size="sm">NEXT</Chip>}
                </div>
                <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span>{t.recurrence.toUpperCase()}</span>
                  {t.gps && <span>· {t.gps}</span>}
                  {t.kids.length > 0 && <span>· {t.kids.map(k => KIDS[k].name).join(', ')}</span>}
                </div>
              </div>

              {/* Owner avatar — tap to reassign */}
              <div onClick={() => reassign(t.id)} className="tap" style={{ display: 'flex', alignItems: 'center', gap: -6, flexShrink: 0 }} title="Tap to reassign">
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg, oklch(0.7 0.18 ${owner.hue}), oklch(0.55 0.2 ${owner.hue + 40}))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#fff', border: owner.self ? '2px solid oklch(0.9 0.14 var(--hue))' : 'none', zIndex: 2 }}>
                  {owner.name[0]}
                </div>
                {paired && (
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: `linear-gradient(135deg, oklch(0.7 0.18 ${paired.hue}), oklch(0.55 0.2 ${paired.hue + 40}))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#fff', marginLeft: -8, border: '2px solid var(--bg, #14141c)' }}>
                    {paired.name[0]}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add */}
      <div onClick={onAdd} className="tap" style={{ marginTop: 10, padding: 12, borderRadius: 12, border: '1.5px dashed var(--hairline-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--fg-2)', fontSize: 12 }}>
        <I.plus size={14}/> Add task with recurrence
      </div>
    </div>
  );
};

// ── ALARMS TAB ─────────────────────────────────────
const AlarmsTab = ({ clusters, setClusters, overrides, onVoice }) => {
  const toggleCluster = (id) => setClusters(cs => cs.map(c => c.id === id ? { ...c, active: !c.active } : c));

  const isClusterSuppressed = (c) => {
    return overrides.some(ov => {
      if (ov.kind === 'reassign') return false;
      if (ov.affects.toLowerCase().includes(c.name.toLowerCase().split(' ')[0])) return true;
      if (ov.kid === 'both' && c.kidTag === 'kids') return true;
      if (ov.kid && c.alarms.some(a => a.kid === ov.kid)) return true;
      return false;
    });
  };

  return (
    <div>
      {/* Big voice hint card */}
      <div onClick={onVoice} className="glass fade-up tap" style={{ padding: 14, marginBottom: 12, background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue) / 0.15), oklch(0.65 0.22 calc(var(--hue) + 80) / 0.1))', borderColor: 'oklch(0.78 0.16 var(--hue) / 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px oklch(0.78 0.16 var(--hue) / 0.4)' }}>
            <I.mic size={18} stroke="#06060a"/>
          </div>
          <div style={{ flex: 1 }}>
            <div className="display" style={{ fontSize: 14, fontWeight: 500 }}>"Hey Friday, Kiaan is home today"</div>
            <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 2 }}>One voice command → suppresses 8 alarms across 2 clusters, just for today.</div>
          </div>
          <I.chevR size={14} stroke="var(--fg-3)"/>
        </div>
      </div>

      {/* Cluster list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {clusters.map(c => {
          const suppressed = isClusterSuppressed(c);
          return (
            <div key={c.id} className="glass fade-up" style={{ padding: 14, opacity: suppressed ? 0.5 : 1, borderColor: suppressed ? 'oklch(0.75 0.18 40 / 0.3)' : undefined }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <div className="display" style={{ fontSize: 15, fontWeight: 500 }}>{c.name}</div>
                    {suppressed && <Chip tone="warn" size="sm">MUTED TODAY</Chip>}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
                    {c.schedule.toUpperCase()} · {c.alarms.length} ALARMS
                  </div>
                </div>
                {/* master toggle for cluster */}
                <div onClick={() => toggleCluster(c.id)} className="tap" style={{ width: 38, height: 22, borderRadius: 99, background: c.active && !suppressed ? 'oklch(0.78 0.16 var(--hue))' : 'oklch(1 0 0 / 0.1)', position: 'relative', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 2, left: c.active && !suppressed ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }}/>
                </div>
              </div>

              {/* alarm pills */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6 }}>
                {c.alarms.map(a => {
                  const Ic = I[a.icon] || I.bell;
                  const kid = a.kid ? KIDS[a.kid] : null;
                  return (
                    <div key={a.id} style={{ padding: '7px 9px', borderRadius: 9, background: 'oklch(1 0 0 / 0.04)', border: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Ic size={12} stroke="var(--fg-2)"/>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 10, color: 'var(--fg)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.label}</div>
                        <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{a.time}{kid ? ' · ' + kid.name : ''}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── RULES TAB (recurrence overview) ────────────────
const RulesTab = ({ tasks, onAdd }) => {
  const grouped = {};
  tasks.forEach(t => {
    const key = t.recurrence;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 8 }}>RECURRENCE · GROUPED BY RULE</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Object.entries(grouped).map(([rule, ts]) => (
          <div key={rule} className="glass fade-up" style={{ padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <I.refresh size={14} stroke="oklch(0.9 0.14 var(--hue))"/>
                <div className="display" style={{ fontSize: 13, fontWeight: 500 }}>{rule}</div>
              </div>
              <Chip size="sm">{ts.length}</Chip>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {ts.map(t => (
                <div key={t.id} style={{ fontSize: 11, color: 'var(--fg-2)', paddingLeft: 22, display: 'flex', gap: 6 }}>
                  <span style={{ color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>{t.time}</span>
                  <span>{t.title}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div onClick={onAdd} className="tap" style={{ marginTop: 10, padding: 12, borderRadius: 12, border: '1.5px dashed var(--hairline-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--fg-2)', fontSize: 12 }}>
        <I.plus size={14}/> Build custom recurrence
      </div>
    </div>
  );
};

// ── VOICE COMMAND SHEET ────────────────────────────
const VoiceCommandSheet = ({ onClose, onApply }) => {
  const [heard, setHeard] = React.useState(null);
  const [listening, setListening] = React.useState(false);

  const simulate = (cmd) => {
    setListening(true);
    setHeard(null);
    setTimeout(() => {
      setHeard(cmd);
      setListening(false);
    }, 1200);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--scrim)', backdropFilter: 'blur(12px)', zIndex: 80, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="fade-up" style={{ width: '100%', background: 'var(--sheet-bg)', border: '1px solid var(--hairline)', borderRadius: '24px 24px 0 0', padding: 20, paddingBottom: 40, maxHeight: '85%', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 4, background: 'var(--grabber)', borderRadius: 99, margin: '0 auto 16px' }}/>

        {/* Voice orb */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 12 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, oklch(0.78 0.16 var(--hue) / 0.5), transparent 70%)', animation: listening ? 'breathe 1s infinite' : 'breathe 3s infinite' }}/>
            <div style={{ position: 'absolute', inset: 12, borderRadius: '50%', background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 80)))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px oklch(0.78 0.16 var(--hue) / 0.6)' }}>
              <I.mic size={22} stroke="#06060a"/>
            </div>
          </div>
          <div className="display" style={{ fontSize: 16, fontWeight: 500, color: 'var(--sheet-fg)', marginBottom: 4 }}>
            {listening ? 'Listening…' : heard ? 'Got it' : 'Hey Friday'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)', textAlign: 'center', maxWidth: 280 }}>
            {heard ? heard.text : 'Try a one-shot override. These apply for the scope you say and auto-clear after.'}
          </div>
        </div>

        {heard ? (
          <div className="glass fade-up" style={{ padding: 14, marginBottom: 14, border: '1px solid oklch(0.78 0.16 var(--hue) / 0.4)', background: 'oklch(0.78 0.16 var(--hue) / 0.08)' }}>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 6 }}>NIK WILL</div>
            <div style={{ fontSize: 13, color: 'var(--fg)', lineHeight: 1.4, marginBottom: 10 }}>
              {heard.kind === 'reassign'
                ? <>Reassign <b>{heard.affects}</b> from the default owner to the one you named — just for <b>{heard.scope}</b>.</>
                : <>Suppress all alarms in <b>{heard.affects}</b> for <b>{heard.scope}</b>. Nothing ringing, nothing pinging.</>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div onClick={onClose} className="tap" style={{ flex: 1, padding: 10, borderRadius: 10, background: 'oklch(1 0 0 / 0.05)', border: '1px solid var(--hairline)', textAlign: 'center', fontSize: 12, color: 'var(--fg-2)' }}>Cancel</div>
              <div onClick={() => onApply(heard)} className="tap" style={{ flex: 2, padding: 10, borderRadius: 10, background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))', color: '#06060a', textAlign: 'center', fontSize: 12, fontWeight: 600 }}>Confirm</div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 8 }}>TRY ONE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {VOICE_COMMAND_EXAMPLES.map((cmd, i) => (
                <div key={i} onClick={() => simulate(cmd)} className="tap glass" style={{ padding: 11, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: 'oklch(0.78 0.16 var(--hue) / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <I.mic size={12} stroke="oklch(0.9 0.14 var(--hue))"/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--fg)', fontWeight: 500 }}>"{cmd.text}"</div>
                    <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{cmd.scope.toUpperCase()} · {cmd.affects}</div>
                  </div>
                  <I.chevR size={12} stroke="var(--fg-3)"/>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── RECURRENCE BUILDER SHEET ───────────────────────
const RecurrenceBuilderSheet = ({ onClose, onSave }) => {
  const [title, setTitle] = React.useState('');
  const [mode, setMode] = React.useState('weekly'); // daily | weekdays | weekly | biweekly | monthly | custom
  const [days, setDays] = React.useState(['tue']);
  const [monthlyKind, setMonthlyKind] = React.useState('dayOfMonth'); // dayOfMonth | nthWeek
  const [dayOfMonth, setDayOfMonth] = React.useState(15);
  const [nthWeek, setNthWeek] = React.useState('2');
  const [nthWeekday, setNthWeekday] = React.useState('wed');
  const [time, setTime] = React.useState('17:00');
  const [owner, setOwner] = React.useState('arjun');
  const [pair, setPair] = React.useState(false);

  const DAYS = [['mon','M'],['tue','T'],['wed','W'],['thu','T'],['fri','F'],['sat','S'],['sun','S']];
  const NTH = [['1','1st'],['2','2nd'],['3','3rd'],['4','4th'],['last','Last']];

  const toggleDay = (d) => setDays(ds => ds.includes(d) ? ds.filter(x => x !== d) : [...ds, d]);

  const label = (() => {
    if (mode === 'daily') return 'Every day';
    if (mode === 'weekdays') return 'Mon–Fri';
    if (mode === 'weekly') return days.length ? 'Every ' + days.map(d => d[0].toUpperCase() + d.slice(1,3)).join(', ') : 'Weekly — pick days';
    if (mode === 'biweekly') return 'Every other ' + (days[0] ? days[0][0].toUpperCase() + days[0].slice(1,3) : 'Tue');
    if (mode === 'monthly' && monthlyKind === 'dayOfMonth') return `Monthly on the ${dayOfMonth}${['th','st','nd','rd'][dayOfMonth%10>3?0:dayOfMonth%10]}`;
    if (mode === 'monthly' && monthlyKind === 'nthWeek') return `Monthly — ${NTH.find(n=>n[0]===nthWeek)[1]} ${nthWeekday[0].toUpperCase()+nthWeekday.slice(1,3)}`;
    return 'Custom';
  })();

  const save = () => {
    if (!title.trim()) return;
    onSave({ title, recurrenceLabel: label, time, owner, pair });
  };

  const modes = [
    ['daily', 'Every day'],
    ['weekdays', 'Weekdays'],
    ['weekly', 'Weekly (pick days)'],
    ['biweekly', 'Every other week'],
    ['monthly', 'Monthly'],
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--scrim)', backdropFilter: 'blur(12px)', zIndex: 80, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="fade-up" style={{ width: '100%', background: 'var(--sheet-bg)', border: '1px solid var(--hairline)', borderRadius: '24px 24px 0 0', padding: 20, paddingBottom: 40, maxHeight: '90%', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 4, background: 'var(--grabber)', borderRadius: 99, margin: '0 auto 16px' }}/>
        <div className="display" style={{ fontSize: 18, fontWeight: 600, marginBottom: 14, color: 'var(--sheet-fg)' }}>New recurring task</div>

        {/* Title */}
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Piano class — Kiaan" style={{ width: '100%', padding: 12, borderRadius: 12, background: 'var(--input-bg)', border: '1px solid var(--hairline)', color: 'var(--sheet-fg)', fontSize: 13, fontFamily: 'var(--font-body, Inter)', outline: 'none', marginBottom: 14, boxSizing: 'border-box' }}/>

        {/* Recurrence mode */}
        <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>REPEATS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {modes.map(([k, l]) => (
            <div key={k} onClick={() => setMode(k)} className="tap" style={{ padding: '7px 11px', borderRadius: 99, fontSize: 11, background: mode === k ? 'oklch(0.78 0.16 var(--hue) / 0.2)' : 'oklch(1 0 0 / 0.05)', border: '1px solid ' + (mode === k ? 'oklch(0.78 0.16 var(--hue) / 0.4)' : 'var(--hairline)'), color: mode === k ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)' }}>
              {l}
            </div>
          ))}
        </div>

        {/* Day picker for weekly/biweekly */}
        {(mode === 'weekly' || mode === 'biweekly') && (
          <>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>DAYS</div>
            <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
              {DAYS.map(([k, l]) => (
                <div key={k} onClick={() => toggleDay(k)} className="tap" style={{ flex: 1, aspectRatio: '1', maxWidth: 42, borderRadius: 10, background: days.includes(k) ? 'oklch(0.78 0.16 var(--hue) / 0.25)' : 'oklch(1 0 0 / 0.04)', border: '1px solid ' + (days.includes(k) ? 'oklch(0.78 0.16 var(--hue) / 0.5)' : 'var(--hairline)'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: days.includes(k) ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)' }}>
                  {l}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Monthly options */}
        {mode === 'monthly' && (
          <>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>MONTHLY PATTERN</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {[['dayOfMonth', 'Same day each month'], ['nthWeek', 'Nth weekday']].map(([k, l]) => (
                <div key={k} onClick={() => setMonthlyKind(k)} className="tap" style={{ flex: 1, padding: '8px 10px', borderRadius: 10, fontSize: 11, textAlign: 'center', background: monthlyKind === k ? 'oklch(0.78 0.16 var(--hue) / 0.2)' : 'oklch(1 0 0 / 0.04)', border: '1px solid ' + (monthlyKind === k ? 'oklch(0.78 0.16 var(--hue) / 0.4)' : 'var(--hairline)'), color: monthlyKind === k ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)' }}>
                  {l}
                </div>
              ))}
            </div>
            {monthlyKind === 'dayOfMonth' ? (
              <div style={{ marginBottom: 12 }}>
                <input type="range" min="1" max="31" value={dayOfMonth} onChange={e => setDayOfMonth(+e.target.value)} style={{ width: '100%' }}/>
                <div style={{ fontSize: 11, color: 'var(--fg-2)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>Day {dayOfMonth}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <select value={nthWeek} onChange={e => setNthWeek(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 10, background: 'var(--input-bg)', border: '1px solid var(--hairline)', color: 'var(--sheet-fg)', fontSize: 12 }}>
                  {NTH.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                <select value={nthWeekday} onChange={e => setNthWeekday(e.target.value)} style={{ flex: 2, padding: 10, borderRadius: 10, background: 'var(--input-bg)', border: '1px solid var(--hairline)', color: 'var(--sheet-fg)', fontSize: 12 }}>
                  <option value="mon">Monday</option><option value="tue">Tuesday</option><option value="wed">Wednesday</option><option value="thu">Thursday</option><option value="fri">Friday</option><option value="sat">Saturday</option><option value="sun">Sunday</option>
                </select>
              </div>
            )}
          </>
        )}

        {/* Time */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>TIME</div>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, background: 'var(--input-bg)', border: '1px solid var(--hairline)', color: 'var(--sheet-fg)', fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>ASSIGN</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {Object.entries(PARENTS).map(([k, p]) => (
                <div key={k} onClick={() => setOwner(k)} className="tap" style={{ flex: 1, padding: 10, borderRadius: 10, textAlign: 'center', background: owner === k ? `oklch(0.7 0.18 ${p.hue} / 0.25)` : 'oklch(1 0 0 / 0.04)', border: '1px solid ' + (owner === k ? `oklch(0.7 0.18 ${p.hue} / 0.5)` : 'var(--hairline)'), fontSize: 11, color: owner === k ? `oklch(0.9 0.14 ${p.hue})` : 'var(--fg-2)', fontWeight: owner === k ? 600 : 400 }}>
                  {p.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pair */}
        <div onClick={() => setPair(!pair)} className="tap" style={{ padding: 10, borderRadius: 10, background: pair ? 'oklch(0.78 0.16 var(--hue) / 0.1)' : 'oklch(1 0 0 / 0.04)', border: '1px solid ' + (pair ? 'oklch(0.78 0.16 var(--hue) / 0.3)' : 'var(--hairline)'), display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 18, height: 18, borderRadius: 6, border: '1.5px solid ' + (pair ? 'oklch(0.78 0.16 var(--hue))' : 'var(--hairline-strong)'), background: pair ? 'oklch(0.78 0.16 var(--hue) / 0.3)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {pair && <I.check size={11} stroke="oklch(0.9 0.14 var(--hue))"/>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg)' }}>Also notify other parent</div>
        </div>

        {/* Preview */}
        <div className="glass" style={{ padding: 12, marginBottom: 14, background: 'oklch(0.78 0.16 var(--hue) / 0.05)', borderColor: 'oklch(0.78 0.16 var(--hue) / 0.2)' }}>
          <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 4 }}>PREVIEW</div>
          <div style={{ fontSize: 12, color: 'var(--fg)' }}>
            <b>{title || 'New task'}</b> · {label} at {time}
          </div>
          <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
            ASSIGNED: {PARENTS[owner].name.toUpperCase()}{pair ? ' + NOTIFY ' + Object.values(PARENTS).find(p => p !== PARENTS[owner]).name.toUpperCase() : ''}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div onClick={onClose} className="tap" style={{ flex: 1, padding: 12, borderRadius: 12, background: 'oklch(1 0 0 / 0.05)', border: '1px solid var(--hairline)', textAlign: 'center', fontSize: 13, color: 'var(--fg-2)' }}>Cancel</div>
          <div onClick={save} className="tap" style={{ flex: 2, padding: 12, borderRadius: 12, background: title ? 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))' : 'oklch(1 0 0 / 0.05)', color: title ? '#06060a' : 'var(--fg-3)', fontWeight: 600, fontSize: 13, textAlign: 'center' }}>
            Save rule
          </div>
        </div>
      </div>
    </div>
  );
};

// ── LIVE TOAST ─────────────────────────────────────
const LiveToast = ({ notif }) => {
  const Ic = I[notif.icon] || I.bell;
  return (
    <div className="fade-up" style={{ position: 'absolute', top: 60, left: 12, right: 12, zIndex: 90, padding: 12, borderRadius: 14, background: 'var(--sheet-bg)', backdropFilter: 'blur(16px)', border: '1px solid oklch(0.78 0.16 var(--hue) / 0.4)', boxShadow: '0 10px 30px oklch(0 0 0 / 0.5), 0 0 30px oklch(0.78 0.16 var(--hue) / 0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Ic size={16} stroke="#06060a"/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sheet-fg)' }}>{notif.title}</div>
        <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 1 }}>{notif.body}</div>
      </div>
    </div>
  );
};

window.FamilyOpsScreen = FamilyOpsScreen;
