/* Nik — shared UI primitives */

import type { CSSProperties, FC, ReactNode } from 'react';
import { Fragment } from 'react';
import { I } from './icons';

// ── Gradient defs (shared) ───────────────────────────────
export const GradientDefs: FC = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }}>
    <defs>
      <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="oklch(0.78 0.16 var(--hue, 220))"/>
        <stop offset="100%" stopColor="oklch(0.68 0.20 calc(var(--hue, 220) + 60))"/>
      </linearGradient>
      <linearGradient id="ringGradWarm" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="oklch(0.82 0.17 70)"/>
        <stop offset="100%" stopColor="oklch(0.72 0.20 30)"/>
      </linearGradient>
      <linearGradient id="ringGradCool" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="oklch(0.78 0.16 200)"/>
        <stop offset="100%" stopColor="oklch(0.70 0.18 280)"/>
      </linearGradient>
      <linearGradient id="ringGradGreen" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="oklch(0.80 0.18 150)"/>
        <stop offset="100%" stopColor="oklch(0.70 0.18 180)"/>
      </linearGradient>
      <radialGradient id="orbGrad" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="oklch(0.95 0.12 var(--hue, 220))" stopOpacity="1"/>
        <stop offset="60%" stopColor="oklch(0.65 0.22 var(--hue, 220))" stopOpacity="0.9"/>
        <stop offset="100%" stopColor="oklch(0.35 0.18 calc(var(--hue, 220) + 60))" stopOpacity="0.6"/>
      </radialGradient>
    </defs>
  </svg>
);

// ── Ring progress ────────────────────────────────────────
export type RingProps = {
  size?: number;
  pct?: number;
  sw?: number;
  label?: ReactNode;
  gradId?: string;
  children?: ReactNode;
};
export const Ring: FC<RingProps> = ({ size = 60, pct = 0.5, sw = 4, gradId = 'ringGrad', children }) => {
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      <circle cx={size/2} cy={size/2} r={r} strokeWidth={sw} fill="none" className="ring-track"/>
      <circle cx={size/2} cy={size/2} r={r} strokeWidth={sw} fill="none"
        stroke={`url(#${gradId})`}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        strokeLinecap="round"
        style={{
          transform: 'rotate(-90deg)', transformOrigin: 'center',
          filter: 'drop-shadow(0 0 4px oklch(0.78 0.16 var(--hue, 220) / 0.6))',
          transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
      {children}
    </svg>
  );
};

// ── XP bar ───────────────────────────────────────────────
export type XPBarProps = {
  cur: number;
  max: number;
  level?: number | string;
  compact?: boolean;
};
export const XPBar: FC<XPBarProps> = ({ cur, max, level, compact = false }) => {
  const pct = Math.min(100, (cur / max) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
      {!compact && (
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.60 0.22 calc(var(--hue) + 60)))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
          color: '#06060a',
          boxShadow: '0 0 12px oklch(0.78 0.16 var(--hue) / 0.5)',
        }}>{level}</div>
      )}
      <div style={{ flex: 1 }}>
        {!compact && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--fg-3)', marginBottom: 3, fontFamily: 'var(--font-mono)' }}>
            <span>LVL {level}</span>
            <span>{cur} / {max} XP</span>
          </div>
        )}
        <div style={{
          height: compact ? 4 : 6, background: 'oklch(1 0 0 / 0.06)', borderRadius: 99,
          overflow: 'hidden', position: 'relative',
        }}>
          <div className="xp-fill" style={{
            height: '100%', width: `${pct}%`, borderRadius: 99,
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}/>
        </div>
      </div>
    </div>
  );
};

