/* Nik — app shell: tab nav, voice overlay, notifications, onboarding */

import type { FC, ReactNode } from 'react';
import { Fragment, useEffect, useState } from 'react';
import { I } from './icons';
import { VoiceOrb, Waveform } from './primitives';

// ── Tab bar (floating glass) ───────────────────────────
export type TabBarProps = {
  active: string;
  onNav: (id: string) => void;
  onVoice: () => void;
};
export const TabBar: FC<TabBarProps> = ({ active, onNav, onVoice }) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const tabs: { id: string; icon: string; label: string; center?: boolean }[] = [
    { id: 'home', icon: 'home', label: 'Home' },
    { id: 'quests', icon: 'sword', label: 'Tasks' },
    { id: 'voice', icon: 'mic', label: '', center: true },
    { id: 'habits', icon: 'target', label: 'Habits' },
    { id: 'more', icon: 'grid', label: 'More' },
  ];
  const moreItems: { id: string; icon: string; label: string; tag?: string; sub: string }[] = [
    { id: 'diary', icon: 'book', label: 'Diary', tag: 'NEW', sub: 'Daily · photos · voice' },
    { id: 'focus', icon: 'target', label: 'Focus Mode', tag: 'NEW', sub: 'Timer · lockdown · tree' },
    { id: 'score', icon: 'sparkle', label: 'Nik Score', tag: 'NEW', sub: '4 pillars · 0\u20131000' },
    { id: 'meds', icon: 'pill', label: 'Meds', sub: 'Schedules · Rx · AI add' },
    { id: 'familyops', icon: 'family', label: 'Family Ops', sub: 'Tasks · alarms · rules' },
    { id: 'family', icon: 'family', label: 'Family Circle', sub: 'Locations · XP · pings' },
    { id: 'fitness', icon: 'dumbbell', label: 'Fitness', sub: 'Coach · library · plan' },
    { id: 'stats', icon: 'stats', label: 'Growth', sub: 'Weekly stats' },
    { id: 'widgets', icon: 'grid', label: 'Widgets', sub: 'Edit home screen' },
    { id: 'chat', icon: 'mic', label: 'Ask Nik', sub: 'Voice · chat' },
    { id: 'profile', icon: 'user', label: 'Profile', sub: 'Themes · connect · settings' },
  ];
  return (
    <Fragment>
    {moreOpen && (
      <div onClick={() => setMoreOpen(false)} style={{
        position: 'absolute', inset: 0, zIndex: 39,
        background: 'var(--scrim)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 12px 92px',
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          width: '100%',
          padding: '14px 14px 16px',
          background: 'var(--sheet-bg)',
          border: '1px solid var(--hairline)',
          borderRadius: 18,
          boxShadow: '0 20px 60px oklch(0 0 0 / 0.6)',
          opacity: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono, JetBrains Mono)', letterSpacing: 1.5 }}>MORE DASHBOARDS</div>
            <div onClick={() => setMoreOpen(false)} className="tap" style={{ fontSize: 14, color: 'var(--fg-2)', padding: '2px 6px' }}>✕</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {moreItems.map(m => {
              const Ic = I[m.icon] || I.grid;
              const isActive = active === m.id;
              return (
                <div key={m.id} onClick={() => { onNav(m.id); setMoreOpen(false); }} className="tap" style={{
                  padding: 10, borderRadius: 12,
                  background: isActive ? 'oklch(0.78 0.16 var(--hue) / 0.18)' : 'var(--input-bg)',
                  border: '1px solid ' + (isActive ? 'oklch(0.78 0.16 var(--hue) / 0.4)' : 'var(--hairline)'),
                  display: 'flex', gap: 8, alignItems: 'center', minWidth: 0,
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: 'oklch(0.78 0.16 var(--hue) / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ic size={14} stroke={isActive ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)'}/>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--sheet-fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.label}</div>
                      {m.tag && <div style={{ fontSize: 8, padding: '1px 5px', borderRadius: 99, background: 'oklch(0.78 0.16 var(--hue) / 0.25)', color: 'oklch(0.9 0.14 var(--hue))', fontFamily: 'var(--font-mono, JetBrains Mono)', letterSpacing: 0.5, flexShrink: 0 }}>{m.tag}</div>}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono, JetBrains Mono)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )}
    <div style={{
      position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 40,
    }}>
      <div className="glass" style={{
        padding: '6px', display: 'flex', gap: 2, alignItems: 'center',
        background: 'oklch(0.12 0.02 260 / 0.8)',
        backdropFilter: 'blur(30px) saturate(180%)',
        border: '1px solid oklch(1 0 0 / 0.1)',
        borderRadius: 99,
        boxShadow: '0 10px 40px oklch(0 0 0 / 0.5)',
      }}>
        {tabs.map(t => {
          const Ic = I[t.icon];
          const isActive = active === t.id && !t.center;
          if (t.center) return (
            <div key={t.id} onClick={onVoice} className="tap" style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px oklch(0.78 0.16 var(--hue) / 0.6)',
              margin: '0 2px',
            }}>
              <Ic size={20} stroke="#06060a" sw={2.2}/>
            </div>
          );
          return (
            <div key={t.id} onClick={() => { setMoreOpen(false); onNav(t.id); }} className="tap" style={{
              width: 52, height: 44, borderRadius: 99,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 2, color: isActive || (t.id === 'more' && moreOpen) ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-3)',
              background: isActive || (t.id === 'more' && moreOpen) ? 'oklch(0.78 0.16 var(--hue) / 0.15)' : 'transparent',
            }}>
              <Ic size={18}/>
              <div style={{ fontSize: 8, fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>{t.label.toUpperCase()}</div>
            </div>
          );
        })}
      </div>
    </div>
    </Fragment>
  );
};

// ── Voice overlay (full-screen takeover) ───────────────
export type VoiceOverlayProps = {
  onClose: () => void;
};
export const VoiceOverlay: FC<VoiceOverlayProps> = ({ onClose }) => {
  const [transcript, setTranscript] = useState('');
  const phrases = ['Hey Nik,', 'Hey Nik, move my 3pm', 'Hey Nik, move my 3pm by 30 min'];
  useEffect(() => {
    let i = 0;
    const tick = () => {
      if (i < phrases.length) { setTranscript(phrases[i]); i++; }
    };
    const iv = setInterval(tick, 700);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: 'radial-gradient(ellipse at 50% 60%, oklch(0.3 0.15 var(--hue) / 0.6), oklch(0.08 0.02 260 / 0.96) 70%)',
      backdropFilter: 'blur(30px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      {/* Edge glow */}
      <div style={{
        position: 'absolute', inset: 0,
        boxShadow: 'inset 0 0 80px oklch(0.78 0.16 var(--hue) / 0.4)',
        pointerEvents: 'none',
        animation: 'breathe 1.6s ease-in-out infinite',
      }}/>

      {/* Close */}
      <div onClick={onClose} className="tap" style={{
        position: 'absolute', top: 60, right: 20,
        width: 36, height: 36, borderRadius: '50%',
        background: 'oklch(1 0 0 / 0.08)', border: '1px solid var(--hairline)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <I.close size={16} stroke="#fff"/>
      </div>

      <div style={{ fontSize: 11, color: 'oklch(0.9 0.12 var(--hue))', fontFamily: 'var(--font-mono)', letterSpacing: 2, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.78 0.18 var(--hue))', animation: 'breathe 0.8s infinite' }}/>
        LISTENING
      </div>

      <VoiceOrb size={180} listening/>

      <div style={{ marginTop: 40, minHeight: 60, textAlign: 'center', maxWidth: '90%' }}>
        <div className="display" style={{ fontSize: 22, fontWeight: 400, lineHeight: 1.3, color: '#fff' }}>
          {transcript || '…'}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <Waveform active bars={12} height={24}/>
      </div>

      <div style={{ marginTop: 40, fontSize: 11, color: 'oklch(1 0 0 / 0.5)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, textAlign: 'center' }}>
        TRY: "PLAN MY EVENING" · "WHAT DID MEERA ADD?" · "START FOCUS MODE"
      </div>
    </div>
  );
};

// ── Offline / sync banner ──────────────────────────────
export type OfflineBannerProps = {
  state?: 'offline' | 'syncing' | null;
};
export const OfflineBanner: FC<OfflineBannerProps> = ({ state }) => {
  if (!state) return null;
  const isSyncing = state === 'syncing';
  const Ic = isSyncing ? I.sync : I.wifiOff;
  return (
    <div style={{
      position: 'absolute', top: 12, left: 12, right: 12, zIndex: 50,
      padding: '8px 12px', borderRadius: 12,
      background: isSyncing ? 'oklch(0.78 0.16 var(--hue) / 0.15)' : 'oklch(0.70 0.20 25 / 0.15)',
      border: '1px solid ' + (isSyncing ? 'oklch(0.78 0.16 var(--hue) / 0.4)' : 'oklch(0.70 0.20 25 / 0.4)'),
      display: 'flex', alignItems: 'center', gap: 8,
      fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 0.5,
      color: isSyncing ? 'oklch(0.9 0.14 var(--hue))' : 'oklch(0.85 0.15 25)',
    }}>
      <Ic size={14}/>
      <span>{isSyncing ? 'SYNCING…' : 'OFFLINE · CHANGES QUEUED'}</span>
    </div>
  );
};

// ── Empty state ────────────────────────────────────────
export type EmptyStateProps = {
  icon?: string;
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
};
export const EmptyState: FC<EmptyStateProps> = ({ icon = 'sparkle', title, body, action }) => {
  const Ic = I[icon] || I.sparkle;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32, textAlign: 'center', gap: 10,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: 'oklch(0.78 0.16 var(--hue) / 0.12)',
        border: '1px solid oklch(0.78 0.16 var(--hue) / 0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 4,
      }}>
        <Ic size={24} stroke="oklch(0.9 0.14 var(--hue))"/>
      </div>
      <div className="display" style={{ fontSize: 16, fontWeight: 500, color: 'var(--fg)' }}>{title}</div>
      {body && <div style={{ fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.5, maxWidth: 280 }}>{body}</div>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
};

// ── Skeleton screen ────────────────────────────────────
export type SkeletonScreenProps = {
  rows?: number;
};
export const SkeletonScreen: FC<SkeletonScreenProps> = ({ rows = 4 }) => (
  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{
        height: 64, borderRadius: 12,
        background: 'linear-gradient(90deg, oklch(1 0 0 / 0.04), oklch(1 0 0 / 0.08), oklch(1 0 0 / 0.04))',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s ease-in-out infinite',
        border: '1px solid var(--hairline)',
      }}/>
    ))}
  </div>
);
