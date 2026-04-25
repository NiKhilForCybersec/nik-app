import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Tile, ScreenHeader, Icon } from '../components';
import { colors, hueColor, monoFont } from '../theme';
import type { NavProps } from '../router';

type PillarId = 'focus' | 'health' | 'mind' | 'family';

type Pillar = {
  id: PillarId;
  label: string;
  icon: string;
  weight: number;
  color: number;
  desc: string;
};

const SCORE_PILLARS: Pillar[] = [
  { id: 'focus', label: 'Focus', icon: 'target', weight: 0.3, color: 220, desc: 'Deep work · sessions · attention' },
  { id: 'health', label: 'Health', icon: 'heart', weight: 0.25, color: 25, desc: 'Movement · meds · sleep' },
  { id: 'mind', label: 'Mind', icon: 'sparkles', weight: 0.25, color: 280, desc: 'Diary · mood · learning' },
  { id: 'family', label: 'Family', icon: 'family', weight: 0.2, color: 150, desc: 'Time together · ops · pings' },
];

type PillarData = { value: number; max: number; weeklyGoal: number; trend: number[] };

type Backlog = {
  id: string;
  title: string;
  missed: string;
  cost: number;
  makeup: string;
  pillar: PillarId;
  dismissable?: boolean;
  gentle?: boolean;
};

type Recent = { ts: string; delta: number; source: string; pillar: PillarId };

const MOCK_SCORE: {
  total: number;
  delta7d: number;
  todayContribution: number;
  pillars: Record<PillarId, PillarData>;
  backlog: Backlog[];
  recent: Recent[];
} = {
  total: 742,
  delta7d: 28,
  todayContribution: 18,
  pillars: {
    focus: { value: 218, max: 300, weeklyGoal: 240, trend: [180, 195, 210, 220, 215, 218, 218] },
    health: { value: 195, max: 250, weeklyGoal: 220, trend: [170, 185, 190, 195, 195, 195, 195] },
    mind: { value: 184, max: 250, weeklyGoal: 200, trend: [150, 160, 170, 175, 180, 184, 184] },
    family: { value: 145, max: 200, weeklyGoal: 170, trend: [130, 135, 140, 142, 144, 145, 145] },
  },
  backlog: [
    { id: 'b1', title: "Mom's call", missed: 'Yesterday', cost: -3, makeup: 'Call mom today (+5)', pillar: 'family', dismissable: true },
    { id: 'b2', title: "Anya's dentist (rebook)", missed: '2 days ago', cost: -2, makeup: 'Book within 48h (+3)', pillar: 'family' },
    { id: 'b3', title: 'Iron tablet (Sun)', missed: 'Sunday', cost: -1, makeup: 'Take tonight (+2)', pillar: 'health' },
    { id: 'b4', title: 'Reading 30min', missed: 'Today', cost: 0, makeup: 'Catch up before bed (+4)', pillar: 'mind', dismissable: true, gentle: true },
  ],
  recent: [
    { ts: '2h ago', delta: 8, source: 'Focus 50min · Spec writing', pillar: 'focus' },
    { ts: '4h ago', delta: 3, source: 'B12 + Multivitamin', pillar: 'health' },
    { ts: '6h ago', delta: 5, source: 'Diary · morning entry', pillar: 'mind' },
    { ts: 'Yest', delta: -3, source: 'Missed: Call mom', pillar: 'family' },
    { ts: 'Yest', delta: 4, source: 'Workout · arms day', pillar: 'health' },
  ],
};

const RANKS = ['E', 'D', 'C', 'B', 'A', 'S'];

