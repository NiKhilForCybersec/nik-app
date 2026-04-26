/* Nik — Profile + Settings */
import React from 'react';
import type { ScreenProps } from '../App';
import { THEMES } from '../theme/themes';
import { I } from '../components/icons';
import { Avatar, Chip, HUDCorner, XPBar } from '../components/primitives';
import { useOp } from '../lib/useOp';
import { profile as profileOps } from '../contracts/profile';
import { signOut } from '../lib/auth';

export const PROFILE_PRESETS: Array<Record<string, any>> = [
  { id: 'obsidian', name: 'Obsidian Youth', subtitle: 'Solo Leveling · HUD · electric', hue: 220, mode: 'dark', intensity: 'full', tag: 'Default' },
  { id: 'executive', name: 'Executive', subtitle: 'Minimal slate · refined · adult', hue: 240, mode: 'dark', intensity: 'light', tag: 'Adult' },
  { id: 'paper', name: 'Paper', subtitle: 'Light · warm neutral · calm', hue: 35, mode: 'light', intensity: 'light', tag: 'Adult' },
  { id: 'mono', name: 'Monochrome', subtitle: 'Zero color · focus · brutalist', hue: 260, mode: 'dark', intensity: 'light', tag: 'Adult' },
  { id: 'sage', name: 'Sage Light', subtitle: 'Organic · biolum · soft', hue: 150, mode: 'light', intensity: 'medium', tag: 'Wellness' },
  { id: 'crimson', name: 'Crimson HUD', subtitle: 'Cyberpunk red · sharp', hue: 25, mode: 'dark', intensity: 'full', tag: 'Youth' },
  { id: 'aurora', name: 'Aurora Glass', subtitle: 'Apple Vision · frosted', hue: 280, mode: 'dark', intensity: 'medium', tag: 'Balanced' },
  { id: 'solar', name: 'Solar', subtitle: 'Warm gold · daylight', hue: 70, mode: 'light', intensity: 'medium', tag: 'Wellness' },
];

