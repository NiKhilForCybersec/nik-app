/* Nik — Kids View: Kiaan + Anya, family-pulse, parent-asks, reward shop */
import { useState } from 'react';
import type { ScreenProps } from '../App';
import { I } from '../components/icons';
import { Ring } from '../components/primitives';

type ChecklistItem = { id: string; emoji: string; label: string; done: boolean };
type Kid = {
  id: string;
  name: string;
  grade: string;
  age: number;
  hue: number;
  initial: string;
  mood: string;
  moodNote: string;
  checklist: ChecklistItem[];
  reward: { name: string; emoji: string; need: number };
};

const KIDS: Kid[] = [
  {
    id: 'kiaan',
    name: 'Kiaan',
    grade: 'Class 7 · Inventure',
    age: 12,
    hue: 30,
    initial: 'K',
    mood: 'Quiet',
    moodNote: 'Math test today',
    checklist: [
      { id: 'k1', emoji: '🦷', label: 'Brush + ready by 7:15', done: true },
      { id: 'k2', emoji: '🎒', label: 'School bag packed',     done: true },
      { id: 'k3', emoji: '🎹', label: 'Piano · 20 min',         done: false },
      { id: 'k4', emoji: '📐', label: 'Math homework',          done: false },
    ],
    reward: { name: 'New cricket bat', emoji: '🏏', need: 60 },
  },
  {
    id: 'anya',
    name: 'Anya',
    grade: 'Class 3 · Inventure',
    age: 8,
    hue: 280,
    initial: 'A',
    mood: 'Happy',
    moodNote: 'Made a new friend',
    checklist: [
      { id: 'a1', emoji: '☀️', label: 'Wake-up + bed made',   done: true },
      { id: 'a2', emoji: '🦷', label: 'Brush teeth',           done: true },
      { id: 'a3', emoji: '🏊', label: 'Swim class · 5pm',      done: false },
      { id: 'a4', emoji: '📖', label: 'Read 1 chapter',        done: false },
    ],
    reward: { name: 'Movie night, your pick', emoji: '🎬', need: 30 },
  },
];

const FAMILY_PULSE = [
  { who: 'Meera', emoji: '👩🏽', hue: 320, status: 'WFH · deck',           next: 'Pickup Anya · 3:30',  dot: 'oklch(0.75 0.18 150)' },
  { who: 'Arjun', emoji: '👨🏽', hue: 220, status: 'Whitefield → MG Rd',   next: 'Design review · 3pm', dot: 'oklch(0.75 0.18 150)' },
  { who: 'Kiaan', emoji: '🧑🏽', hue: 30,  status: 'School',               next: 'Piano · 5pm',         dot: 'oklch(0.82 0.15 70)' },
  { who: 'Anya',  emoji: '👧🏽', hue: 280, status: 'School',               next: 'Swim · 5pm',          dot: 'oklch(0.82 0.15 70)' },
  { who: 'Mom',   emoji: '👵🏽', hue: 150, status: 'Pune · Home',          next: 'Walk in garden · 6',  dot: 'oklch(0.5 0.02 260)' },
];

const PARENT_ASKS = [
  { id: 'p1', who: 'Kiaan', text: 'Sleepover at Aarav\'s on Friday?',  when: '5pm',  hue: 30 },
  { id: 'p2', who: 'Anya',  text: 'Movie night tonight? Just one!',    when: 'Now',  hue: 280 },
  { id: 'p3', who: 'Kiaan', text: 'Order pizza from Toscano?',         when: '4:30', hue: 30 },
  { id: 'p4', who: 'Anya',  text: 'Can I call Dadi before bed?',       when: 'Now',  hue: 280 },
];

const REWARD_SHOP = [
  { id: 's1', emoji: '🍫', name: 'Dark chocolate',     need: 5,   cost: '₹120' },
  { id: 's2', emoji: '🎬', name: 'Movie night',        need: 30,  cost: '₹0'   },
  { id: 's3', emoji: '🎮', name: '1hr extra screen',   need: 40,  cost: '₹0'   },
  { id: 's4', emoji: '🛹', name: 'Skateboard wheels',  need: 50,  cost: '₹1,800' },
  { id: 's5', emoji: '🏏', name: 'Cricket bat',        need: 60,  cost: '₹2,400' },
  { id: 's6', emoji: '🎢', name: 'Wonderla day-trip',  need: 120, cost: '₹3,200' },
];

