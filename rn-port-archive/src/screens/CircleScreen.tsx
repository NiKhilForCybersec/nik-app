import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { Tile, Chip, Avatar, Icon, ScreenHeader } from '../components';
import { colors, monoFont, hueColor } from '../theme';
import type { NavProps } from '../router';

// ── Inlined mock data (from prototype circle-data.js) ─────────────
type Member = {
  id: string;
  name: string;
  role: string;
  relation: 'self' | 'partner' | 'parent' | 'kid-teen' | 'kid-young';
  age: number;
  hue: number;
  self?: boolean;
  status: 'online' | 'away' | 'offline';
  location: string;
  health: { score: number; mood: { today: string } };
  careRecipient?: boolean;
};

const CIRCLE_MEMBERS: Member[] = [
  { id: 'arjun', name: 'Arjun', role: 'You', relation: 'self', age: 36, hue: 220, self: true,
    status: 'online', location: 'Commute · Whitefield → MG Rd',
    health: { score: 782, mood: { today: 'focused' } } },
  { id: 'meera', name: 'Meera', role: 'Partner', relation: 'partner', age: 34, hue: 320,
    status: 'online', location: 'Home',
    health: { score: 624, mood: { today: 'tired' } } },
  { id: 'kiaan', name: 'Kiaan', role: 'Son · 12', relation: 'kid-teen', age: 12, hue: 30,
    status: 'away', location: 'School · Inventure Academy',
    health: { score: 540, mood: { today: 'ok' } } },
  { id: 'anya', name: 'Anya', role: 'Daughter · 8', relation: 'kid-young', age: 8, hue: 280,
    status: 'away', location: 'School · Inventure Academy',
    health: { score: 612, mood: { today: 'happy' } } },
  { id: 'mom', name: 'Mom', role: 'Mother · 67', relation: 'parent', age: 67, hue: 150,
    status: 'online', location: 'Pune · Home',
    health: { score: 488, mood: { today: 'lonely' } }, careRecipient: true },
];

type Alert = { ownerId: string; kind: string; level: 'red' | 'amber' | 'soft'; text: string; cta: string };
const CIRCLE_ALERTS: Alert[] = [
  { ownerId: 'meera', kind: 'sleep', level: 'amber', text: 'Sleep <6h for 4 nights', cta: 'Send a soft check-in' },
  { ownerId: 'mom', kind: 'meds', level: 'red', text: 'Telmisartan missed 3x — BP elevated', cta: 'Call now' },
  { ownerId: 'mom', kind: 'mood', level: 'amber', text: 'No social contact for 3 days', cta: 'Schedule a video call' },
  { ownerId: 'kiaan', kind: 'mood', level: 'soft', text: 'Quieter than usual today', cta: 'Ask about school' },
];

const VIEW_LOG: Array<{ viewer: string; owner: string; section: string; when: string }> = [
  { viewer: 'meera', owner: 'arjun', section: 'health', when: 'today · 9:14am' },
  { viewer: 'meera', owner: 'arjun', section: 'schedule', when: 'today · 9:14am' },
  { viewer: 'meera', owner: 'arjun', section: 'mood', when: 'today · 9:15am' },
  { viewer: 'meera', owner: 'arjun', section: 'health', when: 'yesterday · 11pm' },
  { viewer: 'meera', owner: 'arjun', section: 'health', when: 'yesterday · 7pm' },
];

// Simple sharing matrix — for v1 we treat self/inner/family as can-view-everything
// and kids as restricted. (Full PrivacyMatrix is deferred with the sheet companions.)
const canCircleView = (viewerId: string, ownerId: string, _category: string): boolean => {
  if (viewerId === ownerId) return true;
  // For demo: everything visible to me except the kids' deep mood
  return true;
};

