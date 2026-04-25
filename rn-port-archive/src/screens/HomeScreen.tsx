import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { MOCK } from '../data/mock';
import { colors, hueColor, monoFont } from '../theme';
import { Tile } from '../components/Tile';
import { Chip } from '../components/Chip';
import { Ring } from '../components/Ring';
import { XPBar } from '../components/XPBar';
import { Avatar } from '../components/Avatar';
import type { NavProps } from '../router';

export const HomeScreen = ({ onNav, onVoice }: NavProps) => {
  const u = MOCK.user;
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1200);
    return () => clearInterval(id);
  }, []);
  const liveSteps = 5240 + ((tick * 3) % 180);
  const liveHR = 68 + Math.round(Math.sin(tick * 0.4) * 4);
  const liveKcal = 1840 + (tick % 6);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
      {/* Greeting */}
      <View style={{ marginBottom: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginBottom: 6,
          }}>
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
              color: colors.fg3,
              fontSize: 11,
              letterSpacing: 2,
              fontFamily: monoFont,
            }}>
            {MOCK.today.date.toUpperCase()} · {MOCK.today.weather.toUpperCase()}
          </Text>
        </View>
        <Text style={{ color: colors.fg, fontSize: 30, fontWeight: '400' }}>Good morning,</Text>
        <Text style={{ color: colors.accent, fontSize: 30, fontWeight: '700' }}>{u.name}</Text>
      </View>

      {/* HUD card */}
      <Tile style={{ marginBottom: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}>
          <View>
            <Text
              style={{
                color: colors.fg3,
                fontSize: 10,
                fontFamily: monoFont,
                letterSpacing: 1.5,
              }}>
              HUNTER
            </Text>
            <Text style={{ color: colors.fg, fontSize: 18, fontWeight: '600', marginTop: 2 }}>
              {u.title}
            </Text>
          </View>
          <LinearGradient
            colors={[colors.accent, colors.accent2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{ color: '#06060e', fontSize: 9, opacity: 0.7, letterSpacing: 1 }}>
              LVL
            </Text>
            <Text style={{ color: '#06060e', fontSize: 22, fontWeight: '800', lineHeight: 24 }}>
              {u.level}
            </Text>
          </LinearGradient>
        </View>
        <XPBar cur={u.xp} max={u.xpMax} level={u.level} />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 10,
          }}>
          {Object.entries(u.stats).map(([k, v]) => (
            <View key={k} style={{ flex: 1, alignItems: 'center' }}>
              <Text
                style={{
                  color: colors.fg3,
                  fontSize: 10,
                  fontFamily: monoFont,
                  letterSpacing: 1,
                }}>
                {k}
              </Text>
              <Text
                style={{ color: colors.accent, fontSize: 13, fontWeight: '700', marginTop: 2 }}>
                {v}
              </Text>
            </View>
          ))}
        </View>
      </Tile>

      {/* Bento row 1: Streak + Score */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <Tile style={{ flex: 1, aspectRatio: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 18 }}>🔥</Text>
            <Chip tone="warn" size="sm">
              STREAK
            </Chip>
          </View>
          <View style={{ marginTop: 18 }}>
            <Text style={{ color: colors.flame, fontSize: 44, fontWeight: '700', lineHeight: 46 }}>
              {u.streak}
            </Text>
            <Text style={{ color: colors.fg3, fontSize: 11, marginTop: 4 }}>
              days · personal best
            </Text>
          </View>
        </Tile>

        <Tile
          style={{
            flex: 1,
            aspectRatio: 1,
            backgroundColor: colors.accentSoft,
            borderColor: colors.accentBorder,
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <Text
              style={{
                color: colors.accent,
                fontSize: 10,
                fontFamily: monoFont,
                letterSpacing: 1.5,
              }}>
              NIK SCORE
            </Text>
            <Text style={{ color: colors.ok, fontSize: 9, fontFamily: monoFont }}>+28</Text>
          </View>
          <Text
            style={{ color: colors.fg, fontSize: 38, fontWeight: '600', marginTop: 8, lineHeight: 40 }}>
            742
          </Text>
          <View style={{ flexDirection: 'row', gap: 3, marginTop: 8 }}>
            {[0.73, 0.78, 0.74, 0.73].map((p, i) => {
              const hues = [220, 25, 280, 150];
              return (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 99,
                    backgroundColor: colors.hairline,
                    overflow: 'hidden',
                  }}>
                  <View
                    style={{
                      height: '100%',
                      width: `${p * 100}%`,
                      backgroundColor: hueColor(hues[i]),
                    }}
                  />
                </View>
              );
            })}
          </View>
          <Text
            style={{
              color: colors.fg3,
              fontSize: 9,
              fontFamily: monoFont,
              marginTop: 6,
              letterSpacing: 1,
            }}>
            FOCUS · HEALTH · MIND · FAMILY
          </Text>
        </Tile>
      </View>

      {/* Focus launcher */}
      <Tile style={{ marginBottom: 10 }}>
        <Text
          style={{
            color: colors.fg3,
            fontSize: 10,
            fontFamily: monoFont,
            letterSpacing: 1.5,
          }}>
          FOCUS
        </Text>
        <Text style={{ color: colors.fg, fontSize: 20, fontWeight: '500', marginTop: 6 }}>
          Begin a session
        </Text>
        <Text style={{ color: colors.fg2, fontSize: 12, marginTop: 4 }}>
          Nik suggests <Text style={{ color: colors.accent, fontWeight: '700' }}>50 min · deep</Text>
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: 10,
          }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ok }} />
          <Text style={{ color: colors.ok, fontFamily: monoFont, fontSize: 11, letterSpacing: 1 }}>
            START →
          </Text>
        </View>
      </Tile>

      {/* GPS smart card */}
      <Tile
        style={{
          marginBottom: 10,
          backgroundColor: colors.accentSoft,
          borderColor: colors.accentBorder,
        }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 14 }}>📍</Text>
            <Text
              style={{
                color: colors.accent,
                fontSize: 11,
                fontFamily: monoFont,
                letterSpacing: 1,
              }}>
              LIVE · GPS
            </Text>
          </View>
          <Chip tone="accent" size="sm">
            NEW QUEST
          </Chip>
        </View>
        <Text style={{ color: colors.fg, fontSize: 16, fontWeight: '500' }}>
          You're near <Text style={{ color: colors.accent }}>Nature's Basket</Text>
        </Text>
        <Text style={{ color: colors.fg2, fontSize: 12, marginTop: 4 }}>
          Meera added <Text style={{ color: colors.fg, fontWeight: '700' }}>Groceries</Text> — pick
          them up? +80 XP
        </Text>
      </Tile>

      {/* Habits mini */}
      <Tile style={{ marginBottom: 10 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}>
          <Text
            style={{
              color: colors.fg3,
              fontSize: 11,
              fontFamily: monoFont,
              letterSpacing: 1.5,
            }}>
            HABITS · TODAY
          </Text>
          <Text style={{ color: colors.fg3 }}>›</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {MOCK.habits.slice(0, 4).map((h) => {
            const pct = h.done / h.target;
            const emoji = { water: '💧', book: '📖', dumbbell: '🏋️', brain: '🧘', flame: '🔥', moon: '🌙' }[h.icon];
            return (
              <View key={h.id} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
                <View>
                  <Ring size={48} pct={pct} hue={h.hue} sw={3} />
                  <View
                    style={{
                      position: 'absolute',
                      width: 48,
                      height: 48,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text style={{ fontSize: 18 }}>{emoji}</Text>
                  </View>
                </View>
                <Text style={{ color: colors.fg2, fontSize: 10 }}>{h.name}</Text>
              </View>
            );
          })}
        </View>
      </Tile>

      {/* Family ping */}
      <Tile style={{ marginBottom: 10 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}>
          <Text
            style={{
              color: colors.fg3,
              fontSize: 11,
              fontFamily: monoFont,
              letterSpacing: 1.5,
            }}>
            FAMILY · CIRCLE
          </Text>
          <Chip tone="ok" size="sm">
            3 ONLINE
          </Chip>
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          {MOCK.family.slice(0, 5).map((p, i) => (
            <View key={p.name} style={{ marginLeft: i === 0 ? 0 : -10 }}>
              <Avatar name={p.name} size={34} hue={p.hue} status={p.status} ring={p.self} />
            </View>
          ))}
        </View>
        <Text style={{ color: colors.fg2, fontSize: 12 }}>
          <Text style={{ color: colors.fg, fontWeight: '700' }}>Kiaan</Text> finished homework +40
          XP · <Text style={{ color: colors.fg, fontWeight: '700' }}>Meera</Text> added groceries
        </Text>
      </Tile>

      {/* Live vitals */}
      <Tile>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger }}
            />
            <Text
              style={{
                color: colors.fg3,
                fontSize: 11,
                fontFamily: monoFont,
                letterSpacing: 1.5,
              }}>
              LIVE · APPLE HEALTH
            </Text>
          </View>
          <Chip tone="accent" size="sm">
            SYNCING
          </Chip>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <LiveStat label="STEPS" value={liveSteps.toLocaleString()} target="8k" hue={40} />
          <LiveStat label="HEART" value={String(liveHR)} unit="BPM" hue={25} />
          <LiveStat label="KCAL" value={String(liveKcal)} target="2.2k" hue={150} />
        </View>
        <View style={{ marginTop: 10 }}>
          <Svg width="100%" height={28} viewBox="0 0 300 28">
            <Polyline
              fill="none"
              stroke={colors.accent}
              strokeWidth={1.5}
              points={Array.from({ length: 30 })
                .map((_, i) => {
                  const x = i * 10;
                  const phase = (i + tick) * 0.4;
                  const y = 14 + Math.sin(phase) * 4 + (i % 7 === 0 ? -6 : 0);
                  return `${x},${y}`;
                })
                .join(' ')}
            />
          </Svg>
        </View>
      </Tile>

      {/* Ask Nik */}
      <Tile style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <LinearGradient
          colors={[colors.accent, colors.accent2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#06060e' }} />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.fg, fontSize: 13 }}>Ask Nik anything…</Text>
          <Text
            style={{
              color: colors.fg3,
              fontSize: 10,
              fontFamily: monoFont,
              letterSpacing: 1,
              marginTop: 2,
            }}>
            TAP · OR SAY "HEY NIK"
          </Text>
        </View>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: colors.accentSoft,
            borderWidth: 1,
            borderColor: colors.accentBorder,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ fontSize: 14 }}>🎤</Text>
        </View>
      </Tile>
    </ScrollView>
  );
};

const LiveStat = ({
  label,
  value,
  unit,
  target,
  hue,
}: {
  label: string;
  value: string;
  unit?: string;
  target?: string;
  hue: number;
}) => (
  <View
    style={{
      flex: 1,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: `${hueColor(hue, 0.85, 0.16)}22`,
      borderWidth: 1,
      borderColor: `${hueColor(hue, 0.85, 0.16)}55`,
    }}>
    <Text
      style={{
        color: colors.fg3,
        fontSize: 8,
        fontFamily: monoFont,
        letterSpacing: 1,
        marginBottom: 2,
      }}>
      {label}
    </Text>
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
      <Text style={{ color: hueColor(hue, 0.9), fontSize: 17, fontWeight: '700' }}>{value}</Text>
      {unit && (
        <Text style={{ color: colors.fg3, fontSize: 8, fontFamily: monoFont }}>{unit}</Text>
      )}
    </View>
    {target && (
      <Text style={{ color: colors.fg3, fontSize: 8, fontFamily: monoFont, marginTop: 1 }}>
        / {target}
      </Text>
    )}
  </View>
);
