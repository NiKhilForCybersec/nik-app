/* Nik — Couple: Arjun & Meera shared space (bento, Indian context) */
import { useState } from 'react';
import type { ScreenProps } from '../App';
import { I } from '../components/icons';

const COUPLE = {
  partner: { name: 'Meera', hue: 320, initial: 'M' },
  self:    { name: 'Arjun', hue: 220, initial: 'A' },
  streak: 12,         // weeks of weekly date nights
  togetherYears: 9,
  nextDate: {
    when: 'Sat · 7:30 PM',
    where: 'Toit, Indiranagar',
    tag: 'DATE NIGHT',
    sub: 'Mom has the kids till 11',
  },
  offsite: {
    label: '2 nights · Coorg',
    sub: 'in 12 days · ₹18,400 booked',
  },
  rituals: [
    { id: 'r1', emoji: '☕', label: 'Morning chai together', sub: '7:15am · porch', done: true,  hue: 30 },
    { id: 'r2', emoji: '📋', label: 'Sunday meal plan',      sub: 'after lunch',     done: true,  hue: 60 },
    { id: 'r3', emoji: '📵', label: 'Friday phones-down',    sub: '8pm onwards',     done: false, hue: 280 },
    { id: 'r4', emoji: '🌙', label: 'Lights-out by 11',      sub: 'weeknights',      done: false, hue: 220 },
  ],
  gratitudes: [
    { from: 'Meera', text: 'You did three school pickups in a row when my deck went sideways. I noticed.', when: 'Yesterday' },
  ],
  questions: [
    { from: 'Arjun', text: 'What\'s one thing you want more of from me this month?', when: 'Today', answered: false },
  ],
  notes: [
    { title: 'Kiaan · math tuition', sub: 'Try Mr. Iyer · Wed/Fri 5pm · ₹2,400/mo', who: 'Both', updated: '3h ago' },
    { title: 'Mom\'s 68th in Pune',   sub: 'Flights Jan 4-7 · gift idea: tanpura',   who: 'Arjun', updated: 'Yesterday' },
  ],
  memories: [
    { text: 'Today in 2018 — that wet camping trip near Chikmagalur. You laughed for an hour in the car.', who: 'Nik', when: 'Today' },
  ],
  agreements: [
    { t: 'No phones at dinner',         since: 'May',   ok: true,  note: 'holding · 6 nights' },
    { t: 'One real date a week',        since: 'Aug',   ok: true,  note: '12-week streak' },
    { t: 'No work talk after 9pm',      since: 'Sep',   ok: false, note: 'slipped twice this week' },
    { t: 'Friday is sacred · just us',  since: 'Nov',   ok: true,  note: 'on track' },
  ],
};

