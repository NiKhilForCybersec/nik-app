/* Nik — Kids View (simplified, supervised) */

const KIDS_VIEW = {
  kid: { name: 'Anya', age: 8, accent: 'oklch(0.75 0.18 30)', avatar: 'A' },
  today: [
    { t: '☀️', label: 'Wake up', done: true },
    { t: '🦷', label: 'Brush teeth', done: true },
    { t: '🎒', label: 'School ready', done: true },
    { t: '🎹', label: 'Piano practice · 20 min', done: false },
    { t: '📚', label: 'Read a chapter', done: false },
    { t: '🛁', label: 'Bath time', done: false },
  ],
  stars: 14,
  reward: { name: 'Movie night, kid pick', need: 20, have: 14 },
  asks: [
    { from: 'Mom', text: 'Can we watch one more episode?', when: '5pm', status: 'pending' },
    { from: 'Anya', text: 'I finished my reading early!', when: 'Now', status: 'celebrate' },
  ],
  family: [
    { who: 'Mom', emoji: '👩🏽', status: 'In a meeting', color: 'oklch(0.7 0.18 350)' },
    { who: 'Dad', emoji: '👨🏽', status: 'Coming home soon', color: 'oklch(0.65 0.18 var(--hue))' },
    { who: 'Kiaan', emoji: '🧒🏽', status: 'At school', color: 'oklch(0.7 0.16 200)' },
  ],
};

const KidsScreen = ({ onNav }) => {
  const [stars, setStars] = React.useState(KIDS_VIEW.stars);
  const [today, setToday] = React.useState(KIDS_VIEW.today);

  const toggle = (i) => {
    setToday(prev => prev.map((t, idx) => idx === i ? { ...t, done: !t.done } : t));
    if (!today[i].done) setStars(s => s + 1);
    else setStars(s => Math.max(0, s - 1));
  };

  const need = KIDS_VIEW.reward.need;
  const pct = Math.min(1, stars / need);

  return (
    <div style={{ padding: '8px 16px 100px', fontFamily: 'var(--font-body)' }}>
      <div style={{ marginBottom: 16, textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, ${KIDS_VIEW.kid.accent}, oklch(0.5 0.18 30))`, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: '#fff', fontWeight: 700 }}>{KIDS_VIEW.kid.avatar}</div>
        <div className="display" style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.1 }}>Hi, {KIDS_VIEW.kid.name}!</div>
        <div style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 4 }}>You've got {stars} ⭐ today</div>
      </div>

      {/* Reward bar */}
      <div className="glass fade-up" style={{ padding: 14, marginBottom: 14, background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue) / 0.15), oklch(0.65 0.18 30 / 0.1))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 600 }}>🎬 {KIDS_VIEW.reward.name}</div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)' }}>{stars} / {need}</div>
        </div>
        <div style={{ height: 10, background: 'var(--input-bg)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ width: pct * 100 + '%', height: '100%', background: 'linear-gradient(90deg, oklch(0.7 0.16 60), oklch(0.7 0.18 30))', borderRadius: 99 }}/>
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{Math.max(0, need - stars)} more stars to go!</div>
      </div>

      {/* Today's stuff */}
      <div style={{ fontSize: 14, color: 'var(--fg)', fontWeight: 600, marginBottom: 8, padding: '0 4px' }}>Today's plan</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {today.map((t, i) => (
          <div key={i} onClick={() => toggle(i)} className="tap glass fade-up" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 14, opacity: t.done ? 0.55 : 1 }}>
            <div style={{ fontSize: 28, lineHeight: 1 }}>{t.t}</div>
            <div style={{ flex: 1, fontSize: 14, color: 'var(--fg)', fontWeight: 500, textDecoration: t.done ? 'line-through' : 'none' }}>{t.label}</div>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: t.done ? 'none' : '2px solid var(--hairline-strong)', background: t.done ? 'oklch(0.7 0.16 60)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {t.done && <span style={{ fontSize: 16 }}>⭐</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Asks */}
      <div style={{ fontSize: 14, color: 'var(--fg)', fontWeight: 600, marginBottom: 8, padding: '0 4px' }}>Messages</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {KIDS_VIEW.asks.map((a, i) => (
          <div key={i} className="glass fade-up" style={{ padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 11, color: 'var(--fg-3)', fontWeight: 600 }}>{a.from}</div>
              <div style={{ fontSize: 10, color: 'var(--fg-3)' }}>· {a.when}</div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--fg)' }}>"{a.text}"</div>
            {a.status === 'pending' && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <div className="tap" style={{ flex: 1, padding: 8, borderRadius: 8, background: 'oklch(0.7 0.16 var(--hue))', textAlign: 'center', fontSize: 12, color: '#06060a', fontWeight: 600 }}>Yes!</div>
                <div className="tap" style={{ flex: 1, padding: 8, borderRadius: 8, background: 'var(--input-bg)', textAlign: 'center', fontSize: 12, color: 'var(--fg-2)' }}>Not now</div>
              </div>
            )}
            {a.status === 'celebrate' && (
              <div style={{ marginTop: 8, padding: 8, borderRadius: 8, background: 'oklch(0.7 0.16 60 / 0.15)', textAlign: 'center', fontSize: 12, color: 'var(--fg)' }}>🎉 +1 star! Mom got the message.</div>
            )}
          </div>
        ))}
      </div>

      {/* Family pulse */}
      <div style={{ fontSize: 14, color: 'var(--fg)', fontWeight: 600, marginBottom: 8, padding: '0 4px' }}>Where everyone is</div>
      <div className="glass fade-up" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {KIDS_VIEW.family.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{f.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 600 }}>{f.who}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-2)' }}>{f.status}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="tap" style={{ marginTop: 16, padding: 12, borderRadius: 12, textAlign: 'center', fontSize: 11, color: 'var(--fg-3)' }}>🔒 Parent settings</div>
    </div>
  );
};

Object.assign(window, { KidsScreen });
