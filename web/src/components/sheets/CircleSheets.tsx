/* Nik — Family Circle: detail sheets
   Ported from www/screens/circle-sheets.jsx */

import React, { useState } from 'react';
import { I } from '../icons';
import { Avatar, Chip, HUDCorner, Ring } from '../primitives';
import { PRIVACY_CATEGORIES, TRUST_TIERS, canCircleView } from '../../contracts/circle';

// ── Sheet wrapper ────────────────────────────────────────
type CircleSheetProps = {
  title: string;
  sub?: string;
  onClose: () => void;
  children?: React.ReactNode;
  accent?: string;
};

export const CircleSheet: React.FC<CircleSheetProps> = ({ title, sub, onClose, children }) => {
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'oklch(0 0 0 / 0.5)', backdropFilter: 'blur(8px)', zIndex: 100,
      display: 'flex', alignItems: 'flex-end',
      animation: 'fade-in 0.2s ease-out',
    }}>
      <div onClick={e => e.stopPropagation()} className="sheet" style={{
        width: '100%', maxHeight: '92%', overflow: 'auto',
        background: 'var(--sheet-bg, var(--bg))',
        color: 'var(--sheet-fg, var(--fg))',
        borderRadius: '20px 20px 0 0',
        border: '1px solid var(--hairline)',
        borderBottom: 'none',
        animation: 'slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        position: 'relative',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--hairline-strong)', margin: '8px auto 12px' }}/>
        <div style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--hairline)' }}>
          <div>
            <div className="display" style={{ fontSize: 18, fontWeight: 600 }}>{title}</div>
            {sub && <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5, marginTop: 2 }}>{sub}</div>}
          </div>
          <div onClick={onClose} className="tap" style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', border: '1px solid var(--hairline-strong)' }}>
            <span style={{ fontSize: 14 }}>✕</span>
          </div>
        </div>
        <div style={{ padding: 16 }}>{children}</div>
      </div>
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
};

// ── Helper: locked-section placeholder ──────────────────
const LockedSection: React.FC<{ label: string; owner: Record<string, any>; viewer?: any; onRequest: () => void }> = ({ label, owner, onRequest }) => (
  <div style={{ padding: 14, marginBottom: 10, background: 'oklch(1 0 0 / 0.02)', border: '1px dashed var(--hairline-strong)', borderRadius: 12, textAlign: 'center' }}>
    <I.lock size={16} stroke="var(--fg-3)"/>
    <div style={{ fontSize: 11, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5, marginTop: 4 }}>{label.toUpperCase()} · PRIVATE</div>
    <div style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 4 }}>{owner.name} hasn't shared this with you</div>
    <div onClick={onRequest} className="tap" style={{ marginTop: 8, display: 'inline-block', fontSize: 10, color: 'oklch(0.85 0.14 var(--hue))', fontFamily: 'var(--font-mono)', letterSpacing: 0.8, padding: '4px 10px', border: '1px solid oklch(0.78 0.16 var(--hue) / 0.4)', borderRadius: 99 }}>REQUEST ACCESS</div>
  </div>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 8, marginTop: 4 }}>{String(children).toUpperCase()}</div>
);