// ── Constellation hero ─────────────────────────────────────────────
const ConstellationHero = ({ members, alerts, onSelect }: {
  members: Member[]; alerts: Alert[]; onSelect: (id: string) => void;
}) => {
  const me = 'arjun';
  const others = members.filter(m => m.id !== me);
  const heroH = 320;
  const cx = 0; const cy = 0;
  return (
    <Tile style={{ padding: 0, marginBottom: 14, height: heroH, overflow: 'hidden' }}>
      {/* labels */}
      <Text style={{
        position: 'absolute', top: 12, left: 14,
        fontFamily: monoFont, fontSize: 9, color: colors.fg3, letterSpacing: 1.5,
      }}>CONSTELLATION</Text>
      <View style={{
        position: 'absolute', top: 12, right: 14,
        flexDirection: 'row', alignItems: 'center', gap: 5,
      }}>
        <View style={{ width: 5, height: 5, borderRadius: 99, backgroundColor: colors.ok }} />
        <Text style={{ fontFamily: monoFont, fontSize: 9, color: colors.ok, letterSpacing: 1.5 }}>LIVE</Text>
      </View>

      {/* center container */}
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        alignItems: 'center', justifyContent: 'center',
      }}>
        {/* orbit rings */}
        {[160, 240].map((d, i) => (
          <View key={d} style={{
            position: 'absolute',
            width: d, height: d, borderRadius: d / 2,
            borderWidth: 1, borderStyle: i === 0 ? 'dashed' : 'solid',
            borderColor: i === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
          }} />
        ))}

        {/* connecting lines */}
        <Svg width={300} height={300} style={{ position: 'absolute', opacity: 0.15 }}>
          {others.map((m, i) => {
            const angle = (i / others.length) * 2 * Math.PI - Math.PI / 2;
            const r = m.relation === 'partner' ? 90 : (m.relation === 'parent' ? 130 : 105);
            const x = 150 + Math.cos(angle) * r;
            const y = 150 + Math.sin(angle) * r;
            return <Line key={m.id} x1={150} y1={150} x2={x} y2={y}
              stroke={colors.accent} strokeWidth={1} strokeDasharray="2 4" />;
          })}
        </Svg>

        {/* center = you */}
        <Pressable onPress={() => onSelect('arjun')} style={{ alignItems: 'center', position: 'absolute' }}>
          <Avatar name="A" size={68} hue={220} ring />
          <Text style={{ fontSize: 11, marginTop: 8, fontWeight: '700', letterSpacing: 1, color: colors.fg }}>YOU</Text>
          <Text style={{ fontSize: 9, fontFamily: monoFont, color: colors.fg3, letterSpacing: 0.5 }}>NIK SCORE 782</Text>
        </Pressable>

        {/* others on orbit */}
        {others.map((m, i) => {
          const angle = (i / others.length) * 2 * Math.PI - Math.PI / 2;
          const r = m.relation === 'partner' ? 90 : (m.relation === 'parent' ? 130 : 105);
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          const hasAlert = alerts.some(a => a.ownerId === m.id);
          return (
            <Pressable key={m.id} onPress={() => onSelect(m.id)} style={{
              position: 'absolute',
              transform: [{ translateX: x }, { translateY: y }],
              alignItems: 'center',
            }}>
              <View>
                <Avatar name={m.name} size={46} hue={m.hue} status={m.status} />
                {hasAlert && (
                  <View style={{
                    position: 'absolute', top: -3, right: -3,
                    width: 14, height: 14, borderRadius: 7,
                    backgroundColor: colors.danger,
                    borderWidth: 2, borderColor: colors.bg,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 8, fontWeight: '700', color: '#fff' }}>!</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 9, marginTop: 5, color: colors.fg2, fontFamily: monoFont, fontWeight: '700' }}>
                {m.name.toUpperCase()}
              </Text>
              <Text style={{ fontSize: 8, color: colors.fg3, fontFamily: monoFont }}>{m.health.score}</Text>
            </Pressable>
          );
        })}
      </View>
    </Tile>
  );
};

