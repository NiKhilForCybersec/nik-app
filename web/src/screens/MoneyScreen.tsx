/* Nik — Money / light finance */
import React from 'react';
import type { ScreenProps } from '../App';

const MONEY = {
  balance: 12480, currency: '$', delta30: -340,
  budgets: [
    { cat: 'Groceries', spent: 412, cap: 600, icon: 'shopping' },
    { cat: 'Dining', spent: 285, cap: 250, icon: 'utensils' },
    { cat: 'Transport', spent: 78, cap: 200, icon: 'car' },
    { cat: 'Family', spent: 540, cap: 800, icon: 'users' },
    { cat: 'Health', spent: 95, cap: 200, icon: 'heart' },
  ],
  bills: [
    { name: 'Rent', amt: 2400, when: 'Dec 1', auto: true },
    { name: 'Internet', amt: 65, when: 'Dec 4', auto: true },
    { name: 'Spotify', amt: 16, when: 'Dec 8', auto: true },
    { name: "Kiaan's piano", amt: 180, when: 'Dec 10', auto: false },
  ],
  recent: [
    { merchant: 'Whole Foods', amt: -86.40, cat: 'Groceries', when: '2h ago' },
    { merchant: 'Uber', amt: -14.20, cat: 'Transport', when: 'yesterday' },
    { merchant: 'Salary · Acme', amt: 4200, cat: 'Income', when: 'Nov 28' },
    { merchant: "Joe's Pizza", amt: -42.50, cat: 'Dining', when: 'Nov 28' },
  ],
};

export default function MoneyScreen(_props: ScreenProps) {
  const [tab, setTab] = React.useState<'overview' | 'bills' | 'recent'>('overview');
  const m = MONEY;

  return (
    <div style={{ padding: '8px 16px 100px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>MONEY · NOVEMBER</div>
        <div className="display" style={{ fontSize: 28, fontWeight: 'var(--display-weight, 500)' as any, lineHeight: 1.1, marginTop: 4, textTransform: 'var(--display-case)' as any, letterSpacing: 'var(--display-tracking)' }}>Money</div>
      </div>

      <div className="glass fade-up" style={{ padding: 16, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, oklch(0.78 0.16 var(--hue) / 0.18), transparent 70%)' }}/>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}>NET BALANCE</div>
        <div className="display" style={{ fontSize: 38, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>{m.currency}{m.balance.toLocaleString()}</div>
        <div style={{ fontSize: 12, color: m.delta30 < 0 ? 'var(--warn)' : 'var(--ok)', marginTop: 4 }}>{m.delta30 < 0 ? '↓' : '↑'} {m.currency}{Math.abs(m.delta30)} in 30 days</div>
      </div>

      <div className="glass fade-up" style={{ padding: 14, marginBottom: 12, background: 'oklch(0.78 0.16 var(--hue) / 0.06)' }}>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 4 }}>NIK NOTICED</div>
        <div style={{ fontSize: 13, color: 'var(--fg)', lineHeight: 1.5 }}>You're <b>$35 over</b> on Dining this month. Want to skip Friday takeout to stay on track?</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <div className="tap" style={{ flex: 1, padding: 8, borderRadius: 9, background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.2 var(--hue)))', color: '#06060a', textAlign: 'center', fontSize: 11, fontWeight: 600 }}>Skip Friday</div>
          <div className="tap" style={{ padding: '8px 12px', borderRadius: 9, background: 'var(--input-bg)', color: 'var(--fg-2)', fontSize: 11 }}>Maybe later</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12, padding: 3, background: 'var(--input-bg)', borderRadius: 12 }}>
        {([['overview','Budgets'],['bills','Bills'],['recent','Activity']] as const).map(([k,l]) => (
          <div key={k} onClick={() => setTab(k)} className="tap" style={{ flex: 1, padding: '8px 4px', borderRadius: 9, textAlign: 'center', background: tab===k ? 'oklch(0.78 0.16 var(--hue) / 0.18)' : 'transparent', color: tab===k ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)', fontSize: 11, fontWeight: tab===k ? 600 : 400 }}>{l}</div>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {m.budgets.map(b => {
            const pct = Math.min(1, b.spent / b.cap);
            const over = b.spent > b.cap;
            return (
              <div key={b.cat} className="glass fade-up" style={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 500 }}>{b.cat}</div>
                  <div style={{ fontSize: 11, color: over ? 'var(--warn)' : 'var(--fg-2)', fontFamily: 'var(--font-mono)' }}>{m.currency}{b.spent} / {b.cap}</div>
                </div>
                <div style={{ height: 6, background: 'var(--input-bg)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: pct * 100 + '%', height: '100%', background: over ? 'var(--warn)' : 'linear-gradient(90deg, oklch(0.65 0.15 var(--hue)), oklch(0.78 0.16 var(--hue)))' }}/>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'bills' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {m.bills.map((b, i) => (
            <div key={i} className="glass fade-up" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{b.when.split(' ')[1]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 500 }}>{b.name}</div>
                <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{b.when.toUpperCase()} · {b.auto ? 'AUTO-PAY' : 'MANUAL'}</div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--fg)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{m.currency}{b.amt}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'recent' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {m.recent.map((t, i) => (
            <div key={i} className="glass fade-up" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--fg)' }}>{t.merchant}</div>
                <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{t.cat.toUpperCase()} · {t.when.toUpperCase()}</div>
              </div>
              <div style={{ fontSize: 13, color: t.amt > 0 ? 'var(--ok)' : 'var(--fg)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{t.amt > 0 ? '+' : ''}{m.currency}{Math.abs(t.amt).toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
