/* Aether — improved Habits with add/remove + GPS/Health integrations + dynamic widgets
   Also: terminology mapping so adult themes use neutral names (not "Hunter"/"Quest") */

// ── Terminology map by aesthetic ───────────────────
const VOCAB = {
  youth: {
    user_title: 'Rank B Hunter',
    level_word: 'LVL',
    xp_word: 'XP',
    quest: 'Quest',
    quests: 'Quests',
    questsPage: 'Daily Quests',
    mission: 'Mission',
    habits: 'Rituals',
    streak: 'Streak',
    fitness: 'Training',
    rank_prefix: 'RANK',
    greet: 'Good morning,',
    hud_label: 'HUNTER',
    emergent: 'EMERGENT · GPS',
  },
  adult: {
    user_title: 'Member',
    level_word: 'Tier',
    xp_word: 'Points',
    quest: 'Task',
    quests: 'Tasks',
    questsPage: "Today's Tasks",
    mission: 'Focus',
    habits: 'Habits',
    streak: 'Streak',
    fitness: 'Fitness',
    rank_prefix: 'PRIORITY',
    greet: 'Hello,',
    hud_label: 'PROFILE',
    emergent: 'SMART · GPS',
  },
};
const getVocab = (aesthetic) => (aesthetic === 'glass' || aesthetic === 'organic') ? VOCAB.adult : VOCAB.youth;

window.VOCAB = VOCAB;
window.getVocab = getVocab;

// ── Improved HABITS screen ─────────────────────────
const HabitsScreenV2 = ({ onNav, aesthetic = 'hybrid' }) => {
  const V = getVocab(aesthetic);
  const [habits, setHabits] = React.useState(MOCK.habits);
  const [editing, setEditing] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [gpsEnabled, setGpsEnabled] = React.useState(true);
  const [healthEnabled, setHealthEnabled] = React.useState(true);

  const bump = (id) => setHabits(hs => hs.map(h => h.id === id ? { ...h, done: Math.min(h.target, h.done + 1) } : h));
  const remove = (id) => setHabits(hs => hs.filter(h => h.id !== id));
  const totalPct = habits.length ? habits.reduce((s, h) => s + (h.done / h.target), 0) / habits.length : 0;

  const add = (newH) => {
    setHabits(hs => [...hs, { id: 'h' + Date.now(), done: 0, streak: 0, ...newH }]);
    setAdding(false);
  };

  return (
    <div style={{ padding: '8px 16px 80px' }}>
      <div style={{ marginBottom: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>{V.habits.toUpperCase()} · TODAY</div>
          <div className="display" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>{V.habits}</div>
        </div>
        <div onClick={() => setEditing(!editing)} className="tap" style={{ padding: '7px 12px', borderRadius: 99, fontSize: 11, background: editing ? 'oklch(0.78 0.16 var(--hue) / 0.2)' : 'oklch(1 0 0 / 0.04)', border: '1px solid ' + (editing ? 'oklch(0.78 0.16 var(--hue) / 0.5)' : 'var(--hairline)'), color: editing ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)' }}>{editing ? 'Done' : 'Edit'}</div>
      </div>

      {/* Hero ring */}
      <div className="glass fade-up" style={{ padding: 18, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative' }}>
          <Ring size={86} pct={totalPct} sw={6}/>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="display" style={{ fontSize: 20, fontWeight: 600 }}>{Math.round(totalPct * 100)}%</div>
            <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>COMPLETE</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="display" style={{ fontSize: 15, fontWeight: 500 }}>{habits.length} {V.habits.toLowerCase()} tracked</div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.4, marginTop: 4 }}>
            Longest {V.streak.toLowerCase()}: <b style={{ color: 'oklch(0.82 0.17 40)' }}>42 days</b>. Hydrate next.
          </div>
        </div>
      </div>

      {/* Integration chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <IntegrationChip label="GPS" sub="auto-logging" on={gpsEnabled} onToggle={() => setGpsEnabled(!gpsEnabled)} icon="location"/>
        <IntegrationChip label="Apple Health" sub="12 metrics" on={healthEnabled} onToggle={() => setHealthEnabled(!healthEnabled)} icon="trend"/>
        <IntegrationChip label="Calendar" sub="time blocks" on={true} icon="calendar"/>
      </div>

      {/* Habit list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {habits.map(h => {
          const HI = I[h.icon] || I.target;
          const pct = h.done / h.target;
          const done = h.done >= h.target;
          return (
            <div key={h.id} className="glass fade-up" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <Ring size={52} pct={pct} sw={3} gradId={h.hue > 100 && h.hue < 200 ? 'ringGradGreen' : h.hue < 80 ? 'ringGradWarm' : 'ringGradCool'}/>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HI size={18} stroke={`oklch(0.85 0.14 ${h.hue})`}/>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="display" style={{ fontSize: 14, fontWeight: 500 }}>{h.name}</div>
                  {done && <Chip tone="ok" size="sm">DONE</Chip>}
                  {h.auto && <Chip tone="accent" size="sm">AUTO</Chip>}
                </div>
                <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  {h.done} / {h.target} {h.unit} · <span style={{ color: 'oklch(0.82 0.17 40)' }}>🔥 {h.streak}d</span>
                  {h.source && <span> · {h.source}</span>}
                </div>
              </div>
              {editing ? (
                <div onClick={() => remove(h.id)} className="tap" style={{ width: 34, height: 34, borderRadius: 10, background: 'oklch(0.70 0.20 25 / 0.15)', border: '1px solid oklch(0.70 0.20 25 / 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <I.close size={14} stroke="oklch(0.85 0.15 25)"/>
                </div>
              ) : (
                <div onClick={() => bump(h.id)} className="tap" style={{ width: 34, height: 34, borderRadius: 10, background: done ? 'oklch(0.78 0.15 150 / 0.2)' : 'oklch(0.78 0.16 var(--hue) / 0.18)', border: '1px solid ' + (done ? 'oklch(0.78 0.15 150 / 0.4)' : 'oklch(0.78 0.16 var(--hue) / 0.4)'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {done ? <I.check size={14} stroke="oklch(0.85 0.14 150)"/> : <I.plus size={14} stroke="oklch(0.9 0.14 var(--hue))"/>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add habit CTA */}
      <div onClick={() => setAdding(true)} className="tap" style={{ marginTop: 12, padding: 14, borderRadius: 14, border: '1.5px dashed var(--hairline-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--fg-2)', fontSize: 13 }}>
        <I.plus size={16}/> <span>New {V.habits.toLowerCase().slice(0, -1)}</span>
      </div>

      {/* AI suggestions */}
      <div style={{ marginTop: 14, fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 6 }}>AETHER SUGGESTS</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[
          ['Journal', 'brain', 280, 1, 'entry'],
          ['Stretch', 'target', 40, 15, 'min'],
          ['Sunlight', 'sun', 50, 20, 'min'],
          ['Cold shower', 'water', 200, 1, 'x'],
        ].map(([n, ic, hue, target, unit]) => (
          <div key={n} onClick={() => add({ name: n, icon: ic, hue, target, unit })} className="tap" style={{ padding: '7px 11px', borderRadius: 99, fontSize: 11, background: 'oklch(0.78 0.16 var(--hue) / 0.1)', border: '1px solid oklch(0.78 0.16 var(--hue) / 0.3)', color: 'oklch(0.9 0.14 var(--hue))', display: 'flex', alignItems: 'center', gap: 5 }}>
            <I.plus size={10}/> {n}
          </div>
        ))}
      </div>

      {/* Add habit modal */}
      {adding && <AddHabitSheet onAdd={add} onClose={() => setAdding(false)}/>}
    </div>
  );
};

const IntegrationChip = ({ label, sub, on, onToggle, icon }) => {
  const Ic = I[icon];
  return (
    <div onClick={onToggle} className="tap glass" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: onToggle ? 'pointer' : 'default' }}>
      <Ic size={14} stroke={on ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-3)'}/>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg)' }}>{label}</div>
        <div style={{ fontSize: 8, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>{sub}</div>
      </div>
      <div style={{ width: 28, height: 16, borderRadius: 99, position: 'relative', background: on ? 'oklch(0.78 0.16 var(--hue))' : 'oklch(1 0 0 / 0.1)' }}>
        <div style={{ position: 'absolute', top: 2, left: on ? 14 : 2, width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }}/>
      </div>
    </div>
  );
};