export default function ProfileScreen({ onNav: _onNav, state, setState }: ScreenProps) {
  const { data: u } = useOp(profileOps.get, {});
  const [tab, setTab] = React.useState('themes'); // profile | themes | connect | notifs | about
  const [appliedFlash, setAppliedFlash] = React.useState<string | null>(null);

  // Local state shape may include extra keys like hue/mode used by the prototype.
  const s: Record<string, any> = state || {};

  const pickUniverse = (t: any) => {
    setState?.((x) => ({ ...x, theme: t.id, hue: t.hue, mode: t.mode } as any));
    setAppliedFlash(t.id);
    setTimeout(() => setAppliedFlash(null), 1400);
  };

  return (
    <div style={{ padding: '8px 16px 80px', position: 'relative' }}>
      {appliedFlash && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 50, padding: '10px 16px', borderRadius: 99, background: 'oklch(0.78 0.16 var(--hue))', color: 'oklch(0.1 0.02 260)', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: 1, boxShadow: '0 8px 24px oklch(0.78 0.16 var(--hue) / 0.5)', animation: 'fade-up 0.3s ease-out' }}>
          ✓ {THEMES?.[appliedFlash]?.name?.toUpperCase()} APPLIED
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>ACCOUNT</div>
        <div className="display" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>Profile</div>
      </div>

      {/* Hero profile card */}
      <div className="glass scanlines fade-up" style={{ padding: 18, marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
        <HUDCorner position="tl"/><HUDCorner position="tr"/><HUDCorner position="bl"/><HUDCorner position="br"/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar name={u?.name ?? '—'} size={68} hue={s.hue} ring/>
          <div style={{ flex: 1 }}>
            <div className="display" style={{ fontSize: 20, fontWeight: 600 }}>{u?.name ?? '—'}</div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>{(u?.title ?? '').toUpperCase()} · LVL {u?.level ?? 1}</div>
            <div style={{ marginTop: 8 }}>
              <XPBar cur={u?.xp ?? 0} max={u?.xp_max ?? 1000} level={u?.level ?? 1} compact/>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--hairline)' }}>
          {[['Age', u?.age ? String(u.age) : '—'], ['Joined', u?.joined_at ? joinedAgo(u.joined_at) : '—'], ['Streak', String(u?.streak ?? 0)], ['Lvl', String(u?.level ?? 1)]].map(([k, v]) => (
            <div key={k} style={{ flex: 1, textAlign: 'center' }}>
              <div className="display" style={{ fontSize: 16, fontWeight: 600 }}>{v}</div>
              <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>{k.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto' }}>
        {[['profile', 'Profile'], ['themes', 'Themes'], ['connect', 'Integrations'], ['notifs', 'Notifications'], ['about', 'About']].map(([id, l]) => (
          <div key={id} onClick={() => setTab(id)} className="tap" style={{
            padding: '7px 12px', borderRadius: 99, fontSize: 12, whiteSpace: 'nowrap',
            background: tab === id ? 'oklch(0.78 0.16 var(--hue) / 0.2)' : 'oklch(1 0 0 / 0.04)',
            border: '1px solid ' + (tab === id ? 'oklch(0.78 0.16 var(--hue) / 0.5)' : 'var(--hairline)'),
            color: tab === id ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)',
          }}>{l}</div>
        ))}
      </div>

      {tab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { k: 'Name',            v: u?.name ?? '—', icon: 'user' },
            { k: 'Age',             v: u?.age ? String(u.age) : '—', icon: 'calendar' },
            { k: 'Height · Weight', v: u?.height_cm && u?.weight_kg ? `${u.height_cm}cm · ${u.weight_kg}kg` : '—', icon: 'trend' },
            { k: 'Goal',            v: u?.goal ?? '—', icon: 'target' },
            { k: 'Nik persona',     v: u?.persona ?? '—', icon: 'sparkle' },
            { k: 'Voice',           v: u?.voice ?? '—', icon: 'mic' },
          ].map(r => {
            const Ic = (I as any)[r.icon];
            return (
              <div key={r.k} className="glass tap" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'oklch(0.78 0.16 var(--hue) / 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ic size={15} stroke="oklch(0.9 0.14 var(--hue))"/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>{r.k.toUpperCase()}</div>
                  <div style={{ fontSize: 13, color: 'var(--fg)' }}>{r.v}</div>
                </div>
                <I.chevR size={14} stroke="var(--fg-3)"/>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'themes' && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 10 }}>UNIVERSES · {Object.keys(THEMES || {}).length} CURATED</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {Object.values(THEMES || {}).map((t: any) => {
              const active = state?.theme === t.id;
              const isLight = t.mode === 'light';
              const bg = t.bg || (isLight
                ? `linear-gradient(135deg, ${t.palette.bg}, ${t.palette.bg2 || t.palette.bg})`
                : `linear-gradient(135deg, ${t.palette.bg}, ${t.palette.bg2 || t.palette.bg})`);
              const fg = t.palette.fg;
              const accent = t.palette.accent;
              return (
                <div key={t.id} onClick={() => pickUniverse(t)} className="tap" style={{
                  borderRadius: 16, overflow: 'hidden',
                  border: active ? `2px solid ${accent}` : '1px solid var(--hairline-strong)',
                  boxShadow: active ? `0 0 0 3px ${accent.replace(')', ' / 0.25)')}, 0 8px 24px ${accent.replace(')', ' / 0.2)')}` : '0 4px 14px oklch(0 0 0 / 0.18)',
                  position: 'relative',
                  background: 'var(--surface)',
                }}>
                  {/* Preview */}
                  <div style={{
                    aspectRatio: '3/4', background: t.palette.bg, padding: 10, position: 'relative', overflow: 'hidden',
                    fontFamily: t.fonts.body,
                  }}>
                    {/* aurora */}
                    <div style={{ position: 'absolute', inset: 0, background: bg, opacity: 0.9 }}/>
                    <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: accent, filter: 'blur(28px)', opacity: 0.55 }}/>
                    {/* motif overlay */}
                    {t.motif === 'scanlines' && (
                      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, oklch(1 0 0 / 0.03) 2px, oklch(1 0 0 / 0.03) 3px)', pointerEvents: 'none' }}/>
                    )}
                    {t.motif === 'paper' && (
                      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 20%, oklch(0 0 0 / 0.04) 0, transparent 40%)', pointerEvents: 'none' }}/>
                    )}
                    <div style={{ position: 'relative' }}>
                      <div style={{ fontFamily: t.fonts.mono, fontSize: 7, color: t.palette.fg3, letterSpacing: 1, textTransform: 'uppercase' }}>
                        {t.vocab?.hudLabel || 'TODAY'} {t.vocab?.levelWord ? '· ' + t.vocab.levelWord + ' 27' : ''}
                      </div>
                      <div style={{
                        fontFamily: t.fonts.display,
                        fontSize: 12,
                        fontWeight: t.fonts.displayWeight || 500,
                        color: fg,
                        marginTop: 4,
                        lineHeight: 1.2,
                        letterSpacing: t.fonts.displayTracking || 0,
                        textTransform: t.fonts.displayCase === 'uppercase' ? 'uppercase' : 'none',
                      }}>
                        {t.vocab?.greet || 'Hello,'}<br/>Arjun
                      </div>
                      {/* mock progress */}
                      <div style={{ marginTop: 10, height: 3, background: t.palette.hairline, borderRadius: 99 }}>
                        <div style={{ width: '70%', height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${accent}, ${t.palette.accent2 || accent})` }}/>
                      </div>
                      {/* mock chip */}
                      <div style={{ marginTop: 8, display: 'inline-flex', padding: '3px 6px', borderRadius: 6, border: `1px solid ${accent.replace(')', ' / 0.4)')}`, background: accent.replace(')', ' / 0.15)'), fontSize: 7, color: fg, fontFamily: t.fonts.mono, letterSpacing: 0.5 }}>
                        {(t.vocab?.quest || 'TASK').toUpperCase()}
                      </div>
                    </div>
                    {/* mock ring */}
                    <div style={{ position: 'absolute', bottom: 10, right: 10, width: 26, height: 26, borderRadius: '50%', border: `2px solid ${accent}`, borderRightColor: 'transparent', borderBottomColor: 'transparent' }}/>
                    {active && (
                      <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <I.check size={12} stroke={t.palette.bg} sw={2.5}/>
                      </div>
                    )}
                  </div>
                  {/* Meta */}
                  <div style={{ padding: 10, background: 'oklch(1 0 0 / 0.03)', borderTop: '1px solid var(--hairline)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginBottom: 2 }}>
                      <div className="display" style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>{t.name}</div>
                      <div style={{ fontSize: 8, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5, padding: '1px 5px', border: '1px solid var(--hairline)', borderRadius: 4, whiteSpace: 'nowrap' }}>{(t.tag || '').toUpperCase()}</div>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--fg-3)', lineHeight: 1.3 }}>{t.subtitle}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Intensity */}
          <div className="glass" style={{ padding: 14, marginTop: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 10 }}>INTENSITY</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['soft', 'medium', 'full'] as const).map(i => (
                <div key={i} onClick={() => setState?.(x => ({ ...x, intensity: i }))} className="tap" style={{
                  flex: 1, padding: '8px 10px', borderRadius: 10, textAlign: 'center', fontSize: 12,
                  background: state?.intensity === i ? 'oklch(0.78 0.16 var(--hue) / 0.18)' : 'oklch(1 0 0 / 0.04)',
                  border: '1px solid ' + (state?.intensity === i ? 'oklch(0.78 0.16 var(--hue) / 0.4)' : 'var(--hairline)'),
                  color: state?.intensity === i ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)',
                  textTransform: 'capitalize',
                }}>{i}</div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 8, lineHeight: 1.5 }}>
              <b style={{ color: 'var(--fg-2)' }}>Soft</b> hides HUD chrome, <b style={{ color: 'var(--fg-2)' }}>medium</b> keeps it subtle, <b style={{ color: 'var(--fg-2)' }}>full</b> goes all-in on the universe.
            </div>
          </div>

          {/* Live state readout */}
          <div className="glass" style={{ padding: 12, marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)', letterSpacing: 0.5, lineHeight: 1.6 }}>
            ACTIVE · <span style={{ color: 'oklch(0.9 0.14 var(--hue))' }}>{state?.theme}</span><br/>
            HUE {s.hue}° · {(s.mode || 'dark').toUpperCase()} · {(state?.intensity || 'full').toUpperCase()}
          </div>
        </div>
      )}

      {tab === 'connect' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { k: 'Apple Health', v: 'Syncing · 12 metrics', connected: true, hue: 0, sub: 'Steps, HR, sleep, workouts, weight' },
            { k: 'Google Fit', v: 'Not connected', connected: false, hue: 130, sub: 'Alternative to Apple Health' },
            { k: 'Strava', v: 'Syncing · 3 activities', connected: true, hue: 25, sub: 'Runs & cycling' },
            { k: 'Calendar', v: 'iCloud · 2 calendars', connected: true, hue: 220, sub: 'Work + personal' },
            { k: 'ChatGPT', v: 'Connected · GPT-4o', connected: true, hue: 150, sub: 'Form guidance · workout gen' },
            { k: 'Spotify', v: 'Focus playlist ready', connected: true, hue: 130, sub: 'Plays during deep work quests' },
            { k: 'WhatsApp Family', v: 'Pending invite', connected: false, hue: 150, sub: '2 of 5 members' },
            { k: 'Oura Ring', v: 'Not connected', connected: false, hue: 280, sub: 'Deep recovery data' },
          ].map(r => (
            <div key={r.k} className="glass tap" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `oklch(0.7 0.18 ${r.hue} / 0.15)`, border: `1px solid oklch(0.7 0.18 ${r.hue} / 0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 600, color: `oklch(0.9 0.14 ${r.hue})`, fontSize: 13 }}>
                {r.k.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{r.k}</div>
                  {r.connected && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'oklch(0.78 0.15 150)', boxShadow: '0 0 4px oklch(0.78 0.15 150)' }}/>}
                </div>
                <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{r.sub}</div>
              </div>
              {r.connected
                ? <Chip tone="ok" size="sm">Linked</Chip>
                : <Chip tone="default" size="sm">Connect</Chip>}
            </div>
          ))}
        </div>
      )}

      {tab === 'notifs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {([
            ['GPS contextual alerts', true, 'Gym detected, near store, etc.'],
            ['Family task nearby', true, 'When you can help a shared task'],
            ['Quest reminders', true, '15 min before deadlines'],
            ['Weekly insights', true, 'Sunday 9am'],
            ['Level-up effects', true, 'Full-screen XP flash'],
            ['Do not disturb · deep focus', false, 'Silences all during focus quests'],
            ['Quiet hours', false, '10pm – 7am'],
          ] as Array<[string, boolean, string]>).map(([k, on, sub]) => (
            <ToggleRow key={k} label={k} sub={sub} defaultOn={on}/>
          ))}
        </div>
      )}

      {tab === 'about' && (
        <div className="glass" style={{ padding: 16 }}>
          <div className="display" style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Nik 1.0 · Canary</div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.5 }}>An AI that grows with your family. End-to-end encrypted memories. No ads, ever.</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <Chip tone="default" size="md">Privacy</Chip>
            <Chip tone="default" size="md">Terms</Chip>
            <Chip tone="default" size="md">Reset Nik</Chip>
            {import.meta.env.DEV && (
              <div onClick={() => { setState?.((x) => ({ ...x, screen: 'dev' as any })); }} className="tap" style={{ display: 'inline-flex' }}>
                <Chip tone="accent" size="md">Dev console</Chip>
              </div>
            )}
            <div onClick={() => { void signOut(); }} className="tap" style={{ display: 'inline-flex' }}>
              <Chip tone="danger" size="md">Sign out</Chip>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function joinedAgo(iso: string): string {
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}y`;
}

const ToggleRow: React.FC<{ label: string; sub: string; defaultOn: boolean }> = ({ label, sub, defaultOn }) => {
  const [on, setOn] = React.useState(defaultOn);
  return (
    <div className="glass" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--fg)' }}>{label}</div>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{sub}</div>
      </div>
      <div onClick={() => setOn(!on)} className="tap" style={{
        width: 42, height: 24, borderRadius: 99, position: 'relative',
        background: on ? 'oklch(0.78 0.16 var(--hue))' : 'oklch(1 0 0 / 0.1)',
        transition: 'background 0.2s',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: on ? 20 : 2,
          width: 20, height: 20, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}/>
      </div>
    </div>
  );
};
