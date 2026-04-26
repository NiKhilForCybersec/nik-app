/* Nik — Family Circle: a care dashboard.
   Design language matches MoreScreen — categorized bento sections,
   gradient PinnedTile heroes, glass cards, mono-caps section labels.
*/
import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ScreenProps } from '../App';
import { useOp, useOpMutation } from '../lib/useOp';
import { circle as circleOps, canCircleView, TRUST_TIERS } from '../contracts/circle';
import type { CircleMember } from '../contracts/circle';
import { I } from '../components/icons';
import { Avatar, Chip, HUDCorner } from '../components/primitives';
import {
  MemberDetailSheet,
  PrivacySheet,
  ViewLogSheet,
} from '../components/sheets/CircleSheets';

// Project a DB row into the legacy "rich member" shape the screen + sheets
// were originally written against. Health/meds/etc. live in the JSONB
// `profile` until they earn their own contracts.
type LegacyMember = {
  id: string;
  name: string;
  role: string;
  age: number | null;
  hue: number;
  self: boolean;
  status: 'online' | 'away' | 'offline';
  location: string | null;
  birthday: string | null;
  bloodType: string | null;
  health: Record<string, any>;
  meds: any[];
  care: Record<string, any>;
  schedule: any[];
  diary: Record<string, any>;
  cycle?: Record<string, any>;
  careRecipient: boolean;
  member_id: string;
  share_tier: CircleMember['share_tier'];
  custom_cats: string[];
};

function toLegacy(m: CircleMember): LegacyMember {
  const p = m.profile as Record<string, any>;
  return {
    id: m.member_id,
    name: m.name,
    role: m.role,
    age: m.age,
    hue: m.hue,
    self: m.is_self,
    status: m.status,
    location: m.location,
    birthday: m.birthday,
    bloodType: m.blood_type,
    health: (p.health ?? {}) as Record<string, any>,
    meds: Array.isArray(p.meds) ? p.meds : [],
    care: (p.care ?? {}) as Record<string, any>,
    schedule: Array.isArray(p.schedule) ? p.schedule : [],
    diary: (p.diary ?? {}) as Record<string, any>,
    cycle: p.cycle as Record<string, any> | undefined,
    careRecipient: m.care_recipient,
    member_id: m.member_id,
    share_tier: m.share_tier,
    custom_cats: m.custom_cats,
  };
}

// View log + alerts haven't been migrated yet — small inline placeholders.
// Promote to their own tables once the underlying domains (location
// changes, missed-meds detection, etc.) feed them.
const VIEW_LOG: { viewer: string; owner: string; section: string; when: string }[] = [];
const CIRCLE_ALERTS: { ownerId: string; kind: string; level: string; text: string; cta: string }[] = [];

const ME = 'self';

// alert level → palette hue + accent stroke
const ALERT_TONE: Record<string, { hue: number; accent: string; tone: 'danger' | 'warn' | 'accent' }> = {
  red:   { hue: 25,  accent: 'oklch(0.78 0.20 25)',  tone: 'danger' },
  amber: { hue: 60,  accent: 'oklch(0.85 0.16 70)',  tone: 'warn'   },
  soft:  { hue: 220, accent: 'oklch(0.85 0.14 220)', tone: 'accent' },
};

// alert kind → icon
const ALERT_ICON: Record<string, keyof typeof I> = {
  sleep: 'moon',
  meds:  'pill',
  mood:  'heart',
};

// CTA → icon
const CTA_ICON = (cta: string): keyof typeof I => {
  const c = cta.toLowerCase();
  if (c.includes('call'))     return 'phone';
  if (c.includes('video'))    return 'phone';
  if (c.includes('schedule')) return 'calendar';
  if (c.includes('check'))    return 'send';
  if (c.includes('ask'))      return 'chat';
  return 'send';
};

