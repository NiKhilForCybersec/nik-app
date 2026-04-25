import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon } from 'react-native-svg';
import { Tile } from '../components';
import { colors, hueColor, monoFont } from '../theme';
import type { NavProps } from '../router';

const ONBOARD_STEPS = [
  'hello',
  'name',
  'family',
  'rhythm',
  'permissions',
  'voice',
  'theme',
  'ready',
] as const;

type StepKey = (typeof ONBOARD_STEPS)[number];

type PermKey = 'health' | 'calendar' | 'location' | 'contacts';

type OnbData = {
  name: string;
  role: 'solo' | 'parent' | 'couple' | 'family';
  kids: number;
  partner: boolean;
  chronotype: 'early' | 'balanced' | 'night';
  perms: Record<PermKey, boolean>;
  voice: 'morning' | 'crisp' | 'warm' | 'mute';
  theme: 'noir' | 'dawn' | 'forest' | 'ghibli';
};

const ROLES: [OnbData['role'], string][] = [
  ['solo', 'Just me'],
  ['parent', 'Me + kids'],
  ['couple', 'Me + partner'],
  ['family', 'Whole family'],
];

const CHRONOTYPES: { k: OnbData['chronotype']; t: string; sub: string; icon: string }[] = [
  { k: 'early', t: 'Early bird', sub: 'Up before 6, in bed by 22:00', icon: '🌅' },
  { k: 'balanced', t: 'Steady', sub: 'Wake 6:30–7:30, sleep around 23:00', icon: '☀️' },
  { k: 'night', t: 'Night owl', sub: 'Up past midnight, slow morning', icon: '🌙' },
];

const PERMS: { k: PermKey; t: string; sub: string }[] = [
  { k: 'health', t: 'Health & fitness', sub: 'Sleep, steps, workouts' },
  { k: 'calendar', t: 'Calendar', sub: 'Read events to plan your day' },
  { k: 'location', t: 'Location', sub: 'Geofenced reminders, errand routing' },
  { k: 'contacts', t: 'Contacts', sub: 'Birthday + check-in nudges' },
];

const VOICES: { k: OnbData['voice']; t: string; sub: string }[] = [
  { k: 'morning', t: 'Morning calm', sub: 'Soft, slower, low-stim' },
  { k: 'crisp', t: 'Crisp', sub: 'Clear, efficient, gets to it' },
  { k: 'warm', t: 'Warm', sub: 'Like a thoughtful friend' },
  { k: 'mute', t: 'No voice', sub: 'Read, never speak' },
];

const THEMES: { k: OnbData['theme']; t: string; g: [string, string] }[] = [
  { k: 'noir', t: 'Nik Noir', g: [hueColor(280, 0.18, 0.04), hueColor(280, 0.32, 0.16)] },
  { k: 'dawn', t: 'Soft Dawn', g: [hueColor(60, 0.92, 0.05), hueColor(30, 0.85, 0.1)] },
  { k: 'forest', t: 'Forest', g: [hueColor(150, 0.2, 0.06), hueColor(150, 0.4, 0.13)] },
  { k: 'ghibli', t: 'Studio', g: [hueColor(200, 0.85, 0.07), hueColor(140, 0.7, 0.13)] },
];

