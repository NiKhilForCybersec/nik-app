/* Nik — Focus Mode
   AI-suggested timer · fullscreen lockdown · distraction tracking · session report.
   Three views:
     1. setup — picks task, AI suggests duration, optional preset
     2. session — running timer, forest-style growth, distraction log
     3. report — score, distractions, insight, "back to home"
*/

const FOCUS_TASKS = [
  { id: 't1', title: 'Spec: sync engine architecture', energy: 'deep', est: 50, pillar: 'focus', icon: 'briefcase' },
  { id: 't2', title: 'Reply to investor thread', energy: 'shallow', est: 15, pillar: 'focus', icon: 'mail' },
  { id: 't3', title: 'Read: \'Being Mortal\' ch. 4', energy: 'medium', est: 30, pillar: 'mind', icon: 'book' },
  { id: 't4', title: 'Anya — homework hour', energy: 'medium', est: 45, pillar: 'family', icon: 'family' },
  { id: 't5', title: 'Inbox zero', energy: 'shallow', est: 20, pillar: 'focus', icon: 'mail' },
];

const DISTRACTION_REASONS = [
  { id: 'msg', label: 'Slack / message', icon: '💬' },
  { id: 'urge', label: 'Just an urge', icon: '🌀' },
  { id: 'kid', label: 'Kid needed me', icon: '👧' },
  { id: 'doubt', label: 'Stuck on the task', icon: '🤔' },
  { id: 'pee', label: 'Bio break', icon: '🚻' },
  { id: 'other', label: 'Something else', icon: '·' },
];

const ENERGY_PRESETS = {
  deep:    { duration: 50, break: 10, label: 'Deep · 50/10', desc: 'Long horizon, no shallow work' },
  medium:  { duration: 30, break: 5,  label: 'Steady · 30/5', desc: 'Focused but flexible' },
  shallow: { duration: 15, break: 3,  label: 'Quick · 15/3',  desc: 'Burst through it' },
};

