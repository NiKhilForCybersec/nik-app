import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Tile, ScreenHeader } from '../components';
import { colors, hueColor, monoFont } from '../theme';
import type { NavProps } from '../router';

type SleepStage = 'awake' | 'rem' | 'light' | 'deep';

type StageSegment = { stage: SleepStage; start: number; end: number };
type Dream = { date: string; tag: string; mood: string; text: string };

const SLEEP_DATA: {
  lastNight: { score: number; hours: number; deep: number; rem: number; light: number; awake: number };
  trend7: number[];
  bedtime: string;
  wake: string;
  goal: number;
  stages: StageSegment[];
  dreams: Dream[];
} = {
  lastNight: { score: 84, hours: 7.4, deep: 1.6, rem: 1.9, light: 3.4, awake: 0.5 },
  trend7: [78, 72, 88, 65, 91, 80, 84],
  bedtime: '23:15',
  wake: '06:45',
  goal: 8,
  stages: [
    { stage: 'awake', start: 0, end: 4 },
    { stage: 'light', start: 4, end: 32 },
    { stage: 'deep', start: 32, end: 50 },
    { stage: 'light', start: 50, end: 68 },
    { stage: 'rem', start: 68, end: 92 },
    { stage: 'awake', start: 92, end: 100 },
  ],
  dreams: [
    {
      date: 'Last night',
      tag: 'vivid',
      mood: 'curious',
      text: "Walked through a library where each book was a different season. The librarian had Meera's laugh.",
    },
    {
      date: '2 nights ago',
      tag: 'fragment',
      mood: 'unsettled',
      text: 'Running but the floor kept changing texture. Woke up at 4:12.',
    },
    {
      date: '4 nights ago',
      tag: 'lucid',
      mood: 'calm',
      text: 'Realized I was dreaming, looked at my hands. Stayed for what felt like an hour.',
    },
  ],
};

const HUE = 260;

const STAGE_COLORS: Record<SleepStage, string> = {
  awake: hueColor(30, 0.7, 0.18),
  rem: hueColor(HUE, 0.7, 0.18),
  light: hueColor(HUE, 0.6, 0.12),
  deep: hueColor(HUE, 0.45, 0.15),
};

type Tab = 'overview' | 'wind-down' | 'dreams' | 'alarm';

const WIND_DOWN_STEPS = [
  { t: '22:30', label: 'Dim lights to 30%' },
  { t: '22:45', label: 'Last sip of water' },
  { t: '23:00', label: 'Phone → Do Not Disturb' },
  { t: '23:10', label: '5-min breathing · 4-7-8' },
  { t: '23:15', label: 'Lights out' },
];

const SOUNDS = ['Rain on a tin roof', 'Brown noise', 'Forest at dusk', 'Tibetan bowls'];

const ALARM_OPTIONS: [string, boolean][] = [
  ['Soft chimes — fade in 3 min', true],
  ['Birdsong + light increase', false],
  ['Vibration only', false],
];