export default function CoupleScreen({ onNav: _onNav, state: _state, setState: _setState }: ScreenProps) {
  const [rituals, setRituals] = useState(COUPLE.rituals);
  const [questionAnswered, setQuestionAnswered] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const toggleRitual = (id: string) => {
    setRituals(prev => prev.map(r => r.id === id ? { ...r, done: !r.done } : r));
  };

  const ping = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  };

  const HUE = 320;

  return (
    <div style={{ padding: '8px 16px 100px', color: 'var(--fg)', ['--hue' as any]: HUE }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)' }}>
          SHARED · ARJUN + MEERA
        </div>
        <div className="display" style={{
          fontSize: 32, fontWeight: 500, lineHeight: 1.05, marginTop: 4, letterSpacing: -0.5,
        }}>
          Us
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 6, lineHeight: 1.5 }}>
          {COUPLE.togetherYears} years in. Small rituals, kept on purpose.
        </div>
      </div>

      {/* ── Streak hero (PinnedTile-style) ─────────────────── */}
      <div className="glass fade-up scanlines" style={{
        position: 'relative', overflow: 'hidden',
        padding: 16, borderRadius: 18, marginBottom: 24,
        background: `linear-gradient(135deg, oklch(0.78 0.16 ${HUE} / 0.24), oklch(0.55 0.22 ${HUE + 60} / 0.14))`,
        borderColor: `oklch(0.78 0.16 ${HUE} / 0.4)`,
      }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 85% 20%, oklch(0.7 0.2 ${HUE} / 0.3), transparent 55%)` }}/>

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: `oklch(0.78 0.16 ${HUE} / 0.3)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 12px oklch(0.78 0.16 ${HUE} / 0.5)`,
          }}>
            <I.heart size={18} stroke={`oklch(0.95 0.12 ${HUE})`}/>
          </div>
          <div style={{
            fontSize: 9, padding: '3px 8px', borderRadius: 99,
            background: `oklch(0.78 0.16 ${HUE} / 0.3)`,
            color: `oklch(0.95 0.14 ${HUE})`,
            fontFamily: 'var(--font-mono)', letterSpacing: 1,
          }}>STREAK</div>
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div className="display" style={{
              fontSize: 56, fontWeight: 500, lineHeight: 0.95, letterSpacing: -1.5,
              color: 'var(--fg)',
            }}>
              {COUPLE.streak}
            </div>
            <div className="display" style={{ fontSize: 16, fontWeight: 500, color: 'var(--fg)', marginTop: 4 }}>
              weeks of weekly date nights
            </div>
            <div style={{ fontSize: 10, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5, marginTop: 6 }}>
              SINCE FEB · LONGEST EVER
            </div>
          </div>

          {/* Overlapping avatars */}
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: `linear-gradient(135deg, oklch(0.65 0.18 ${COUPLE.self.hue}), oklch(0.45 0.22 ${COUPLE.self.hue + 60}))`,
              border: '2px solid var(--bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, color: '#fff', fontWeight: 600, fontFamily: 'var(--font-display)',
              boxShadow: `0 0 10px oklch(0.65 0.18 ${COUPLE.self.hue} / 0.5)`,
            }}>{COUPLE.self.initial}</div>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: `linear-gradient(135deg, oklch(0.65 0.18 ${COUPLE.partner.hue}), oklch(0.45 0.22 ${COUPLE.partner.hue + 60}))`,
              border: '2px solid var(--bg)', marginLeft: -16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, color: '#fff', fontWeight: 600, fontFamily: 'var(--font-display)',
              boxShadow: `0 0 10px oklch(0.65 0.18 ${COUPLE.partner.hue} / 0.5)`,
            }}>{COUPLE.partner.initial}</div>
          </div>
        </div>

        {/* sparkles */}
        <div style={{ position: 'absolute', top: 14, right: 70, opacity: 0.5 }}>
          <I.sparkle size={12} stroke={`oklch(0.95 0.12 ${HUE})`}/>
        </div>
      </div>

      {/* ── Up Next (2-col bento: date night + offsite) ───── */}
      <div style={{ marginBottom: 24 }}>
        <SectionLabel title="UP NEXT" subtitle="Plans on the calendar"/>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
          {/* Date night pinned */}
          <div className="glass fade-up scanlines" style={{
            padding: 14, borderRadius: 18, position: 'relative', overflow: 'hidden',
            background: `linear-gradient(135deg, oklch(0.78 0.16 ${HUE} / 0.20), oklch(0.55 0.22 ${HUE + 40} / 0.10))`,
            borderColor: `oklch(0.78 0.16 ${HUE} / 0.35)`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{
                fontSize: 9, padding: '2px 7px', borderRadius: 99,
                background: `oklch(0.78 0.16 ${HUE} / 0.3)`,
                color: `oklch(0.95 0.14 ${HUE})`,
                fontFamily: 'var(--font-mono)', letterSpacing: 1,
              }}>{COUPLE.nextDate.tag}</div>
              <I.calendar size={14} stroke={`oklch(0.9 0.14 ${HUE})`}/>
            </div>
            <div className="display" style={{ fontSize: 18, fontWeight: 500, marginTop: 4, color: 'var(--fg)' }}>
              {COUPLE.nextDate.when}
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 2, fontWeight: 500 }}>
              {COUPLE.nextDate.where}
            </div>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 4, letterSpacing: 0.5 }}>
              {COUPLE.nextDate.sub.toUpperCase()}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              <div className="tap" onClick={() => ping('Reschedule sent to Meera')} style={{
                padding: '6px 10px', borderRadius: 8,
                background: `oklch(0.78 0.16 ${HUE} / 0.18)`,
                color: `oklch(0.95 0.12 ${HUE})`,
                fontSize: 11, fontWeight: 500,
              }}>Reschedule</div>
              <div className="tap" onClick={() => ping('Booking Uber for 7:15pm')} style={{
                padding: '6px 10px', borderRadius: 8,
                background: 'var(--input-bg)', color: 'var(--fg-2)', fontSize: 11,
              }}>Get Uber</div>
            </div>
          </div>

          {/* Offsite */}
          <div className="glass fade-up" style={{
            padding: 14, borderRadius: 18, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, oklch(0.78 0.16 150 / 0.18), oklch(0.6 0.2 200 / 0.08))',
            borderColor: 'oklch(0.78 0.16 150 / 0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{
                fontSize: 9, padding: '2px 7px', borderRadius: 99,
                background: 'oklch(0.78 0.16 150 / 0.3)',
                color: 'oklch(0.95 0.14 150)',
                fontFamily: 'var(--font-mono)', letterSpacing: 1,
              }}>OFFSITE</div>
              <I.location size={14} stroke="oklch(0.9 0.14 150)"/>
            </div>
            <div className="display" style={{ fontSize: 16, fontWeight: 500, marginTop: 4, color: 'var(--fg)', lineHeight: 1.2 }}>
              {COUPLE.offsite.label}
            </div>
            <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 6, letterSpacing: 0.5 }}>
              {COUPLE.offsite.sub.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Shared rituals strip ─────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <SectionLabel title="RITUALS" subtitle="Tap to mark done today"/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {rituals.map(r => (
            <div key={r.id} onClick={() => toggleRitual(r.id)} className="glass tap fade-up" style={{
              padding: 12, borderRadius: 14,
              display: 'flex', alignItems: 'center', gap: 10,
              opacity: r.done ? 0.62 : 1,
              borderColor: r.done ? `oklch(0.78 0.16 ${r.hue} / 0.35)` : undefined,
              background: r.done
                ? `linear-gradient(135deg, oklch(0.78 0.16 ${r.hue} / 0.12), transparent 75%)`
                : `linear-gradient(135deg, oklch(0.78 0.16 ${r.hue} / 0.05), transparent 75%)`,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `oklch(0.78 0.16 ${r.hue} / 0.18)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>{r.emoji}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: 12, fontWeight: 500, color: 'var(--fg)',
                  textDecoration: r.done ? 'line-through' : 'none',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{r.label}</div>
                <div style={{
                  fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)',
                  marginTop: 2, letterSpacing: 0.5,
                }}>{r.sub.toUpperCase()}</div>
              </div>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                border: r.done ? 'none' : '1.5px solid var(--hairline-strong)',
                background: r.done ? `oklch(0.78 0.16 ${r.hue})` : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {r.done && <I.check size={11} stroke="#06060a" sw={3}/>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Threads bento (2-col) ───────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <SectionLabel title="THREADS" subtitle="Things only you two share"/>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {/* Gratitude */}
          <ThreadCard
            kind="GRATITUDE" hue={30} icon={<I.heart size={14} stroke="oklch(0.9 0.14 30)"/>}
            count="1 today · 4 pending" addLabel="+ note one"
            onAdd={() => ping('Gratitude noted')}
          >
            <div style={{ fontSize: 11, color: 'var(--fg)', lineHeight: 1.5 }}>
              "{COUPLE.gratitudes[0].text}"
            </div>
            <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 6, letterSpacing: 0.5 }}>
              — {COUPLE.gratitudes[0].from.toUpperCase()} · {COUPLE.gratitudes[0].when.toUpperCase()}
            </div>
          </ThreadCard>

          {/* Questions */}
          <ThreadCard
            kind="QUESTIONS" hue={HUE} icon={<I.chat size={14} stroke={`oklch(0.9 0.14 ${HUE})`}/>}
            count="1 open · waiting on Meera"
            addLabel={questionAnswered ? 'Answered' : '+ ask one'}
            onAdd={() => { setQuestionAnswered(true); ping('Sent to Meera'); }}
          >
            <div style={{ fontSize: 11, color: 'var(--fg)', lineHeight: 1.5, fontStyle: 'italic' }}>
              "{COUPLE.questions[0].text}"
            </div>
            <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 6, letterSpacing: 0.5 }}>
              ASKED BY {COUPLE.questions[0].from.toUpperCase()} · {COUPLE.questions[0].when.toUpperCase()}
            </div>
          </ThreadCard>

          {/* Shared notes */}
          <ThreadCard
            kind="SHARED NOTES" hue={220} icon={<I.book size={14} stroke="oklch(0.9 0.14 220)"/>}
            count={`${COUPLE.notes.length} active`} addLabel="+ note"
            onAdd={() => ping('New shared note')}
          >
            {COUPLE.notes.map((n, i) => (
              <div key={i} style={{ marginBottom: i < COUPLE.notes.length - 1 ? 8 : 0 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg)' }}>{n.title}</div>
                <div style={{ fontSize: 10, color: 'var(--fg-2)', marginTop: 1 }}>{n.sub}</div>
              </div>
            ))}
          </ThreadCard>

          {/* Memories */}
          <ThreadCard
            kind="MEMORIES" hue={280} icon={<I.sparkles size={14} stroke="oklch(0.9 0.14 280)"/>}
            count="On this day · 6 yrs ago" addLabel="+ memory"
            onAdd={() => ping('Saved to vault')}
          >
            <div style={{ fontSize: 11, color: 'var(--fg)', lineHeight: 1.5 }}>
              {COUPLE.memories[0].text}
            </div>
          </ThreadCard>
        </div>
      </div>

      {/* ── Agreements ──────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <SectionLabel title="AGREEMENTS" subtitle="The small contracts you keep"/>

        <div className="glass fade-up" style={{ padding: 12, borderRadius: 14 }}>
          {COUPLE.agreements.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 4px',
              borderBottom: i < COUPLE.agreements.length - 1 ? '1px solid var(--hairline)' : 'none',
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 500 }}>{a.t}</div>
                <div style={{
                  fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)',
                  marginTop: 2, letterSpacing: 0.5,
                }}>SINCE {a.since.toUpperCase()}</div>
              </div>
              <div style={{
                fontSize: 10, padding: '4px 9px', borderRadius: 99,
                background: a.ok
                  ? 'oklch(0.78 0.15 150 / 0.15)'
                  : 'oklch(0.82 0.15 70 / 0.15)',
                color: a.ok
                  ? 'oklch(0.85 0.14 150)'
                  : 'oklch(0.9 0.14 70)',
                border: a.ok
                  ? '1px solid oklch(0.78 0.15 150 / 0.4)'
                  : '1px solid oklch(0.82 0.15 70 / 0.4)',
                fontFamily: 'var(--font-mono)', letterSpacing: 0.5,
                whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 10,
              }}>
                {a.note.toUpperCase()}
              </div>
            </div>
          ))}
          <div onClick={() => ping('Open agreements editor')} className="tap" style={{
            marginTop: 6, padding: '8px 4px',
            fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1,
            textAlign: 'center',
          }}>+ ADD AGREEMENT</div>
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

type ThreadCardProps = {
  kind: string;
  hue: number;
  icon: React.ReactNode;
  count: string;
  addLabel: string;
  onAdd: () => void;
  children: React.ReactNode;
};
const ThreadCard = ({ kind, hue, icon, count, addLabel, onAdd, children }: ThreadCardProps) => (
  <div className="glass fade-up" style={{
    padding: 12, borderRadius: 14, display: 'flex', flexDirection: 'column',
    background: `linear-gradient(135deg, oklch(0.78 0.16 ${hue} / 0.06), transparent 70%)`,
    borderColor: `oklch(0.78 0.16 ${hue} / 0.18)`,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <div style={{
        width: 24, height: 24, borderRadius: 7,
        background: `oklch(0.78 0.16 ${hue} / 0.18)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <div style={{
        fontSize: 9, color: `oklch(0.9 0.14 ${hue})`,
        fontFamily: 'var(--font-mono)', letterSpacing: 1, fontWeight: 500,
      }}>{kind}</div>
    </div>

    <div style={{ flex: 1, marginBottom: 8, minHeight: 36 }}>
      {children}
    </div>

    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      paddingTop: 8, borderTop: '1px solid var(--hairline)',
    }}>
      <div style={{
        fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)',
        letterSpacing: 0.5, textTransform: 'uppercase',
      }}>{count}</div>
      <div onClick={onAdd} className="tap" style={{
        fontSize: 10, color: `oklch(0.9 0.14 ${hue})`,
        fontFamily: 'var(--font-mono)', letterSpacing: 0.5,
      }}>{addLabel}</div>
    </div>
  </div>
);
