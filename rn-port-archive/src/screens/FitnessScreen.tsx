import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import Svg, { Rect, Circle, Line, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Tile, Chip, Icon, ScreenHeader } from '../components';
import { colors, hueColor, monoFont } from '../theme';
import type { NavProps } from '../router';

type Exercise = {
  id: string;
  name: string;
  group: string;
  equip: string;
  difficulty: string;
  hue: number;
  pr: string;
  last: string;
};

const EXERCISES: Exercise[] = [
  { id: 'e1', name: 'Bench Press', group: 'Chest', equip: 'Barbell', difficulty: 'Intermediate', hue: 25, pr: '85kg × 5', last: '2d ago' },
  { id: 'e2', name: 'Back Squat', group: 'Legs', equip: 'Barbell', difficulty: 'Advanced', hue: 280, pr: '120kg × 3', last: '4d ago' },
  { id: 'e3', name: 'Deadlift', group: 'Back', equip: 'Barbell', difficulty: 'Advanced', hue: 220, pr: '140kg × 2', last: '1w ago' },
  { id: 'e4', name: 'Pull-up', group: 'Back', equip: 'Bodyweight', difficulty: 'Intermediate', hue: 150, pr: 'BW+15 × 6', last: '1d ago' },
  { id: 'e5', name: 'Overhead Press', group: 'Shoulders', equip: 'Barbell', difficulty: 'Intermediate', hue: 320, pr: '55kg × 5', last: '3d ago' },
  { id: 'e6', name: 'Romanian Deadlift', group: 'Legs', equip: 'Barbell', difficulty: 'Intermediate', hue: 40, pr: '100kg × 8', last: '4d ago' },
  { id: 'e7', name: 'Dumbbell Row', group: 'Back', equip: 'Dumbbell', difficulty: 'Beginner', hue: 200, pr: '32kg × 10', last: '1d ago' },
  { id: 'e8', name: 'Goblet Squat', group: 'Legs', equip: 'Dumbbell', difficulty: 'Beginner', hue: 180, pr: '28kg × 12', last: '5d ago' },
];

const GROUPS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

type Tab = 'coach' | 'library' | 'plan';

export default function FitnessScreen({ onBack }: NavProps) {
  const [tab, setTab] = useState<Tab>('coach');
  const [group, setGroup] = useState('All');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Exercise | null>(null);

  const filtered = EXERCISES.filter(
    (e) =>
      (group === 'All' || e.group === group) &&
      (!query || e.name.toLowerCase().includes(query.toLowerCase())),
  );

  if (selected) {
    return <ExerciseDetail exercise={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 120 }}>
      <ScreenHeader title="Fitness" subtitle="Training · Guided by AI" onBack={onBack} />

      <View style={{ paddingHorizontal: 16 }}>
        {/* Live metrics strip */}
        <Tile
          style={{
            marginBottom: 12,
            padding: 12,
            flexDirection: 'row',
            gap: 10,
            alignItems: 'center',
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.ok,
              }}
            />
            <Text
              style={{
                fontSize: 9,
                color: colors.fg3,
                fontFamily: monoFont,
                letterSpacing: 1.5,
              }}>
              APPLE HEALTH · LIVE
            </Text>
          </View>
          <View style={{ flex: 1 }} />
          {(
            [
              ['HR', '72'],
              ['STEPS', '6.2k'],
              ['KCAL', '480'],
              ['SLEEP', '7.4h'],
            ] as const
          ).map(([k, v]) => (
            <View key={k} style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.accent,
                  fontFamily: monoFont,
                  fontWeight: '600',
                }}>
                {v}
              </Text>
              <Text
                style={{
                  fontSize: 8,
                  color: colors.fg3,
                  fontFamily: monoFont,
                  letterSpacing: 1,
                }}>
                {k}
              </Text>
            </View>
          ))}
        </Tile>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
          {(
            [
              ['coach', 'AI Coach'],
              ['library', 'Library'],
              ['plan', "Today's Plan"],
            ] as const
          ).map(([id, l]) => {
            const active = tab === id;
            return (
              <Pressable
                key={id}
                onPress={() => setTab(id)}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderRadius: 12,
                  backgroundColor: active ? colors.accentSoft : 'rgba(255,255,255,0.04)',
                  borderWidth: 1,
                  borderColor: active ? colors.accentBorder : colors.hairline,
                  alignItems: 'center',
                  opacity: pressed ? 0.85 : 1,
                })}>
                <Text
                  style={{
                    fontSize: 12,
                    color: active ? colors.accent : colors.fg2,
                  }}>
                  {l}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tab === 'coach' && <CoachTab onOpen={setSelected} />}
        {tab === 'library' && (
          <LibraryTab
            group={group}
            setGroup={setGroup}
            query={query}
            setQuery={setQuery}
            filtered={filtered}
            onOpen={setSelected}
          />
        )}
        {tab === 'plan' && <PlanTab onOpen={setSelected} />}
      </View>
    </ScrollView>
  );
}

