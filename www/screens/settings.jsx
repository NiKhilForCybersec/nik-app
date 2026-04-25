/* Aether — Settings deep pages + empty/loading/offline primitives */

// ── EMPTY STATE ──────────────────────────────────
const EmptyState = ({ icon = 'sparkle', title, body, cta, onCta }) => {
  const Icon = (window.I && window.I[icon]) || (() => null);
  return (
    <div style={{ padding: '32px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'oklch(0.78 0.16 var(--hue) / 0.1)', border: '1px solid oklch(0.78 0.16 var(--hue) / 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Icon size={26} stroke="oklch(0.85 0.14 var(--hue))"/>
      </div>
      <div className="display" style={{ fontSize: 17, fontWeight: 500, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.55, maxWidth: 240, marginBottom: cta ? 16 : 0 }}>{body}</div>
      {cta && (
        <div onClick={onCta} className="tap" style={{ padding: '10px 18px', borderRadius: 12, background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.2 var(--hue)))', color: '#06060a', fontSize: 13, fontWeight: 600 }}>{cta}</div>
      )}
    </div>
  );
};

// ── SKELETON ─────────────────────────────────────
const Skeleton = ({ h = 60, w = '100%', radius = 12, style }) => (
  <div style={{ height: h, width: w, borderRadius: radius, background: 'linear-gradient(90deg, var(--input-bg) 0%, oklch(0.78 0.04 var(--hue) / 0.1) 50%, var(--input-bg) 100%)', backgroundSize: '200% 100%', animation: 'skel 1.4s ease-in-out infinite', ...style }}/>
);

const SkeletonScreen = () => (
  <div style={{ padding: '8px 16px 80px' }}>
    <div style={{ marginBottom: 16 }}>
      <Skeleton h={12} w="40%" style={{ marginBottom: 8 }}/>
      <Skeleton h={28} w="60%"/>
    </div>
    <Skeleton h={120} style={{ marginBottom: 12 }}/>
    <Skeleton h={70} style={{ marginBottom: 8 }}/>
    <Skeleton h={70} style={{ marginBottom: 8 }}/>
    <Skeleton h={70}/>
    <style>{`@keyframes skel { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
  </div>
);

// ── OFFLINE BANNER ───────────────────────────────
const OfflineBanner = ({ visible, kind = 'offline' }) => {
  if (!visible) return null;
  const meta = kind === 'offline'
    ? { icon: 'wifiOff', t: 'You\'re offline', sub: 'Aether is using your local cache.', tone: 'warn' }
    : kind === 'syncing'
    ? { icon: 'sync', t: 'Syncing…', sub: 'Catching up with your circle.', tone: 'accent' }
    : { icon: 'alert', t: 'Couldn\'t reach the brain', sub: 'I\'ll keep trying. Tap to retry now.', tone: 'warn' };
  const colors = meta.tone === 'warn' ? 'var(--warn)' : 'oklch(0.85 0.14 var(--hue))';
  return (
    <div style={{ position: 'absolute', top: 8, left: 12, right: 12, zIndex: 30, padding: '10px 12px', borderRadius: 12, background: 'oklch(0.18 0.02 var(--hue) / 0.92)', backdropFilter: 'blur(20px)', border: `1px solid ${meta.tone === 'warn' ? 'var(--warn)' : 'oklch(0.78 0.16 var(--hue) / 0.4)'}`, display: 'flex', alignItems: 'center', gap: 10, animation: 'bannerIn .3s ease' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors, animation: 'pulse 1.6s ease-in-out infinite' }}/>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: 'var(--fg)', fontWeight: 500 }}>{meta.t}</div>
        <div style={{ fontSize: 10, color: 'var(--fg-2)', marginTop: 1 }}>{meta.sub}</div>
      </div>
      <style>{`@keyframes bannerIn { from { transform: translateY(-8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } } @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }`}</style>
    </div>
  );
};

// ── SETTINGS DEEP PAGES ──────────────────────────
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
    head: 'Aether',
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
      { k: 'theme', t: 'Theme universe', sub: '12 universes · current: Aether Noir' },
      { k: 'font', t: 'Typography', sub: 'Editorial serif · larger' },
      { k: 'density', t: 'Density', sub: 'Comfortable' },
      { k: 'haptics', t: 'Haptics & sound', sub: 'Subtle · system' },
    ],
  },
];

const SettingsScreen = ({ onNav }) => {
  const [open, setOpen] = React.useState(null); // section item key

  return (
    <div style={{ padding: '8px 16px 100px' }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>SETTINGS</div>
        <div className="display" style={{ fontSize: 28, fontWeight: 'var(--display-weight, 500)', lineHeight: 1.1, marginTop: 4, textTransform: 'var(--display-case)', letterSpacing: 'var(--display-tracking)' }}>Settings</div>
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

      <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>AETHER · 1.4.2 · BUILD 8801</div>
    </div>
  );
};

Object.assign(window, { EmptyState, Skeleton, SkeletonScreen, OfflineBanner, SettingsScreen });
