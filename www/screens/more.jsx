/* Nik — Habits, Quests, Family, Widgets, Stats screens */

// ── HABITS ─────────────────────────────────────────────
const HabitsScreen = ({ onNav }) => {
  const [habits, setHabits] = React.useState(MOCK.habits);
  const bump = (id) => setHabits(hs => hs.map(h => h.id === id ? { ...h, done: Math.min(h.target, h.done + 1) } : h));
  const reset = (id) => setHabits(hs => hs.map(h => h.id === id ? { ...h, done: 0 } : h));

  const totalPct = habits.reduce((s, h) => s + (h.done / h.target), 0) / habits.length;

  return (
    <div style={{ padding: '8px 16px 80px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>RITUALS · TODAY</div>
        <div className="display" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>Habits</div>
      </div>

      {/* Hero ring — overall */}
      <div className="glass fade-up" style={{ padding: 20, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative' }}>
          <Ring size={90} pct={totalPct} sw={6}/>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="display" style={{ fontSize: 22, fontWeight: 600 }}>{Math.round(totalPct * 100)}%</div>
            <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>COMPLETE</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="display" style={{ fontSize: 15, fontWeight: 500 }}>You're on track</div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.4, marginTop: 4 }}>
            Log 2 more to keep your <b style={{ color: 'oklch(0.82 0.17 40)' }}>42-day streak</b>. Nik suggests hydrating next.
          </div>
        </div>
      </div>

      {/* Habits list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {habits.map(h => {
          const HI = I[h.icon];
          const pct = h.done / h.target;
          const done = h.done >= h.target;
          return (
            <div key={h.id} className="glass fade-up" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <Ring size={54} pct={pct} sw={3} gradId={h.hue > 100 && h.hue < 200 ? 'ringGradGreen' : h.hue < 80 ? 'ringGradWarm' : 'ringGradCool'}/>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HI size={20} stroke={`oklch(0.85 0.14 ${h.hue})`}/>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="display" style={{ fontSize: 15, fontWeight: 500 }}>{h.name}</div>
                  {done && <Chip tone="ok" size="sm">DONE</Chip>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  {h.done} / {h.target} {h.unit} · <span style={{ color: 'oklch(0.82 0.17 40)' }}>🔥 {h.streak}d</span>
                </div>
              </div>
              <div onClick={() => bump(h.id)} className="tap" style={{
                width: 38, height: 38, borderRadius: 12,
                background: done ? 'oklch(0.78 0.15 150 / 0.2)' : 'oklch(0.78 0.16 var(--hue) / 0.18)',
                border: '1px solid ' + (done ? 'oklch(0.78 0.15 150 / 0.4)' : 'oklch(0.78 0.16 var(--hue) / 0.4)'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {done ? <I.check size={16} stroke="oklch(0.85 0.14 150)"/> : <I.plus size={16} stroke="oklch(0.9 0.14 var(--hue))"/>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add habit CTA */}
      <div className="tap" style={{
        marginTop: 14, padding: 14, borderRadius: 16,
        border: '1.5px dashed var(--hairline-strong)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        color: 'var(--fg-2)', fontSize: 13,
      }}>
        <I.plus size={16}/> <span>New ritual</span>
      </div>
    </div>
  );
};

// ── QUESTS ─────────────────────────────────────────────
const QuestsScreen = ({ onNav }) => {
  const rankHue = { S: 320, A: 30, B: 220, C: 150, D: 260 };
  return (
    <div style={{ padding: '8px 16px 80px' }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>DAILY LOG</div>
          <div className="display" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>Quests</div>
        </div>
        <Chip tone="accent" size="lg">+540 XP TODAY</Chip>
      </div>

      {/* Featured emergent quest (GPS) */}
      <div className="glass scanlines fade-up" style={{
        padding: 16, marginBottom: 14, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue) / 0.18), oklch(0.65 0.22 calc(var(--hue) + 80) / 0.12))',
        borderColor: 'oklch(0.78 0.16 var(--hue) / 0.4)',
      }}>
        <HUDCorner position="tl"/><HUDCorner position="tr"/><HUDCorner position="bl"/><HUDCorner position="br"/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <I.sparkle size={14} stroke="oklch(0.9 0.14 var(--hue))"/>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'oklch(0.9 0.14 var(--hue))', letterSpacing: 1.5 }}>EMERGENT · CONTEXT · GPS</span>
        </div>
        <div className="display" style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.3, marginBottom: 8 }}>
          Groceries run — you're 420m from Nature's Basket
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-2)', marginBottom: 12, lineHeight: 1.5 }}>
          Meera added this 12 min ago. Nik detected your proximity and surfaced it. Accept to lock in +80 XP and save her a trip.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="tap" style={{
            flex: 1, padding: '10px 12px', borderRadius: 12,
            background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.60 0.22 calc(var(--hue) + 60)))',
            color: '#06060a', fontSize: 13, fontWeight: 600, textAlign: 'center',
            boxShadow: '0 0 16px oklch(0.78 0.16 var(--hue) / 0.4)',
          }}>Accept Quest</div>
          <div className="tap" style={{
            padding: '10px 14px', borderRadius: 12,
            background: 'oklch(1 0 0 / 0.05)', border: '1px solid var(--hairline)',
            fontSize: 13, color: 'var(--fg-2)',
          }}>Snooze</div>
        </div>
      </div>

      {/* Quest list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {MOCK.quests.map(q => (
          <div key={q.id} className="glass fade-up" style={{
            padding: 12, display: 'flex', alignItems: 'center', gap: 12,
            opacity: q.status === 'done' ? 0.55 : 1,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              border: `1.5px solid oklch(0.78 0.16 ${rankHue[q.rank]})`,
              background: `oklch(0.78 0.16 ${rankHue[q.rank]} / 0.1)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17,
              color: `oklch(0.9 0.14 ${rankHue[q.rank]})`, flexShrink: 0,
            }}>{q.rank}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)', textDecoration: q.status === 'done' ? 'line-through' : 'none' }}>
                {q.title}
              </div>
              <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 3, display: 'flex', gap: 8 }}>
                <span style={{ color: 'oklch(0.9 0.14 var(--hue))' }}>+{q.xp} XP</span>
                {q.trigger && <span>· {q.trigger}</span>}
                {q.auto && <span style={{ color: 'oklch(0.85 0.14 150)' }}>· AUTO</span>}
              </div>
              {q.progress && (
                <div style={{ height: 2, background: 'oklch(1 0 0 / 0.06)', borderRadius: 99, marginTop: 6, overflow: 'hidden' }}>
                  <div className="xp-fill" style={{ height: '100%', width: `${q.progress * 100}%`, borderRadius: 99 }}/>
                </div>
              )}
            </div>
            {q.status === 'done' && <I.check size={18} stroke="oklch(0.85 0.14 150)"/>}
            {q.status === 'pending' && <I.chevR size={14} stroke="var(--fg-3)"/>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── FAMILY ─────────────────────────────────────────────
const FamilyScreen = ({ onNav }) => {
  const [selected, setSelected] = React.useState(0);
  const members = MOCK.family;

  return (
    <div style={{ padding: '8px 16px 80px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>SHARED CIRCLE · 5</div>
        <div className="display" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>Family</div>
      </div>

      {/* Constellation */}
      <div className="glass fade-up" style={{ padding: 16, marginBottom: 14, position: 'relative', height: 280, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, oklch(0.78 0.16 var(--hue) / 0.15), transparent 60%)' }}/>
        {/* orbit rings */}
        {[70, 110].map(r => (
          <div key={r} style={{
            position: 'absolute', top: '50%', left: '50%',
            width: r*2, height: r*2, borderRadius: '50%',
            border: '1px dashed oklch(1 0 0 / 0.08)',
            transform: 'translate(-50%, -50%)',
          }}/>
        ))}
        {/* center = you */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <Avatar name="A" size={56} hue={220} ring/>
        </div>
        {/* others in orbit */}
        {members.filter(m => !m.self).map((m, i, arr) => {
          const angle = (i / arr.length) * 2 * Math.PI - Math.PI / 2;
          const r = i % 2 === 0 ? 90 : 115;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          return (
            <div key={m.name} onClick={() => setSelected(i + 1)} className="tap" style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
            }}>
              <Avatar name={m.name} size={42} hue={m.hue} status={m.status} ring={selected === i + 1}/>
              <div style={{ fontSize: 9, textAlign: 'center', marginTop: 4, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>{m.name.toUpperCase()}</div>
            </div>
          );
        })}
        {/* HUD labels */}
        <div style={{ position: 'absolute', top: 12, left: 12, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-3)', letterSpacing: 1 }}>CONSTELLATION</div>
        <div style={{ position: 'absolute', top: 12, right: 12, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'oklch(0.78 0.15 150)', letterSpacing: 1 }}>● LIVE</div>
      </div>

      {/* Selected member card */}
      {selected > 0 && (() => {
        const m = members[selected];
        return (
          <div className="glass fade-up" style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <Avatar name={m.name} size={44} hue={m.hue} status={m.status}/>
              <div style={{ flex: 1 }}>
                <div className="display" style={{ fontSize: 16, fontWeight: 500 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>
                  {m.role.toUpperCase()} · LVL {m.level} · <I.location size={9} style={{ display: 'inline', verticalAlign: 'middle' }}/> {m.location}
                </div>
              </div>
              <Chip tone="accent" size="sm">+ TASK</Chip>
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.5, padding: '8px 10px', background: 'oklch(1 0 0 / 0.03)', borderRadius: 10 }}>
              <b style={{ color: 'oklch(0.9 0.14 var(--hue))' }}>Nik:</b> {m.name === 'Meera' ? 'Meera usually appreciates voice notes on commute. Try one?' : m.name === 'Kiaan' ? 'Kiaan completed 2 of 3 homework quests. Great day.' : m.name === 'Dadi' ? 'Dadi hasn\'t heard from you in 4 days. Call tonight?' : 'Raj is traveling. Low-priority mode on.'}
            </div>
          </div>
        );
      })()}

      {/* Shared tasks */}
      <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 1.5, fontFamily: 'var(--font-mono)' }}>SHARED TASKS</div>
        <Chip tone="warn" size="sm">🔔 1 NEARBY</Chip>
      </div>
      {MOCK.tasks.map(t => (
        <div key={t.id} className="glass fade-up" style={{ padding: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 22, height: 22, borderRadius: 7, border: '1.5px solid var(--hairline-strong)' }}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--fg)' }}>{t.title}</div>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
              {t.when} · by {t.by}
              {t.near && <span style={{ color: 'oklch(0.9 0.14 var(--hue))' }}> · NEARBY</span>}
            </div>
          </div>
          {t.near && <Chip tone="accent" size="sm">+80 XP</Chip>}
        </div>
      ))}
    </div>
  );
};