export default function OnboardScreen({ onNav }: NavProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnbData>({
    name: '',
    role: 'parent',
    kids: 2,
    partner: true,
    chronotype: 'balanced',
    perms: { health: false, calendar: false, location: false, contacts: false },
    voice: 'morning',
    theme: 'noir',
  });

  const next = () => setStep((s) => Math.min(ONBOARD_STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const set = (patch: Partial<OnbData>) => setData((d) => ({ ...d, ...patch }));
  const cur: StepKey = ONBOARD_STEPS[step];
  const isLast = step === ONBOARD_STEPS.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 32,
          paddingBottom: 24,
          flexGrow: 1,
        }}>
        {/* Progress */}
        <View style={{ flexDirection: 'row', gap: 4, marginBottom: 28 }}>
          {ONBOARD_STEPS.map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 2,
                borderRadius: 99,
                backgroundColor: i <= step ? colors.accent : colors.hairline,
              }}
            />
          ))}
        </View>

        <View style={{ flex: 1, justifyContent: 'center' }}>
          {cur === 'hello' && (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
              <View
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  marginBottom: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <LinearGradient
                  colors={[colors.accent, colors.accent2]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 70,
                    opacity: 0.5,
                  }}
                />
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: hueColor(280, 0.95, 0.05),
                  }}
                />
              </View>
              <Text style={{ color: colors.fg, fontSize: 36, fontWeight: '500', marginBottom: 12 }}>
                I'm Nik.
              </Text>
              <Text
                style={{
                  color: colors.fg2,
                  fontSize: 15,
                  lineHeight: 22,
                  maxWidth: 280,
                  textAlign: 'center',
                }}>
                I'm here to hold the small things so you don't have to. Let's set up.
              </Text>
            </View>
          )}

          {cur === 'name' && (
            <View>
              <Text
                style={{ color: colors.fg, fontSize: 28, fontWeight: '500', marginBottom: 8 }}>
                What should I call you?
              </Text>
              <Text style={{ color: colors.fg2, fontSize: 13, marginBottom: 24 }}>
                Your first name is plenty.
              </Text>
              <TextInput
                value={data.name}
                onChangeText={(v) => set({ name: v })}
                placeholder="e.g. Ravi"
                placeholderTextColor={colors.fg3}
                autoFocus
                style={{
                  backgroundColor: colors.surfaceStrong,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  borderRadius: 14,
                  paddingHorizontal: 18,
                  paddingVertical: 16,
                  fontSize: 18,
                  color: colors.fg,
                }}
              />
            </View>
          )}

          {cur === 'family' && (
            <View>
              <Text
                style={{ color: colors.fg, fontSize: 28, fontWeight: '500', marginBottom: 8 }}>
                Who are you running things for?
              </Text>
              <Text style={{ color: colors.fg2, fontSize: 13, marginBottom: 24 }}>
                This shapes the family ops surface.
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {ROLES.map(([k, l]) => {
                  const active = data.role === k;
                  return (
                    <Pressable
                      key={k}
                      onPress={() => set({ role: k })}
                      style={{
                        width: '48%',
                        paddingVertical: 14,
                        borderRadius: 14,
                        backgroundColor: active ? colors.accentSoft : colors.surfaceStrong,
                        borderWidth: 1,
                        borderColor: active ? colors.accent : colors.hairline,
                        alignItems: 'center',
                      }}>
                      <Text
                        style={{
                          fontSize: 13,
                          color: active ? colors.accent : colors.fg,
                          fontWeight: active ? '600' : '400',
                        }}>
                        {l}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {(data.role === 'parent' || data.role === 'family') && (
                <Tile>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.fg3,
                      fontFamily: monoFont,
                      letterSpacing: 1.5,
                      marginBottom: 8,
                    }}>
                    HOW MANY KIDS
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {[1, 2, 3, 4].map((n) => {
                      const active = data.kids === n;
                      return (
                        <Pressable
                          key={n}
                          onPress={() => set({ kids: n })}
                          style={{
                            flex: 1,
                            paddingVertical: 10,
                            borderRadius: 10,
                            backgroundColor: active ? colors.accent : colors.bg,
                            alignItems: 'center',
                          }}>
                          <Text
                            style={{
                              fontSize: 14,
                              color: active ? '#06060e' : colors.fg,
                              fontWeight: '600',
                            }}>
                            {n}
                            {n === 4 ? '+' : ''}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Tile>
              )}
            </View>
          )}

          {cur === 'rhythm' && (
            <View>
              <Text
                style={{ color: colors.fg, fontSize: 28, fontWeight: '500', marginBottom: 8 }}>
                What's your rhythm?
              </Text>
              <Text style={{ color: colors.fg2, fontSize: 13, marginBottom: 24 }}>
                So I time the brief and wind-down right.
              </Text>
              {CHRONOTYPES.map((o) => {
                const active = data.chronotype === o.k;
                return (
                  <Pressable
                    key={o.k}
                    onPress={() => set({ chronotype: o.k })}
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      backgroundColor: active ? colors.accentSoft : colors.surfaceStrong,
                      borderWidth: 1,
                      borderColor: active ? colors.accent : 'transparent',
                      marginBottom: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                    }}>
                    <Text style={{ fontSize: 26 }}>{o.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ fontSize: 14, color: colors.fg, fontWeight: '500' }}>
                        {o.t}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.fg3, marginTop: 2 }}>
                        {o.sub}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {cur === 'permissions' && (
            <View>
              <Text
                style={{ color: colors.fg, fontSize: 28, fontWeight: '500', marginBottom: 8 }}>
                What can I see?
              </Text>
              <Text style={{ color: colors.fg2, fontSize: 13, marginBottom: 24 }}>
                You're in charge. Toggle anything off later.
              </Text>
              {PERMS.map((p) => {
                const on = data.perms[p.k];
                return (
                  <Tile
                    key={p.k}
                    style={{
                      marginBottom: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, color: colors.fg, fontWeight: '500' }}>
                        {p.t}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.fg3, marginTop: 2 }}>
                        {p.sub}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        set({ perms: { ...data.perms, [p.k]: !on } })
                      }
                      style={{
                        width: 40,
                        height: 22,
                        borderRadius: 99,
                        backgroundColor: on ? colors.accent : colors.hairlineStrong,
                        justifyContent: 'center',
                      }}>
                      <View
                        style={{
                          position: 'absolute',
                          top: 2,
                          left: on ? 20 : 2,
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: '#fff',
                        }}
                      />
                    </Pressable>
                  </Tile>
                );
              })}
            </View>
          )}

          {cur === 'voice' && (
            <View>
              <Text
                style={{ color: colors.fg, fontSize: 28, fontWeight: '500', marginBottom: 8 }}>
                How should I sound?
              </Text>
              <Text style={{ color: colors.fg2, fontSize: 13, marginBottom: 24 }}>
                You can change voices anytime.
              </Text>
              {VOICES.map((v) => {
                const active = data.voice === v.k;
                return (
                  <Pressable
                    key={v.k}
                    onPress={() => set({ voice: v.k })}
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      backgroundColor: active ? colors.accentSoft : colors.surfaceStrong,
                      borderWidth: 1,
                      borderColor: active ? colors.accent : 'transparent',
                      marginBottom: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                    }}>
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: active ? colors.accent : colors.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Svg width={14} height={14} viewBox="0 0 24 24">
                        <Polygon
                          points="6,4 20,12 6,20"
                          fill={active ? '#06060e' : colors.fg}
                        />
                      </Svg>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ fontSize: 14, color: colors.fg, fontWeight: '500' }}>
                        {v.t}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.fg3, marginTop: 2 }}>
                        {v.sub}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {cur === 'theme' && (
            <View>
              <Text
                style={{ color: colors.fg, fontSize: 28, fontWeight: '500', marginBottom: 8 }}>
                Choose a feeling.
              </Text>
              <Text style={{ color: colors.fg2, fontSize: 13, marginBottom: 24 }}>
                You can switch any time. There's a lot more inside.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {THEMES.map((t) => {
                  const active = data.theme === t.k;
                  return (
                    <Pressable
                      key={t.k}
                      onPress={() => set({ theme: t.k })}
                      style={{
                        width: '48%',
                        borderRadius: 14,
                        overflow: 'hidden',
                        borderWidth: 2,
                        borderColor: active ? colors.accent : 'transparent',
                      }}>
                      <LinearGradient
                        colors={t.g}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ height: 80 }}
                      />
                      <View
                        style={{
                          padding: 10,
                          backgroundColor: colors.surfaceStrong,
                          alignItems: 'center',
                        }}>
                        <Text
                          style={{ fontSize: 12, color: colors.fg, fontWeight: '500' }}>
                          {t.t}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {cur === 'ready' && (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 40,
              }}>
              <Text style={{ fontSize: 56, marginBottom: 20 }}>✨</Text>
              <Text
                style={{
                  color: colors.fg,
                  fontSize: 28,
                  fontWeight: '500',
                  marginBottom: 12,
                  textAlign: 'center',
                }}>
                {data.name ? `Hello, ${data.name}.` : "You're all set."}
              </Text>
              <Text
                style={{
                  color: colors.fg2,
                  fontSize: 14,
                  lineHeight: 22,
                  maxWidth: 280,
                  textAlign: 'center',
                  marginBottom: 24,
                }}>
                I'll learn as we go. Tomorrow morning I'll have your first brief.
              </Text>
              <Text
                style={{
                  color: colors.fg3,
                  fontSize: 11,
                  fontFamily: monoFont,
                  letterSpacing: 1.5,
                }}>
                FIRST BRIEF · 6:50 AM
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            alignItems: 'center',
            marginTop: 24,
          }}>
          {step > 0 && !isLast && (
            <Pressable
              onPress={back}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: colors.surfaceStrong,
              }}>
              <Text style={{ fontSize: 13, color: colors.fg2 }}>Back</Text>
            </Pressable>
          )}
          <View style={{ flex: 1 }} />
          <Pressable onPress={isLast ? () => onNav('home') : next}>
            <LinearGradient
              colors={[colors.accent, colors.accent2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingHorizontal: 28,
                paddingVertical: 14,
                borderRadius: 14,
              }}>
              <Text
                style={{ color: '#06060e', fontSize: 14, fontWeight: '600' }}>
                {isLast ? 'Open Nik' : 'Continue →'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