// ── Voice orb ────────────────────────────────────────────
export type VoiceOrbProps = {
  size?: number;
  listening?: boolean;
  onClick?: () => void;
};
export const VoiceOrb: FC<VoiceOrbProps> = ({ size = 80, listening = false, onClick }) => (
  <div className="tap" onClick={onClick} style={{
    width: size, height: size, position: 'relative', cursor: 'pointer',
  }}>
    {/* outer halo */}
    <div style={{
      position: 'absolute', inset: -8, borderRadius: '50%',
      background: 'radial-gradient(circle, oklch(0.78 0.18 var(--hue) / 0.4), transparent 70%)',
      animation: listening ? 'breathe 1.4s ease-in-out infinite' : 'breathe 3s ease-in-out infinite',
      filter: 'blur(4px)',
    }}/>
    {/* rotating ring */}
    <svg width={size} height={size} style={{
      position: 'absolute', inset: 0,
      animation: `orb-rotate ${listening ? '4s' : '20s'} linear infinite`,
    }}>
      <circle cx={size/2} cy={size/2} r={size/2 - 2} fill="none"
        stroke="oklch(0.78 0.16 var(--hue) / 0.6)"
        strokeWidth="1" strokeDasharray="2 6"/>
    </svg>
    {/* orb body */}
    <div style={{
      position: 'absolute', inset: 4, borderRadius: '50%',
      background: 'url(#orbGrad)',
      backgroundImage: `radial-gradient(circle at 35% 30%,
        oklch(0.95 0.12 var(--hue)),
        oklch(0.55 0.22 var(--hue)) 55%,
        oklch(0.25 0.15 calc(var(--hue) + 60)) 100%)`,
      boxShadow: `
        inset 0 2px 8px oklch(1 0 0 / 0.4),
        inset 0 -8px 16px oklch(0 0 0 / 0.3),
        0 0 24px oklch(0.78 0.18 var(--hue) / 0.6)`,
      animation: listening ? 'orb-pulse 1.2s ease-in-out infinite' : 'breathe 3s ease-in-out infinite',
    }}/>
    {/* highlight */}
    <div style={{
      position: 'absolute', top: '18%', left: '22%', width: '30%', height: '22%',
      borderRadius: '50%', background: 'oklch(1 0 0 / 0.45)', filter: 'blur(4px)',
      pointerEvents: 'none',
    }}/>
  </div>
);

// ── Waveform bars (for voice listening) ─────────────────
export type WaveformProps = {
  active?: boolean;
  bars?: number;
  color?: string;
  height?: number;
};
export const Waveform: FC<WaveformProps> = ({ active = true, bars = 5, color = 'oklch(0.9 0.1 var(--hue))', height = 20 }) => (
  <div style={{ display: 'flex', gap: 3, alignItems: 'center', height }}>
    {Array.from({ length: bars }).map((_, i) => (
      <div key={i} className={active ? 'wave-bar' : ''} style={{
        width: 2, height: active ? '100%' : '40%', background: color, borderRadius: 2,
        animationDelay: `${i * 0.1}s`,
        opacity: active ? 1 : 0.5,
      }}/>
    ))}
  </div>
);

// ── Avatar (geometric, no images) ───────────────────────
export type AvatarProps = {
  name?: string;
  size?: number;
  hue?: number;
  ring?: boolean;
  status?: 'online' | 'away' | 'offline' | string;
};
export const Avatar: FC<AvatarProps> = ({ name = 'A', size = 36, hue = 220, ring = false, status }) => {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div style={{
      width: size, height: size, position: 'relative',
      borderRadius: '50%',
      background: `linear-gradient(135deg, oklch(0.65 0.18 ${hue}), oklch(0.45 0.22 ${hue + 60}))`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: size * 0.4,
      color: '#fff', flexShrink: 0,
      boxShadow: ring ? `0 0 0 2px oklch(0.78 0.16 ${hue}), 0 0 12px oklch(0.78 0.16 ${hue} / 0.5)` : 'none',
    }}>
      {initial}
      {status && (
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: size * 0.3, height: size * 0.3, borderRadius: '50%',
          background: status === 'online' ? 'oklch(0.75 0.18 150)' : status === 'away' ? 'oklch(0.82 0.15 70)' : 'oklch(0.5 0.02 260)',
          border: '2px solid var(--bg)',
        }}/>
      )}
    </div>
  );
};

// ── Chip / Tag ──────────────────────────────────────────
export type ChipProps = {
  children?: ReactNode;
  tone?: 'default' | 'accent' | 'warn' | 'ok' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
};
export const Chip: FC<ChipProps> = ({ children, tone = 'default', size = 'md', icon }) => {
  const tones = {
    default: { bg: 'oklch(1 0 0 / 0.06)', fg: 'var(--fg-2)', br: 'var(--hairline)' },
    accent: { bg: 'oklch(0.78 0.16 var(--hue) / 0.15)', fg: 'oklch(0.88 0.12 var(--hue))', br: 'oklch(0.78 0.16 var(--hue) / 0.4)' },
    warn: { bg: 'oklch(0.82 0.15 70 / 0.15)', fg: 'oklch(0.9 0.14 70)', br: 'oklch(0.82 0.15 70 / 0.4)' },
    ok: { bg: 'oklch(0.78 0.15 150 / 0.15)', fg: 'oklch(0.85 0.14 150)', br: 'oklch(0.78 0.15 150 / 0.4)' },
    danger: { bg: 'oklch(0.70 0.20 25 / 0.15)', fg: 'oklch(0.85 0.15 25)', br: 'oklch(0.70 0.20 25 / 0.4)' },
  };
  const t = tones[tone];
  const sizes = { sm: { p: '2px 6px', fs: 9 }, md: { p: '3px 9px', fs: 10 }, lg: { p: '5px 12px', fs: 11 } };
  const s = sizes[size];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: s.p, borderRadius: 99,
      background: t.bg, color: t.fg, border: `1px solid ${t.br}`,
      fontFamily: 'var(--font-mono)', fontSize: s.fs, fontWeight: 500,
      letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      {icon}{children}
    </div>
  );
};

