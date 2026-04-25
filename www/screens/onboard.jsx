/* Nik — Onboarding (first-run flow) */

const ONBOARD_STEPS = ['hello', 'name', 'family', 'rhythm', 'permissions', 'voice', 'theme', 'ready'];

const OnboardScreen = ({ onDone }) => {
  const [step, setStep] = React.useState(0);
  const [data, setData] = React.useState({
    name: '',
    role: 'parent',
    kids: 2,
    partner: true,
    chronotype: 'balanced',
    perms: { health: false, calendar: false, location: false, contacts: false },
    voice: 'morning',
    theme: 'noir',
  });

  const next = () => setStep(s => Math.min(ONBOARD_STEPS.length - 1, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));
  const set = (patch) => setData(d => ({ ...d, ...patch }));

  const cur = ONBOARD_STEPS[step];

  return (
    <div style={{ position: 'relative', minHeight: '100%', display: 'flex', flexDirection: 'column', padding: '32px 20px 24px', overflow: 'hidden' }}>
      {/* Ambient bg */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 60% at 50% ${20 + step*8}%, oklch(0.5 0.22 var(--hue) / 0.3), transparent 60%), radial-gradient(circle at 80% 80%, oklch(0.55 0.2 var(--hue-accent, var(--hue)) / 0.15), transparent 50%)`, transition: 'background 0.6s' }}/>

      {/* Progress */}
      <div style={{ position: 'relative', display: 'flex', gap: 4, marginBottom: 28 }}>
        {ONBOARD_STEPS.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 2, borderRadius: 99, background: i <= step ? 'oklch(0.78 0.16 var(--hue))' : 'var(--hairline)' }}/>
        ))}
      </div>

      <div key={cur} style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', animation: 'onbFade 0.5s ease' }}>
        {cur === 'hello' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 140, height: 140, marginBottom: 32 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, oklch(0.78 0.18 var(--hue)), oklch(0.4 0.18 var(--hue)) 70%, transparent)', filter: 'blur(2px)', animation: 'onbPulse 3s ease-in-out infinite' }}/>
              <div style={{ position: 'absolute', inset: 30, borderRadius: '50%', background: 'oklch(0.95 0.05 var(--hue))', boxShadow: '0 0 60px oklch(0.78 0.18 var(--hue))' }}/>
            </div>
            <div className="display" style={{ fontSize: 36, fontWeight: 'var(--display-weight)', lineHeight: 1.1, marginBottom: 12, letterSpacing: 'var(--display-tracking)' }}>I'm Nik.</div>
            <div style={{ fontSize: 15, color: 'var(--fg-2)', lineHeight: 1.5, maxWidth: 280 }}>I'm here to hold the small things so you don't have to. Let's set up.</div>
          </div>
        )}

        {cur === 'name' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="display" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.2, marginBottom: 8 }}>What should I call you?</div>
            <div style={{ fontSize: 13, color: 'var(--fg-2)', marginBottom: 24 }}>Your first name is plenty.</div>
            <input value={data.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Ravi" autoFocus style={{ background: 'var(--input-bg)', border: '1px solid var(--hairline)', borderRadius: 14, padding: '16px 18px', fontSize: 18, color: 'var(--fg)', outline: 'none', fontFamily: 'inherit' }}/>
          </div>
        )}

        {cur === 'family' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="display" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.2, marginBottom: 8 }}>Who are you running things for?</div>
            <div style={{ fontSize: 13, color: 'var(--fg-2)', marginBottom: 24 }}>This shapes the family ops surface.</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[['solo','Just me'],['parent','Me + kids'],['couple','Me + partner'],['family','Whole family']].map(([k, l]) => (
                <div key={k} onClick={() => set({ role: k })} className="tap" style={{ padding: 14, borderRadius: 14, background: data.role === k ? 'oklch(0.78 0.16 var(--hue) / 0.15)' : 'var(--input-bg)', border: data.role === k ? '1px solid oklch(0.78 0.16 var(--hue))' : '1px solid var(--hairline)', textAlign: 'center', fontSize: 13, color: data.role === k ? 'oklch(0.92 0.14 var(--hue))' : 'var(--fg)', fontWeight: data.role === k ? 600 : 400 }}>{l}</div>
              ))}
            </div>

            {(data.role === 'parent' || data.role === 'family') && (
              <div className="glass" style={{ padding: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 8 }}>HOW MANY KIDS</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1,2,3,4].map(n => (
                    <div key={n} onClick={() => set({ kids: n })} className="tap" style={{ flex: 1, padding: 10, borderRadius: 10, background: data.kids === n ? 'oklch(0.78 0.16 var(--hue))' : 'var(--bg)', textAlign: 'center', fontSize: 14, color: data.kids === n ? '#06060a' : 'var(--fg)', fontWeight: 600 }}>{n}{n === 4 ? '+' : ''}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {cur === 'rhythm' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="display" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.2, marginBottom: 8 }}>What's your rhythm?</div>
            <div style={{ fontSize: 13, color: 'var(--fg-2)', marginBottom: 24 }}>So I time the brief and wind-down right.</div>
            {[
              { k: 'early', t: 'Early bird', sub: 'Up before 6, in bed by 22:00', icon: '🌅' },
              { k: 'balanced', t: 'Steady', sub: 'Wake 6:30–7:30, sleep around 23:00', icon: '☀️' },
              { k: 'night', t: 'Night owl', sub: 'Up past midnight, slow morning', icon: '🌙' },
            ].map(o => (
              <div key={o.k} onClick={() => set({ chronotype: o.k })} className="tap" style={{ padding: 14, borderRadius: 14, background: data.chronotype === o.k ? 'oklch(0.78 0.16 var(--hue) / 0.12)' : 'var(--input-bg)', border: data.chronotype === o.k ? '1px solid oklch(0.78 0.16 var(--hue))' : '1px solid transparent', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 26 }}>{o.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: 'var(--fg)', fontWeight: 500 }}>{o.t}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{o.sub}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {cur === 'permissions' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="display" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.2, marginBottom: 8 }}>What can I see?</div>
            <div style={{ fontSize: 13, color: 'var(--fg-2)', marginBottom: 24 }}>You're in charge. Toggle anything off later.</div>
            {[
              { k: 'health', t: 'Health & fitness', sub: 'Sleep, steps, workouts' },
              { k: 'calendar', t: 'Calendar', sub: 'Read events to plan your day' },
              { k: 'location', t: 'Location', sub: 'Geofenced reminders, errand routing' },
              { k: 'contacts', t: 'Contacts', sub: 'Birthday + check-in nudges' },
            ].map(p => (
              <div key={p.k} className="glass" style={{ padding: 14, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 500 }}>{p.t}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{p.sub}</div>
                </div>
                <div onClick={() => set({ perms: { ...data.perms, [p.k]: !data.perms[p.k] } })} className="tap" style={{ width: 40, height: 22, borderRadius: 99, background: data.perms[p.k] ? 'oklch(0.7 0.15 var(--hue))' : 'var(--hairline-strong)', position: 'relative', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 2, left: data.perms[p.k] ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s' }}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {cur === 'voice' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="display" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.2, marginBottom: 8 }}>How should I sound?</div>
            <div style={{ fontSize: 13, color: 'var(--fg-2)', marginBottom: 24 }}>You can change voices anytime.</div>
            {[
              { k: 'morning', t: 'Morning calm', sub: 'Soft, slower, low-stim' },
              { k: 'crisp', t: 'Crisp', sub: 'Clear, efficient, gets to it' },
              { k: 'warm', t: 'Warm', sub: 'Like a thoughtful friend' },
              { k: 'mute', t: 'No voice', sub: 'Read, never speak' },
            ].map(v => (
              <div key={v.k} onClick={() => set({ voice: v.k })} className="tap" style={{ padding: 14, borderRadius: 14, background: data.voice === v.k ? 'oklch(0.78 0.16 var(--hue) / 0.12)' : 'var(--input-bg)', border: data.voice === v.k ? '1px solid oklch(0.78 0.16 var(--hue))' : '1px solid transparent', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: data.voice === v.k ? 'oklch(0.78 0.16 var(--hue))' : 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={data.voice === v.k ? '#06060a' : 'currentColor'}><polygon points="6 4 20 12 6 20 6 4"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: 'var(--fg)', fontWeight: 500 }}>{v.t}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{v.sub}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {cur === 'theme' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="display" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.2, marginBottom: 8 }}>Choose a feeling.</div>
            <div style={{ fontSize: 13, color: 'var(--fg-2)', marginBottom: 24 }}>You can switch any time. There's a lot more inside.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { k: 'noir', t: 'Nik Noir', g: 'linear-gradient(135deg, oklch(0.18 0.04 280), oklch(0.32 0.16 280))' },
                { k: 'dawn', t: 'Soft Dawn', g: 'linear-gradient(135deg, oklch(0.92 0.05 60), oklch(0.85 0.1 30))' },
                { k: 'forest', t: 'Forest', g: 'linear-gradient(135deg, oklch(0.2 0.06 150), oklch(0.4 0.13 150))' },
                { k: 'ghibli', t: 'Studio', g: 'linear-gradient(135deg, oklch(0.85 0.07 200), oklch(0.7 0.13 140))' },
              ].map(t => (
                <div key={t.k} onClick={() => set({ theme: t.k })} className="tap" style={{ padding: 0, borderRadius: 14, overflow: 'hidden', border: data.theme === t.k ? '2px solid oklch(0.78 0.16 var(--hue))' : '2px solid transparent' }}>
                  <div style={{ height: 80, background: t.g }}/>
                  <div style={{ padding: 10, background: 'var(--input-bg)', fontSize: 12, color: 'var(--fg)', fontWeight: 500, textAlign: 'center' }}>{t.t}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {cur === 'ready' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>✨</div>
            <div className="display" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.2, marginBottom: 12 }}>{data.name ? `Hello, ${data.name}.` : 'You\'re all set.'}</div>
            <div style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.5, maxWidth: 280, marginBottom: 24 }}>I'll learn as we go. Tomorrow morning I'll have your first brief.</div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}>FIRST BRIEF · 6:50 AM</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ position: 'relative', display: 'flex', gap: 8, alignItems: 'center', marginTop: 16 }}>
        {step > 0 && step < ONBOARD_STEPS.length - 1 && (
          <div onClick={back} className="tap" style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--input-bg)', fontSize: 13, color: 'var(--fg-2)' }}>Back</div>
        )}
        <div style={{ flex: 1 }}/>
        {step < ONBOARD_STEPS.length - 1 ? (
          <div onClick={next} className="tap" style={{ padding: '14px 28px', borderRadius: 14, background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.2 var(--hue)))', color: '#06060a', fontSize: 14, fontWeight: 600, boxShadow: '0 8px 24px oklch(0.55 0.22 var(--hue) / 0.4)' }}>Continue →</div>
        ) : (
          <div onClick={onDone} className="tap" style={{ padding: '14px 28px', borderRadius: 14, background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.2 var(--hue)))', color: '#06060a', fontSize: 14, fontWeight: 600, boxShadow: '0 8px 24px oklch(0.55 0.22 var(--hue) / 0.4)' }}>Open Nik</div>
        )}
      </div>

      <style>{`
        @keyframes onbFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes onbPulse { 0%, 100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.08); opacity: 1; } }
      `}</style>
    </div>
  );
};

Object.assign(window, { OnboardScreen });
