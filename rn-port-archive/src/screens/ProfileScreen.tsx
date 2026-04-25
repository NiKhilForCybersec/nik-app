import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Tile, Chip, Avatar, XPBar, Icon, ScreenHeader } from '../components';
import { colors, hueColor, monoFont } from '../theme';
import { MOCK } from '../data/mock';
import type { NavProps } from '../router';

type Theme = {
  id: string;
  name: string;
  subtitle: string;
  hue: number;
  mode: 'dark' | 'light';
  tag: string;
};

const THEMES: Theme[] = [
  { id: 'obsidian', name: 'Obsidian Youth', subtitle: 'Solo Leveling · HUD · electric', hue: 220, mode: 'dark', tag: 'Default' },
  { id: 'executive', name: 'Executive', subtitle: 'Minimal slate · refined · adult', hue: 240, mode: 'dark', tag: 'Adult' },
  { id: 'paper', name: 'Paper', subtitle: 'Light · warm neutral · calm', hue: 35, mode: 'light', tag: 'Adult' },
  { id: 'mono', name: 'Monochrome', subtitle: 'Zero color · focus · brutalist', hue: 260, mode: 'dark', tag: 'Adult' },
  { id: 'sage', name: 'Sage Light', subtitle: 'Organic · biolum · soft', hue: 150, mode: 'light', tag: 'Wellness' },
  { id: 'crimson', name: 'Crimson HUD', subtitle: 'Cyberpunk red · sharp', hue: 25, mode: 'dark', tag: 'Youth' },
  { id: 'aurora', name: 'Aurora Glass', subtitle: 'Apple Vision · frosted', hue: 280, mode: 'dark', tag: 'Balanced' },
  { id: 'solar', name: 'Solar', subtitle: 'Warm gold · daylight', hue: 70, mode: 'light', tag: 'Wellness' },
];

type Tab = 'profile' | 'themes' | 'connect' | 'notifs' | 'about';

type Integration = {
  k: string;
  v: string;
  connected: boolean;
  hue: number;
  sub: string;
};

const INTEGRATIONS: Integration[] = [
  { k: 'Apple Health', v: 'Syncing · 12 metrics', connected: true, hue: 0, sub: 'Steps, HR, sleep, workouts, weight' },
  { k: 'Google Fit', v: 'Not connected', connected: false, hue: 130, sub: 'Alternative to Apple Health' },
  { k: 'Strava', v: 'Syncing · 3 activities', connected: true, hue: 25, sub: 'Runs & cycling' },
  { k: 'Calendar', v: 'iCloud · 2 calendars', connected: true, hue: 220, sub: 'Work + personal' },
  { k: 'ChatGPT', v: 'Connected · GPT-4o', connected: true, hue: 150, sub: 'Form guidance · workout gen' },
  { k: 'Spotify', v: 'Focus playlist ready', connected: true, hue: 130, sub: 'Plays during deep work quests' },
  { k: 'WhatsApp Family', v: 'Pending invite', connected: false, hue: 150, sub: '2 of 5 members' },
  { k: 'Oura Ring', v: 'Not connected', connected: false, hue: 280, sub: 'Deep recovery data' },
];

const NOTIFS: [string, boolean, string][] = [
  ['GPS contextual alerts', true, 'Gym detected, near store, etc.'],
  ['Family task nearby', true, 'When you can help a shared task'],
  ['Quest reminders', true, '15 min before deadlines'],
  ['Weekly insights', true, 'Sunday 9am'],
  ['Level-up effects', true, 'Full-screen XP flash'],
  ['Do not disturb · deep focus', false, 'Silences all during focus quests'],
  ['Quiet hours', false, '10pm – 7am'],
];

const PROFILE_FIELDS: { k: string; v: string; icon: string }[] = [
  { k: 'Name', v: 'Arjun Menon', icon: 'viewers' },
  { k: 'Age', v: '32', icon: 'calendar' },
  { k: 'Height · Weight', v: '178cm · 74kg', icon: 'activity' },
  { k: 'Goal', v: 'Hypertrophy · sleep 8h', icon: 'target' },
  { k: 'Nik persona', v: 'Direct · witty', icon: 'sparkle' },
  { k: 'Voice', v: 'Nova · EN-IN', icon: 'mic' },
];

