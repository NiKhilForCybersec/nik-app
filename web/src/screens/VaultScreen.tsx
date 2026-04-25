/* Nik — Memory Vault */
import React from 'react';
import type { ScreenProps } from '../App';

const VAULT = {
  collections: [
    { id: 'kids', title: 'The kids growing up', count: 1247, cover: 'oklch(0.7 0.15 30)', span: '2018 → today' },
    { id: 'us', title: 'Meera & me', count: 432, cover: 'oklch(0.65 0.18 350)', span: '2014 → today' },
    { id: 'travel', title: 'Travel', count: 318, cover: 'oklch(0.7 0.15 200)', span: '12 trips' },
    { id: 'parents', title: 'Mom & Dad', count: 156, cover: 'oklch(0.7 0.15 80)', span: 'Always' },
  ],
  onThisDay: [
    { year: '5 years ago', text: 'Anya\'s first day of pre-K. She wore the orange dress and refused to let go of your hand.', img: 'oklch(0.7 0.16 60)' },
    { year: '2 years ago', text: 'Thanksgiving at your sister\'s. Kiaan ate three plates of mashed potatoes.', img: 'oklch(0.7 0.14 30)' },
  ],
  recent: [
    { kind: 'photo', when: 'Yesterday', tag: 'Anya · piano', color: 'oklch(0.65 0.16 60)' },
    { kind: 'voice', when: '2 days ago', tag: 'A note to my future self · 1:14', color: 'oklch(0.65 0.16 var(--hue))' },
    { kind: 'photo', when: '3 days ago', tag: 'Sunday pancakes', color: 'oklch(0.65 0.14 40)' },
    { kind: 'video', when: '4 days ago', tag: 'Kiaan riding without training wheels · 0:23', color: 'oklch(0.65 0.14 200)' },
    { kind: 'photo', when: '5 days ago', tag: 'Dad on the porch', color: 'oklch(0.65 0.12 80)' },
    { kind: 'photo', when: 'Last week', tag: 'Walk in Prospect Park', color: 'oklch(0.6 0.13 140)' },
  ],
};

export default function VaultScreen(_props: ScreenProps) {
  const [view, setView] = React.useState<'collections' | 'recent' | 'places'>('collections');

  return (
    <div style={{ padding: '8px 16px 100px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>VAULT · 2,154 MEMORIES</div>
        <div className="display" style={{ fontSize: 28, fontWeight: 'var(--display-weight, 500)' as any, lineHeight: 1.1, marginTop: 4, textTransform: 'var(--display-case)' as any, letterSpacing: 'var(--display-tracking)' }}>Memory Vault</div>
      </div>

      {/* On this day */}
      <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 8, padding: '0 4px' }}>ON THIS DAY</div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, padding: '0 4px 4px', marginLeft: -4, marginRight: -4 }}>
        {VAULT.onThisDay.map((m, i) => (
          <div key={i} className="glass fade-up" style={{ flexShrink: 0, width: 220, padding: 12 }}>
            <div style={{ height: 90, borderRadius: 10, background: `linear-gradient(135deg, ${m.img}, oklch(0.4 0.1 var(--hue)))`, marginBottom: 10, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 10, color: '#fff', fontFamily: 'var(--font-mono)', letterSpacing: 1, textShadow: '0 1px 4px rgba(0,0,0,.5)' }}>{m.year.toUpperCase()}</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg)', lineHeight: 1.5 }}>{m.text}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12, padding: 3, background: 'var(--input-bg)', borderRadius: 12 }}>
        {([['collections','Collections'],['recent','Recent'],['places','Places']] as const).map(([k,l]) => (
          <div key={k} onClick={() => setView(k)} className="tap" style={{ flex: 1, padding: '8px 4px', borderRadius: 9, textAlign: 'center', background: view===k ? 'oklch(0.78 0.16 var(--hue) / 0.18)' : 'transparent', color: view===k ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)', fontSize: 11, fontWeight: view===k ? 600 : 400 }}>{l}</div>
        ))}
      </div>

      {view === 'collections' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {VAULT.collections.map(c => (
            <div key={c.id} className="glass fade-up tap" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ height: 110, background: `linear-gradient(135deg, ${c.cover}, oklch(0.3 0.1 var(--hue)))`, position: 'relative' }}>
                <div style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 9, color: 'rgba(255,255,255,.85)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>{c.count}</div>
              </div>
              <div style={{ padding: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--fg)', fontWeight: 500 }}>{c.title}</div>
                <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{c.span.toUpperCase()}</div>
              </div>
            </div>
          ))}
          <div className="tap" style={{ gridColumn: 'span 2', padding: 14, borderRadius: 14, border: '1.5px dashed var(--hairline-strong)', textAlign: 'center', fontSize: 12, color: 'var(--fg-2)' }}>+ New collection</div>
        </div>
      )}

      {view === 'recent' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {VAULT.recent.map((m, i) => (
            <div key={i} className="tap fade-up" style={{ aspectRatio: '1/1', borderRadius: 10, background: `linear-gradient(135deg, ${m.color}, oklch(0.3 0.08 var(--hue)))`, position: 'relative', overflow: 'hidden' }}>
              {m.kind === 'video' && <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 8, padding: '2px 5px', borderRadius: 99, background: 'rgba(0,0,0,.55)', color: '#fff', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>VID</div>}
              {m.kind === 'voice' && <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 8, padding: '2px 5px', borderRadius: 99, background: 'rgba(0,0,0,.55)', color: '#fff', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>VOX</div>}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 6, background: 'linear-gradient(transparent, rgba(0,0,0,.6))' }}>
                <div style={{ fontSize: 9, color: '#fff', lineHeight: 1.3 }}>{m.tag}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'places' && (
        <div className="glass fade-up" style={{ padding: 12, height: 320, position: 'relative', overflow: 'hidden', borderRadius: 14 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 40%, oklch(0.5 0.15 var(--hue) / 0.3), transparent 50%), radial-gradient(circle at 70% 60%, oklch(0.5 0.15 30 / 0.3), transparent 50%), oklch(0.16 0.02 var(--hue))' }}/>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(oklch(0.4 0.05 var(--hue) / 0.15) 1px, transparent 1px), linear-gradient(90deg, oklch(0.4 0.05 var(--hue) / 0.15) 1px, transparent 1px)', backgroundSize: '24px 24px' }}/>
          {[
            { x: 25, y: 35, n: 412, label: 'Brooklyn' },
            { x: 60, y: 50, n: 86, label: 'Catskills' },
            { x: 70, y: 25, n: 48, label: 'Boston' },
            { x: 35, y: 70, n: 124, label: 'Lisbon' },
            { x: 80, y: 75, n: 32, label: 'Tokyo' },
          ].map((p, i) => (
            <div key={i} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', transform: 'translate(-50%, -50%)' }}>
              <div style={{ width: Math.max(20, Math.sqrt(p.n) * 1.8), height: Math.max(20, Math.sqrt(p.n) * 1.8), borderRadius: '50%', background: 'oklch(0.78 0.16 var(--hue) / 0.4)', border: '1px solid oklch(0.85 0.14 var(--hue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{p.n}</div>
              <div style={{ fontSize: 9, color: 'var(--fg-2)', textAlign: 'center', marginTop: 4, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>{p.label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