const AddHabitSheet = ({ onAdd, onClose }) => {
  const [name, setName] = React.useState('');
  const [icon, setIcon] = React.useState('target');
  const [target, setTarget] = React.useState(5);
  const [unit, setUnit] = React.useState('x');
  const icons = ['target', 'water', 'book', 'brain', 'dumbbell', 'flame', 'moon', 'sun'];
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--scrim)', backdropFilter: 'blur(10px)', zIndex: 70, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="fade-up" style={{ width: '100%', background: 'var(--sheet-bg)', border: '1px solid var(--hairline)', borderRadius: '24px 24px 0 0', padding: 20, paddingBottom: 40 }}>
        <div style={{ width: 40, height: 4, background: 'var(--grabber)', borderRadius: 99, margin: '0 auto 16px' }}/>
        <div className="display" style={{ fontSize: 18, fontWeight: 600, marginBottom: 14, color: 'var(--sheet-fg)' }}>New habit</div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="What do you want to build?" style={{ width: '100%', padding: 12, borderRadius: 12, background: 'var(--input-bg)', border: '1px solid var(--hairline)', color: 'var(--sheet-fg)', fontSize: 13, fontFamily: 'var(--font-body, Inter)', outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}/>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>ICON</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {icons.map(i => {
            const Ic = I[i];
            return (
              <div key={i} onClick={() => setIcon(i)} className="tap" style={{ width: 40, height: 40, borderRadius: 10, background: icon === i ? 'oklch(0.78 0.16 var(--hue) / 0.25)' : 'oklch(1 0 0 / 0.05)', border: '1px solid ' + (icon === i ? 'oklch(0.78 0.16 var(--hue) / 0.5)' : 'var(--hairline)'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ic size={18} stroke={icon === i ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)'}/>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>TARGET</div>
            <input type="number" value={target} onChange={e => setTarget(+e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, background: 'var(--input-bg)', border: '1px solid var(--hairline)', color: 'var(--sheet-fg)', fontSize: 14, fontFamily: 'var(--font-mono)', outline: 'none', boxSizing: 'border-box' }}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>UNIT</div>
            <input value={unit} onChange={e => setUnit(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, background: 'var(--input-bg)', border: '1px solid var(--hairline)', color: 'var(--sheet-fg)', fontSize: 14, fontFamily: 'var(--font-mono)', outline: 'none', boxSizing: 'border-box' }}/>
          </div>
        </div>
        <div onClick={() => name && onAdd({ name, icon, hue: 220, target, unit })} className="tap" style={{ padding: 14, borderRadius: 12, background: name ? 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))' : 'oklch(1 0 0 / 0.05)', color: name ? '#06060a' : 'var(--fg-3)', fontWeight: 600, fontSize: 14, textAlign: 'center' }}>
          Create
        </div>
      </div>
    </div>
  );
};

window.HabitsScreenV2 = HabitsScreenV2;