export default function KidsScreen({ onNav: _onNav, state: _state, setState: _setState }: ScreenProps) {
  const [kids, setKids] = useState(KIDS);
  const [askResponses, setAskResponses] = useState<Record<string, 'yes' | 'no' | null>>({});
  const [toast, setToast] = useState<string | null>(null);

  const totalDone = kids.reduce((acc, k) => acc + k.checklist.filter(c => c.done).length, 0);
  const totalAll  = kids.reduce((acc, k) => acc + k.checklist.length, 0);
  const pct       = totalDone / totalAll;

  // Stars: 1 per done item across both kids
  const stars = totalDone;
  // Combined goal — Anya's reward (closer)
  const groupGoal = KIDS[1].reward;
  const groupPct  = Math.min(1, stars / groupGoal.need);

  const toggle = (kidId: string, itemId: string) => {
    setKids(prev => prev.map(k => k.id === kidId ? {
      ...k,
      checklist: k.checklist.map(c => c.id === itemId ? { ...c, done: !c.done } : c),
    } : k));
  };

  const respond = (id: string, ans: 'yes' | 'no') => {
    setAskResponses(prev => ({ ...prev, [id]: ans }));
    ping(ans === 'yes' ? 'Approved · sent to kid' : 'Maybe later · noted');
  };

  const ping = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  };

  const HUE = 30;

  return (
    <div style={{ padding: '8px 16px 100px', color: 'var(--fg)', ['--hue' as any]: HUE }}>
      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)' }}>
          KIDS · KIAAN + ANYA
        </div>
        <div className="display" style={{
          fontSize: 32, fontWeight: 500, lineHeight: 1.05, marginTop: 4, letterSpacing: -0.5,
        }}>
          Today
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 6, lineHeight: 1.5 }}>
          {totalDone} of {totalAll} done · {stars} ⭐ earned across both
        </div>
      </div>

      {/* ── Hero overview ──────────────────────────────── */}
      <div className="glass fade-up scanlines" style={{
        position: 'relative', overflow: 'hidden',
        padding: 16, borderRadius: 18, marginBottom: 24,
        background: `linear-gradient(135deg, oklch(0.78 0.16 ${HUE} / 0.22), oklch(0.55 0.22 ${HUE + 250} / 0.16))`,
        borderColor: `oklch(0.78 0.16 ${HUE} / 0.4)`,
      }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 80% 25%, oklch(0.7 0.2 ${HUE} / 0.25), transparent 60%)` }}/>

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: `oklch(0.78 0.16 ${HUE} / 0.3)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 12px oklch(0.78 0.16 ${HUE} / 0.5)`,
          }}>
            <I.family size={18} stroke={`oklch(0.95 0.12 ${HUE})`}/>
          </div>
          <div style={{
            fontSize: 9, padding: '3px 8px', borderRadius: 99,
            background: `oklch(0.78 0.16 ${HUE} / 0.3)`,
            color: `oklch(0.95 0.14 ${HUE})`,
            fontFamily: 'var(--font-mono)', letterSpacing: 1,
          }}>BOTH KIDS</div>
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Combined avatars */}
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: `linear-gradient(135deg, oklch(0.65 0.18 ${KIDS[0].hue}), oklch(0.45 0.22 ${KIDS[0].hue + 60}))`,
              border: '2px solid var(--bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: '#fff', fontWeight: 600, fontFamily: 'var(--font-display)',
            }}>{KIDS[0].initial}</div>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: `linear-gradient(135deg, oklch(0.65 0.18 ${KIDS[1].hue}), oklch(0.45 0.22 ${KIDS[1].hue + 60}))`,
              border: '2px solid var(--bg)', marginLeft: -14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: '#fff', fontWeight: 600, fontFamily: 'var(--font-display)',
            }}>{KIDS[1].initial}</div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <div className="display" style={{ fontSize: 36, fontWeight: 500, lineHeight: 1, letterSpacing: -1, color: 'var(--fg)' }}>
                {stars}
              </div>
              <div style={{ fontSize: 16 }}>⭐</div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 4, lineHeight: 1.4 }}>
              Working toward <b>{groupGoal.emoji} {groupGoal.name}</b>
            </div>
            <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 3, letterSpacing: 0.5 }}>
              {groupGoal.need - stars > 0 ? `${groupGoal.need - stars} STARS TO GO` : 'UNLOCKED!'}
            </div>
          </div>

          {/* Combined progress ring */}
          <div style={{ flexShrink: 0, position: 'relative' }}>
            <Ring size={64} sw={5} pct={groupPct}>
              <text x="32" y="36" textAnchor="middle"
                style={{
                  fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600,
                  fill: 'var(--fg)',
                }}>
                {Math.round(pct * 100)}%
              </text>
            </Ring>
          </div>
        </div>
      </div>

      {/* ── Per-kid bento ──────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <SectionLabel title="KIDS" subtitle="Today's checklist · per kid"/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {kids.map(k => <KidCard key={k.id} kid={k} onToggle={toggle}/>)}
        </div>
      </div>

      {/* ── Family pulse strip ─────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <SectionLabel title="FAMILY PULSE" subtitle="Where everyone is right now"/>
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
          margin: '0 -16px', padding: '0 16px 4px',
          scrollbarWidth: 'none',
        }}>
          {FAMILY_PULSE.map((p, i) => (
            <div key={i} className="glass fade-up" style={{
              padding: 11, borderRadius: 14, minWidth: 140, flexShrink: 0,
              background: `linear-gradient(135deg, oklch(0.78 0.16 ${p.hue} / 0.06), transparent 70%)`,
              borderColor: `oklch(0.78 0.16 ${p.hue} / 0.18)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: `linear-gradient(135deg, oklch(0.65 0.18 ${p.hue}), oklch(0.45 0.22 ${p.hue + 60}))`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, position: 'relative',
                }}>
                  {p.emoji}
                  <div style={{
                    position: 'absolute', bottom: -1, right: -1,
                    width: 9, height: 9, borderRadius: '50%',
                    background: p.dot, border: '1.5px solid var(--bg)',
                  }}/>
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg)' }}>{p.who}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-2)', lineHeight: 1.3 }}>
                {p.status}
              </div>
              <div style={{
                fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)',
                marginTop: 4, letterSpacing: 0.5,
              }}>NEXT · {p.next.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Parent asks ────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <SectionLabel title="WAITING ON YOU" subtitle="Quick yes / not now from the kids"/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {PARENT_ASKS.map(a => {
            const ans = askResponses[a.id];
            return (
              <div key={a.id} className="glass fade-up" style={{
                padding: 12, borderRadius: 14, display: 'flex', flexDirection: 'column',
                background: `linear-gradient(135deg, oklch(0.78 0.16 ${a.hue} / 0.06), transparent 70%)`,
                borderColor: `oklch(0.78 0.16 ${a.hue} / 0.18)`,
                opacity: ans ? 0.75 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <div style={{
                    fontSize: 9, padding: '2px 6px', borderRadius: 99,
                    background: `oklch(0.78 0.16 ${a.hue} / 0.18)`,
                    color: `oklch(0.9 0.14 ${a.hue})`,
                    fontFamily: 'var(--font-mono)', letterSpacing: 0.5,
                  }}>{a.who.toUpperCase()}</div>
                  <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
                    · {a.when}
                  </div>
                </div>

                <div style={{ fontSize: 12, color: 'var(--fg)', lineHeight: 1.4, flex: 1, marginBottom: 10 }}>
                  "{a.text}"
                </div>

                {!ans ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div onClick={() => respond(a.id, 'yes')} className="tap" style={{
                      flex: 1, padding: '7px', borderRadius: 8,
                      background: `oklch(0.78 0.16 ${a.hue} / 0.85)`,
                      color: '#06060a', fontWeight: 600, fontSize: 11,
                      textAlign: 'center',
                    }}>Yes!</div>
                    <div onClick={() => respond(a.id, 'no')} className="tap" style={{
                      flex: 1, padding: '7px', borderRadius: 8,
                      background: 'var(--input-bg)', color: 'var(--fg-2)',
                      fontSize: 11, textAlign: 'center',
                    }}>Not now</div>
                  </div>
                ) : (
                  <div style={{
                    padding: '7px 8px', borderRadius: 8, textAlign: 'center',
                    background: ans === 'yes'
                      ? 'oklch(0.78 0.15 150 / 0.18)'
                      : 'oklch(0.82 0.15 70 / 0.15)',
                    color: ans === 'yes'
                      ? 'oklch(0.85 0.14 150)'
                      : 'oklch(0.9 0.14 70)',
                    fontSize: 11, fontWeight: 500,
                    fontFamily: 'var(--font-mono)', letterSpacing: 0.5,
                  }}>
                    {ans === 'yes' ? 'APPROVED' : 'MAYBE LATER'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Reward shop ────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <SectionLabel title="REWARD SHOP" subtitle="What they're working toward"/>
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
          margin: '0 -16px', padding: '0 16px 4px',
          scrollbarWidth: 'none',
        }}>
          {REWARD_SHOP.map(r => {
            const unlocked = stars >= r.need;
            const rPct = Math.min(1, stars / r.need);
            return (
              <div key={r.id} className="glass fade-up" style={{
                padding: 12, borderRadius: 14, minWidth: 130, flexShrink: 0,
                background: unlocked
                  ? `linear-gradient(135deg, oklch(0.78 0.16 ${HUE} / 0.18), oklch(0.55 0.22 ${HUE + 60} / 0.10))`
                  : 'var(--card-bg)',
                borderColor: unlocked
                  ? `oklch(0.78 0.16 ${HUE} / 0.4)`
                  : 'var(--hairline)',
                opacity: unlocked ? 1 : 0.85,
                position: 'relative',
              }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{r.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg)', lineHeight: 1.2 }}>
                  {r.name}
                </div>
                <div style={{
                  fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)',
                  marginTop: 3, letterSpacing: 0.5,
                }}>
                  {r.need}⭐ · {r.cost}
                </div>

                <div style={{
                  marginTop: 8, height: 4, borderRadius: 99,
                  background: 'oklch(1 0 0 / 0.06)', overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${rPct * 100}%`, height: '100%',
                    background: unlocked
                      ? `linear-gradient(90deg, oklch(0.78 0.16 ${HUE}), oklch(0.7 0.18 ${HUE + 30}))`
                      : 'oklch(0.6 0.08 var(--hue) / 0.5)',
                    borderRadius: 99,
                  }}/>
                </div>

                {!unlocked && (
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'oklch(1 0 0 / 0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <I.lock size={9} stroke="var(--fg-3)"/>
                  </div>
                )}
                {unlocked && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    fontSize: 8, padding: '2px 6px', borderRadius: 99,
                    background: `oklch(0.78 0.16 ${HUE})`,
                    color: '#06060a',
                    fontFamily: 'var(--font-mono)', letterSpacing: 0.5, fontWeight: 600,
                  }}>READY</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fade-up" style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          padding: '8px 14px', borderRadius: 99,
          background: `oklch(0.3 0.05 ${HUE} / 0.92)`,
          border: `1px solid oklch(0.78 0.16 ${HUE} / 0.4)`,
          color: 'var(--fg)', fontSize: 12,
          backdropFilter: 'blur(12px)', zIndex: 100,
        }}>{toast}</div>
      )}
    </div>
  );
}

// ── helpers ─────────────────────────────────────────────
const SectionLabel = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)' }}>
      {title}
    </div>
    <div className="display" style={{ fontSize: 16, fontWeight: 500, color: 'var(--fg-2)', marginTop: 2 }}>
      {subtitle}
    </div>
  </div>
);

const KidCard = ({ kid, onToggle }: { kid: Kid; onToggle: (kidId: string, itemId: string) => void }) => {
  const done  = kid.checklist.filter(c => c.done).length;
  const total = kid.checklist.length;
  const stars = done;
  const pct   = Math.min(1, stars / kid.reward.need);

  return (
    <div className="glass fade-up" style={{
      padding: 12, borderRadius: 18, position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      background: `linear-gradient(160deg, oklch(0.78 0.16 ${kid.hue} / 0.16), oklch(0.55 0.22 ${kid.hue + 60} / 0.06) 70%, transparent)`,
      borderColor: `oklch(0.78 0.16 ${kid.hue} / 0.3)`,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: `linear-gradient(135deg, oklch(0.65 0.18 ${kid.hue}), oklch(0.45 0.22 ${kid.hue + 60}))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: '#fff', fontWeight: 600, fontFamily: 'var(--font-display)',
          boxShadow: `0 0 8px oklch(0.78 0.16 ${kid.hue} / 0.5)`, flexShrink: 0,
        }}>{kid.initial}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="display" style={{ fontSize: 15, fontWeight: 500, color: 'var(--fg)', lineHeight: 1 }}>
            {kid.name} <span style={{ color: 'var(--fg-3)', fontSize: 11 }}>· {kid.age}</span>
          </div>
          <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2, letterSpacing: 0.5 }}>
            {kid.grade.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Mood chip */}
      <div style={{
        display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 5,
        padding: '3px 8px', borderRadius: 99, marginBottom: 10,
        background: `oklch(0.78 0.16 ${kid.hue} / 0.18)`,
        border: `1px solid oklch(0.78 0.16 ${kid.hue} / 0.3)`,
      }}>
        <div style={{
          width: 5, height: 5, borderRadius: '50%',
          background: `oklch(0.85 0.16 ${kid.hue})`,
        }}/>
        <div style={{ fontSize: 10, color: `oklch(0.92 0.12 ${kid.hue})`, fontWeight: 500 }}>
          {kid.mood}
        </div>
        <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
          · {kid.moodNote}
        </div>
      </div>

      {/* Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10, flex: 1 }}>
        {kid.checklist.map(c => (
          <div key={c.id} onClick={() => onToggle(kid.id, c.id)} className="tap" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 6px', borderRadius: 8,
            background: c.done ? `oklch(0.78 0.16 ${kid.hue} / 0.10)` : 'transparent',
            opacity: c.done ? 0.65 : 1,
          }}>
            <div style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>{c.emoji}</div>
            <div style={{
              fontSize: 11, color: 'var(--fg)', flex: 1, minWidth: 0,
              textDecoration: c.done ? 'line-through' : 'none',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{c.label}</div>
            <div style={{
              width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
              border: c.done ? 'none' : '1.5px solid var(--hairline-strong)',
              background: c.done ? `oklch(0.78 0.16 ${kid.hue})` : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {c.done && <I.check size={9} stroke="#06060a" sw={3}/>}
            </div>
          </div>
        ))}
      </div>

      {/* Stars + reward */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        paddingTop: 8, borderTop: `1px solid oklch(0.78 0.16 ${kid.hue} / 0.18)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
          <div className="display" style={{
            fontSize: 18, fontWeight: 500, color: 'var(--fg)', lineHeight: 1,
          }}>{stars}</div>
          <div style={{ fontSize: 11 }}>⭐</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)',
            letterSpacing: 0.5, marginBottom: 3,
          }}>{kid.reward.emoji} {kid.reward.name.toUpperCase()}</div>
          <div style={{
            height: 4, borderRadius: 99,
            background: 'oklch(1 0 0 / 0.06)', overflow: 'hidden',
          }}>
            <div style={{
              width: `${pct * 100}%`, height: '100%',
              background: `linear-gradient(90deg, oklch(0.78 0.16 ${kid.hue}), oklch(0.7 0.18 ${kid.hue + 30}))`,
              borderRadius: 99,
            }}/>
          </div>
        </div>
        <div style={{
          fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', flexShrink: 0,
        }}>{stars}/{kid.reward.need}</div>
      </div>

      {/* hidden total — for future use */}
      <div style={{ display: 'none' }}>{total}</div>
    </div>
  );
};
