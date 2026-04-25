/* Nik — shared UI primitives */

// ── Gradient defs (shared) ───────────────────────────────
const GradientDefs = () => (
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
const Ring = ({ size = 60, pct = 0.5, sw = 4, label, gradId = 'ringGrad', children }) => {
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
const XPBar = ({ cur, max, level, compact = false }) => {
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
const VoiceOrb = ({ size = 80, listening = false, onClick }) => (
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
const Waveform = ({ active = true, bars = 5, color = 'oklch(0.9 0.1 var(--hue))', height = 20 }) => (
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
const Avatar = ({ name = 'A', size = 36, hue = 220, ring = false, status }) => {
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
const Chip = ({ children, tone = 'default', size = 'md', icon }) => {
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
const Placeholder = ({ w = '100%', h = 120, label, radius = 12 }) => (
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
const HUDCorner = ({ size = 14, position = 'tl', color = 'oklch(0.78 0.16 var(--hue))' }) => {
  const pos = {
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

Object.assign(window, { GradientDefs, Ring, XPBar, VoiceOrb, Waveform, Avatar, Chip, Placeholder, HUDCorner });