// ── Placeholder image (striped) ─────────────────────────
export type PlaceholderProps = {
  w?: number | string;
  h?: number | string;
  label?: ReactNode;
  radius?: number;
};
export const Placeholder: FC<PlaceholderProps> = ({ w = '100%', h = 120, label, radius = 12 }) => (
  <div style={{
    width: w, height: h, borderRadius: radius,
    background: 'repeating-linear-gradient(45deg, oklch(1 0 0 / 0.04), oklch(1 0 0 / 0.04) 8px, oklch(1 0 0 / 0.02) 8px, oklch(1 0 0 / 0.02) 16px)',
    border: '1px dashed var(--hairline)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1.5,
    color: 'var(--fg-3)', textTransform: 'uppercase',
  }}>{label}</div>
);

// ── HUD Corner (decorative) ─────────────────────────────
export type HUDCornerProps = {
  size?: number;
  position?: 'tl' | 'tr' | 'bl' | 'br';
  color?: string;
};
export const HUDCorner: FC<HUDCornerProps> = ({ size = 14, position = 'tl', color = 'oklch(0.78 0.16 var(--hue))' }) => {
  const pos: Record<string, CSSProperties> = {
    tl: { top: 0, left: 0, transform: 'rotate(0deg)' },
    tr: { top: 0, right: 0, transform: 'rotate(90deg)' },
    bl: { bottom: 0, left: 0, transform: 'rotate(-90deg)' },
    br: { bottom: 0, right: 0, transform: 'rotate(180deg)' },
  };
  return (
    <div style={{ position: 'absolute', ...pos[position], width: size, height: size, pointerEvents: 'none' }}>
      <svg viewBox="0 0 14 14" width={size} height={size}>
        <path d="M0 6V0h6" fill="none" stroke={color} strokeWidth="1.5"/>
      </svg>
    </div>
  );
};

// ── Toast ────────────────────────────────────────────────
// Lives in primitives because App.tsx imports it from here.
export type ToastNotif = {
  kind: 'gps' | 'family' | 'habit' | 'system' | string;
  title: string;
  body: string;
  time: string;
  action?: string;
};
export type ToastProps = {
  notif: ToastNotif | null | undefined;
  onDismiss?: () => void;
};
export const Toast: FC<ToastProps> = ({ notif, onDismiss }) => {
  if (!notif) return null;
  const icons: Record<string, string> = { gps: 'location', family: 'family', habit: 'target', system: 'sparkle' };
  const Ic = I[icons[notif.kind]] || I.sparkle;
  return (
    <div className="toast-in glass" style={{
      position: 'absolute', top: 52, left: 12, right: 12, zIndex: 55,
      padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start',
      background: 'var(--sheet-bg)',
      borderColor: 'oklch(0.78 0.16 var(--hue) / 0.4)',
      boxShadow: '0 10px 30px oklch(0 0 0 / 0.4)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        background: 'oklch(0.78 0.16 var(--hue) / 0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Ic size={16} stroke="oklch(0.9 0.14 var(--hue))"/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sheet-fg)' }}>{notif.title}</div>
        <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 2, lineHeight: 1.4 }}>{notif.body}</div>
        {notif.action && (
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            <div className="tap" style={{
              padding: '4px 10px', borderRadius: 99, fontSize: 10,
              background: 'oklch(0.78 0.16 var(--hue))',
              color: '#06060a', fontWeight: 600,
            }}>{notif.action}</div>
            <div onClick={onDismiss} className="tap" style={{
              padding: '4px 10px', borderRadius: 99, fontSize: 10,
              color: 'oklch(1 0 0 / 0.6)',
            }}>Later</div>
          </div>
        )}
      </div>
      <div onClick={onDismiss} style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{notif.time.toUpperCase()}</div>
    </div>
  );
};