// ── Main screen ────────────────────────────────────────────────────
export default function CircleScreen({ onBack }: NavProps) {
  const me = 'arjun';
  const [, setSelectedId] = useState<string | null>(null);
  const viewsOfMe = VIEW_LOG.filter(e => e.owner === me).length;
  const viewersOfMe = [...new Set(VIEW_LOG.filter(e => e.owner === me).map(e => e.viewer))];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 100 }}>
      <ScreenHeader
        title="Family"
        subtitle={`Circle · ${CIRCLE_MEMBERS.length} members`}
        onBack={onBack}
        right={
          <View style={{ flexDirection: 'row', gap: 8, marginRight: 16 }}>
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              borderWidth: 1, borderColor: colors.hairlineStrong,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="eye" size={16} color={colors.fg} />
              {viewsOfMe > 0 && (
                <View style={{
                  position: 'absolute', top: -3, right: -3,
                  minWidth: 14, height: 14, borderRadius: 7,
                  backgroundColor: colors.accent,
                  alignItems: 'center', justifyContent: 'center',
                  paddingHorizontal: 3,
                }}>
                  <Text style={{ color: '#000', fontSize: 8, fontWeight: '700', fontFamily: monoFont }}>
                    {viewsOfMe}
                  </Text>
                </View>
              )}
            </View>
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              borderWidth: 1, borderColor: colors.hairlineStrong,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="shield" size={16} color={colors.fg} />
            </View>
          </View>
        }
      />

      <View style={{ paddingHorizontal: 16 }}>
        {/* Constellation hero */}
        <ConstellationHero
          members={CIRCLE_MEMBERS}
          alerts={CIRCLE_ALERTS}
          onSelect={setSelectedId}
        />

        {/* Awareness strip */}
        {viewsOfMe > 0 && (
          <Tile style={{ padding: 12, marginBottom: 14, backgroundColor: colors.accentSoft }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Icon name="eye" size={16} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: colors.fg }}>
                  Your profile was viewed{' '}
                  <Text style={{ fontWeight: '700' }}>{viewsOfMe}× this week</Text>
                </Text>
                <Text style={{ fontSize: 10, color: colors.fg3, fontFamily: monoFont, marginTop: 2 }}>
                  By {viewersOfMe.map(v => v.toUpperCase()).join(' · ')}
                </Text>
              </View>
              <Icon name="chevron" size={14} color={colors.fg3} />
            </View>
          </Tile>
        )}

        {/* Concern alerts */}
        {CIRCLE_ALERTS.length > 0 && (
          <View style={{ marginBottom: 14 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 8,
            }}>
              <Text style={{ fontSize: 10, color: colors.fg3, fontFamily: monoFont, letterSpacing: 1.5 }}>
                NIK NOTICED · {CIRCLE_ALERTS.length} ITEMS
              </Text>
              <Text style={{ fontSize: 9, color: colors.fg3 }}>shared by them</Text>
            </View>
            {CIRCLE_ALERTS.map((a, i) => {
              const m = CIRCLE_MEMBERS.find(x => x.id === a.ownerId);
              if (!m) return null;
              const tone: 'danger' | 'warn' | 'accent' =
                a.level === 'red' ? 'danger' : a.level === 'amber' ? 'warn' : 'accent';
              const toneColor =
                a.level === 'red' ? colors.danger : a.level === 'amber' ? colors.warn : colors.accent;
              return (
                <Tile key={i} onPress={() => setSelectedId(a.ownerId)}
                  style={{
                    padding: 12, marginBottom: 8,
                    borderLeftWidth: 3, borderLeftColor: toneColor,
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Avatar name={m.name} size={32} hue={m.hue} status={m.status} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: colors.fg }}>
                        <Text style={{ fontWeight: '700' }}>{m.name}</Text> · {a.text}
                      </Text>
                      <Text style={{
                        fontSize: 10, color: toneColor, fontFamily: monoFont, marginTop: 2,
                      }}>{a.cta.toUpperCase()}</Text>
                    </View>
                    <Chip tone={tone} size="sm">{a.level.toUpperCase()}</Chip>
                  </View>
                </Tile>
              );
            })}
          </View>
        )}

        {/* Member cards */}
        <Text style={{
          fontSize: 10, color: colors.fg3, fontFamily: monoFont, letterSpacing: 1.5, marginBottom: 8,
        }}>EVERYONE</Text>
        <View style={{ gap: 8 }}>
          {CIRCLE_MEMBERS.map(m => {
            const isMe = m.id === me;
            const canHealth = canCircleView(me, m.id, 'health');
            const canLoc = canCircleView(me, m.id, 'location');
            return (
              <Tile key={m.id} onPress={() => setSelectedId(m.id)} style={{ padding: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar name={m.name} size={42} hue={m.hue} status={m.status} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.fg }}>{m.name}</Text>
                      {isMe && <Chip tone="accent" size="sm">YOU</Chip>}
                      {m.careRecipient && <Chip tone="warn" size="sm">CARE</Chip>}
                    </View>
                    <Text style={{
                      fontSize: 10, color: colors.fg3, fontFamily: monoFont, marginTop: 2,
                    }}>
                      {m.role.toUpperCase()}
                      {canLoc && ` · ${m.location.split('·')[0].trim().toUpperCase()}`}
                    </Text>
                  </View>
                  {canHealth ? (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 11, fontFamily: monoFont, color: colors.fg, fontWeight: '700' }}>
                        {m.health.score}
                      </Text>
                      <Text style={{ fontSize: 9, color: colors.fg3, fontFamily: monoFont }}>
                        {m.health.mood.today.toUpperCase()}
                      </Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Icon name="lock" size={10} color={colors.fg3} />
                      <Text style={{ fontSize: 9, color: colors.fg3, fontFamily: monoFont }}>PRIVATE</Text>
                    </View>
                  )}
                </View>
              </Tile>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}
