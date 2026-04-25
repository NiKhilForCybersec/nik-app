/* Nik — Settings deep pages */
import { useState } from 'react';
import type { ScreenProps } from '../App';

const SETTINGS_SECTIONS = [
  {
    head: 'You',
    items: [
      { k: 'profile', t: 'Name, photo, voice', sub: 'Ravi · Morning calm voice' },
      { k: 'rhythm', t: 'Daily rhythm', sub: 'Up 6:45 · bed 23:15' },
      { k: 'health', t: 'Health profile', sub: 'Connected · Apple Health' },
    ],
  },
  {
    head: 'Nik',
    items: [
      { k: 'voice', t: 'Voice & tone', sub: 'Morning calm · 1.0× · whispers' },
      { k: 'autonomy', t: 'How proactive should I be?', sub: 'Suggest, don\'t auto-act' },
      { k: 'memory', t: 'Memory & forgetting', sub: 'Forgets weekly · keeps milestones' },
      { k: 'brief', t: 'Today\'s Brief', sub: '6:50 AM · 4 minutes · 7 sections' },
    ],
  },
  {
    head: 'Permissions',
    items: [
      { k: 'cal', t: 'Calendar', sub: 'iCloud + Google · read & write' },
      { k: 'health2', t: 'Health & fitness', sub: 'Sleep, steps, workouts' },
      { k: 'loc', t: 'Location', sub: 'While using · errand routing' },
      { k: 'contacts', t: 'Contacts', sub: 'Read only · for nudges' },
      { k: 'photos', t: 'Photos', sub: 'On-device · for vault & memories' },
    ],
  },
  {
    head: 'Family',
    items: [
      { k: 'circle', t: 'Your circle', sub: 'Meera, Anya, Kiaan, Mom, Sister' },
      { k: 'roles', t: 'Roles & sharing', sub: 'What each person sees' },
      { k: 'kidmode', t: 'Kids mode', sub: 'Anya · supervised' },
    ],
  },
  {
    head: 'Privacy',
    items: [
      { k: 'data', t: 'Your data', sub: 'On-device first · cloud opt-in' },
      { k: 'export', t: 'Export everything', sub: 'JSON + media archive' },
      { k: 'delete', t: 'Delete account', sub: 'All data, irreversible', danger: true },
    ],
  },
  {
    head: 'Aesthetic',
    items: [
      { k: 'theme', t: 'Theme universe', sub: '12 universes · current: Nik Noir' },
      { k: 'font', t: 'Typography', sub: 'Editorial serif · larger' },
      { k: 'density', t: 'Density', sub: 'Comfortable' },
      { k: 'haptics', t: 'Haptics & sound', sub: 'Subtle · system' },
    ],
  },
] as Array<{ head: string; items: Array<{ k: string; t: string; sub: string; danger?: boolean }> }>;

export default function SettingsScreen(_props: ScreenProps) {
  const [open, setOpen] = useState<string | null>(null); // section item key

  return (
    <div style={{ padding: '8px 16px 100px' }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>SETTINGS</div>
        <div className="display" style={{ fontSize: 28, fontWeight: 'var(--display-weight, 500)', lineHeight: 1.1, marginTop: 4, textTransform: 'var(--display-case)' as any, letterSpacing: 'var(--display-tracking)' }}>Settings</div>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'var(--input-bg)', marginBottom: 16 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--fg-3)' }}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <div style={{ fontSize: 13, color: 'var(--fg-3)' }}>Search settings</div>
      </div>

      {SETTINGS_SECTIONS.map(sec => (
        <div key={sec.head} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 8, padding: '0 4px' }}>{sec.head.toUpperCase()}</div>
          <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
            {sec.items.map((it, i) => (
              <div key={it.k} onClick={() => setOpen(open === it.k ? null : it.k)} className="tap" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < sec.items.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: it.danger ? 'var(--warn)' : 'var(--fg)', fontWeight: 500 }}>{it.t}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{it.sub}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--fg-3)', transform: open === it.k ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .2s' }}><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>NIK · 1.4.2 · BUILD 8801</div>
    </div>
  );
}
