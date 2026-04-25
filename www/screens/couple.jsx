/* Nik — Couples space (Meera & me) */

const COUPLE = {
  partner: { name: 'Meera', accent: 'oklch(0.7 0.18 350)' },
  streak: 11,
  nextDate: { day: 'Saturday', t: '7:30 PM', where: 'Olmsted', kids: 'Sitter booked' },
  threads: [
    { id: 1, kind: 'shared-note', t: 'Things to do before March', items: ['Renew passports', 'Book the cabin', 'Call the dentist re: Anya'], updated: '2h ago', who: 'Both' },
    { id: 2, kind: 'gratitude', text: 'You handled school pickup three days in a row when my work blew up. I noticed.', who: 'Meera', when: 'Yesterday' },
    { id: 3, kind: 'question', text: 'What\'s one thing you want more of from me this month?', who: 'Nik', when: 'Today' },
    { id: 4, kind: 'memory', text: 'Six years ago today: that disastrous camping trip in the rain. We laughed for an hour in the car.', who: 'Nik', when: 'Today' },
  ],
  agreements: [
    { t: 'Phones away at dinner', since: 'May' },
    { t: 'One real date a week', since: 'August' },
    { t: 'No work talk after 9pm', since: 'Sep' },
  ],
};

const CoupleScreen = ({ onNav }) => {
  const c = COUPLE;
  return (
    <div style={{ padding: '8px 16px 100px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>SHARED · WITH MEERA</div>
        <div className="display" style={{ fontSize: 28, fontWeight: 'var(--display-weight, 500)', lineHeight: 1.1, marginTop: 4, textTransform: 'var(--display-case)', letterSpacing: 'var(--display-tracking)' }}>Us</div>
      </div>

      {/* Streak + date */}
      <div className="glass fade-up" style={{ padding: 16, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 20%, oklch(0.7 0.18 350 / 0.18), transparent 60%)' }}/>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, oklch(0.65 0.18 var(--hue)), oklch(0.45 0.16 var(--hue)))', border: '2px solid var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 600 }}>R</div>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, oklch(0.7 0.18 350), oklch(0.5 0.18 350))', border: '2px solid var(--bg)', marginLeft: -12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 600 }}>M</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 500 }}>Ravi & Meera</div>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{c.streak}-WEEK DATE STREAK · 8Y TOGETHER</div>
          </div>
        </div>
      </div>

      <div className="glass fade-up" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 8 }}>NEXT DATE</div>
        <div className="display" style={{ fontSize: 18, color: 'var(--fg)', fontWeight: 500 }}>{c.nextDate.day}, {c.nextDate.t}</div>
        <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 2 }}>{c.nextDate.where} · {c.nextDate.kids}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <div className="tap" style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--input-bg)', fontSize: 11, color: 'var(--fg-2)' }}>Reroute</div>
          <div className="tap" style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--input-bg)', fontSize: 11, color: 'var(--fg-2)' }}>Order Lyft</div>
          <div className="tap" style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--input-bg)', fontSize: 11, color: 'var(--fg-2)' }}>Sitter check</div>
        </div>
      </div>

      <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 8, padding: '0 4px' }}>SHARED THREADS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {c.threads.map(t => (
          <div key={t.id} className="glass fade-up" style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 9, padding: '2px 6px', borderRadius: 99, background: t.kind === 'gratitude' ? 'oklch(0.7 0.15 30 / 0.15)' : t.kind === 'question' ? 'oklch(0.78 0.16 var(--hue) / 0.15)' : 'var(--input-bg)', color: 'var(--fg)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>{t.kind.toUpperCase()}</div>
              <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{(t.who || '').toUpperCase()} · {(t.when || t.updated || '').toUpperCase()}</div>
            </div>
            {t.t && <div style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 500, marginBottom: 6 }}>{t.t}</div>}
            {t.text && <div style={{ fontSize: 13, color: 'var(--fg)', lineHeight: 1.55 }}>{t.text}</div>}
            {t.items && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                {t.items.map((it, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-2)' }}>
                    <div style={{ width: 14, height: 14, borderRadius: 4, border: '1.5px solid var(--hairline-strong)' }}/>
                    {it}
                  </div>
                ))}
              </div>
            )}
            {t.kind === 'question' && (
              <div className="tap" style={{ marginTop: 10, padding: 8, borderRadius: 8, background: 'var(--input-bg)', textAlign: 'center', fontSize: 11, color: 'var(--fg-2)' }}>Answer privately</div>
            )}
          </div>
        ))}
      </div>

      <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 8, padding: '0 4px' }}>OUR AGREEMENTS</div>
      <div className="glass fade-up" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {c.agreements.map((a, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: i < c.agreements.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
            <div style={{ fontSize: 13, color: 'var(--fg)' }}>{a.t}</div>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>SINCE {a.since.toUpperCase()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

Object.assign(window, { CoupleScreen });