const StatCard: React.FC<{ label: string; value: React.ReactNode; sub: React.ReactNode; alert?: any }> = ({ label, value, sub, alert }) => (
  <div className="glass" style={{ padding: 12, position: 'relative', borderLeft: alert ? '3px solid oklch(0.78 0.18 60)' : undefined }}>
    <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 4 }}>{label.toUpperCase()}</div>
    <div className="display" style={{ fontSize: 20, fontWeight: 600, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 10, color: alert ? 'oklch(0.78 0.18 60)' : 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>{sub}</div>
  </div>
);

// ── Member detail sheet ──────────────────────────────────
type MemberDetailSheetProps = {
  member: Record<string, any>;
  viewerId: string;
  sharing: Record<string, any>;
  onClose: () => void;
  onNav?: (s: any) => void;
};

export const MemberDetailSheet: React.FC<MemberDetailSheetProps> = ({ member: m, viewerId, sharing, onClose, onNav }) => {
  const isMe = m.id === viewerId;
  const can = (cat: string) => canCircleView(viewerId, m.id, cat, sharing);
  const tier = sharing?.[m.id]?.[viewerId] || 'none';
  const [requested, setRequested] = useState<Record<string, boolean>>({});

  const moodColor: Record<string, string> = {
    happy: 'oklch(0.78 0.16 60)',
    good: 'oklch(0.78 0.14 150)',
    focused: 'oklch(0.78 0.14 220)',
    ok: 'oklch(0.7 0.06 240)',
    low: 'oklch(0.65 0.1 280)',
    tired: 'oklch(0.6 0.08 30)',
    lonely: 'oklch(0.6 0.1 280)',
  };

  return (
    <CircleSheet
      title={m.name}
      sub={`${m.role.toUpperCase()} · ${isMe ? 'YOU' : (typeof tier === 'string' ? tier.toUpperCase() : 'CUSTOM') + ' ACCESS'}`}
      onClose={onClose}
    >
      {/* Hero */}
      <div className="glass" style={{ padding: 16, marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
        <HUDCorner position="tl"/><HUDCorner position="tr"/><HUDCorner position="bl"/><HUDCorner position="br"/>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 100% 0%, oklch(0.78 0.16 ${m.hue} / 0.18), transparent 60%)`, pointerEvents: 'none' }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <Avatar name={m.name} size={64} hue={m.hue} status={m.status} ring/>
          <div style={{ flex: 1 }}>
            <div className="display" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.1 }}>{m.name}</div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5, marginTop: 4 }}>
              AGE {m.age} · {m.bloodType} · 🎂 {m.birthday.toUpperCase()}
            </div>
            {can('location') ? (
              <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <I.location size={11}/> {m.location}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <I.lock size={10}/> location private
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 12, position: 'relative' }}>
          {!isMe && (
            <>
              <div className="tap" style={{ flex: 1, padding: '8px 10px', borderRadius: 10, background: 'oklch(0.78 0.16 var(--hue))', color: 'oklch(0.1 0.02 260)', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: 0.5, textAlign: 'center' }}>MESSAGE</div>
              <div className="tap" style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--hairline-strong)', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: 0.5, textAlign: 'center' }}>VOICE NOTE</div>
              <div className="tap" style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid var(--hairline-strong)', fontSize: 11, display: 'grid', placeItems: 'center' }}>＋</div>
            </>
          )}
          {isMe && (
            <div onClick={() => onNav?.('profile')} className="tap" style={{ flex: 1, padding: '8px 10px', borderRadius: 10, background: 'oklch(0.78 0.16 var(--hue))', color: 'oklch(0.1 0.02 260)', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: 0.5, textAlign: 'center' }}>EDIT YOUR PROFILE</div>
          )}
        </div>
      </div>

      {/* Health snapshot */}
      <SectionLabel>Health snapshot</SectionLabel>
      {can('health') ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          <StatCard label="Sleep" value={`${m.health.sleep.last}h`} sub={m.health.sleep.alert || `avg ${m.health.sleep.avgWk}h/wk`} alert={m.health.sleep.alert}/>
          <StatCard label="Steps" value={(m.health.steps || 0).toLocaleString()} sub="today"/>
          {m.health.heart?.resting && <StatCard label="Resting HR" value={`${m.health.heart.resting}`} sub="bpm"/>}
          {m.health.bp && <StatCard label="BP" value={`${m.health.bp.sys}/${m.health.bp.dia}`} sub={m.health.bp.alert || 'today'} alert={m.health.bp.alert}/>}
          {m.health.glucose && <StatCard label="Glucose" value={`${m.health.glucose.last}`} sub={m.health.glucose.fasting}/>}
          <StatCard label="Nik Score" value={m.health.score} sub={`${m.health.streaks}d streak`}/>
        </div>
      ) : (
        <LockedSection label="Health snapshot" owner={m} onRequest={() => setRequested(r => ({ ...r, health: true }))}/>
      )}

      {/* Mood */}
      <SectionLabel>Mood · 7-day trend</SectionLabel>
      {can('mood') ? (
        <div className="glass" style={{ padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: 99, background: moodColor[m.health.mood.today] || 'var(--fg-3)' }}/>
            <div style={{ fontSize: 13, color: 'var(--fg)' }}><b style={{ textTransform: 'capitalize' }}>{m.health.mood.today}</b> today</div>
          </div>
          <div style={{ display: 'flex', gap: 4, height: 32, alignItems: 'flex-end' }}>
            {m.health.mood.trend7.map((mood: string, i: number) => {
              const h = ['low','tired','lonely'].includes(mood) ? 12 : ['ok'].includes(mood) ? 20 : 30;
              return (
                <div key={i} style={{ flex: 1, height: h, borderRadius: 4, background: moodColor[mood] || 'var(--fg-3)', opacity: 0.85 }}/>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 6, letterSpacing: 0.5 }}>
            {['M','T','W','T','F','S','S'].map((d, i) => <span key={i}>{d}</span>)}
          </div>
          {m.health.mood.alert && (
            <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'oklch(0.78 0.18 60 / 0.08)', borderLeft: '3px solid oklch(0.78 0.18 60)', fontSize: 11, color: 'var(--fg-2)' }}>
              ⚠ {m.health.mood.alert}
            </div>
          )}
        </div>
      ) : (
        <LockedSection label="Mood" owner={m} onRequest={() => setRequested(r => ({ ...r, mood: true }))}/>
      )}

      {/* Cycle (if applicable) */}
      {m.health.cycle && (
        <>
          <SectionLabel>Cycle</SectionLabel>
          {can('cycle') ? (
            <div className="glass" style={{ padding: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Ring size={56} pct={m.health.cycle.day / 28} sw={5} gradId={`cycle-${m.id}`}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{m.health.cycle.day}</div>
              </Ring>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--fg)' }}>{m.health.cycle.phase}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>NEXT · {m.health.cycle.next.toUpperCase()}</div>
              </div>
            </div>
          ) : (
            <LockedSection label="Cycle" owner={m} onRequest={() => setRequested(r => ({ ...r, cycle: true }))}/>
          )}
        </>
      )}

      {/* Meds */}
      <SectionLabel>Medications · {m.meds.length}</SectionLabel>
      {can('meds') ? (
        m.meds.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {m.meds.map((med: any, i: number) => (
              <div key={i} className="glass" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'oklch(0.78 0.16 var(--hue) / 0.15)', display: 'grid', placeItems: 'center' }}>
                  <I.pill size={16} stroke="oklch(0.85 0.14 var(--hue))"/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--fg)' }}>{med.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{med.dose.toUpperCase()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: med.adherence < 0.7 ? 'oklch(0.7 0.18 30)' : 'oklch(0.78 0.14 150)', fontFamily: 'var(--font-mono)' }}>{Math.round(med.adherence * 100)}%</div>
                  {med.alert && <div style={{ fontSize: 9, color: 'oklch(0.7 0.2 30)', fontFamily: 'var(--font-mono)' }}>{med.alert.toUpperCase()}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--fg-3)', padding: '8px 12px', marginBottom: 14 }}>No medications</div>
        )
      ) : (
        <LockedSection label="Medications" owner={m} onRequest={() => setRequested(r => ({ ...r, meds: true }))}/>
      )}

      {/* Schedule */}
      <SectionLabel>Today's schedule</SectionLabel>
      {can('schedule') ? (
        <div className="glass" style={{ padding: 12, marginBottom: 14 }}>
          {m.schedule.map((s: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < m.schedule.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-2)', fontWeight: 600, width: 50 }}>{s.time}</div>
              <div style={{ flex: 1, fontSize: 12, color: 'var(--fg)' }}>{s.text}</div>
              <Chip tone="default" size="sm">{s.kind.toUpperCase()}</Chip>
            </div>
          ))}
        </div>
      ) : (
        <LockedSection label="Schedule" owner={m} onRequest={() => setRequested(r => ({ ...r, schedule: true }))}/>
      )}

      {/* Care */}
      <SectionLabel>Care notes</SectionLabel>
      {can('care') ? (
        <div className="glass" style={{ padding: 14, marginBottom: 14 }}>
          {m.care.allergies.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: 'oklch(0.7 0.2 30)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 4 }}>⚠ ALLERGIES</div>
              <div style={{ fontSize: 12, color: 'var(--fg)' }}>{m.care.allergies.join(' · ')}</div>
            </div>
          )}
          {m.care.conditions.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 4 }}>CONDITIONS</div>
              <div style={{ fontSize: 12, color: 'var(--fg)' }}>{m.care.conditions.join(' · ') || 'None'}</div>
            </div>
          )}
          {m.care.doctors?.length > 0 && (
            <div style={{ marginBottom: m.care.caregiver || m.care.emergency ? 10 : 0 }}>
              <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 4 }}>DOCTORS</div>
              {m.care.doctors.map((d: any, i: number) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--fg)', marginBottom: 2 }}>
                  {d.name} · <span style={{ color: 'var(--fg-3)' }}>{d.spec}{d.last ? ` · last ${d.last}` : ''}</span>
                </div>
              ))}
            </div>
          )}
          {m.care.caregiver && (
            <div style={{ marginBottom: m.care.emergency ? 10 : 0 }}>
              <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 4 }}>CAREGIVER</div>
              <div style={{ fontSize: 12, color: 'var(--fg)' }}>{m.care.caregiver}</div>
            </div>
          )}
          {m.care.emergency && (
            <div>
              <div style={{ fontSize: 9, color: 'oklch(0.7 0.2 30)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 4 }}>EMERGENCY</div>
              <div style={{ fontSize: 12, color: 'var(--fg)' }}>{m.care.emergency}</div>
            </div>
          )}
        </div>
      ) : (
        <LockedSection label="Care notes" owner={m} onRequest={() => setRequested(r => ({ ...r, care: true }))}/>
      )}

      {/* Diary preview */}
      <SectionLabel>Diary</SectionLabel>
      {can('diary') ? (
        <div className="glass" style={{ padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5, marginBottom: 4 }}>TODAY · MOOD</div>
          <div style={{ fontSize: 12, color: 'var(--fg)', marginBottom: 10 }}>{m.diary.moodToday}</div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5, marginBottom: 4 }}>LAST ENTRY</div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)', fontStyle: 'italic', lineHeight: 1.4 }}>{m.diary.lastEntry}</div>
        </div>
      ) : (
        <LockedSection label="Diary" owner={m} onRequest={() => setRequested(r => ({ ...r, diary: true }))}/>
      )}

      {/* Awareness footer — what THEY can see about you (when viewing yourself) */}
      {isMe && (
        <div style={{ padding: 14, borderRadius: 12, background: 'oklch(1 0 0 / 0.03)', border: '1px solid var(--hairline)', marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <I.viewers size={16} stroke="var(--fg-2)"/>
            <div style={{ fontSize: 11, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)', letterSpacing: 1, fontWeight: 600 }}>SHARED WITH</div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', lineHeight: 1.5 }}>
            Manage who can see your health, meds, mood and more in <b style={{ color: 'oklch(0.85 0.14 var(--hue))' }}>Privacy</b>.
          </div>
        </div>
      )}

      {/* Request confirmations */}
      {Object.keys(requested).length > 0 && (
        <div style={{ position: 'sticky', bottom: 0, marginTop: 16, padding: 12, background: 'oklch(0.78 0.14 150 / 0.15)', border: '1px solid oklch(0.78 0.14 150 / 0.4)', borderRadius: 12, fontSize: 12, color: 'var(--fg)' }}>
            ✓ Access requested for {Object.keys(requested).join(', ')}. Nik will ask {m.name} on your behalf.
        </div>
      )}
    </CircleSheet>
  );
};

// ── Privacy sheet — per-person matrix ────────────────────
type PrivacySheetProps = {
  me: string;
  members: Array<Record<string, any>>;
  sharing: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
  onClose: () => void;
};

export const PrivacySheet: React.FC<PrivacySheetProps> = ({ me, members, sharing, onChange, onClose }) => {
  const others = members.filter(m => m.id !== me);
  // Local mutable copy of sharing
  const [local, setLocal] = useState<Record<string, any>>(() => JSON.parse(JSON.stringify(sharing)));
  const [activeViewer, setActiveViewer] = useState<string>(others[0]?.id);

  // What I (me) share with each viewer
  const myShare = local[me] || {};
  const currentTier = myShare[activeViewer] || 'family';
  const isCustom = typeof currentTier === 'object';

  const setTier = (viewer: string, tier: any) => {
    setLocal(x => ({
      ...x,
      [me]: { ...(x[me] || {}), [viewer]: tier },
    }));
  };

  const toggleCat = (viewer: string, cat: string) => {
    setLocal(x => {
      const cur = x[me]?.[viewer] || 'family';
      const cats = typeof cur === 'object' ? [...cur.cats] : [...(TRUST_TIERS[cur]?.cats || [])];
      const next = cats.includes(cat) ? cats.filter((c: string) => c !== cat) : [...cats, cat];
      return {
        ...x,
        [me]: { ...(x[me] || {}), [viewer]: { custom: true, cats: next } },
      };
    });
  };

  const save = () => {
    onChange(local);
    onClose();
  };

  const viewerObj = members.find(m => m.id === activeViewer);
  const activeCats: string[] = isCustom ? currentTier.cats : (TRUST_TIERS[currentTier]?.cats || []);

  return (
    <CircleSheet title="Privacy" sub="Choose what each person sees about you" onClose={onClose}>
      {/* Top: viewer tabs */}
      <div style={{ display: 'flex', gap: 8, overflow: 'auto', marginBottom: 14, paddingBottom: 4 }}>
        {others.map(v => (
          <div key={v.id} onClick={() => setActiveViewer(v.id)} className="tap" style={{
            padding: '8px 12px', borderRadius: 12,
            border: activeViewer === v.id ? '1px solid oklch(0.78 0.16 var(--hue))' : '1px solid var(--hairline-strong)',
            background: activeViewer === v.id ? 'oklch(0.78 0.16 var(--hue) / 0.12)' : 'transparent',
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          }}>
            <Avatar name={v.name} size={28} hue={v.hue}/>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{v.name}</div>
              <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>{v.role.split('·')[0].trim().toUpperCase()}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tier preset chips */}
      <SectionLabel>Trust tier</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {Object.entries(TRUST_TIERS).map(([key, tier]: [string, any]) => (
          <div key={key} onClick={() => setTier(activeViewer, key)} className="tap" style={{
            padding: 12, borderRadius: 12,
            border: !isCustom && currentTier === key ? '2px solid oklch(0.78 0.16 var(--hue))' : '1px solid var(--hairline-strong)',
            background: !isCustom && currentTier === key ? 'oklch(0.78 0.16 var(--hue) / 0.08)' : 'transparent',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{tier.label}</div>
              {!isCustom && currentTier === key && <div style={{ width: 14, height: 14, borderRadius: 99, background: 'oklch(0.78 0.16 var(--hue))', display: 'grid', placeItems: 'center', fontSize: 9, color: '#000', fontWeight: 700 }}>✓</div>}
            </div>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 4, lineHeight: 1.3 }}>{tier.desc}</div>
            <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 0.3, marginTop: 6 }}>{tier.cats.length}/{PRIVACY_CATEGORIES.length} CATEGORIES</div>
          </div>
        ))}
      </div>

      {/* Per-category matrix */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <SectionLabel>What {viewerObj?.name} can see</SectionLabel>
        {isCustom && <Chip tone="accent" size="sm">CUSTOM</Chip>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
        {PRIVACY_CATEGORIES.map(cat => {
          const on = activeCats.includes(cat.id);
          return (
            <div key={cat.id} onClick={() => toggleCat(activeViewer, cat.id)} className="tap" style={{
              padding: 12, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
              border: '1px solid var(--hairline)',
              background: on ? 'oklch(0.78 0.16 var(--hue) / 0.05)' : 'transparent',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--fg)', fontWeight: on ? 600 : 400 }}>{cat.label}</div>
                <div style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 2 }}>{cat.sub}</div>
              </div>
              <div style={{
                width: 36, height: 22, borderRadius: 99,
                background: on ? 'oklch(0.78 0.16 var(--hue))' : 'var(--hairline-strong)',
                position: 'relative', transition: 'all 0.2s',
              }}>
                <div style={{
                  position: 'absolute', top: 2, left: on ? 16 : 2,
                  width: 18, height: 18, borderRadius: 99, background: '#fff', transition: 'all 0.2s',
                  boxShadow: '0 1px 4px oklch(0 0 0 / 0.3)',
                }}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save */}
      <div onClick={save} className="tap" style={{ padding: 14, borderRadius: 12, background: 'oklch(0.78 0.16 var(--hue))', color: 'oklch(0.1 0.02 260)', textAlign: 'center', fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
        SAVE PRIVACY SETTINGS
      </div>
      <div style={{ fontSize: 10, color: 'var(--fg-3)', textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
        {viewerObj?.name} will be notified of changes. They can request access to anything you keep private.
      </div>
    </CircleSheet>
  );
};

// ── View log sheet ────────────────────────────────────────
type ViewLogSheetProps = {
  me: string;
  members: Array<Record<string, any>>;
  log: Array<Record<string, any>>;
  onClose: () => void;
};

export const ViewLogSheet: React.FC<ViewLogSheetProps> = ({ me, members, log, onClose }) => {
  const [tab, setTab] = useState('viewed-me'); // viewed-me | i-viewed
  const events = tab === 'viewed-me'
    ? log.filter(e => e.owner === me)
    : log.filter(e => e.viewer === me);

  // Group by viewer (or owner)
  const groupKey = tab === 'viewed-me' ? 'viewer' : 'owner';
  const groups: Record<string, Array<Record<string, any>>> = {};
  events.forEach(e => {
    const k = e[groupKey];
    if (!groups[k]) groups[k] = [];
    groups[k].push(e);
  });

  return (
    <CircleSheet title="Awareness log" sub="Transparency: who saw what, when" onClose={onClose}>
      {/* tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, padding: 4, background: 'oklch(1 0 0 / 0.04)', borderRadius: 12 }}>
        {[
          { id: 'viewed-me', label: 'Viewed me', count: log.filter(e => e.owner === me).length },
          { id: 'i-viewed', label: 'I viewed', count: log.filter(e => e.viewer === me).length },
        ].map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} className="tap" style={{
            flex: 1, textAlign: 'center', padding: '8px 12px', borderRadius: 8,
            background: tab === t.id ? 'oklch(0.78 0.16 var(--hue) / 0.15)' : 'transparent',
            color: tab === t.id ? 'oklch(0.85 0.14 var(--hue))' : 'var(--fg-2)',
            fontSize: 12, fontWeight: 600,
            fontFamily: 'var(--font-mono)', letterSpacing: 0.5,
          }}>
            {t.label.toUpperCase()} · {t.count}
          </div>
        ))}
      </div>

      {Object.keys(groups).length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', color: 'var(--fg-3)' }}>
          <I.eye size={28} stroke="var(--fg-3)"/>
          <div style={{ fontSize: 12, marginTop: 8 }}>Nothing to show yet.</div>
        </div>
      ) : (
        Object.entries(groups).map(([id, evts]) => {
          const m = members.find(x => x.id === id);
          if (!m) return null;
          return (
            <div key={id} className="glass" style={{ padding: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Avatar name={m.name} size={36} hue={m.hue} status={m.status}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>{evts.length} VIEW{evts.length > 1 ? 'S' : ''}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {evts.map((e, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, background: 'oklch(1 0 0 / 0.02)' }}>
                    <I.eye size={11} stroke="var(--fg-3)"/>
                    <div style={{ fontSize: 11, color: 'var(--fg-2)', flex: 1 }}>{tab === 'viewed-me' ? `Viewed your ${e.section}` : `Viewed ${m.name}'s ${e.section}`}</div>
                    <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{e.when.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: 'oklch(0.78 0.16 var(--hue) / 0.08)', fontSize: 11, color: 'var(--fg-2)', lineHeight: 1.5 }}>
        <b style={{ color: 'oklch(0.85 0.14 var(--hue))' }}>Why this matters:</b> Everyone in your circle can see who looked at their data. Visibility cuts both ways — that's how trust works.
      </div>
    </CircleSheet>
  );
};