export default function ScoreScreen({ onBack }: NavProps) {
  const s = MOCK_SCORE;
  const [activePillar, setActivePillar] = useState<PillarId | null>(null);
  const tier = Math.min(RANKS.length - 1, Math.floor(s.total / (1000 / RANKS.length)));
  const currentRank = RANKS[tier];
  const nextRankAt = Math.ceil((tier + 1) * (1000 / RANKS.length));
  const pctToNext = Math.min(1, (s.total - tier * (1000 / RANKS.length)) / (1000 / RANKS.length));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 100 }}>
      <ScreenHeader title="Your standing" subtitle="NIK SCORE" onBack={onBack} />

      <View style={{ paddingHorizontal: 16 }}>
        {/* Hero score card */}
        <Tile style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 9,
                  color: colors.fg3,
                  fontFamily: monoFont,
                  letterSpacing: 2,
                  marginBottom: 4,
                }}>
                OPERATIVE {currentRank}
              </Text>
              <Text
                style={{
                  fontSize: 56,
                  fontWeight: '300',
                  letterSpacing: -2,
                  lineHeight: 60,
                  color: hueColor(280, 0.94, 0.12),
                  fontVariant: ['tabular-nums'],
                }}>
                {s.total}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  marginTop: 4,
                }}>
                <Text
                  style={{
                    color: s.delta7d > 0 ? colors.ok : colors.danger,
                    fontSize: 11,
                    fontFamily: monoFont,
                  }}>
                  {s.delta7d > 0 ? '↗' : '↘'} {Math.abs(s.delta7d)}
                </Text>
                <Text style={{ color: colors.fg3, fontSize: 11, fontFamily: monoFont }}>
                  7-day · +{s.todayContribution} today
                </Text>
              </View>
            </View>
            <View style={{ width: 80, height: 80 }}>
              <Svg width={80} height={80}>
                <Defs>
                  <SvgLinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={colors.accent} />
                    <Stop offset="1" stopColor={colors.accent2} />
                  </SvgLinearGradient>
                </Defs>
                <Circle cx={40} cy={40} r={34} fill="none" stroke={colors.hairline} strokeWidth={4} />
                <Circle
                  cx={40}
                  cy={40}
                  r={34}
                  fill="none"
                  stroke="url(#ringGrad)"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34 * pctToNext} ${2 * Math.PI * 34}`}
                  transform="rotate(-90 40 40)"
                />
              </Svg>
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '600',
                    color: hueColor(280, 0.92, 0.14),
                    lineHeight: 26,
                  }}>
                  {currentRank}
                </Text>
                <Text
                  style={{
                    fontSize: 8,
                    color: colors.fg3,
                    fontFamily: monoFont,
                    marginTop: 1,
                  }}>
                  {nextRankAt - s.total} TO NEXT
                </Text>
              </View>
            </View>
          </View>
        </Tile>

        {/* Pillars */}
        <Tile style={{ marginBottom: 10 }}>
          <Text
            style={{
              fontSize: 9,
              color: colors.fg3,
              fontFamily: monoFont,
              letterSpacing: 1.5,
              marginBottom: 10,
            }}>
            FOUR PILLARS
          </Text>
          {SCORE_PILLARS.map((p, idx) => {
            const data = s.pillars[p.id];
            const pct = data.value / data.max;
            const goalPct = data.weeklyGoal / data.max;
            const onGoal = data.value >= data.weeklyGoal;
            const isLast = idx === SCORE_PILLARS.length - 1;
            return (
              <Pressable
                key={p.id}
                onPress={() => setActivePillar(activePillar === p.id ? null : p.id)}
                style={{
                  paddingVertical: 10,
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: colors.hairline,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 6,
                  }}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: `${hueColor(p.color, 0.78)}33`,
                      borderWidth: 1,
                      borderColor: `${hueColor(p.color, 0.78)}55`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Icon name={p.icon} size={13} color={hueColor(p.color, 0.85)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: colors.fg }}>
                        {p.label}
                      </Text>
                      {onGoal && (
                        <Text
                          style={{
                            fontSize: 8,
                            color: colors.ok,
                            fontFamily: monoFont,
                            letterSpacing: 1,
                          }}>
                          ● ON GOAL
                        </Text>
                      )}
                    </View>
                    <Text style={{ fontSize: 10, color: colors.fg3 }}>{p.desc}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: '500',
                        color: hueColor(p.color, 0.9),
                        fontVariant: ['tabular-nums'],
                      }}>
                      {data.value}
                    </Text>
                    <Text
                      style={{
                        fontSize: 9,
                        color: colors.fg3,
                        fontFamily: monoFont,
                      }}>
                      / {data.max}
                    </Text>
                  </View>
                </View>
                {/* Progress bar */}
                <View
                  style={{
                    position: 'relative',
                    height: 5,
                    backgroundColor: colors.hairline,
                    borderRadius: 99,
                  }}>
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: `${pct * 100}%`,
                      backgroundColor: hueColor(p.color, 0.78),
                      borderRadius: 99,
                    }}
                  />
                  <View
                    style={{
                      position: 'absolute',
                      left: `${goalPct * 100}%`,
                      top: -3,
                      height: 11,
                      width: 1.5,
                      backgroundColor: 'rgba(255,255,255,0.5)',
                    }}
                  />
                </View>
                {activePillar === p.id && (
                  <View
                    style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: colors.hairline,
                    }}>
                    <PillarTrend trend={data.trend} color={p.color} />
                    <Text
                      style={{
                        fontSize: 10,
                        color: colors.fg3,
                        marginTop: 6,
                        lineHeight: 14,
                      }}>
                      Weekly goal:{' '}
                      <Text style={{ color: colors.fg2 }}>{data.weeklyGoal}</Text> · 7-day trend
                      shown
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </Tile>

        {/* Backlog */}
        <Tile style={{ marginBottom: 10 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}>
            <Text
              style={{
                fontSize: 9,
                color: colors.fg3,
                fontFamily: monoFont,
                letterSpacing: 1.5,
              }}>
              BACKLOG · {s.backlog.length}
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: colors.ok,
                fontFamily: monoFont,
              }}>
              NO PUNISHMENT
            </Text>
          </View>
          <View
            style={{
              padding: 8,
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: 8,
              marginBottom: 10,
            }}>
            <Text style={{ fontSize: 11, color: colors.fg2, lineHeight: 16 }}>
              Missed things go here gently. Score doesn't drop instantly — you have a 24h window.
              After that, small penalty + a makeup quest worth more.
            </Text>
          </View>
          {s.backlog.map((b) => {
            const pillar = SCORE_PILLARS.find((p) => p.id === b.pillar)!;
            return (
              <View
                key={b.id}
                style={{
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  marginBottom: 6,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      backgroundColor: `${hueColor(pillar.color, 0.78)}33`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 1,
                    }}>
                    <Icon name={pillar.icon} size={10} color={hueColor(pillar.color, 0.85)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: colors.fg }}>
                        {b.title}
                      </Text>
                      {b.gentle && (
                        <View
                          style={{
                            paddingHorizontal: 5,
                            paddingVertical: 1,
                            borderRadius: 99,
                            backgroundColor: colors.accentSoft,
                          }}>
                          <Text
                            style={{
                              fontSize: 7,
                              color: colors.accent,
                              fontFamily: monoFont,
                              letterSpacing: 1,
                            }}>
                            GRACE
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 10, color: colors.fg3, fontFamily: monoFont }}>
                      {b.missed} · {b.cost === 0 ? 'no cost yet' : b.cost + ' nik'}
                    </Text>
                  </View>
                  {b.dismissable && (
                    <Text style={{ fontSize: 11, color: colors.fg3 }}>✕</Text>
                  )}
                </View>
                <View
                  style={{
                    marginTop: 8,
                    padding: 7,
                    borderRadius: 7,
                    backgroundColor: colors.accentSoft,
                    borderWidth: 1,
                    borderColor: colors.accentBorder,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                  <Text style={{ fontSize: 11, color: colors.accent }}>↺ {b.makeup}</Text>
                  <Text
                    style={{
                      fontSize: 9,
                      color: colors.accent,
                      fontFamily: monoFont,
                    }}>
                    DO IT →
                  </Text>
                </View>
              </View>
            );
          })}
        </Tile>

        {/* Recent activity */}
        <Tile>
          <Text
            style={{
              fontSize: 9,
              color: colors.fg3,
              fontFamily: monoFont,
              letterSpacing: 1.5,
              marginBottom: 8,
            }}>
            RECENT MOVEMENTS
          </Text>
          {s.recent.map((r, i) => {
            const pillar = SCORE_PILLARS.find((p) => p.id === r.pillar)!;
            const positive = r.delta > 0;
            return (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingVertical: 7,
                  borderBottomWidth: i < s.recent.length - 1 ? 1 : 0,
                  borderBottomColor: colors.hairline,
                }}>
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: hueColor(pillar.color, 0.85),
                  }}
                />
                <Text style={{ flex: 1, fontSize: 12, color: colors.fg2 }}>{r.source}</Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: positive ? colors.ok : colors.danger,
                    fontFamily: monoFont,
                    fontWeight: '500',
                  }}>
                  {positive ? '+' : ''}
                  {r.delta}
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    color: colors.fg3,
                    fontFamily: monoFont,
                    minWidth: 32,
                    textAlign: 'right',
                  }}>
                  {r.ts}
                </Text>
              </View>
            );
          })}
        </Tile>
      </View>
    </ScrollView>
  );
}

const PillarTrend = ({ trend, color }: { trend: number[]; color: number }) => {
  const w = 280;
  const h = 36;
  const max = Math.max(...trend) * 1.05;
  const min = Math.min(...trend) * 0.95;
  const points = trend.map((v, i) => {
    const x = (i / (trend.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return [x, y] as [number, number];
  });
  const path = points
    .map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1))
    .join(' ');
  const fill = `M0,${h} ` + path.slice(1) + ` L${w},${h} Z`;
  const gradId = `gr${color}`;
  return (
    <Svg width="100%" height={h + 4} viewBox={`0 0 ${w} ${h + 4}`}>
      <Defs>
        <SvgLinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={hueColor(color, 0.78)} stopOpacity="0.4" />
          <Stop offset="1" stopColor={hueColor(color, 0.78)} stopOpacity="0" />
        </SvgLinearGradient>
      </Defs>
      <Path d={fill} fill={`url(#${gradId})`} />
      <Path
        d={path}
        fill="none"
        stroke={hueColor(color, 0.85)}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <Circle
          key={i}
          cx={p[0]}
          cy={p[1]}
          r={i === points.length - 1 ? 2.5 : 1.5}
          fill={hueColor(color, 0.9)}
        />
      ))}
    </Svg>
  );
};
