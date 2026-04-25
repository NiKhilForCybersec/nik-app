/* Nik — Today's Brief (audio) */
import React from 'react';
import type { ScreenProps } from '../App';

const BRIEF = {
  date: 'Friday, Nov 29',
  duration: '4:12',
  segments: [
    { t: '0:00', label: 'Good morning', body: '6:45 wake. You slept 7h 24m — better than your two-week average. Sky\'s overcast in Brooklyn, 38°F. No rain until evening.' },
    { t: '0:34', label: 'Today\'s shape', body: 'Three meetings, all before lunch. Then a clear afternoon — Maya blocked it for you Tuesday, remember? Pickup at 4:15. Anya has piano at 5:30.' },
    { t: '1:18', label: 'On your mind', body: 'You wanted to call your dad. It\'s been 11 days. He\'s probably at the market — try after 2pm his time.' },
    { t: '1:52', label: 'One nudge', body: 'You\'ve got a soft commitment to send Carlos the Q4 outline by EOW. 90 minutes of focus time on it would do it.' },
    { t: '2:30', label: 'Money & home', body: 'Rent clears Sunday. Groceries are getting low — eggs, oat milk, the bread Anya likes. Whole Foods has them all.' },
    { t: '3:08', label: 'Read later', body: 'I saved that piece on attention you started yesterday. It\'s 18 minutes. The bus ride home is 22.' },
    { t: '3:42', label: 'A small thing', body: 'It\'s Meera\'s mom\'s birthday tomorrow. You wrote yourself a note in October to remember. Want me to draft a card?' },
  ],
};

export default function BriefScreen(_props: ScreenProps) {
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0.18); // 0-1
  const [activeSeg, setActiveSeg] = React.useState(1);

  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setProgress(p => {
        const next = p + 0.004;
        if (next >= 1) { setPlaying(false); return 1; }
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [playing]);

  const totalSec = 4 * 60 + 12;
  const cur = Math.floor(progress * totalSec);
  const fmt = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  return (
    <div style={{ padding: '8px 16px 100px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>{BRIEF.date.toUpperCase()}</div>
        <div className="display" style={{ fontSize: 28, fontWeight: 'var(--display-weight, 500)' as any, lineHeight: 1.1, marginTop: 4, textTransform: 'var(--display-case)' as any, letterSpacing: 'var(--display-tracking)' }}>Today's Brief</div>
      </div>

      {/* Player */}
      <div className="glass fade-up" style={{ padding: 18, marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0.55 0.22 var(--hue) / 0.25), transparent 70%)', pointerEvents: 'none' }}/>

        {/* Voice viz */}
        <div style={{ position: 'relative', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, marginBottom: 14 }}>
          {Array.from({ length: 48 }).map((_, i) => {
            const phase = (i / 48) - progress;
            const inWindow = Math.abs(phase) < 0.12;
            const seed = Math.sin(i * 1.3) * 0.5 + 0.5;
            const baseH = 8 + seed * 36;
            const h = playing && inWindow ? baseH * (1 + Math.sin((Date.now()/200) + i) * 0.3) : baseH;
            const passed = i / 48 < progress;
            return <div key={i} style={{ width: 2, height: h, borderRadius: 99, background: passed ? 'oklch(0.85 0.14 var(--hue))' : 'oklch(0.78 0.16 var(--hue) / 0.25)', transition: playing ? 'none' : 'height .3s' }}/>;
          })}
        </div>

        {/* Time */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
          <span>{fmt(cur)}</span>
          <span>{BRIEF.duration}</span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
          <div className="tap" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-2)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
          </div>
          <div onClick={() => setPlaying(!playing)} className="tap" style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.2 var(--hue)))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px oklch(0.55 0.22 var(--hue) / 0.4)' }}>
            {playing ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#06060a"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#06060a"><polygon points="6 4 20 12 6 20 6 4"/></svg>
            )}
          </div>
          <div className="tap" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-2)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
          </div>
        </div>

        {/* Speed + queue */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)', letterSpacing: 1 }}>
          <span className="tap">1.0×</span>
          <span>VOICE · MORNING</span>
          <span className="tap">QUEUE</span>
        </div>
      </div>

      {/* Transcript */}
      <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 8, padding: '0 4px' }}>TRANSCRIPT</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {BRIEF.segments.map((seg, i) => {
          const active = i === activeSeg;
          return (
            <div key={i} onClick={() => { setActiveSeg(i); setProgress(i / BRIEF.segments.length); }} className="tap glass fade-up" style={{ padding: 12, background: active ? 'oklch(0.78 0.16 var(--hue) / 0.1)' : undefined, borderLeft: active ? '2px solid oklch(0.78 0.16 var(--hue))' : '2px solid transparent' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 10, color: active ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>{seg.t}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-2)', fontWeight: 500, letterSpacing: 0.3 }}>{seg.label}</div>
              </div>
              <div style={{ fontSize: 13, color: active ? 'var(--fg)' : 'var(--fg-2)', lineHeight: 1.55 }}>{seg.body}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