export default function CircleScreen({ onNav, state, setState }: ScreenProps) {
  void onNav;
  const me = ME;
  const { data: rows = [] } = useOp(circleOps.list, {});
  const members = React.useMemo(() => rows.map(toLegacy), [rows]);
  const alerts = CIRCLE_ALERTS;
  const log = VIEW_LOG;
  // Build a sharing matrix from the per-member tier/custom_cats columns
  // so canCircleView() (legacy signature) keeps working in the JSX.
  const sharing: Record<string, any> = React.useMemo(() => {
    const out: Record<string, Record<string, any>> = {};
    for (const m of rows) {
      // Owner = signed-in user; viewer = each circle member.
      // For each (viewer = member, owner = self) pair, we surface the tier the
      // owner picked. Override via state if present.
      out['self'] = out['self'] ?? {};
      const tier = m.share_tier === 'custom' ? { cats: m.custom_cats } : m.share_tier;
      out['self'][m.member_id] = tier;
    }
    return ((state as any)?.sharingOverride as Record<string, any>) || out;
  }, [rows, state]);
  void TRUST_TIERS; // re-exported for sheets

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [showPrivacy, setShowPrivacy] = React.useState(false);
  const [showLog, setShowLog] = React.useState(false);
  const [showAdd, setShowAdd] = React.useState(false);

  const addMember = useOpMutation(circleOps.add);
  const removeMember = useOpMutation(circleOps.remove);
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['circle.list'] });

  const handleRemove = async (memberId: string, name: string) => {
    if (memberId === 'self') return;
    if (!window.confirm(`Remove ${name} from your circle? Their shared data will no longer be visible to you.`)) return;
    await removeMember.mutateAsync({ id: memberId });
    void refresh();
  };

  const selected = selectedId ? members.find(m => m.id === selectedId) : null;

  const onlineCount = members.filter(m => m.status === 'online').length;
  const viewsOfMe = log.filter(e => e.owner === me);

  return (
    <div style={{ padding: '8px 16px 100px', color: 'var(--fg)' }}>
      {/* ─── HEADER ───────────────────────────────────────── */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)' }}>
            FAMILY · {members.length} MEMBERS · {onlineCount} ONLINE
          </div>
          <div className="display" style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.05, marginTop: 4, letterSpacing: -0.5 }}>
            Your circle
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 6, lineHeight: 1.5 }}>
            The people you carry, and the people who carry you. Tap anyone to see
            how they're doing — or what you've chosen to let them see about you.
          </div>
        </div>
        <div onClick={() => setShowAdd(true)} className="tap" title="Add a circle member" style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 12px oklch(0.78 0.16 var(--hue) / 0.4)',
        }}>
          <I.plus size={20} stroke="#06060a" sw={2.4} />
        </div>
      </div>

      {/* Add-member sheet (minimal) */}
      {showAdd && (
        <AddMemberSheet
          onClose={() => setShowAdd(false)}
          onSubmit={async (input) => {
            try {
              await addMember.mutateAsync(input);
              void refresh();
              setShowAdd(false);
            } catch (e) {
              alert(`Couldn't add: ${(e as Error).message}`);
            }
          }}
        />
      )}

      {/* ─── LIVE STATUS STRIP ───────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <SectionLabel
          title="LIVE NOW"
          subtitle="Where everyone is, right this second"
          right={
            <span
              style={{
                fontSize: 9,
                color: 'oklch(0.78 0.15 150)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 99,
                  background: 'oklch(0.78 0.15 150)',
                  boxShadow: '0 0 6px oklch(0.78 0.15 150)',
                  animation: 'breathe 1.6s infinite',
                }}
              />
              LIVE
            </span>
          }
        />
        <div
          style={{
            display: 'flex',
            gap: 10,
            overflowX: 'auto',
            paddingBottom: 6,
            marginTop: 10,
            scrollbarWidth: 'none',
          }}
        >
          {members.map(m => {
            const isMe = m.id === me;
            const canLoc = canCircleView(me, m.id, 'location', sharing);
            const loc = canLoc
              ? (m.location as string).split('·')[0].trim()
              : 'Private';
            return (
              <div
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className="tap glass"
                style={{
                  ['--hue' as any]: m.hue,
                  flex: '0 0 116px',
                  padding: 12,
                  borderRadius: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  background: `linear-gradient(160deg, oklch(0.78 0.16 ${m.hue} / 0.08), transparent 75%)`,
                  borderColor: `oklch(0.78 0.16 ${m.hue} / 0.18)`,
                  position: 'relative',
                }}
              >
                <Avatar name={m.name} size={48} hue={m.hue} status={m.status} ring={isMe} />
                <div style={{ textAlign: 'center', minWidth: 0, width: '100%' }}>
                  <div
                    className="display"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--fg)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {m.name}
                    {isMe && (
                      <span
                        style={{
                          marginLeft: 4,
                          fontSize: 8,
                          fontFamily: 'var(--font-mono)',
                          color: `oklch(0.85 0.14 ${m.hue})`,
                          letterSpacing: 1,
                        }}
                      >
                        YOU
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: 'var(--fg-3)',
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: 0.4,
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 3,
                    }}
                  >
                    {!canLoc && <I.lock size={8} stroke="var(--fg-3)" />}
                    {loc.toUpperCase()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── NIK NOTICED — concern alerts ────────────────── */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionLabel
            title="NIK NOTICED"
            subtitle="Patterns worth a soft tap on the shoulder"
            right={
              <span
                style={{
                  fontSize: 9,
                  color: 'var(--fg-3)',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: 1,
                }}
              >
                {alerts.length} ITEMS
              </span>
            }
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginTop: 10,
            }}
          >
            {alerts.map((a, i) => {
              const m = members.find(x => x.id === a.ownerId);
              if (!m) return null;
              const tone = ALERT_TONE[a.level] || ALERT_TONE.soft;
              const Ic = I[ALERT_ICON[a.kind] || 'alert'];
              const Cta = I[CTA_ICON(a.cta)];
              return (
                <div
                  key={i}
                  onClick={() => setSelectedId(a.ownerId)}
                  className="tap glass fade-up scanlines"
                  style={{
                    ['--hue' as any]: tone.hue,
                    padding: 14,
                    borderRadius: 18,
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: 168,
                    display: 'flex',
                    flexDirection: 'column',
                    background: `linear-gradient(135deg, oklch(0.78 0.18 ${tone.hue} / 0.22), oklch(0.55 0.22 ${tone.hue + 60} / 0.12))`,
                    borderColor: `oklch(0.78 0.18 ${tone.hue} / 0.45)`,
                  }}
                >
                  <HUDCorner position="tl" color={tone.accent} />
                  <HUDCorner position="br" color={tone.accent} />

                  {/* Top row: icon + level chip */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        background: `oklch(0.78 0.18 ${tone.hue} / 0.3)`,
                        display: 'grid',
                        placeItems: 'center',
                        boxShadow: `0 0 12px oklch(0.78 0.18 ${tone.hue} / 0.4)`,
                      }}
                    >
                      <Ic size={17} stroke={`oklch(0.95 0.14 ${tone.hue})`} />
                    </div>
                    <Chip tone={tone.tone} size="sm">
                      {a.level}
                    </Chip>
                  </div>

                  {/* Member */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      marginTop: 10,
                    }}
                  >
                    <Avatar name={m.name} size={20} hue={m.hue} />
                    <div
                      style={{
                        fontSize: 10,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--fg-2)',
                        letterSpacing: 0.5,
                      }}
                    >
                      {m.name.toUpperCase()} · {m.role.toUpperCase()}
                    </div>
                  </div>

                  {/* Headline */}
                  <div
                    className="display"
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--fg)',
                      lineHeight: 1.35,
                      marginTop: 6,
                    }}
                  >
                    {a.text}
                  </div>

                  {/* CTA chip */}
                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: 10,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: 0.6,
                      color: tone.accent,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}
                  >
                    <Cta size={11} stroke={tone.accent} />
                    {a.cta}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── AWARENESS — viewed you this week ─────────────── */}
      {viewsOfMe.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionLabel
            title="VIEWED YOU · THIS WEEK"
            subtitle="Visibility cuts both ways"
            right={
              <span
                onClick={() => setShowLog(true)}
                className="tap"
                style={{
                  fontSize: 9,
                  color: 'oklch(0.85 0.14 var(--hue))',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: 1,
                }}
              >
                FULL LOG →
              </span>
            }
          />
          <div
            onClick={() => setShowLog(true)}
            className="tap glass fade-up"
            style={{
              padding: 12,
              borderRadius: 14,
              marginTop: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {viewsOfMe.slice(0, 5).map((e, i) => {
              const v = members.find(m => m.id === e.viewer);
              if (!v) return null;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 4px',
                    borderBottom:
                      i < Math.min(viewsOfMe.length, 5) - 1
                        ? '1px solid var(--hairline)'
                        : 'none',
                  }}
                >
                  <Avatar name={v.name} size={28} hue={v.hue} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--fg)' }}>
                      <b>{v.name}</b> looked at your{' '}
                      <span style={{ color: 'var(--fg-2)' }}>{e.section}</span>
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: 'var(--fg-3)',
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: 0.4,
                        marginTop: 1,
                      }}
                    >
                      {e.when.toUpperCase()}
                    </div>
                  </div>
                  <I.eye size={12} stroke="var(--fg-3)" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── CARE SNAPSHOT — bento grid of members ───────── */}
      <div style={{ marginBottom: 24 }}>
        <SectionLabel
          title="CARE SNAPSHOT"
          subtitle="Each person, at a glance"
          right={
            <span
              style={{
                fontSize: 9,
                color: 'var(--fg-3)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: 1,
              }}
            >
              {members.length}
            </span>
          }
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginTop: 10,
          }}
        >
          {members.map(m => (
            <div key={m.id} style={{ position: 'relative' }}>
              <MemberCard
                m={m}
                isMe={m.id === me}
                sharing={sharing}
                meId={me}
                onTap={() => setSelectedId(m.id)}
              />
              {!m.self && (
                <div
                  onClick={(e) => { e.stopPropagation(); void handleRemove(m.id, m.name); }}
                  className="tap"
                  title={`Remove ${m.name} from circle`}
                  style={{
                    position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 7,
                    background: 'oklch(0.10 0.02 260 / 0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--hairline)', opacity: 0.7,
                  }}
                >
                  <I.close size={10} stroke="var(--fg-2)" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── PRIVACY SHORTCUT ─────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div
          onClick={() => setShowPrivacy(true)}
          className="tap glass fade-up"
          style={{
            padding: 16,
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background:
              'linear-gradient(135deg, oklch(0.78 0.16 var(--hue) / 0.12), transparent 75%)',
            borderColor: 'oklch(0.78 0.16 var(--hue) / 0.3)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'oklch(0.78 0.16 var(--hue) / 0.22)',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 0 14px oklch(0.78 0.16 var(--hue) / 0.35)',
              flexShrink: 0,
            }}
          >
            <I.sparkle size={20} stroke="oklch(0.95 0.12 var(--hue))" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="display"
              style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg)' }}
            >
              Manage what each person sees
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--fg-3)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: 0.5,
                marginTop: 3,
              }}
            >
              PER-PERSON · PER-CATEGORY · ALWAYS REVERSIBLE
            </div>
          </div>
          <I.chevron size={16} stroke="var(--fg-3)" />
        </div>
      </div>

      {/* ─── SHEETS ───────────────────────────────────────── */}
      {selected && (
        <MemberDetailSheet
          member={selected}
          viewerId={me}
          sharing={sharing}
          onClose={() => setSelectedId(null)}
          onNav={onNav}
        />
      )}
      {showPrivacy && (
        <PrivacySheet
          me={me}
          members={members}
          sharing={sharing}
          onChange={(next) =>
            setState?.((x: any) => ({ ...x, sharingOverride: next }))
          }
          onClose={() => setShowPrivacy(false)}
        />
      )}
      {showLog && (
        <ViewLogSheet
          me={me}
          members={members}
          log={log}
          onClose={() => setShowLog(false)}
        />
      )}

      <style>{`
        @keyframes breathe { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}

/* ─── Section label (mono caps + subtitle) ─────────────── */
const SectionLabel: React.FC<{
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}> = ({ title, subtitle, right }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 10,
    }}
  >
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: 10,
          color: 'var(--fg-3)',
          letterSpacing: 2,
          fontFamily: 'var(--font-mono)',
        }}
      >
        {title}
      </div>
      <div
        className="display"
        style={{
          fontSize: 16,
          fontWeight: 500,
          color: 'var(--fg-2)',
          marginTop: 2,
        }}
      >
        {subtitle}
      </div>
    </div>
    {right}
  </div>
);

/* ─── Member card (bento tile per member) ───────────────── */
const MemberCard: React.FC<{
  m: Record<string, any>;
  isMe: boolean;
  meId: string;
  sharing: Record<string, any>;
  onTap: () => void;
}> = ({ m, isMe, meId, sharing, onTap }) => {
  const canHealth = canCircleView(meId, m.id, 'health', sharing);
  const canMood = canCircleView(meId, m.id, 'mood', sharing);
  const canSched = canCircleView(meId, m.id, 'schedule', sharing);
  const canScore = canCircleView(meId, m.id, 'score', sharing);
  const canDiary = canCircleView(meId, m.id, 'diary', sharing);

  const next = canSched && m.schedule?.[0];
  const moodLabel = canMood ? m.health?.mood?.today : null;
  const diarySnip = canDiary ? m.diary?.moodToday : null;
  const score = canScore ? m.health?.score : null;

  const hasAlert = !!(
    m.health?.bp?.alert ||
    m.health?.sleep?.alert ||
    m.health?.mood?.alert ||
    m.meds?.some((x: any) => x.alert)
  );

  return (
    <div
      onClick={onTap}
      className="glass tap fade-up"
      style={{
        ['--hue' as any]: m.hue,
        padding: 14,
        borderRadius: 18,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 192,
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(135deg, oklch(0.78 0.16 ${m.hue} / 0.18), oklch(0.55 0.22 ${m.hue + 60} / 0.08))`,
        borderColor: `oklch(0.78 0.16 ${m.hue} / 0.32)`,
      }}
    >
      {/* Top row: avatar + score */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <Avatar name={m.name} size={42} hue={m.hue} status={m.status} ring={isMe} />
        {score != null ? (
          <div style={{ textAlign: 'right' }}>
            <div
              className="display"
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--fg)',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}
            >
              {score}
            </div>
            <div
              style={{
                fontSize: 8,
                color: 'var(--fg-3)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: 1,
                marginTop: 2,
              }}
            >
              SCORE
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: 9,
              color: 'var(--fg-3)',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              letterSpacing: 0.5,
            }}
          >
            <I.lock size={9} stroke="var(--fg-3)" />
            PRIVATE
          </div>
        )}
      </div>

      {/* Name + relation */}
      <div style={{ marginTop: 10 }}>
        <div
          className="display"
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--fg)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {m.name}
          {hasAlert && canHealth && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 99,
                background: 'oklch(0.78 0.20 25)',
                boxShadow: '0 0 6px oklch(0.78 0.20 25)',
              }}
            />
          )}
        </div>
        <div
          style={{
            fontSize: 9,
            color: 'var(--fg-3)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: 0.5,
            marginTop: 2,
          }}
        >
          {m.role.toUpperCase()} · {m.age}
        </div>
      </div>

      {/* Mood pill */}
      {moodLabel && (
        <div style={{ marginTop: 8 }}>
          <span
            style={{
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              letterSpacing: 0.6,
              padding: '2px 7px',
              borderRadius: 99,
              background: `oklch(0.78 0.16 ${m.hue} / 0.18)`,
              color: `oklch(0.92 0.12 ${m.hue})`,
              border: `1px solid oklch(0.78 0.16 ${m.hue} / 0.35)`,
              textTransform: 'uppercase',
            }}
          >
            {moodLabel}
          </span>
        </div>
      )}

      {/* Bottom: next thing or diary snippet */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {next && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 10,
              color: 'var(--fg-2)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: 0.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <I.clock size={10} stroke={`oklch(0.85 0.14 ${m.hue})`} />
            <b style={{ color: `oklch(0.9 0.12 ${m.hue})` }}>{next.time}</b>
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {next.text}
            </span>
          </div>
        )}
        {diarySnip && (
          <div
            style={{
              fontSize: 10,
              color: 'var(--fg-3)',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
            }}
          >
            “{diarySnip}”
          </div>
        )}
        {!next && !diarySnip && (
          <div
            style={{
              fontSize: 10,
              color: 'var(--fg-3)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <I.lock size={9} stroke="var(--fg-3)" />
            NOT SHARED
          </div>
        )}
      </div>
    </div>
  );
};

