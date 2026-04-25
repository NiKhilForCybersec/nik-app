import { useState } from 'react';
import type { ScreenProps } from '../App';
import { I } from '../components/icons';
import { Chip } from '../components/primitives';

const widgets = [
  { id: 'w1', name: 'Level HUD', size: '2x1', hue: 220 },
  { id: 'w2', name: 'Streak', size: '1x1', hue: 40 },
  { id: 'w3', name: 'Daily Ring', size: '1x1', hue: 200 },
  { id: 'w4', name: 'Active Quest', size: '2x1', hue: 280 },
  { id: 'w5', name: 'Family Ping', size: '2x1', hue: 150 },
  { id: 'w6', name: 'Voice Orb', size: '2x1', hue: 220 },
];
const palette = ['Calendar', 'Sleep', 'Mood', 'Steps', 'Water', 'Map'];

export default function WidgetsScreen(_p: ScreenProps) {
  const [editing] = useState(true);
  return (
    <div style={{ padding: '8px 16px 80px' }}>
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>EDIT MODE · DRAG TO REARRANGE</div>
          <div className="display" style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>Your Canvas</div>
        </div>
        <Chip tone="accent" size="sm">● EDITING</Chip>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {widgets.map(w => (
          <div key={w.id} className="glass" style={{
            padding: 12, aspectRatio: w.size === '2x1' ? '2 / 1' : '1 / 1',
            gridColumn: w.size === '2x1' ? 'span 2' : 'span 1',
            position: 'relative',
            background: `linear-gradient(135deg, oklch(0.78 0.16 ${w.hue} / 0.12), oklch(0.5 0.2 ${w.hue + 60} / 0.06))`,
            borderColor: `oklch(0.78 0.16 ${w.hue} / 0.25)`,
            animation: editing ? 'breathe 2.2s ease-in-out infinite' : 'none',
          }}>
            <div style={{
              position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%',
              background: 'oklch(0.25 0.02 260)', border: '1px solid var(--hairline-strong)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <I.close size={10} stroke="var(--fg-2)"/>
            </div>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>{w.size.toUpperCase()}</div>
            <div className="display" style={{ fontSize: 14, fontWeight: 500, marginTop: 6, color: `oklch(0.92 0.1 ${w.hue})` }}>{w.name}</div>
            <div style={{ position: 'absolute', bottom: 6, right: 6, opacity: 0.4 }}>
              <svg width="12" height="12" viewBox="0 0 12 12">
                <circle cx="3" cy="3" r="1" fill="currentColor"/>
                <circle cx="9" cy="3" r="1" fill="currentColor"/>
                <circle cx="3" cy="9" r="1" fill="currentColor"/>
                <circle cx="9" cy="9" r="1" fill="currentColor"/>
              </svg>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 1.5, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>PALETTE · DRAG UP TO ADD</div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {palette.map(p => (
          <div key={p} className="glass tap" style={{
            padding: '10px 14px', borderRadius: 14, flexShrink: 0, fontSize: 12,
            color: 'var(--fg-2)', whiteSpace: 'nowrap',
            background: 'oklch(1 0 0 / 0.03)',
          }}>+ {p}</div>
        ))}
      </div>

      <div className="tap" style={{
        marginTop: 16, padding: '14px', borderRadius: 14, textAlign: 'center',
        background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))',
        color: '#06060a', fontWeight: 600, fontSize: 14,
      }}>Done editing</div>
    </div>
  );
}
