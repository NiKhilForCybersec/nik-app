/* Aether — Home / dashboard screen (bento widgets) */

const HomeScreen = ({ dark, onNav, onVoice, aesthetic = 'hybrid', intensity = 'medium' }) => {
  const u = MOCK.user;
  const V = (typeof getVocab === 'function') ? getVocab(aesthetic) : { greet: 'Good morning,', hud_label: 'HUNTER', user_title: u.title, level_word: 'LVL', quest: 'Quest', emergent: 'LIVE · GPS' };
  const rankColor = { S: 320, A: 30, B: 220, C: 150, D: 200, E: 260 };

  // ── Live "ticking" data feel — updates once per second ──
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1200);
    return () => clearInterval(id);
  }, []);
  // Simulate live step count creeping up
  const liveSteps = 5240 + (tick * 3 % 180);
  const liveHR = 68 + Math.round(Math.sin(tick * 0.4) * 4);

  return (
    <div style={{ padding: '0 16px 80px', color: 'var(--fg)' }}>
      {/* Greeting + live location */}
      <div style={{ paddingTop: 8, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.78 0.15 150)', boxShadow: '0 0 6px oklch(0.78 0.15 150)' }}/>
          {MOCK.today.date.toUpperCase()} · {MOCK.today.weather}
        </div>
        <div className="display" style={{ fontSize: 30, fontWeight: 400, lineHeight: 1.1, letterSpacing: -0.5 }}>
          {V.greet}<br/>
          <span style={{ fontWeight: 600, background: 'linear-gradient(90deg, oklch(0.9 0.12 var(--hue)), oklch(0.75 0.18 calc(var(--hue) + 60)))', WebkitBackgroundClip: 'text', color: 'transparent' }}>{u.name}</span>
        </div>
      </div>

      {/* HUD card — level & stats (Solo-Leveling flavor) */}
      {intensity !== 'light' && (
        <div className="glass scanlines fade-up" style={{ padding: 16, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
          <HUDCorner position="tl"/><HUDCorner position="tr"/>
          <HUDCorner position="bl"/><HUDCorner position="br"/>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', letterSpacing: 1.5 }}>{V.hud_label}</div>
              <div className="display" style={{ fontSize: 18, fontWeight: 600 }}>{V.user_title}</div>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 80)))',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: '#06060a', fontFamily: 'var(--font-display)',
                boxShadow: '0 0 20px oklch(0.78 0.16 var(--hue) / 0.5), inset 0 1px 0 oklch(1 0 0 / 0.3)',
              }}>
                <div style={{ fontSize: 9, opacity: 0.6, letterSpacing: 1 }}>{V.level_word}</div>
                <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{u.level}</div>
              </div>
            </div>
          </div>
          <XPBar cur={u.xp} max={u.xpMax} level={u.level} compact/>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
            {Object.entries(u.stats).map(([k, v]) => (
              <div key={k} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ color: 'var(--fg-3)', letterSpacing: 1 }}>{k}</div>
                <div style={{ color: 'oklch(0.9 0.1 var(--hue))', fontSize: 13, fontWeight: 600, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bento grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        {/* Streak */}
        <div className="glass fade-up tap" style={{ padding: 14, gridColumn: 'span 1', aspectRatio: '1 / 1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <I.flame size={20} stroke="oklch(0.82 0.17 40)"/>
            <Chip tone="warn" size="sm">STREAK</Chip>
          </div>
          <div style={{ marginTop: 20 }}>
            <div className="display" style={{ fontSize: 44, fontWeight: 600, lineHeight: 1, background: 'linear-gradient(135deg, oklch(0.9 0.15 60), oklch(0.7 0.2 20))', WebkitBackgroundClip: 'text', color: 'transparent' }}>{u.streak}</div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 4 }}>days · personal best</div>
          </div>
        </div>

        {/* Daily focus ring */}
        <div onClick={() => onNav('score')} className="glass fade-up tap" style={{ padding: 14, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue) / 0.1), oklch(0.55 0.22 calc(var(--hue) + 60) / 0.05))', borderColor: 'oklch(0.78 0.16 var(--hue) / 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 10, color: 'oklch(0.85 0.14 var(--hue))', letterSpacing: 1.5, fontFamily: 'var(--font-mono)' }}>AETHER SCORE</div>
            <div style={{ fontSize: 9, color: 'oklch(0.75 0.18 140)', fontFamily: 'var(--font-mono)' }}>+28</div>
          </div>
          <div className="display" style={{ fontSize: 38, fontWeight: 500, lineHeight: 1, marginTop: 10, color: 'oklch(0.94 0.12 var(--hue))', fontVariantNumeric: 'tabular-nums' }}>742</div>
          <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
            {[0.73, 0.78, 0.74, 0.73].map((p, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: 'oklch(1 0 0 / 0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: (p * 100) + '%', background: ['oklch(0.85 0.16 220)','oklch(0.85 0.16 25)','oklch(0.85 0.16 280)','oklch(0.85 0.16 150)'][i] }}/>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>FOCUS · HEALTH · MIND · FAMILY</div>
        </div>

        {/* Focus mode launcher */}
        <div onClick={() => onNav('focus')} className="glass fade-up tap" style={{ padding: 14, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -10, right: -10, width: 60, height: 60, borderRadius: '50%', background: 'radial-gradient(circle, oklch(0.78 0.16 140 / 0.25) 0%, transparent 70%)' }}/>
          <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: 1.5, fontFamily: 'var(--font-mono)' }}>FOCUS</div>
          <div className="display" style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.1, marginTop: 8 }}>Begin a session</div>
          <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 4, lineHeight: 1.4 }}>Aether suggests <b style={{ color: 'oklch(0.85 0.14 var(--hue))' }}>50 min · deep</b></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 11, color: 'oklch(0.85 0.16 140)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.75 0.18 140)' }}/> START →
          </div>
        </div>

        {/* GPS smart card — full width */}
        <div onClick={() => onNav('quests')} className="glass fade-up tap" style={{ padding: 14, gridColumn: 'span 2', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue) / 0.18), oklch(0.65 0.22 calc(var(--hue) + 80) / 0.12))', borderColor: 'oklch(0.78 0.16 var(--hue) / 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <I.location size={18} stroke="oklch(0.9 0.14 var(--hue))"/>
                <div style={{ position: 'absolute', top: -2, right: -2, width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.78 0.15 150)', boxShadow: '0 0 6px oklch(0.78 0.15 150)', animation: 'breathe 1.5s infinite' }}/>
              </div>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'oklch(0.9 0.14 var(--hue))', letterSpacing: 1 }}>{V.emergent}</span>
            </div>
            <Chip tone="accent" size="sm">NEW {V.quest.toUpperCase()}</Chip>
          </div>
          <div className="display" style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.3, marginBottom: 4 }}>You're near <span style={{ color: 'oklch(0.9 0.14 var(--hue))' }}>Nature's Basket</span></div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)' }}>Meera added <b style={{ color: 'var(--fg)' }}>Groceries</b> — pick them up? +80 XP</div>
        </div>

        {/* Habits mini */}
        <div onClick={() => onNav('habits')} className="glass fade-up tap" style={{ padding: 14, gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 1.5, fontFamily: 'var(--font-mono)' }}>HABITS · TODAY</div>
            <I.chevR size={14} stroke="var(--fg-3)"/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {MOCK.habits.map(h => {
              const HI = I[h.icon];
              const pct = h.done / h.target;
              return (
                <div key={h.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ position: 'relative' }}>
                    <Ring size={48} pct={pct} sw={3}/>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <HI size={18} stroke={`oklch(0.85 0.14 ${h.hue})`}/>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--fg-2)', textAlign: 'center' }}>{h.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next quest */}
        <div onClick={() => onNav('quests')} className="glass fade-up tap" style={{ padding: 14, gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: 1.5, fontFamily: 'var(--font-mono)', marginBottom: 3 }}>ACTIVE {V.quest.toUpperCase()}</div>
              <div className="display" style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>{MOCK.quests[1].title}</div>
            </div>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              border: '1.5px solid oklch(0.78 0.16 var(--hue))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
              color: 'oklch(0.9 0.14 var(--hue))',
              background: 'oklch(0.78 0.16 var(--hue) / 0.1)',
            }}>A</div>
          </div>
          <div style={{ marginTop: 4 }}>
            <div style={{ height: 3, background: 'oklch(1 0 0 / 0.06)', borderRadius: 99, overflow: 'hidden' }}>
              <div className="xp-fill" style={{ height: '100%', width: '60%', borderRadius: 99 }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
              <span>1h 12m left</span>
              <span>+240 XP</span>
            </div>
          </div>
        </div>

        {/* Family ping */}
        <div onClick={() => onNav('family')} className="glass fade-up tap" style={{ padding: 14, gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 1.5, fontFamily: 'var(--font-mono)' }}>FAMILY · CIRCLE</div>
            <Chip tone="ok" size="sm">3 ONLINE</Chip>
          </div>
          <div style={{ display: 'flex', gap: -8, marginBottom: 8 }}>
            {MOCK.family.slice(0, 5).map((p, i) => (
              <div key={i} style={{ marginLeft: i === 0 ? 0 : -10, zIndex: 5 - i }}>
                <Avatar name={p.name} size={34} hue={p.hue} status={p.status} ring={p.self}/>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.4 }}>
            <b style={{ color: 'var(--fg)' }}>Kiaan</b> finished homework +40 XP ·{' '}
            <b style={{ color: 'var(--fg)' }}>Meera</b> added groceries
          </div>
        </div>

        {/* DIARY · today's entry */}
        <div onClick={() => onNav('diary')} className="glass fade-up tap" style={{ padding: 14, gridColumn: 'span 2', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <I.book size={13} stroke="oklch(0.85 0.14 var(--hue))"/>
              <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 1.5, fontFamily: 'var(--font-mono)' }}>DIARY · TODAY</div>
            </div>
            <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>184 ENTRIES</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 10, background: 'url(https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200) center/cover', flexShrink: 0 }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="display" style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Long morning, finally</div>
              <div style={{ fontSize: 11, color: 'var(--fg-2)', lineHeight: 1.4, marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>Slept past the alarm and didn't feel guilty. Aanya named her drawing Pomelo…</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
                <span>😊 BRIGHT</span><span>·</span><span>📍 Bandra</span>
              </div>
            </div>
          </div>
        </div>

        {/* LIVE VITALS — ticks every 1.2s */}
        <div onClick={() => onNav('fitness')} className="glass fade-up tap" style={{ padding: 14, gridColumn: 'span 2', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(0.7 0.24 25)', boxShadow: '0 0 8px oklch(0.7 0.24 25)', animation: 'breathe 1.2s infinite' }}/>
              <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 1.5, fontFamily: 'var(--font-mono)' }}>LIVE · APPLE HEALTH</div>
            </div>
            <Chip tone="accent" size="sm">SYNCING</Chip>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <LiveStat label="STEPS" value={liveSteps.toLocaleString()} target="8k" hue={40}/>
            <LiveStat label="HEART" value={liveHR} unit="BPM" hue={25} pulse/>
            <LiveStat label="KCAL" value={1840 + (tick % 6)} target="2.2k" hue={150}/>
          </div>
          {/* mini live EKG-ish sparkline */}
          <svg width="100%" height="22" viewBox="0 0 300 22" style={{ marginTop: 8, opacity: 0.7 }}>
            <polyline fill="none" stroke="oklch(0.78 0.16 var(--hue))" strokeWidth="1.5"
              points={Array.from({length: 30}).map((_, i) => {
                const x = i * 10;
                const phase = (i + tick) * 0.4;
                const y = 11 + Math.sin(phase) * 3 + (i % 7 === 0 ? -5 : 0);
                return `${x},${y}`;
              }).join(' ')}
            />
          </svg>
        </div>
      </div>

      {/* Ask Aether prompt */}
      <div onClick={() => onNav('chat')} className="glass fade-up tap" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
        <VoiceOrb size={40}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: 'var(--fg)' }}>Ask Aether anything…</div>
          <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>TAP · OR SAY "HEY AETHER"</div>
        </div>
        <div onClick={(e) => { e.stopPropagation(); onVoice(); }} className="tap" style={{
          width: 36, height: 36, borderRadius: 12,
          background: 'oklch(0.78 0.16 var(--hue) / 0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid oklch(0.78 0.16 var(--hue) / 0.4)',
        }}>
          <I.mic size={16} stroke="oklch(0.9 0.14 var(--hue))"/>
        </div>
      </div>
    </div>
  );
};

window.HomeScreen = HomeScreen;

const LiveStat = ({ label, value, unit, target, hue = 220, pulse }) => (
  <div style={{ padding: '8px 10px', borderRadius: 10, background: `oklch(0.78 0.16 ${hue} / 0.08)`, border: `1px solid oklch(0.78 0.16 ${hue} / 0.2)` }}>
    <div style={{ fontSize: 8, color: 'var(--fg-3)', letterSpacing: 1, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
      <div className="display" style={{ fontSize: 17, fontWeight: 600, color: `oklch(0.9 0.14 ${hue})`, fontVariantNumeric: 'tabular-nums', animation: pulse ? 'breathe 1.2s infinite' : 'none' }}>{value}</div>
      {unit && <div style={{ fontSize: 8, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{unit}</div>}
    </div>
    {target && <div style={{ fontSize: 8, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>/ {target}</div>}
  </div>
);
window.LiveStat = LiveStat;