// ── AddMemberSheet ──────────────────────────────────────
// Minimal modal: lets the user add a new circle member by name +
// relation. Cross-account user search is a multi-tenant feature
// (deferred — see docs/Concerns.md). For now this just inserts a
// row into the user's own circle_members table.

const RELATIONS = ['partner','child','parent','sibling','grandparent','caregiver','friend','family'] as const;
const TIERS = ['inner','family','kid','caregiver'] as const;

const AddMemberSheet: React.FC<{
  onClose: () => void;
  onSubmit: (input: { memberId: string; name: string; role: string; relation: typeof RELATIONS[number]; shareTier: typeof TIERS[number]; hue: number }) => void | Promise<void>;
}> = ({ onClose, onSubmit }) => {
  const [name, setName] = React.useState('');
  const [relation, setRelation] = React.useState<typeof RELATIONS[number]>('family');
  const [tier, setTier] = React.useState<typeof TIERS[number]>('family');
  const [hue, setHue] = React.useState(220);
  const [busy, setBusy] = React.useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const memberId = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 40);
      await onSubmit({
        memberId, name: name.trim(), role: relation === 'family' ? 'Family' : relation[0]!.toUpperCase() + relation.slice(1),
        relation, shareTier: tier, hue,
      });
    } finally { setBusy(false); }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'oklch(0 0 0 / 0.5)',
      backdropFilter: 'blur(8px)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} className="glass scanlines" style={{
        padding: 22, width: '100%', maxWidth: 380, position: 'relative', overflow: 'hidden',
      }}>
        <HUDCorner position="tl" /><HUDCorner position="tr" /><HUDCorner position="bl" /><HUDCorner position="br" />
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 1.5, fontFamily: 'var(--font-mono)' }}>ADD TO CIRCLE</div>
        <div className="display" style={{ fontSize: 22, fontWeight: 500, marginTop: 4, marginBottom: 14 }}>Who are you adding?</div>

        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Their name" autoFocus
            style={inputStyle} />
        </Field>

        <Field label="Relation">
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {RELATIONS.map((r) => (
              <div key={r} onClick={() => setRelation(r)} className="tap" style={{
                padding: '5px 9px', borderRadius: 99, fontSize: 10, fontFamily: 'var(--font-mono)',
                background: relation === r ? 'oklch(0.78 0.16 var(--hue) / 0.2)' : 'oklch(1 0 0 / 0.04)',
                border: '1px solid ' + (relation === r ? 'oklch(0.78 0.16 var(--hue) / 0.5)' : 'var(--hairline)'),
                color: relation === r ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)',
              }}>{r}</div>
            ))}
          </div>
        </Field>

        <Field label="What can they see about you?">
          <div style={{ display: 'flex', gap: 4 }}>
            {TIERS.map((t) => (
              <div key={t} onClick={() => setTier(t)} className="tap" style={{
                flex: 1, padding: '6px 8px', borderRadius: 8, fontSize: 11, textAlign: 'center',
                fontFamily: 'var(--font-mono)', letterSpacing: 0.5,
                background: tier === t ? 'oklch(0.78 0.16 var(--hue) / 0.2)' : 'oklch(1 0 0 / 0.04)',
                border: '1px solid ' + (tier === t ? 'oklch(0.78 0.16 var(--hue) / 0.5)' : 'var(--hairline)'),
                color: tier === t ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)',
              }}>{t}</div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 6, lineHeight: 1.4 }}>
            {TRUST_TIERS[tier].desc} — sees: {TRUST_TIERS[tier].cats.join(', ')}
          </div>
        </Field>

        <Field label="Avatar hue">
          <input type="range" min={0} max={360} value={hue} onChange={(e) => setHue(Number(e.target.value))} style={{ width: '100%', accentColor: `oklch(0.78 0.16 ${hue})` }} />
        </Field>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <div onClick={onClose} className="tap" style={{
            flex: 1, padding: '10px 12px', borderRadius: 10, textAlign: 'center', fontSize: 13,
            background: 'oklch(1 0 0 / 0.04)', border: '1px solid var(--hairline)', color: 'var(--fg-2)',
          }}>Cancel</div>
          <div onClick={() => !busy && void submit()} className="tap" style={{
            flex: 1, padding: '10px 12px', borderRadius: 10, textAlign: 'center', fontSize: 13, fontWeight: 600,
            background: name.trim()
              ? 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))'
              : 'oklch(1 0 0 / 0.04)',
            color: name.trim() ? '#06060a' : 'var(--fg-3)', opacity: busy ? 0.5 : 1,
          }}>{busy ? 'Adding…' : 'Add'}</div>
        </div>
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 8,
  background: 'oklch(1 0 0 / 0.04)', border: '1px solid var(--hairline)',
  color: 'var(--fg)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)',
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 5 }}>
      {label.toUpperCase()}
    </div>
    {children}
  </div>
);