function CoachTab({ onOpen }: { onOpen: (e: Exercise) => void }) {
  return (
    <View style={{ gap: 10 }}>
      {/* user prompt */}
      <View style={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
        <LinearGradient
          colors={['rgba(167,139,250,0.25)', 'rgba(236,72,153,0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 18,
            borderBottomRightRadius: 4,
            borderWidth: 1,
            borderColor: colors.accentBorder,
          }}>
          <Text style={{ color: colors.fg, fontSize: 13, lineHeight: 19 }}>
            I like bench press — what's the perfect form? Show me.
          </Text>
        </LinearGradient>
      </View>

      <Tile style={{ padding: 14 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Icon name="sparkle" size={14} color={colors.accent} />
          <Text
            style={{
              fontSize: 10,
              color: colors.accent,
              fontFamily: monoFont,
              letterSpacing: 1.5,
            }}>
            NIK · VIA CHATGPT
          </Text>
          <View style={{ flex: 1 }} />
          <Text style={{ fontSize: 9, color: colors.fg3, fontFamily: monoFont }}>2.4s</Text>
        </View>

        <FormDiagram exercise="Bench Press" />

        <Text
          style={{
            color: colors.fg,
            fontSize: 15,
            fontWeight: '500',
            marginTop: 12,
            marginBottom: 4,
          }}>
          Barbell Bench Press · Perfect form
        </Text>
        <Text
          style={{
            color: colors.fg3,
            fontSize: 11,
            fontFamily: monoFont,
            marginBottom: 10,
            letterSpacing: 1,
          }}>
          CHEST · PUSH · INTERMEDIATE
        </Text>

        <View style={{ gap: 8 }}>
          {[
            { n: 1, t: 'Setup', d: 'Lie flat, eyes under the bar. Retract shoulder blades, plant feet firmly.' },
            { n: 2, t: 'Grip', d: 'Hands 1.5x shoulder width, wrists stacked over elbows. Break the bar apart.' },
            { n: 3, t: 'Descent', d: 'Lower to mid-chest with control, elbows at ~70° from torso. 2–3s tempo.' },
            { n: 4, t: 'Press', d: 'Drive up & back toward face. Exhale at the top. Maintain arch & leg drive.' },
          ].map((s) => (
            <View
              key={s.n}
              style={{
                flexDirection: 'row',
                gap: 10,
                paddingHorizontal: 10,
                paddingVertical: 8,
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: 10,
                borderLeftWidth: 2,
                borderLeftColor: colors.accent,
              }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text
                  style={{
                    color: colors.bg,
                    fontWeight: '700',
                    fontSize: 11,
                  }}>
                  {s.n}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.fg }}>{s.t}</Text>
                <Text style={{ fontSize: 11, color: colors.fg2, lineHeight: 16 }}>{s.d}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Common mistakes */}
        <View
          style={{
            marginTop: 12,
            padding: 10,
            backgroundColor: 'rgba(248,113,113,0.08)',
            borderWidth: 1,
            borderColor: 'rgba(248,113,113,0.2)',
            borderRadius: 10,
          }}>
          <Text
            style={{
              fontSize: 10,
              color: colors.danger,
              fontFamily: monoFont,
              letterSpacing: 1,
              marginBottom: 6,
            }}>
            AVOID
          </Text>
          <Text style={{ fontSize: 11, color: colors.fg2, lineHeight: 16 }}>
            <Text style={{ fontWeight: '700' }}>Flared elbows</Text> (90°) → shoulder stress ·{' '}
            <Text style={{ fontWeight: '700' }}>Bouncing</Text> the bar ·{' '}
            <Text style={{ fontWeight: '700' }}>Lifting feet</Text> → loss of drive
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          <Pressable
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 99,
              backgroundColor: colors.accentSoft,
              borderWidth: 1,
              borderColor: colors.accentBorder,
              opacity: pressed ? 0.8 : 1,
            })}>
            <Text style={{ fontSize: 11, color: colors.accent, fontWeight: '500' }}>
              Add to today's workout
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onOpen(EXERCISES[0])}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 99,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderWidth: 1,
              borderColor: colors.hairline,
              opacity: pressed ? 0.8 : 1,
            })}>
            <Text style={{ fontSize: 11, color: colors.fg2 }}>Full detail →</Text>
          </Pressable>
        </View>
      </Tile>

      {/* Suggestions */}
      <Text
        style={{
          fontSize: 10,
          color: colors.fg3,
          fontFamily: monoFont,
          letterSpacing: 1,
          marginTop: 6,
        }}>
        TRY ASKING
      </Text>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        {[
          'Build me a 4-day push/pull/legs',
          'Why am I plateauing on squat?',
          'Show deadlift cues',
          '30-min hotel workout',
        ].map((s) => (
          <Pressable
            key={s}
            style={({ pressed }) => ({
              paddingHorizontal: 11,
              paddingVertical: 7,
              borderRadius: 99,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.hairline,
              opacity: pressed ? 0.8 : 1,
            })}>
            <Text style={{ fontSize: 11, color: colors.fg2 }}>{s}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function FormDiagram({ exercise }: { exercise: string }) {
  return (
    <View
      style={{
        aspectRatio: 16 / 10,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#15151c',
        borderWidth: 1,
        borderColor: colors.accentBorder,
        position: 'relative',
      }}>
      <View
        style={{
          position: 'absolute',
          top: 10,
          left: 14,
        }}>
        <Text
          style={{
            fontSize: 9,
            fontFamily: monoFont,
            color: colors.accent,
            letterSpacing: 1.5,
          }}>
          CHATGPT · FORM DEMO
        </Text>
      </View>
      <View
        style={{
          position: 'absolute',
          top: 10,
          right: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        }}>
        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.ok }} />
        <Text
          style={{
            fontSize: 9,
            fontFamily: monoFont,
            color: colors.ok,
            letterSpacing: 1.5,
          }}>
          LOOPING
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Svg viewBox="0 0 200 120" width="70%" height="80%">
          {/* Bench */}
          <Rect x={40} y={82} width={120} height={6} rx={2} fill="rgba(255,255,255,0.2)" />
          <Rect x={50} y={88} width={4} height={18} fill="rgba(255,255,255,0.2)" />
          <Rect x={146} y={88} width={4} height={18} fill="rgba(255,255,255,0.2)" />
          {/* Body */}
          <G>
            <Circle cx={55} cy={75} r={6} fill="none" stroke={colors.accent} strokeWidth={1.5} />
            <Line x1={62} y1={77} x2={130} y2={78} stroke={colors.accent} strokeWidth={1.5} />
            <Circle cx={130} cy={78} r={2.5} fill={colors.accent} />
            <Line x1={130} y1={78} x2={150} y2={85} stroke={colors.accent} strokeWidth={1.5} />
            <Line x1={150} y1={85} x2={150} y2={110} stroke={colors.accent} strokeWidth={1.5} />
            <Line x1={130} y1={78} x2={145} y2={88} stroke={colors.accent} strokeWidth={1.5} />
            <Line x1={145} y1={88} x2={145} y2={110} stroke={colors.accent} strokeWidth={1.5} />
            {/* Arms + bar */}
            <Line x1={80} y1={77} x2={80} y2={55} stroke={colors.accent} strokeWidth={2} />
            <Line x1={80} y1={55} x2={80} y2={38} stroke={colors.accent} strokeWidth={2} />
            <Rect x={45} y={35} width={70} height={3} rx={1.5} fill={colors.accent} />
            <Circle cx={45} cy={36.5} r={6} fill={colors.accent2} />
            <Circle cx={115} cy={36.5} r={6} fill={colors.accent2} />
          </G>
        </Svg>
      </View>
      <View
        style={{
          position: 'absolute',
          bottom: 10,
          left: 14,
          right: 14,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <Text style={{ fontSize: 9, fontFamily: monoFont, color: colors.flame }}>
          ◀ ECCENTRIC 2s
        </Text>
        <Text style={{ fontSize: 9, fontFamily: monoFont, color: colors.fg3 }}>
          {exercise.toUpperCase()}
        </Text>
        <Text style={{ fontSize: 9, fontFamily: monoFont, color: colors.ok }}>
          CONCENTRIC 1s ▶
        </Text>
      </View>
    </View>
  );
}

function LibraryTab({
  group,
  setGroup,
  query,
  setQuery,
  filtered,
  onOpen,
}: {
  group: string;
  setGroup: (g: string) => void;
  query: string;
  setQuery: (q: string) => void;
  filtered: Exercise[];
  onOpen: (e: Exercise) => void;
}) {
  return (
    <View>
      {/* Search */}
      <Tile
        style={{
          paddingHorizontal: 12,
          paddingVertical: 6,
          marginBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          borderRadius: 99,
        }}>
        <Icon name="compass" size={14} color={colors.fg3} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search 240+ exercises…"
          placeholderTextColor={colors.fg3}
          style={{ flex: 1, color: colors.fg, fontSize: 12, paddingVertical: 6 }}
        />
        <Icon name="mic" size={14} color={colors.accent} />
      </Tile>

      {/* Group filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6, paddingBottom: 4 }}
        style={{ marginBottom: 12 }}>
        {GROUPS.map((g) => {
          const active = group === g;
          return (
            <Pressable
              key={g}
              onPress={() => setGroup(g)}
              style={({ pressed }) => ({
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 99,
                backgroundColor: active ? colors.accentSoft : 'rgba(255,255,255,0.04)',
                borderWidth: 1,
                borderColor: active ? colors.accentBorder : colors.hairline,
                opacity: pressed ? 0.8 : 1,
              })}>
              <Text style={{ fontSize: 11, color: active ? colors.accent : colors.fg2 }}>
                {g}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Cards */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {filtered.map((e) => (
          <Pressable
            key={e.id}
            onPress={() => onOpen(e)}
            style={({ pressed }) => ({
              width: '48%',
              opacity: pressed ? 0.85 : 1,
            })}>
            <Tile style={{ padding: 10 }}>
              <View
                style={{
                  aspectRatio: 4 / 3,
                  borderRadius: 10,
                  marginBottom: 8,
                  overflow: 'hidden',
                  backgroundColor: '#1c1c24',
                  borderWidth: 1,
                  borderColor: `${hueColor(e.hue, 0.85, 0.16)}55`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}>
                <Text
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    fontSize: 7,
                    fontFamily: monoFont,
                    color: hueColor(e.hue, 0.9),
                    letterSpacing: 1,
                  }}>
                  {e.group.toUpperCase()}
                </Text>
                <Icon name="dumbbell" size={30} color={hueColor(e.hue, 0.9)} strokeWidth={1.4} />
                <Text
                  style={{
                    position: 'absolute',
                    bottom: 6,
                    right: 6,
                    fontSize: 7,
                    fontFamily: monoFont,
                    color: colors.fg3,
                    paddingHorizontal: 5,
                    paddingVertical: 2,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    borderRadius: 4,
                  }}>
                  GIF
                </Text>
              </View>
              <Text
                style={{ fontSize: 12, fontWeight: '500', color: colors.fg }}
                numberOfLines={1}>
                {e.name}
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  color: colors.fg3,
                  fontFamily: monoFont,
                  marginTop: 2,
                }}
                numberOfLines={1}>
                PR {e.pr} · {e.last}
              </Text>
            </Tile>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => ({
          marginTop: 12,
          padding: 14,
          borderRadius: 14,
          backgroundColor: colors.accentSoft,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: colors.accentBorder,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: pressed ? 0.8 : 1,
        })}>
        <Icon name="sparkle" size={14} color={colors.accent} />
        <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '500' }}>
          Ask ChatGPT for a new exercise
        </Text>
      </Pressable>
    </View>
  );
}

function PlanTab({ onOpen }: { onOpen: (e: Exercise) => void }) {
  const today: { name: string; sets: string; weight: string; status: 'done' | 'active' | 'pending'; ex: Exercise }[] = [
    { name: 'Bench Press', sets: '5 × 5', weight: '82.5kg', status: 'done', ex: EXERCISES[0] },
    { name: 'Incline DB Press', sets: '4 × 8', weight: '24kg', status: 'active', ex: EXERCISES[0] },
    { name: 'Cable Flyes', sets: '3 × 12', weight: '18kg', status: 'pending', ex: EXERCISES[0] },
    { name: 'Tricep Rope Pushdown', sets: '4 × 10', weight: '28kg', status: 'pending', ex: EXERCISES[0] },
  ];
  return (
    <View>
      <Tile style={{ marginBottom: 12, padding: 14 }}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text
              style={{
                fontSize: 10,
                color: colors.accent,
                fontFamily: monoFont,
                letterSpacing: 1.5,
              }}>
              DAY 3 / 7 · PUSH
            </Text>
            <Text style={{ fontSize: 18, fontWeight: '500', color: colors.fg, marginTop: 4 }}>
              Chest & Triceps
            </Text>
            <Text style={{ fontSize: 11, color: colors.fg2, marginTop: 2 }}>
              4 exercises · ~52 min · 14,200kg volume
            </Text>
          </View>
          <Chip tone="accent" size="md">
            +180 XP
          </Chip>
        </View>
        <View
          style={{
            height: 3,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 99,
            marginTop: 12,
            overflow: 'hidden',
          }}>
          <LinearGradient
            colors={[colors.accent, colors.accent2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: '100%', width: '25%', borderRadius: 99 }}
          />
        </View>
      </Tile>

      {today.map((x, i) => (
        <Pressable
          key={i}
          onPress={() => onOpen(x.ex)}
          style={({ pressed }) => ({ marginBottom: 8, opacity: pressed ? 0.85 : 1 })}>
          <Tile
            style={{
              padding: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              opacity: x.status === 'done' ? 0.6 : 1,
            }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor:
                  x.status === 'done'
                    ? colors.okSoft
                    : x.status === 'active'
                    ? colors.accentSoft
                    : 'rgba(255,255,255,0.04)',
                borderWidth: 1,
                borderColor:
                  x.status === 'done'
                    ? 'rgba(52,211,153,0.4)'
                    : x.status === 'active'
                    ? colors.accentBorder
                    : colors.hairline,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {x.status === 'done' ? (
                <Icon name="check" size={14} color={colors.ok} />
              ) : x.status === 'active' ? (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.accent,
                  }}
                />
              ) : (
                <Text
                  style={{ fontFamily: monoFont, fontSize: 11, color: colors.fg3 }}>
                  {i + 1}
                </Text>
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: colors.fg }}>{x.name}</Text>
              <Text
                style={{
                  fontSize: 10,
                  color: colors.fg3,
                  fontFamily: monoFont,
                  marginTop: 2,
                }}>
                {x.sets} @ {x.weight}
              </Text>
            </View>
            <Icon name="chevR" size={14} color={colors.fg3} />
          </Tile>
        </Pressable>
      ))}
    </View>
  );
}