export default function SleepScreen({ onBack }: NavProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const [windDownActive, setWindDownActive] = useState(false);
  const s = SLEEP_DATA;

  const ringR = 40;
  const ringC = 2 * Math.PI * ringR;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 100 }}>
      <ScreenHeader title="Sleep" subtitle="LAST NIGHT" onBack={onBack} />

      <View style={{ paddingHorizontal: 16 }}>
        {/* Score ring */}
        <Tile
          style={{
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}>
          <View style={{ width: 96, height: 96 }}>
            <Svg width={96} height={96}>
              <Circle
                cx={48}
                cy={48}
                r={ringR}
                fill="none"
                stroke={colors.hairline}
                strokeWidth={6}
              />
              <Circle
                cx={48}
                cy={48}
                r={ringR}
                fill="none"
                stroke={hueColor(HUE, 0.7, 0.15)}
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray={`${(s.lastNight.score / 100) * ringC} ${ringC}`}
                transform="rotate(-90 48 48)"
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
                  color: hueColor(HUE, 0.92, 0.14),
                  lineHeight: 26,
                }}>
                {s.lastNight.score}
              </Text>
              <Text
                style={{
                  fontSize: 8,
                  color: colors.fg3,
                  fontFamily: monoFont,
                  marginTop: 2,
                }}>
                SCORE
              </Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: '500', color: colors.fg }}>
              {s.lastNight.hours}h
            </Text>
            <Text style={{ fontSize: 11, color: colors.fg2, marginTop: 2 }}>
              {s.bedtime} → {s.wake}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: colors.fg3,
                fontFamily: monoFont,
                marginTop: 6,
                lineHeight: 16,
              }}>
              DEEP <Text style={{ color: colors.fg }}>{s.lastNight.deep}h</Text> · REM{' '}
              <Text style={{ color: colors.fg }}>{s.lastNight.rem}h</Text>
            </Text>
          </View>
        </Tile>

        {/* Tabs */}
        <View
          style={{
            flexDirection: 'row',
            gap: 4,
            marginBottom: 12,
            padding: 3,
            backgroundColor: colors.surface,
            borderRadius: 12,
          }}>
          {(
            [
              ['overview', 'Stages'],
              ['wind-down', 'Wind-down'],
              ['dreams', 'Dreams'],
              ['alarm', 'Alarm'],
            ] as [Tab, string][]
          ).map(([k, l]) => {
            const sel = tab === k;
            return (
              <Pressable
                key={k}
                onPress={() => setTab(k)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 4,
                  borderRadius: 9,
                  alignItems: 'center',
                  backgroundColor: sel ? colors.accentSoft : 'transparent',
                }}>
                <Text
                  style={{
                    fontSize: 11,
                    color: sel ? colors.accent : colors.fg2,
                    fontWeight: sel ? '600' : '400',
                  }}>
                  {l}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tab === 'overview' && (
          <>
            {/* Hypnogram */}
            <Tile style={{ marginBottom: 10 }}>
              <Text
                style={{
                  fontSize: 10,
                  color: colors.fg3,
                  fontFamily: monoFont,
                  letterSpacing: 1.5,
                  marginBottom: 10,
                }}>
                HYPNOGRAM · 7H 24M
              </Text>
              <View style={{ height: 80 }}>
                {(['awake', 'rem', 'light', 'deep'] as SleepStage[]).map((stage, row) => (
                  <View
                    key={stage}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: row * 20,
                      height: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                    <Text
                      style={{
                        width: 36,
                        fontSize: 9,
                        color: colors.fg3,
                        fontFamily: monoFont,
                        letterSpacing: 1,
                      }}>
                      {stage.toUpperCase()}
                    </Text>
                    <View style={{ flex: 1, position: 'relative', height: 14 }}>
                      {s.stages
                        .filter((seg) => seg.stage === stage)
                        .map((seg, i) => (
                          <View
                            key={i}
                            style={{
                              position: 'absolute',
                              left: `${seg.start}%`,
                              width: `${seg.end - seg.start}%`,
                              top: 0,
                              bottom: 0,
                              backgroundColor: STAGE_COLORS[stage],
                              borderRadius: 3,
                            }}
                          />
                        ))}
                    </View>
                  </View>
                ))}
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 8,
                  paddingLeft: 42,
                }}>
                {['23:15', '02:00', '04:30', '06:45'].map((t) => (
                  <Text
                    key={t}
                    style={{
                      fontSize: 9,
                      color: colors.fg3,
                      fontFamily: monoFont,
                    }}>
                    {t}
                  </Text>
                ))}
              </View>
            </Tile>

            {/* 7 day trend */}
            <Tile style={{ marginBottom: 10 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  marginBottom: 10,
                }}>
                <Text
                  style={{
                    fontSize: 10,
                    color: colors.fg3,
                    fontFamily: monoFont,
                    letterSpacing: 1.5,
                  }}>
                  LAST 7 NIGHTS
                </Text>
                <Text style={{ fontSize: 11, color: colors.ok }}>+6 vs avg</Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  gap: 8,
                  height: 70,
                }}>
                {s.trend7.map((v, i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      gap: 4,
                    }}>
                    {i === 6 ? (
                      <LinearGradient
                        colors={[hueColor(HUE, 0.78), hueColor(HUE, 0.55, 0.2)]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={{
                          width: '100%',
                          height: (v / 100) * 60,
                          borderRadius: 4,
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          width: '100%',
                          height: (v / 100) * 60,
                          backgroundColor: `${hueColor(HUE, 0.78)}40`,
                          borderRadius: 4,
                        }}
                      />
                    )}
                    <Text
                      style={{
                        fontSize: 9,
                        color: colors.fg3,
                        fontFamily: monoFont,
                      }}>
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                    </Text>
                  </View>
                ))}
              </View>
            </Tile>

            <Tile style={{ backgroundColor: colors.accentSoft, borderColor: colors.accentBorder }}>
              <Text
                style={{
                  fontSize: 10,
                  color: colors.fg3,
                  fontFamily: monoFont,
                  letterSpacing: 1.5,
                  marginBottom: 4,
                }}>
                NIK NOTICED
              </Text>
              <Text style={{ fontSize: 12, color: colors.fg, lineHeight: 18 }}>
                Your deep sleep peaks when you're in bed before{' '}
                <Text style={{ fontWeight: '700' }}>23:00</Text>. You missed that window 3 of the
                last 7 nights.
              </Text>
            </Tile>
          </>
        )}

        {tab === 'wind-down' && (
          <>
            <Tile style={{ marginBottom: 10 }}>
              <Text
                style={{
                  fontSize: 10,
                  color: colors.fg3,
                  fontFamily: monoFont,
                  letterSpacing: 1.5,
                  marginBottom: 8,
                }}>
                STARTS IN 47 MIN
              </Text>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '500',
                  color: colors.fg,
                  marginBottom: 12,
                }}>
                Tonight's wind-down
              </Text>
              <View style={{ gap: 6, marginBottom: 14 }}>
                {WIND_DOWN_STEPS.map((step, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingVertical: 8,
                      paddingHorizontal: 10,
                      borderRadius: 10,
                      backgroundColor: 'rgba(255,255,255,0.04)',
                    }}>
                    <Text
                      style={{
                        fontSize: 10,
                        color: colors.fg2,
                        fontFamily: monoFont,
                        width: 38,
                      }}>
                      {step.t}
                    </Text>
                    <Text style={{ flex: 1, fontSize: 12, color: colors.fg }}>{step.label}</Text>
                    <View
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        borderWidth: 1.5,
                        borderColor: colors.hairlineStrong,
                      }}
                    />
                  </View>
                ))}
              </View>
              <Pressable onPress={() => setWindDownActive(!windDownActive)}>
                {windDownActive ? (
                  <View
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: colors.accentSoft,
                      borderWidth: 1,
                      borderColor: colors.accentBorder,
                      alignItems: 'center',
                    }}>
                    <Text style={{ fontWeight: '600', fontSize: 13, color: colors.accent }}>
                      Active · Nik is guiding you
                    </Text>
                  </View>
                ) : (
                  <LinearGradient
                    colors={[hueColor(HUE, 0.78), hueColor(HUE, 0.55, 0.2)]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ padding: 12, borderRadius: 12, alignItems: 'center' }}>
                    <Text style={{ fontWeight: '600', fontSize: 13, color: '#06060a' }}>
                      Start now
                    </Text>
                  </LinearGradient>
                )}
              </Pressable>
            </Tile>

            <Tile>
              <Text
                style={{
                  fontSize: 10,
                  color: colors.fg3,
                  fontFamily: monoFont,
                  letterSpacing: 1.5,
                  marginBottom: 8,
                }}>
                SOUNDS
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {SOUNDS.map((sound) => (
                  <Pressable
                    key={sound}
                    style={{
                      width: '48.5%',
                      padding: 10,
                      borderRadius: 10,
                      backgroundColor: 'rgba(255,255,255,0.04)',
                    }}>
                    <Text style={{ fontSize: 11, color: colors.fg2 }}>{sound}</Text>
                  </Pressable>
                ))}
              </View>
            </Tile>
          </>
        )}

        {tab === 'dreams' && (
          <View style={{ gap: 8 }}>
            {s.dreams.map((d, i) => (
              <Tile key={i}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}>
                  <Text
                    style={{
                      fontSize: 10,
                      color: colors.fg3,
                      fontFamily: monoFont,
                      letterSpacing: 1,
                    }}>
                    {d.date.toUpperCase()}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 5 }}>
                    <View
                      style={{
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 99,
                        backgroundColor: colors.accentSoft,
                      }}>
                      <Text
                        style={{
                          fontSize: 9,
                          color: colors.accent,
                          fontFamily: monoFont,
                          letterSpacing: 0.5,
                        }}>
                        {d.tag.toUpperCase()}
                      </Text>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 99,
                        backgroundColor: 'rgba(255,255,255,0.04)',
                      }}>
                      <Text
                        style={{
                          fontSize: 9,
                          color: colors.fg2,
                          fontFamily: monoFont,
                          letterSpacing: 0.5,
                        }}>
                        {d.mood.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={{ fontSize: 13, color: colors.fg, lineHeight: 20 }}>{d.text}</Text>
              </Tile>
            ))}
            <Pressable
              style={{
                padding: 14,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: colors.hairlineStrong,
                borderStyle: 'dashed',
                alignItems: 'center',
              }}>
              <Text style={{ fontSize: 12, color: colors.fg2 }}>
                + Voice-record this morning's dream
              </Text>
            </Pressable>
          </View>
        )}

        {tab === 'alarm' && (
          <>
            <Tile style={{ marginBottom: 10, alignItems: 'center', paddingVertical: 18 }}>
              <Text
                style={{
                  fontSize: 10,
                  color: colors.fg3,
                  fontFamily: monoFont,
                  letterSpacing: 1.5,
                  marginBottom: 6,
                }}>
                SMART WAKE · 06:30 → 06:50
              </Text>
              <Text
                style={{
                  fontSize: 42,
                  fontWeight: '500',
                  color: hueColor(HUE, 0.9, 0.14),
                  lineHeight: 46,
                }}>
                06:45
              </Text>
              <Text style={{ fontSize: 12, color: colors.fg2, marginTop: 6, textAlign: 'center' }}>
                Wakes you in your lightest sleep within the window.
              </Text>
            </Tile>
            <Tile>
              <Text
                style={{
                  fontSize: 10,
                  color: colors.fg3,
                  fontFamily: monoFont,
                  letterSpacing: 1.5,
                  marginBottom: 8,
                }}>
                WAKE WITH
              </Text>
              <View style={{ gap: 6 }}>
                {ALARM_OPTIONS.map(([l, on], i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 10,
                      borderRadius: 10,
                      backgroundColor: 'rgba(255,255,255,0.04)',
                    }}>
                    <Text style={{ fontSize: 12, color: colors.fg }}>{l}</Text>
                    <View
                      style={{
                        width: 32,
                        height: 18,
                        borderRadius: 99,
                        backgroundColor: on ? hueColor(HUE, 0.7, 0.15) : colors.hairlineStrong,
                        position: 'relative',
                      }}>
                      <View
                        style={{
                          position: 'absolute',
                          top: 2,
                          left: on ? 16 : 2,
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          backgroundColor: '#fff',
                        }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </Tile>
          </>
        )}
      </View>
    </ScrollView>
  );
}