// ── iOS device frame (from www/frames/ios-frame.jsx) ──
function IOSStatusBar({ dark = false, time = '9:41' }: { dark?: boolean; time?: string }) {
  const c = dark ? '#fff' : '#000';
  return (
    <div style={{
      display: 'flex', gap: 154, alignItems: 'center', justifyContent: 'center',
      padding: '21px 24px 19px', boxSizing: 'border-box',
      position: 'relative', zIndex: 20, width: '100%',
    }}>
      <div style={{ flex: 1, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 1.5 }}>
        <span style={{
          fontFamily: '-apple-system, "SF Pro", system-ui', fontWeight: 590,
          fontSize: 17, lineHeight: '22px', color: c,
        }}>{time}</span>
      </div>
      <div style={{ flex: 1, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, paddingTop: 1, paddingRight: 1 }}>
        <svg width="19" height="12" viewBox="0 0 19 12">
          <rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" fill={c}/>
          <rect x="4.8" y="5" width="3.2" height="7" rx="0.7" fill={c}/>
          <rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" fill={c}/>
          <rect x="14.4" y="0" width="3.2" height="12" rx="0.7" fill={c}/>
        </svg>
        <svg width="17" height="12" viewBox="0 0 17 12">
          <path d="M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z" fill={c}/>
          <path d="M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z" fill={c}/>
          <circle cx="8.5" cy="10.5" r="1.5" fill={c}/>
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke={c} strokeOpacity="0.35" fill="none"/>
          <rect x="2" y="2" width="20" height="9" rx="2" fill={c}/>
          <path d="M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z" fill={c} fillOpacity="0.4"/>
        </svg>
      </div>
    </div>
  );
}

export type IOSDeviceProps = {
  children?: ReactNode;
  width?: number;
  height?: number;
  dark?: boolean;
  title?: string;
};
export const IOSDevice: FC<IOSDeviceProps> = ({
  children, width = 402, height = 874, dark = false,
}) => (
  <div style={{
    width, height, borderRadius: 48, overflow: 'hidden',
    position: 'relative', background: dark ? '#000' : '#F2F2F7',
    boxShadow: '0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)',
    fontFamily: '-apple-system, system-ui, sans-serif',
    WebkitFontSmoothing: 'antialiased',
  }}>
    {/* dynamic island */}
    <div style={{
      position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
      width: 126, height: 37, borderRadius: 24, background: '#000', zIndex: 50,
    }} />
    {/* status bar (absolute) */}
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
      <IOSStatusBar dark={dark} />
    </div>
    {/* content */}
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
    </div>
    {/* home indicator */}
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 60,
      height: 34, display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
      paddingBottom: 8, pointerEvents: 'none',
    }}>
      <div style={{
        width: 139, height: 5, borderRadius: 100,
        background: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.25)',
      }} />
    </div>
  </div>
);

// ── Android device frame (from www/frames/android-frame.jsx) ──
const MD_C = {
  surface: '#f4fbf8',
  onSurface: '#171d1b',
  frameBorder: 'rgba(116,119,117,0.5)',
};

function AndroidStatusBar({ dark = false }: { dark?: boolean }) {
  const c = dark ? '#fff' : MD_C.onSurface;
  return (
    <div style={{
      height: 40, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 16px',
      position: 'relative',
      fontFamily: 'Roboto, system-ui, sans-serif',
    }}>
      <div style={{ width: 128, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 400, letterSpacing: 0.25, lineHeight: '20px', color: c }}>9:30</span>
      </div>
      <div style={{
        position: 'absolute', left: '50%', top: 8, transform: 'translateX(-50%)',
        width: 24, height: 24, borderRadius: 100, background: '#2e2e2e',
      }} />
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Fragment>
          <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: -2 }}>
            <path d="M8 13.3L.67 5.97a10.37 10.37 0 0114.66 0L8 13.3z" fill={c}/>
          </svg>
          <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: -2 }}>
            <path d="M14.67 14.67V1.33L1.33 14.67h13.34z" fill={c}/>
          </svg>
        </Fragment>
        <svg width="16" height="16" viewBox="0 0 16 16">
          <rect x="3.75" y="2" width="8.5" height="13" rx="1.5" fill={c}/>
          <rect x="5.5" y="0.9" width="5" height="2" rx="0.5" fill={c}/>
        </svg>
      </div>
    </div>
  );
}

function AndroidNavBar({ dark = false }: { dark?: boolean }) {
  return (
    <div style={{
      height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 108, height: 4, borderRadius: 2,
        background: dark ? '#fff' : MD_C.onSurface, opacity: 0.4,
      }} />
    </div>
  );
}

export type AndroidDeviceProps = {
  children?: ReactNode;
  width?: number;
  height?: number;
  dark?: boolean;
  title?: string;
};
export const AndroidDevice: FC<AndroidDeviceProps> = ({
  children, width = 412, height = 892, dark = false,
}) => (
  <div style={{
    width, height, borderRadius: 18, overflow: 'hidden',
    background: dark ? '#1d1b20' : MD_C.surface,
    border: `8px solid ${MD_C.frameBorder}`,
    boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
    display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
  }}>
    <AndroidStatusBar dark={dark} />
    <div style={{ flex: 1, overflow: 'auto' }}>
      {children}
    </div>
    <AndroidNavBar dark={dark} />
  </div>
);
