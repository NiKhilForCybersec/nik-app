import type { ScreenProps } from '../App';
import { I } from '../components/icons';
import { Chip } from '../components/primitives';

const week = [0.4, 0.7, 0.55, 0.8, 0.65, 0.9, 0.75];
const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const cards = [
  { k: 'Sleep', v: '7.4h', delta: '+12%', hue: 280, icon: 'moon' },
  { k: 'Focus', v: '4.2h', delta: '+8%', hue: 200, icon: 'target' },
  { k: 'Active', v: '58m', delta: '+22%', hue: 40, icon: 'dumbbell' },
  { k: 'Screen', v: '3.1h', delta: '-18%', hue: 150, icon: 'eye' },
];

export default function StatsScreen(_p: ScreenProps) {
  return (
    <div style={{ padding: '8px 16px 80px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>INSIGHTS · LAST 7 DAYS</div>
        <div className="display" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>Growth</div>
      </div>

      <div className="glass fade-up" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>COMPLETION</div>
            <div className="display" style={{ fontSize: 28, fontWeight: 600 }}>68<span style={{ fontSize: 14, color: 'var(--fg-3)' }}>%</span></div>
          </div>
          <Chip tone="ok" size="sm">↑ 12% vs last week</Chip>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 100 }}>
          {week.map((v, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: '100%', height: `${v * 100}%`, borderRadius: 6,
                background: 'linear-gradient(180deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))',
                boxShadow: '0 0 8px oklch(0.78 0.16 var(--hue) / 0.4)',
              }}/>
              <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{days[i]}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        {cards.map(s => {
          const SI = I[s.icon];
          return (
            <div key={s.k} className="glass fade-up" style={{ padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <SI size={16} stroke={`oklch(0.85 0.14 ${s.hue})`}/>
                <div style={{ fontSize: 10, color: 'oklch(0.85 0.14 150)', fontFamily: 'var(--font-mono)' }}>{s.delta}</div>
              </div>
              <div className="display" style={{ fontSize: 20, fontWeight: 600, marginTop: 8 }}>{s.v}</div>
              <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>{s.k.toUpperCase()}</div>
            </div>
          );
        })}
      </div>

      <div className="glass fade-up" style={{
        padding: 14,
        background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue) / 0.15), oklch(0.65 0.22 calc(var(--hue) + 80) / 0.08))',
        borderColor: 'oklch(0.78 0.16 var(--hue) / 0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <I.sparkle size={14} stroke="oklch(0.9 0.14 var(--hue))"/>
          <span style={{ fontSize: 10, color: 'oklch(0.9 0.14 var(--hue))', fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}>NIK · PATTERN FOUND</span>
        </div>
        <div className="display" style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.4, marginBottom: 4 }}>
          You focus 38% better when you train before noon
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.5 }}>
          I'll start suggesting morning gym quests by default. Tap to dismiss if you'd rather not.
        </div>
      </div>
    </div>
  );
}