export default function ProfileScreen({ onBack }: NavProps) {
  const u = MOCK.user;
  const [tab, setTab] = useState<Tab>('themes');
  const [activeTheme, setActiveTheme] = useState('obsidian');
  const [intensity, setIntensity] = useState<'soft' | 'medium' | 'full'>('full');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 120 }}>
      <ScreenHeader title="Profile" subtitle="Account" onBack={onBack} />

      <View style={{ paddingHorizontal: 16 }}>
        {/* Hero card */}
        <Tile style={{ marginBottom: 14, padding: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar name={u.name} size={68} hue={220} ring />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.fg, fontSize: 20, fontWeight: '600' }}>
                {u.name} Menon
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.fg3,
                  fontFamily: monoFont,
                  letterSpacing: 0.5,
                  marginTop: 2,
                }}>
                {u.title.toUpperCase()} · LVL {u.level}
              </Text>
              <View style={{ marginTop: 8 }}>
                <XPBar cur={u.xp} max={u.xpMax} level={u.level} />
              </View>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              marginTop: 14,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: colors.hairline,
            }}>
            {(
              [
                ['Age', '32'],
                ['Joined', '14mo'],
                ['Memories', '2,840'],
                ['Quests', '184'],
              ] as const
            ).map(([k, v]) => (
              <View key={k} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.fg }}>{v}</Text>
                <Text
                  style={{
                    fontSize: 9,
                    color: colors.fg3,
                    fontFamily: monoFont,
                    letterSpacing: 1,
                  }}>
                  {k.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        </Tile>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
          style={{ marginBottom: 12 }}>
          {(
            [
              ['profile', 'Profile'],
              ['themes', 'Themes'],
              ['connect', 'Integrations'],
              ['notifs', 'Notifications'],
              ['about', 'About'],
            ] as const
          ).map(([id, l]) => {
            const active = tab === id;
            return (
              <Pressable
                key={id}
                onPress={() => setTab(id)}
                style={({ pressed }) => ({
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 99,
                  backgroundColor: active ? colors.accentSoft : 'rgba(255,255,255,0.04)',
                  borderWidth: 1,
                  borderColor: active ? colors.accentBorder : colors.hairline,
                  opacity: pressed ? 0.8 : 1,
                })}>
                <Text style={{ fontSize: 12, color: active ? colors.accent : colors.fg2 }}>
                  {l}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {tab === 'profile' && (
          <View style={{ gap: 8 }}>
            {PROFILE_FIELDS.map((r) => (
              <Tile
                key={r.k}
                style={{
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    backgroundColor: colors.accentSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Icon name={r.icon} size={15} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.fg3,
                      fontFamily: monoFont,
                      letterSpacing: 0.5,
                    }}>
                    {r.k.toUpperCase()}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.fg }}>{r.v}</Text>
                </View>
                <Icon name="chevR" size={14} color={colors.fg3} />
              </Tile>
            ))}
          </View>
        )}

        {tab === 'themes' && (
          <View>
            <Text
              style={{
                fontSize: 11,
                color: colors.fg3,
                fontFamily: monoFont,
                letterSpacing: 1,
                marginBottom: 10,
              }}>
              UNIVERSES · {THEMES.length} CURATED
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {THEMES.map((t) => {
                const active = activeTheme === t.id;
                const accent = hueColor(t.hue, 0.78);
                const isLight = t.mode === 'light';
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setActiveTheme(t.id)}
                    style={({ pressed }) => ({
                      width: '48%',
                      borderRadius: 16,
                      overflow: 'hidden',
                      borderWidth: active ? 2 : 1,
                      borderColor: active ? accent : colors.hairlineStrong,
                      backgroundColor: colors.surface,
                      opacity: pressed ? 0.85 : 1,
                    })}>
                    <View
                      style={{
                        aspectRatio: 3 / 4,
                        backgroundColor: isLight ? '#f5f1e8' : '#0e0e1a',
                        padding: 10,
                        position: 'relative',
                        overflow: 'hidden',
                      }}>
                      <LinearGradient
                        colors={[accent, hueColor(t.hue + 60, 0.55, 0.22)]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          position: 'absolute',
                          top: -20,
                          right: -20,
                          width: 80,
                          height: 80,
                          borderRadius: 40,
                          opacity: 0.55,
                        }}
                      />
                      <Text
                        style={{
                          fontFamily: monoFont,
                          fontSize: 7,
                          color: isLight ? 'rgba(0,0,0,0.4)' : colors.fg3,
                          letterSpacing: 1,
                        }}>
                        TODAY · LVL 27
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '500',
                          color: isLight ? '#1a1a1a' : colors.fg,
                          marginTop: 4,
                          lineHeight: 14,
                        }}>
                        Hello,{'\n'}Arjun
                      </Text>
                      <View
                        style={{
                          marginTop: 10,
                          height: 3,
                          backgroundColor: isLight
                            ? 'rgba(0,0,0,0.08)'
                            : colors.hairline,
                          borderRadius: 99,
                        }}>
                        <View
                          style={{
                            width: '70%',
                            height: '100%',
                            borderRadius: 99,
                            backgroundColor: accent,
                          }}
                        />
                      </View>
                      <View
                        style={{
                          marginTop: 8,
                          alignSelf: 'flex-start',
                          paddingHorizontal: 6,
                          paddingVertical: 3,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: accent,
                          backgroundColor: `${accent}22`,
                        }}>
                        <Text
                          style={{
                            fontSize: 7,
                            color: isLight ? '#1a1a1a' : colors.fg,
                            fontFamily: monoFont,
                            letterSpacing: 0.5,
                          }}>
                          QUEST
                        </Text>
                      </View>
                      {active && (
                        <View
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            backgroundColor: accent,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                          <Icon
                            name="check"
                            size={12}
                            color={isLight ? '#fff' : colors.bg}
                            strokeWidth={2.5}
                          />
                        </View>
                      )}
                    </View>
                    <View
                      style={{
                        padding: 10,
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        borderTopWidth: 1,
                        borderTopColor: colors.hairline,
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 4,
                          marginBottom: 2,
                        }}>
                        <Text
                          style={{ fontSize: 12, fontWeight: '600', color: colors.fg }}
                          numberOfLines={1}>
                          {t.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 8,
                            color: colors.fg3,
                            fontFamily: monoFont,
                            letterSpacing: 0.5,
                            paddingHorizontal: 5,
                            paddingVertical: 1,
                            borderWidth: 1,
                            borderColor: colors.hairline,
                            borderRadius: 4,
                          }}>
                          {t.tag.toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        style={{ fontSize: 10, color: colors.fg3, lineHeight: 13 }}
                        numberOfLines={2}>
                        {t.subtitle}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Intensity */}
            <Tile style={{ padding: 14, marginTop: 14 }}>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.fg3,
                  fontFamily: monoFont,
                  letterSpacing: 1,
                  marginBottom: 10,
                }}>
                INTENSITY
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {(['soft', 'medium', 'full'] as const).map((i) => {
                  const active = intensity === i;
                  return (
                    <Pressable
                      key={i}
                      onPress={() => setIntensity(i)}
                      style={({ pressed }) => ({
                        flex: 1,
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        borderRadius: 10,
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
                          textTransform: 'capitalize',
                        }}>
                        {i}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text
                style={{
                  fontSize: 10,
                  color: colors.fg3,
                  marginTop: 8,
                  lineHeight: 15,
                }}>
                <Text style={{ color: colors.fg2 }}>Soft</Text> hides HUD chrome,{' '}
                <Text style={{ color: colors.fg2 }}>medium</Text> keeps it subtle,{' '}
                <Text style={{ color: colors.fg2 }}>full</Text> goes all-in on the universe.
              </Text>
            </Tile>
          </View>
        )}

        {tab === 'connect' && (
          <View style={{ gap: 8 }}>
            {INTEGRATIONS.map((r) => (
              <Tile
                key={r.k}
                style={{
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: `${hueColor(r.hue, 0.7, 0.18)}22`,
                    borderWidth: 1,
                    borderColor: `${hueColor(r.hue, 0.7, 0.18)}55`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text
                    style={{
                      fontWeight: '600',
                      color: hueColor(r.hue, 0.9),
                      fontSize: 13,
                    }}>
                    {r.k.charAt(0)}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      style={{ fontSize: 13, fontWeight: '500', color: colors.fg }}
                      numberOfLines={1}>
                      {r.k}
                    </Text>
                    {r.connected && (
                      <View
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 3,
                          backgroundColor: colors.ok,
                        }}
                      />
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      color: colors.fg3,
                      fontFamily: monoFont,
                      marginTop: 2,
                    }}
                    numberOfLines={1}>
                    {r.sub}
                  </Text>
                </View>
                {r.connected ? (
                  <Chip tone="ok" size="sm">
                    Linked
                  </Chip>
                ) : (
                  <Chip tone="neutral" size="sm">
                    Connect
                  </Chip>
                )}
              </Tile>
            ))}
          </View>
        )}

        {tab === 'notifs' && (
          <View style={{ gap: 8 }}>
            {NOTIFS.map(([k, on, sub]) => (
              <ToggleRow key={k} label={k} sub={sub} defaultOn={on} />
            ))}
          </View>
        )}

        {tab === 'about' && (
          <Tile style={{ padding: 16 }}>
            <Text
              style={{ fontSize: 18, fontWeight: '600', color: colors.fg, marginBottom: 4 }}>
              Nik 1.0 · Canary
            </Text>
            <Text style={{ fontSize: 12, color: colors.fg2, lineHeight: 18 }}>
              An AI that grows with your family. End-to-end encrypted memories. No ads, ever.
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <Chip tone="neutral">Privacy</Chip>
              <Chip tone="neutral">Terms</Chip>
              <Chip tone="neutral">Reset Nik</Chip>
              <Chip tone="danger">Sign out</Chip>
            </View>
          </Tile>
        )}
      </View>
    </ScrollView>
  );
}

function ToggleRow({
  label,
  sub,
  defaultOn,
}: {
  label: string;
  sub: string;
  defaultOn: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <Tile
      style={{
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, color: colors.fg }}>{label}</Text>
        <Text
          style={{
            fontSize: 10,
            color: colors.fg3,
            fontFamily: monoFont,
            marginTop: 2,
          }}>
          {sub}
        </Text>
      </View>
      <Pressable
        onPress={() => setOn((v) => !v)}
        style={({ pressed }) => ({
          width: 42,
          height: 24,
          borderRadius: 99,
          backgroundColor: on ? colors.accent : 'rgba(255,255,255,0.1)',
          position: 'relative',
          opacity: pressed ? 0.85 : 1,
        })}>
        <View
          style={{
            position: 'absolute',
            top: 2,
            left: on ? 20 : 2,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#fff',
          }}
        />
      </Pressable>
    </Tile>
  );
}