// ── WIDGETS (home-edit mode) ───────────────────────────
const WidgetsScreen = ({ onNav }) => {
  const [editing, setEditing] = React.useState(true);
  const widgets = [
    { id: 'w1', name: 'Level HUD', size: '2x1', hue: 220 },
    { id: 'w2', name: 'Streak', size: '1x1', hue: 40 },
    { id: 'w3', name: 'Daily Ring', size: '1x1', hue: 200 },
    { id: 'w4', name: 'Active Quest', size: '2x1', hue: 280 },
    { id: 'w5', name: 'Family Ping', size: '2x1', hue: 150 },
    { id: 'w6', name: 'Voice Orb', size: '2x1', hue: 220 },
  ];
  const palette = ['Calendar', 'Sleep', 'Mood', 'Steps', 'Water', 'Map'];

  return (
    <div style={{ padding: '8px 16px 80px' }}>
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>EDIT MODE · DRAG TO REARRANGE</div>
          <div className="display" style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>Your Canvas</div>
        </div>
        <Chip tone="accent" size="sm">● EDITING</Chip>
      </div>

      {/* Bento editable */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {widgets.map(w => (
          <div key={w.id} className="glass" style={{
            padding: 12, aspectRatio: w.size === '2x1' ? '2 / 1' : '1 / 1',
            gridColumn: w.size === '2x1' ? 'span 2' : 'span 1',
            position: 'relative',
            background: `linear-gradient(135deg, oklch(0.78 0.16 ${w.hue} / 0.12), oklch(0.5 0.2 ${w.hue + 60} / 0.06))`,
            borderColor: `oklch(0.78 0.16 ${w.hue} / 0.25)`,
            animation: editing ? 'breathe 2.2s ease-in-out infinite' : 'none',
          }}>
            {/* remove btn */}
            <div style={{
              position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%',
              background: 'oklch(0.25 0.02 260)', border: '1px solid var(--hairline-strong)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <I.close size={10} stroke="var(--fg-2)"/>
            </div>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>{w.size.toUpperCase()}</div>
            <div className="display" style={{ fontSize: 14, fontWeight: 500, marginTop: 6, color: `oklch(0.92 0.1 ${w.hue})` }}>{w.name}</div>
            {/* corner grip */}
            <div style={{ position: 'absolute', bottom: 6, right: 6, opacity: 0.4 }}>
              <svg width="12" height="12" viewBox="0 0 12 12">
                <circle cx="3" cy="3" r="1" fill="currentColor"/>
                <circle cx="9" cy="3" r="1" fill="currentColor"/>
                <circle cx="3" cy="9" r="1" fill="currentColor"/>
                <circle cx="9" cy="9" r="1" fill="currentColor"/>
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Palette */}
      <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 1.5, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>PALETTE · DRAG UP TO ADD</div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {palette.map(p => (
          <div key={p} className="glass tap" style={{
            padding: '10px 14px', borderRadius: 14, flexShrink: 0, fontSize: 12,
            color: 'var(--fg-2)', whiteSpace: 'nowrap',
            background: 'oklch(1 0 0 / 0.03)',
          }}>+ {p}</div>
        ))}
      </div>

      {/* Finish */}
      <div className="tap" style={{
        marginTop: 16, padding: '14px', borderRadius: 14, textAlign: 'center',
        background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))',
        color: '#06060a', fontWeight: 600, fontSize: 14,
      }}>Done editing</div>
    </div>
  );
};

// ── STATS ──────────────────────────────────────────────
const StatsScreen = () => {
  const week = [0.4, 0.7, 0.55, 0.8, 0.65, 0.9, 0.75];
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div style={{ padding: '8px 16px 80px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>INSIGHTS · LAST 7 DAYS</div>
        <div className="display" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>Growth</div>
      </div>

      {/* Weekly chart */}
      <div className="glass fade-up" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>COMPLETION</div>
            <div className="display" style={{ fontSize: 28, fontWeight: 600 }}>68<span style={{ fontSize: 14, color: 'var(--fg-3)' }}>%</span></div>
          </div>
          <Chip tone="ok" size="sm">↑ 12% vs last week</Chip>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 100 }}>
          {week.map((v, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: '100%', height: `${v * 100}%`, borderRadius: 6,
                background: 'linear-gradient(180deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))',
                boxShadow: '0 0 8px oklch(0.78 0.16 var(--hue) / 0.4)',
              }}/>
              <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{days[i]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        {[
          { k: 'Sleep', v: '7.4h', delta: '+12%', hue: 280, icon: 'moon' },
          { k: 'Focus', v: '4.2h', delta: '+8%', hue: 200, icon: 'target' },
          { k: 'Active', v: '58m', delta: '+22%', hue: 40, icon: 'dumbbell' },
          { k: 'Screen', v: '3.1h', delta: '-18%', hue: 150, icon: 'eye' },
        ].map(s => {
          const SI = I[s.icon];
          return (
            <div key={s.k} className="glass fade-up" style={{ padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <SI size={16} stroke={`oklch(0.85 0.14 ${s.hue})`}/>
                <div style={{ fontSize: 10, color: 'oklch(0.85 0.14 150)', fontFamily: 'var(--font-mono)' }}>{s.delta}</div>
              </div>
              <div className="display" style={{ fontSize: 20, fontWeight: 600, marginTop: 8 }}>{s.v}</div>
              <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>{s.k.toUpperCase()}</div>
            </div>
          );
        })}
      </div>

      {/* AI insight */}
      <div className="glass fade-up" style={{
        padding: 14,
        background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue) / 0.15), oklch(0.65 0.22 calc(var(--hue) + 80) / 0.08))',
        borderColor: 'oklch(0.78 0.16 var(--hue) / 0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <I.sparkle size={14} stroke="oklch(0.9 0.14 var(--hue))"/>
          <span style={{ fontSize: 10, color: 'oklch(0.9 0.14 var(--hue))', fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}>NIK · PATTERN FOUND</span>
        </div>
        <div className="display" style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.4, marginBottom: 4 }}>
          You focus 38% better when you train before noon
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.5 }}>
          I'll start suggesting morning gym quests by default. Tap to dismiss if you'd rather not.
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { HabitsScreen, QuestsScreen, FamilyScreen, WidgetsScreen, StatsScreen });
