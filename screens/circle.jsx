/* Nik — Family Circle main screen
   Constellation hero (orbit of avatars) + alerts strip + member cards.
   Tapping a member opens detail sheet. Gear icon opens privacy sharing matrix.
*/

const FamilyCircleScreen = ({ onNav, state, setState }) => {
  const me = 'arjun';
  const members = window.CIRCLE_MEMBERS;
  const alerts = window.CIRCLE_ALERTS;
  const log = window.VIEW_LOG;
  const sharing = state?.sharingOverride || window.DEFAULT_SHARING;

  const [selectedId, setSelectedId] = React.useState(null);
  const [showPrivacy, setShowPrivacy] = React.useState(false);
  const [showLog, setShowLog] = React.useState(false);

  const others = members.filter(m => m.id !== me);
  const selected = selectedId && members.find(m => m.id === selectedId);

  // Times my profile was viewed by others, this week
  const viewsOfMe = log.filter(e => e.owner === me).length;
  const viewersOfMe = [...new Set(log.filter(e => e.owner === me).map(e => e.viewer))];

  return (
    <div style={{ padding: '8px 16px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>CIRCLE · {members.length} MEMBERS</div>
          <div className="display" style={{ fontSize: 28, fontWeight: 'var(--display-weight, 500)', lineHeight: 1.1, marginTop: 4, textTransform: 'var(--display-case, none)', letterSpacing: 'var(--display-tracking, normal)' }}>Family</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div onClick={() => setShowLog(true)} className="tap" title="View log" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--hairline-strong)', display: 'grid', placeItems: 'center', position: 'relative' }}>
            <I.eye size={16}/>
            {viewsOfMe > 0 && <div style={{ position: 'absolute', top: -3, right: -3, minWidth: 14, height: 14, borderRadius: 99, background: 'oklch(0.78 0.16 var(--hue))', color: '#000', fontSize: 8, fontWeight: 700, display: 'grid', placeItems: 'center', padding: '0 3px', fontFamily: 'var(--font-mono)' }}>{viewsOfMe}</div>}
          </div>
          <div onClick={() => setShowPrivacy(true)} className="tap" title="Privacy" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--hairline-strong)', display: 'grid', placeItems: 'center' }}>
            <I.shield size={16}/>
          </div>
        </div>
      </div>

      {/* CONSTELLATION HERO */}
      <div className="glass" style={{ padding: 0, marginBottom: 14, position: 'relative', height: 320, overflow: 'hidden', borderRadius: 18 }}>
        <HUDCorner position="tl"/><HUDCorner position="tr"/><HUDCorner position="bl"/><HUDCorner position="br"/>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 55%, oklch(0.78 0.16 var(--hue) / 0.18), transparent 65%)' }}/>

        {/* orbit rings */}
        {[80, 120].map((r, i) => (
          <div key={r} style={{
            position: 'absolute', top: '55%', left: '50%',
            width: r*2, height: r*2, borderRadius: '50%',
            border: `1px ${i === 0 ? 'dashed' : 'solid'} oklch(1 0 0 / ${i === 0 ? 0.1 : 0.05})`,
            transform: 'translate(-50%, -50%)',
          }}/>
        ))}

        {/* orbit labels */}
        <div style={{ position: 'absolute', top: 12, left: 14, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-3)', letterSpacing: 1.5 }}>CONSTELLATION</div>
        <div style={{ position: 'absolute', top: 12, right: 14, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'oklch(0.78 0.15 150)', letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 5, height: 5, borderRadius: 99, background: 'oklch(0.78 0.15 150)', animation: 'breathe 1.6s infinite' }}/>
          LIVE
        </div>

        {/* center = you */}
        <div style={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <div onClick={() => setSelectedId('arjun')} className="tap" style={{ position: 'relative' }}>
            <Avatar name="A" size={68} hue={220} ring/>
            <div style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: '1px solid oklch(0.78 0.16 var(--hue) / 0.4)', animation: 'pulse-ring 2s infinite' }}/>
          </div>
          <div className="display" style={{ fontSize: 11, marginTop: 8, fontWeight: 600, letterSpacing: 1 }}>YOU</div>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)', letterSpacing: 0.5 }}>NIK SCORE 782</div>
        </div>

        {/* others on orbit */}
        {others.map((m, i) => {
          const angle = (i / others.length) * 2 * Math.PI - Math.PI / 2;
          const r = m.relation === 'partner' ? 90 : (m.relation === 'parent' ? 130 : 105);
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          const hasAlert = alerts.some(a => a.ownerId === m.id);
          return (
            <div key={m.id} onClick={() => setSelectedId(m.id)} className="tap" style={{
              position: 'absolute', top: '55%', left: '50%',
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              textAlign: 'center',
            }}>
              <div style={{ position: 'relative' }}>
                <Avatar name={m.name} size={46} hue={m.hue} status={m.status}/>
                {hasAlert && (
                  <div style={{ position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: 99, background: 'oklch(0.7 0.2 30)', border: '2px solid var(--bg)', display: 'grid', placeItems: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>!</div>
                )}
              </div>
              <div style={{ fontSize: 9, marginTop: 5, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5, fontWeight: 600 }}>{m.name.toUpperCase()}</div>
              <div style={{ fontSize: 8, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{m.health.score}</div>
            </div>
          );
        })}

        {/* connecting lines svg */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.15 }}>
          {others.map((m, i) => {
            const angle = (i / others.length) * 2 * Math.PI - Math.PI / 2;
            const r = m.relation === 'partner' ? 90 : (m.relation === 'parent' ? 130 : 105);
            const cx = '50%', cy = '55%';
            const x = `calc(50% + ${Math.cos(angle) * r}px)`;
            const y = `calc(55% + ${Math.sin(angle) * r}px)`;
            return <line key={m.id} x1={cx} y1={cy} x2={x} y2={y} stroke="oklch(0.78 0.16 var(--hue))" strokeWidth="1" strokeDasharray="2 4"/>;
          })}
        </svg>
      </div>

      {/* AWARENESS STRIP — your data was viewed */}
      {viewsOfMe > 0 && (
        <div onClick={() => setShowLog(true)} className="tap glass" style={{ padding: 12, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, background: 'oklch(0.78 0.16 var(--hue) / 0.06)' }}>
          <I.eye size={16} stroke="oklch(0.85 0.14 var(--hue))"/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--fg)' }}>Your profile was viewed <b>{viewsOfMe}× this week</b></div>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2, letterSpacing: 0.5 }}>By {viewersOfMe.map(v => v.toUpperCase()).join(' · ')}</div>
          </div>
          <I.chevron size={14}/>
        </div>
      )}

      {/* CONCERN ALERTS — only with consent */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: 1.5, fontFamily: 'var(--font-mono)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>NIK NOTICED · {alerts.length} ITEMS</span>
            <span style={{ fontSize: 9, color: 'var(--fg-3)' }}>shared by them</span>
          </div>
          {alerts.map((a, i) => {
            const m = members.find(x => x.id === a.ownerId);
            const tone = a.level === 'red' ? 'oklch(0.7 0.2 30)' : a.level === 'amber' ? 'oklch(0.78 0.18 60)' : 'oklch(0.78 0.14 var(--hue))';
            return (
              <div key={i} onClick={() => setSelectedId(a.ownerId)} className="tap glass fade-up" style={{ padding: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${tone}` }}>
                <Avatar name={m.name} size={32} hue={m.hue} status={m.status}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--fg)', lineHeight: 1.35 }}><b>{m.name}</b> · {a.text}</div>
                  <div style={{ fontSize: 10, color: tone, fontFamily: 'var(--font-mono)', marginTop: 2, letterSpacing: 0.5 }}>{a.cta.toUpperCase()}</div>
                </div>
                <Chip tone={a.level === 'red' ? 'danger' : a.level === 'amber' ? 'warn' : 'accent'} size="sm">{a.level.toUpperCase()}</Chip>
              </div>
            );
          })}
        </div>
      )}

      {/* MEMBER CARDS */}
      <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: 1.5, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>EVERYONE</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {members.map(m => {
          const isMe = m.id === me;
          const canHealth = canCircleView(me, m.id, 'health', sharing);
          const canMood = canCircleView(me, m.id, 'mood', sharing);
          const canLoc = canCircleView(me, m.id, 'location', sharing);
          const moodLabel = canMood ? m.health.mood.today : '—';
          return (
            <div key={m.id} onClick={() => setSelectedId(m.id)} className="tap glass" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
              <Avatar name={m.name} size={42} hue={m.hue} status={m.status}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="display" style={{ fontSize: 14, fontWeight: 600 }}>{m.name}</div>
                  {isMe && <Chip tone="accent" size="sm">YOU</Chip>}
                  {m.careRecipient && <Chip tone="warn" size="sm">CARE</Chip>}
                </div>
                <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 0.3, marginTop: 2 }}>
                  {m.role.toUpperCase()}
                  {canLoc && <> · {m.location.split('·')[0].trim().toUpperCase()}</>}
                </div>
              </div>
              {canHealth ? (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg)', fontWeight: 600 }}>{m.health.score}</div>
                  <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>{moodLabel?.toUpperCase()}</div>
                </div>
              ) : (
                <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <I.lock size={10}/>
                  PRIVATE
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MEMBER DETAIL SHEET */}
      {selected && (
        <MemberDetailSheet
          member={selected}
          viewerId={me}
          sharing={sharing}
          onClose={() => setSelectedId(null)}
          onNav={onNav}
        />
      )}

      {/* PRIVACY SHEET */}
      {showPrivacy && (
        <PrivacySheet
          me={me}
          members={members}
          sharing={sharing}
          onChange={(next) => setState(x => ({ ...x, sharingOverride: next }))}
          onClose={() => setShowPrivacy(false)}
        />
      )}

      {/* VIEW LOG SHEET */}
      {showLog && (
        <ViewLogSheet
          me={me}
          members={members}
          log={log}
          onClose={() => setShowLog(false)}
        />
      )}

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.2; }
          100% { transform: scale(1); opacity: 0.6; }
        }
        @keyframes breathe { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
};

Object.assign(window, { FamilyCircleScreen });
