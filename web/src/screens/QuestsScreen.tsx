import type { ScreenProps } from '../App';
import { MOCK } from '../data/mock';
import { I } from '../components/icons';
import { Chip, HUDCorner } from '../components/primitives';

const rankHue: Record<string, number> = { S: 320, A: 30, B: 220, C: 150, D: 260 };

export default function QuestsScreen({ onNav: _onNav }: ScreenProps) {
  return (
    <div style={{ padding: '8px 16px 80px' }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>DAILY LOG</div>
          <div className="display" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>Quests</div>
        </div>
        <Chip tone="accent" size="lg">+540 XP TODAY</Chip>
      </div>

      {/* Featured emergent quest (GPS) */}
      <div className="glass scanlines fade-up" style={{
        padding: 16, marginBottom: 14, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue) / 0.18), oklch(0.65 0.22 calc(var(--hue) + 80) / 0.12))',
        borderColor: 'oklch(0.78 0.16 var(--hue) / 0.4)',
      }}>
        <HUDCorner position="tl"/><HUDCorner position="tr"/><HUDCorner position="bl"/><HUDCorner position="br"/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <I.sparkle size={14} stroke="oklch(0.9 0.14 var(--hue))"/>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'oklch(0.9 0.14 var(--hue))', letterSpacing: 1.5 }}>EMERGENT · CONTEXT · GPS</span>
        </div>
        <div className="display" style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.3, marginBottom: 8 }}>
          Groceries run — you're 420m from Nature's Basket
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-2)', marginBottom: 12, lineHeight: 1.5 }}>
          Meera added this 12 min ago. Nik detected your proximity and surfaced it. Accept to lock in +80 XP and save her a trip.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="tap" style={{
            flex: 1, padding: '10px 12px', borderRadius: 12,
            background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.60 0.22 calc(var(--hue) + 60)))',
            color: '#06060a', fontSize: 13, fontWeight: 600, textAlign: 'center',
            boxShadow: '0 0 16px oklch(0.78 0.16 var(--hue) / 0.4)',
          }}>Accept Quest</div>
          <div className="tap" style={{
            padding: '10px 14px', borderRadius: 12,
            background: 'oklch(1 0 0 / 0.05)', border: '1px solid var(--hairline)',
            fontSize: 13, color: 'var(--fg-2)',
          }}>Snooze</div>
        </div>
      </div>

      {/* Quest list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {MOCK.quests.map((q: any) => (
          <div key={q.id} className="glass fade-up" style={{
            padding: 12, display: 'flex', alignItems: 'center', gap: 12,
            opacity: q.status === 'done' ? 0.55 : 1,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              border: `1.5px solid oklch(0.78 0.16 ${rankHue[q.rank]})`,
              background: `oklch(0.78 0.16 ${rankHue[q.rank]} / 0.1)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17,
              color: `oklch(0.9 0.14 ${rankHue[q.rank]})`, flexShrink: 0,
            }}>{q.rank}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)', textDecoration: q.status === 'done' ? 'line-through' : 'none' }}>
                {q.title}
              </div>
              <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 3, display: 'flex', gap: 8 }}>
                <span style={{ color: 'oklch(0.9 0.14 var(--hue))' }}>+{q.xp} XP</span>
                {q.trigger && <span>· {q.trigger}</span>}
                {q.auto && <span style={{ color: 'oklch(0.85 0.14 150)' }}>· AUTO</span>}
              </div>
              {q.progress && (
                <div style={{ height: 2, background: 'oklch(1 0 0 / 0.06)', borderRadius: 99, marginTop: 6, overflow: 'hidden' }}>
                  <div className="xp-fill" style={{ height: '100%', width: `${q.progress * 100}%`, borderRadius: 99 }}/>
                </div>
              )}
            </div>
            {q.status === 'done' && <I.check size={18} stroke="oklch(0.85 0.14 150)"/>}
            {q.status === 'pending' && <I.chevR size={14} stroke="var(--fg-3)"/>}
          </div>
        ))}
      </div>
    </div>
  );
}