const FocusScreen = ({ onNav, onExit }) => {
  const [stage, setStage] = React.useState('setup'); // setup | running | paused | report
  const [task, setTask] = React.useState(FOCUS_TASKS[0]);
  const [duration, setDuration] = React.useState(50); // minutes
  const [preset, setPreset] = React.useState('deep');
  const [strictness, setStrictness] = React.useState('medium'); // soft | medium | hard
  const [elapsed, setElapsed] = React.useState(0); // seconds
  const [distractions, setDistractions] = React.useState([]);
  const [showLeave, setShowLeave] = React.useState(false);
  const [pendingDistraction, setPendingDistraction] = React.useState(null);
  const [aiThinking, setAiThinking] = React.useState(false);

  const total = duration * 60;
  const remaining = Math.max(0, total - elapsed);
  const pct = Math.min(1, elapsed / total);

  // tick
  React.useEffect(() => {
    if (stage !== 'running') return;
    const id = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= total) {
          setStage('report');
          return total;
        }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [stage, total]);

  // sim distraction (simulate after 8s and 22s into session for demo)
  React.useEffect(() => {
    if (stage !== 'running') return;
    const t1 = setTimeout(() => {
      if (stage === 'running') {
        setShowLeave(true);
      }
    }, 9000);
    return () => clearTimeout(t1);
  }, [stage]);

  const startSession = () => {
    setElapsed(0);
    setDistractions([]);
    setStage('running');
  };

  const askAi = () => {
    setAiThinking(true);
    setTimeout(() => {
      // suggest based on energy + time of day
      const energySuggestions = {
        deep: { d: 50, p: 'deep', reason: 'Spec writing needs long arcs. 50 min is your historical sweet spot — you usually crash at 65.' },
        medium: { d: 30, p: 'medium', reason: 'Medium energy works. 30 min balances depth without burning out.' },
        shallow: { d: 15, p: 'shallow', reason: 'This is shallow work. Don\'t over-allocate — 15 is plenty.' },
      };
      const s = energySuggestions[task.energy];
      setDuration(s.d);
      setPreset(s.p);
      setAiThinking(false);
    }, 900);
  };

  const handleLeaveAttempt = () => {
    setShowLeave(false);
    setPendingDistraction({ at: elapsed });
  };

  const logDistraction = (reason) => {
    setDistractions(d => [...d, { at: pendingDistraction.at, reason: reason.label, icon: reason.icon }]);
    setPendingDistraction(null);
  };

  if (stage === 'setup') return <FocusSetup {...{ task, setTask, duration, setDuration, preset, setPreset, strictness, setStrictness, askAi, aiThinking, startSession, onExit }}/>;
  if (stage === 'report') return <FocusReport {...{ task, duration, distractions, onExit, restart: () => setStage('setup') }}/>;

  // RUNNING
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, oklch(0.18 0.04 var(--hue)) 0%, oklch(0.06 0.02 var(--hue)) 70%)', overflow: 'hidden', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
      {/* Lockdown bar */}
      <div style={{ padding: '50px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid oklch(1 0 0 / 0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.75 0.18 140)', boxShadow: '0 0 8px oklch(0.75 0.18 140)' }}/>
          <div style={{ fontSize: 10, color: 'oklch(0.75 0.18 140)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}>FOCUS LOCKED · {strictness.toUpperCase()}</div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{distractions.length} DISTRACTIONS</div>
      </div>

      {/* Center — timer + tree */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative' }}>
        {/* Forest tree */}
        <FocusTree pct={pct} distractions={distractions.length}/>

        {/* Big timer */}
        <div style={{ marginTop: 18, textAlign: 'center' }}>
          <div className="display" style={{ fontSize: 56, fontWeight: 300, fontVariantNumeric: 'tabular-nums', letterSpacing: -2, color: 'var(--fg)', lineHeight: 1 }}>
            {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginTop: 6, textTransform: 'uppercase' }}>{task.title}</div>
        </div>

        {/* Progress arc */}
        <svg width="220" height="22" style={{ marginTop: 18, overflow: 'visible' }}>
          <rect x="0" y="9" width="220" height="3" rx="1.5" fill="oklch(1 0 0 / 0.08)"/>
          <rect x="0" y="9" width={220 * pct} height="3" rx="1.5" fill="url(#ringGrad)"/>
          {distractions.map((d, i) => {
            const x = (d.at / total) * 220;
            return <circle key={i} cx={x} cy={10.5} r="3.5" fill="oklch(0.65 0.22 25)" stroke="oklch(0.95 0 0)" strokeWidth="1"/>;
          })}
        </svg>
      </div>

      {/* Distraction log preview */}
      {distractions.length > 0 && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 6 }}>SESSION LOG</div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
            {distractions.map((d, i) => (
              <div key={i} style={{ padding: '4px 8px', borderRadius: 6, background: 'oklch(0.65 0.22 25 / 0.15)', border: '1px solid oklch(0.65 0.22 25 / 0.3)', fontSize: 10, color: 'oklch(0.85 0.18 25)', whiteSpace: 'nowrap', flexShrink: 0 }}>{d.icon} {d.reason}</div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom controls — only emergency exit */}
      <div style={{ padding: '0 16px 28px', display: 'flex', gap: 8 }}>
        <div onClick={() => setStage('setup')} className="tap" style={{ flex: 1, padding: 14, borderRadius: 12, background: 'oklch(1 0 0 / 0.04)', border: '1px solid var(--hairline)', textAlign: 'center', fontSize: 12, color: 'var(--fg-2)' }}>
          End early
        </div>
        <div onClick={() => setStage(stage === 'running' ? 'paused' : 'running')} className="tap" style={{ flex: 1, padding: 14, borderRadius: 12, background: 'oklch(0.78 0.16 var(--hue) / 0.2)', border: '1px solid oklch(0.78 0.16 var(--hue) / 0.4)', textAlign: 'center', fontSize: 12, color: 'oklch(0.9 0.14 var(--hue))', fontWeight: 500 }}>
          {stage === 'paused' ? '▶ Resume' : '⏸ Pause (counts)'}
        </div>
      </div>

      {/* Leave-attempt overlay */}
      {showLeave && (
        <div style={{ position: 'absolute', inset: 0, background: 'oklch(0 0 0 / 0.92)', backdropFilter: 'blur(20px)', zIndex: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
          <div style={{ fontSize: 64, marginBottom: 16, animation: 'orb-pulse 1.5s ease-in-out infinite' }}>⚠️</div>
          <div className="display" style={{ fontSize: 22, fontWeight: 600, textAlign: 'center', marginBottom: 8 }}>App switch detected</div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)', textAlign: 'center', maxWidth: 280, lineHeight: 1.5, marginBottom: 18 }}>
            Your timer paused. We'll log this if you confirm — it helps you spot patterns.
          </div>
          <div onClick={handleLeaveAttempt} className="tap" style={{ padding: '12px 28px', borderRadius: 99, background: 'oklch(0.65 0.22 25 / 0.2)', border: '1px solid oklch(0.65 0.22 25 / 0.5)', color: 'oklch(0.9 0.18 25)', fontWeight: 500, fontSize: 13, marginBottom: 8 }}>Log it & continue</div>
          <div onClick={() => setShowLeave(false)} className="tap" style={{ padding: 10, fontSize: 11, color: 'var(--fg-3)' }}>I was just stretching · don't log</div>
        </div>
      )}

      {/* Reason picker */}
      {pendingDistraction && (
        <div style={{ position: 'absolute', inset: 0, background: 'oklch(0 0 0 / 0.85)', zIndex: 110, display: 'flex', alignItems: 'flex-end' }}>
          <div className="fade-up" style={{ width: '100%', padding: 18, paddingBottom: 30, background: 'var(--theme-bg2, oklch(0.14 0.02 260))', borderRadius: '20px 20px 0 0', border: '1px solid var(--hairline)' }}>
            <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 4 }}>WHAT PULLED YOU AWAY?</div>
            <div className="display" style={{ fontSize: 18, fontWeight: 500, marginBottom: 14 }}>No judgement, just data</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {DISTRACTION_REASONS.map(r => (
                <div key={r.id} onClick={() => logDistraction(r)} className="tap" style={{ padding: 12, borderRadius: 10, background: 'oklch(1 0 0 / 0.04)', border: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{r.icon}</span>
                  <span style={{ fontSize: 12, color: 'var(--fg)' }}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Setup view ────────────────────────────────────────
const FocusSetup = ({ task, setTask, duration, setDuration, preset, setPreset, strictness, setStrictness, askAi, aiThinking, startSession, onExit }) => (
  <div style={{ padding: '8px 16px 100px' }}>
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 2, textTransform: 'uppercase' }}>FOCUS · DEEP WORK MODE</div>
      <div className="display" style={{ fontSize: 26, fontWeight: 'var(--display-weight, 500)', lineHeight: 1.1, marginTop: 4, textTransform: 'var(--display-case, none)', letterSpacing: 'var(--display-tracking, 0)' }}>What are we doing?</div>
    </div>

    {/* Task picker */}
    <div className="glass fade-up" style={{ padding: 12, marginBottom: 10 }}>
      <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 8 }}>SELECT TASK</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {FOCUS_TASKS.map(t => (
          <div key={t.id} onClick={() => setTask(t)} className="tap" style={{ padding: 10, borderRadius: 10, background: task.id === t.id ? 'oklch(0.78 0.16 var(--hue) / 0.15)' : 'oklch(1 0 0 / 0.03)', border: '1px solid ' + (task.id === t.id ? 'oklch(0.78 0.16 var(--hue) / 0.4)' : 'var(--hairline)'), display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'oklch(1 0 0 / 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {I[t.icon] && React.createElement(I[t.icon], { size: 14, stroke: 'var(--fg-2)' })}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{t.title}</div>
              <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{t.energy.toUpperCase()} · ~{t.est} min</div>
            </div>
            {task.id === t.id && <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'oklch(0.78 0.16 var(--hue))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06060a', fontSize: 9, fontWeight: 700 }}>✓</div>}
          </div>
        ))}
      </div>
    </div>

    {/* AI suggest */}
    <div onClick={!aiThinking ? askAi : undefined} className="glass fade-up tap" style={{ padding: 12, marginBottom: 10, borderColor: 'oklch(0.78 0.16 var(--hue) / 0.3)', background: 'oklch(0.78 0.16 var(--hue) / 0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <I.sparkles size={14} stroke="#06060a"/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, color: 'oklch(0.85 0.14 var(--hue))', fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}>NIK SUGGESTS</div>
        {aiThinking ? (
          <div style={{ fontSize: 12, color: 'var(--fg-2)', fontStyle: 'italic' }}>Reading your task energy…</div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--fg)' }}>{duration}-min {preset} session · matches your peak hours</div>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'oklch(0.85 0.14 var(--hue))' }}>{aiThinking ? '⋯' : '⟲'}</div>
    </div>

    {/* Duration */}
    <div className="glass fade-up" style={{ padding: 12, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}>DURATION</div>
        <div className="display" style={{ fontSize: 22, fontWeight: 500 }}>{duration}<span style={{ fontSize: 11, color: 'var(--fg-3)', fontWeight: 400, marginLeft: 4 }}>min</span></div>
      </div>
      <input type="range" min="5" max="120" step="5" value={duration} onChange={e => setDuration(+e.target.value)} style={{ width: '100%', accentColor: 'oklch(0.78 0.16 var(--hue))' }}/>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}><span>5</span><span>120</span></div>
      <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
        {Object.entries(ENERGY_PRESETS).map(([k, p]) => (
          <div key={k} onClick={() => { setPreset(k); setDuration(p.duration); }} className="tap" style={{ flex: 1, padding: 7, borderRadius: 8, background: preset === k ? 'oklch(0.78 0.16 var(--hue) / 0.18)' : 'oklch(1 0 0 / 0.03)', border: '1px solid ' + (preset === k ? 'oklch(0.78 0.16 var(--hue) / 0.4)' : 'var(--hairline)'), textAlign: 'center', fontSize: 10, color: preset === k ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)' }}>{p.label}</div>
        ))}
      </div>
    </div>

    {/* Strictness */}
    <div className="glass fade-up" style={{ padding: 12, marginBottom: 14 }}>
      <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 8 }}>STRICTNESS</div>
      <div style={{ display: 'flex', gap: 5 }}>
        {[
          { k: 'soft', l: 'Soft', d: 'Just track' },
          { k: 'medium', l: 'Medium', d: 'Pause on leave' },
          { k: 'hard', l: 'Hard', d: 'Full lockdown' },
        ].map(o => (
          <div key={o.k} onClick={() => setStrictness(o.k)} className="tap" style={{ flex: 1, padding: 9, borderRadius: 9, background: strictness === o.k ? 'oklch(0.78 0.16 var(--hue) / 0.18)' : 'oklch(1 0 0 / 0.03)', border: '1px solid ' + (strictness === o.k ? 'oklch(0.78 0.16 var(--hue) / 0.4)' : 'var(--hairline)'), textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: strictness === o.k ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg)' }}>{o.l}</div>
            <div style={{ fontSize: 9, color: 'var(--fg-3)', marginTop: 2 }}>{o.d}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Start CTA */}
    <div onClick={startSession} className="tap" style={{ padding: 16, borderRadius: 14, background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))', textAlign: 'center', fontWeight: 600, fontSize: 14, color: '#06060a', boxShadow: '0 12px 40px oklch(0.78 0.16 var(--hue) / 0.4)' }}>
      Begin {duration}-min focus →
    </div>
  </div>
);

// ── Tree ──────────────────────────────────────────────
const FocusTree = ({ pct, distractions }) => {
  const stage = Math.floor(pct * 5); // 0-5
  const wilt = Math.min(distractions, 3);
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" style={{ filter: wilt ? `hue-rotate(${-wilt * 8}deg) saturate(${1 - wilt * 0.15})` : 'none', transition: 'filter 1s' }}>
      {/* ground */}
      <ellipse cx="80" cy="148" rx="50" ry="6" fill="oklch(0.22 0.04 var(--hue) / 0.5)"/>
      {/* trunk */}
      <rect x="76" y={140 - stage * 14} width="8" height={Math.max(6, stage * 14)} fill="oklch(0.35 0.05 30)" rx="2"/>
      {/* leaves */}
      {stage >= 1 && <circle cx="80" cy={132 - stage * 12} r={8 + stage * 4} fill="oklch(0.55 0.18 145)" opacity={0.9 - wilt * 0.15}/>}
      {stage >= 2 && <circle cx="68" cy={132 - stage * 10} r={6 + stage * 3} fill="oklch(0.6 0.16 145)" opacity={0.85 - wilt * 0.15}/>}
      {stage >= 3 && <circle cx="92" cy={132 - stage * 10} r={6 + stage * 3} fill="oklch(0.6 0.16 150)" opacity={0.85 - wilt * 0.15}/>}
      {stage >= 4 && <circle cx="80" cy={120 - stage * 12} r={8 + stage * 2} fill="oklch(0.65 0.18 140)" opacity={0.9 - wilt * 0.15}/>}
      {stage >= 5 && <>
        <circle cx="60" cy="100" r="3" fill="oklch(0.85 0.16 80)" opacity="0.8"/>
        <circle cx="100" cy="95" r="2.5" fill="oklch(0.85 0.16 60)" opacity="0.8"/>
        <circle cx="80" cy="80" r="3" fill="oklch(0.9 0.14 var(--hue))" opacity="0.9"/>
      </>}
      {/* particles */}
      {pct > 0.1 && [...Array(4)].map((_, i) => (
        <circle key={i} cx={50 + i * 20} cy={60 + (i % 2) * 30} r="1.5" fill="oklch(0.9 0.14 var(--hue))" opacity="0.5">
          <animate attributeName="cy" from={60 + (i%2)*30} to={20} dur={(3 + i)+'s'} repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0;0.6;0" dur={(3 + i)+'s'} repeatCount="indefinite"/>
        </circle>
      ))}
    </svg>
  );
};

// ── Report ────────────────────────────────────────────
const FocusReport = ({ task, duration, distractions, onExit, restart }) => {
  const focusScore = Math.max(0, 100 - distractions.length * 12);
  const xpEarned = Math.round((duration / 50) * (focusScore / 100) * 25);
  const insight = distractions.length === 0
    ? 'Pristine session. This belongs in your hall of fame.'
    : distractions.length <= 2
    ? `You leave most often during ${task.title.includes('Spec') ? 'spec work' : 'this kind of task'}. Try a 5-min walk before next session.`
    : 'High distraction load. Tomorrow try a shorter sprint with phone in another room.';

  return (
    <div style={{ position: 'absolute', inset: 0, padding: '50px 16px 30px', background: 'radial-gradient(ellipse at top, oklch(0.18 0.04 var(--hue)) 0%, oklch(0.06 0.02 var(--hue)) 70%)', overflowY: 'auto', zIndex: 100 }}>
      <div style={{ fontSize: 11, color: 'oklch(0.85 0.14 var(--hue))', fontFamily: 'var(--font-mono)', letterSpacing: 2, marginBottom: 6 }}>SESSION COMPLETE</div>
      <div className="display" style={{ fontSize: 28, fontWeight: 'var(--display-weight, 500)', lineHeight: 1.1, marginBottom: 4 }}>{focusScore >= 90 ? 'Outstanding.' : focusScore >= 70 ? 'Good work.' : 'Done. Keep going.'}</div>
      <div style={{ fontSize: 12, color: 'var(--fg-2)', marginBottom: 18 }}>{task.title}</div>

      {/* Big score */}
      <div className="glass fade-up" style={{ padding: 18, marginBottom: 10, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: -50, background: 'radial-gradient(circle, oklch(0.78 0.16 var(--hue) / 0.2) 0%, transparent 60%)', pointerEvents: 'none' }}/>
        <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 2, marginBottom: 6 }}>FOCUS SCORE</div>
        <div className="display" style={{ fontSize: 64, fontWeight: 300, fontVariantNumeric: 'tabular-nums', lineHeight: 1, color: 'oklch(0.92 0.14 var(--hue))', position: 'relative' }}>{focusScore}</div>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 4, position: 'relative' }}>+{xpEarned} XP · +{Math.round(focusScore/10)} nik score</div>
      </div>

      {/* Stats */}
      <div className="glass fade-up" style={{ padding: 14, marginBottom: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, textAlign: 'center' }}>
          <div>
            <div className="display" style={{ fontSize: 22, fontWeight: 500 }}>{duration}<span style={{ fontSize: 10, color: 'var(--fg-3)' }}>m</span></div>
            <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>FOCUSED</div>
          </div>
          <div>
            <div className="display" style={{ fontSize: 22, fontWeight: 500, color: distractions.length ? 'oklch(0.85 0.18 25)' : 'var(--fg)' }}>{distractions.length}</div>
            <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>DISTRACTIONS</div>
          </div>
          <div>
            <div className="display" style={{ fontSize: 22, fontWeight: 500 }}>{Math.round(duration / Math.max(1, distractions.length + 1))}<span style={{ fontSize: 10, color: 'var(--fg-3)' }}>m</span></div>
            <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>AVG STREAK</div>
          </div>
        </div>
      </div>

      {/* Distraction breakdown */}
      {distractions.length > 0 && (
        <div className="glass fade-up" style={{ padding: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 8 }}>WHAT PULLED YOU AWAY</div>
          {distractions.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < distractions.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
              <span style={{ fontSize: 14 }}>{d.icon}</span>
              <span style={{ fontSize: 12, flex: 1 }}>{d.reason}</span>
              <span style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>at {Math.floor(d.at / 60)}:{String(d.at % 60).padStart(2, '0')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Insight */}
      <div className="glass fade-up" style={{ padding: 12, marginBottom: 14, borderColor: 'oklch(0.78 0.16 var(--hue) / 0.3)', background: 'oklch(0.78 0.16 var(--hue) / 0.06)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <I.sparkles size={12} stroke="#06060a"/>
        </div>
        <div>
          <div style={{ fontSize: 9, color: 'oklch(0.85 0.14 var(--hue))', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 3 }}>NIK INSIGHT</div>
          <div style={{ fontSize: 12, color: 'var(--fg)', lineHeight: 1.5 }}>{insight}</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div onClick={restart} className="tap" style={{ flex: 1, padding: 13, borderRadius: 12, background: 'oklch(1 0 0 / 0.05)', border: '1px solid var(--hairline)', textAlign: 'center', fontSize: 12, color: 'var(--fg)' }}>Another session</div>
        <div onClick={onExit} className="tap" style={{ flex: 1, padding: 13, borderRadius: 12, background: 'oklch(0.78 0.16 var(--hue) / 0.2)', border: '1px solid oklch(0.78 0.16 var(--hue) / 0.4)', textAlign: 'center', fontSize: 12, color: 'oklch(0.9 0.14 var(--hue))', fontWeight: 500 }}>Done</div>
      </div>
    </div>
  );
};

window.FocusScreen = FocusScreen;
window.FOCUS_TASKS = FOCUS_TASKS;