function ExerciseDetail({
  exercise,
  onBack,
}: {
  exercise: Exercise;
  onBack: () => void;
}) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 120 }}>
      <ScreenHeader title={exercise.name} subtitle="Exercise" onBack={onBack} />
      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          <Chip tone="accent">{exercise.group}</Chip>
          <Chip tone="neutral">{exercise.equip}</Chip>
          <Chip tone="warn">{exercise.difficulty}</Chip>
        </View>

        <FormDiagram exercise={exercise.name} />

        <Tile style={{ padding: 12, marginTop: 12 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}>
            <View>
              <Text
                style={{
                  fontSize: 10,
                  color: colors.fg3,
                  fontFamily: monoFont,
                  letterSpacing: 1,
                }}>
                PERSONAL BEST
              </Text>
              <Text style={{ fontSize: 22, fontWeight: '600', color: colors.fg }}>
                {exercise.pr}
              </Text>
            </View>
            <Chip tone="ok" size="md">
              ↑ 8% this month
            </Chip>
          </View>
          <View
            style={{
              flexDirection: 'row',
              gap: 4,
              alignItems: 'flex-end',
              height: 40,
            }}>
            {[0.3, 0.45, 0.4, 0.55, 0.6, 0.5, 0.7, 0.65, 0.75, 0.8, 0.85, 1].map((v, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: `${v * 100}%`,
                  borderRadius: 3,
                  backgroundColor: hueColor(280, 0.6 + v * 0.3),
                }}
              />
            ))}
          </View>
        </Tile>

        <Pressable
          style={({ pressed }) => ({ marginTop: 14, opacity: pressed ? 0.85 : 1 })}>
          <LinearGradient
            colors={[colors.accent, colors.accent2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              padding: 14,
              borderRadius: 12,
              alignItems: 'center',
            }}>
            <Text style={{ color: colors.bg, fontWeight: '600', fontSize: 14 }}>Log a set</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </ScrollView>
  );
}
