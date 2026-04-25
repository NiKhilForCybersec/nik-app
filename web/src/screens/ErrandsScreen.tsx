/* Nik — Errands & Routes */
import React from 'react';
import type { ScreenProps } from '../App';

type ErrandItem = { id: number; t: string; where: string; when: string; addr: string; done: boolean };
type RouteStop = { name: string; t: string; kind: 'errand' | 'home' };

const ERRANDS: { list: ErrandItem[]; optimized: RouteStop[] } = {
  list: [
    { id: 1, t: 'Pick up dry cleaning', where: 'Lupita Cleaners', when: 'Today', addr: '7 min', done: false },
    { id: 2, t: 'Grab eggs, oat milk, sourdough', where: 'Whole Foods', when: 'Today', addr: '11 min', done: false },
    { id: 3, t: 'Drop off Anya\'s prescription', where: 'CVS · Atlantic Ave', when: 'Today', addr: '9 min', done: false },
    { id: 4, t: 'Return Amazon package', where: 'UPS Store', when: 'This week', addr: '6 min', done: false },
    { id: 5, t: 'Mail birthday card to Mom', where: 'USPS', when: 'This week', addr: '6 min', done: true },
  ],
  optimized: [
    { name: 'Lupita Cleaners', t: '4 min', kind: 'errand' },
    { name: 'CVS · Atlantic', t: '6 min walk', kind: 'errand' },
    { name: 'UPS Store', t: '2 min walk', kind: 'errand' },
    { name: 'Whole Foods', t: '5 min walk', kind: 'errand' },
    { name: 'Home', t: '8 min', kind: 'home' },
  ],
};

export default function ErrandsScreen(_props: ScreenProps) {
  const [items, setItems] = React.useState<ErrandItem[]>(ERRANDS.list);

  const toggle = (id: number) => setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
  const remaining = items.filter(i => !i.done).length;

  return (
    <div style={{ padding: '8px 16px 100px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>{remaining} OPEN · 35 MIN OF TASKS</div>
        <div className="display" style={{ fontSize: 28, fontWeight: 'var(--display-weight, 500)' as any, lineHeight: 1.1, marginTop: 4, textTransform: 'var(--display-case)' as any, letterSpacing: 'var(--display-tracking)' }}>Errands</div>
      </div>

      {/* AI route */}
      <div className="glass fade-up" style={{ padding: 14, marginBottom: 12, background: 'oklch(0.78 0.16 var(--hue) / 0.06)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}>NIK ROUTED IT</div>
          <div style={{ fontSize: 10, color: 'var(--ok)', fontFamily: 'var(--font-mono)' }}>SAVES 18 MIN</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 4 }}>
          {ERRANDS.optimized.map((stop, i) => (
            <React.Fragment key={i}>
              <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 60 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: stop.kind === 'home' ? 'oklch(0.78 0.16 var(--hue))' : 'var(--input-bg)', border: stop.kind === 'home' ? 'none' : '1px solid var(--hairline-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: stop.kind === 'home' ? '#06060a' : 'var(--fg-2)', fontSize: 10, fontWeight: 600 }}>{i+1}</div>
                <div style={{ fontSize: 9, color: 'var(--fg-2)', marginTop: 4, lineHeight: 1.2, fontWeight: 500 }}>{stop.name}</div>
                <div style={{ fontSize: 8, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{stop.t.toUpperCase()}</div>
              </div>
              {i < ERRANDS.optimized.length - 1 && (
                <div style={{ flex: 1, minWidth: 16, height: 1, background: 'linear-gradient(90deg, transparent, var(--hairline-strong), transparent)', marginTop: -22 }}/>
              )}
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          <div className="tap" style={{ flex: 1, padding: 10, borderRadius: 10, background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.2 var(--hue)))', color: '#06060a', textAlign: 'center', fontSize: 12, fontWeight: 600 }}>Start route</div>
          <div className="tap" style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--input-bg)', color: 'var(--fg-2)', fontSize: 12 }}>Map</div>
        </div>
      </div>

      <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 8, padding: '0 4px' }}>ALL ERRANDS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map(it => (
          <div key={it.id} className="glass fade-up" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10, opacity: it.done ? 0.4 : 1 }}>
            <div onClick={() => toggle(it.id)} className="tap" style={{ width: 22, height: 22, borderRadius: '50%', border: it.done ? 'none' : '1.5px solid var(--hairline-strong)', background: it.done ? 'oklch(0.7 0.15 var(--hue))' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {it.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#06060a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--fg)', textDecoration: it.done ? 'line-through' : 'none' }}>{it.t}</div>
              <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{it.where.toUpperCase()} · {it.addr.toUpperCase()}</div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)' }}>{it.when.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <div className="tap" style={{ marginTop: 12, padding: 14, borderRadius: 14, border: '1.5px dashed var(--hairline-strong)', textAlign: 'center', fontSize: 12, color: 'var(--fg-2)' }}>+ Add errand · or speak it</div>
    </div>
  );
}
