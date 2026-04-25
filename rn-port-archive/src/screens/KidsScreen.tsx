import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Tile, ScreenHeader } from '../components';
import { colors, hueColor, monoFont } from '../theme';
import type { NavProps } from '../router';

type KidTask = { t: string; label: string; done: boolean };
type KidAsk = {
  from: string;
  text: string;
  when: string;
  status: 'pending' | 'celebrate';
};
type KidFamily = { who: string; emoji: string; status: string; hue: number };

const KIDS_VIEW: {
  kid: { name: string; age: number; hue: number; avatar: string };
  today: KidTask[];
  stars: number;
  reward: { name: string; need: number; have: number };
  asks: KidAsk[];
  family: KidFamily[];
} = {
  kid: { name: 'Anya', age: 8, hue: 30, avatar: 'A' },
  today: [
    { t: '☀️', label: 'Wake up', done: true },
    { t: '🦷', label: 'Brush teeth', done: true },
    { t: '🎒', label: 'School ready', done: true },
    { t: '🎹', label: 'Piano practice · 20 min', done: false },
    { t: '📚', label: 'Read a chapter', done: false },
    { t: '🛁', label: 'Bath time', done: false },
  ],
  stars: 14,
  reward: { name: 'Movie night, kid pick', need: 20, have: 14 },
  asks: [
    { from: 'Mom', text: 'Can we watch one more episode?', when: '5pm', status: 'pending' },
    { from: 'Anya', text: 'I finished my reading early!', when: 'Now', status: 'celebrate' },
  ],
  family: [
    { who: 'Mom', emoji: '👩🏽', status: 'In a meeting', hue: 350 },
    { who: 'Dad', emoji: '👨🏽', status: 'Coming home soon', hue: 280 },
    { who: 'Kiaan', emoji: '🧒🏽', status: 'At school', hue: 200 },
  ],
};

export default function KidsScreen({ onBack }: NavProps) {
  const [stars, setStars] = useState(KIDS_VIEW.stars);
  const [today, setToday] = useState<KidTask[]>(KIDS_VIEW.today);

  const toggle = (i: number) => {
    setToday((prev) =>
      prev.map((t, idx) => (idx === i ? { ...t, done: !t.done } : t)),
    );
    if (!today[i].done) setStars((s) => s + 1);
    else setStars((s) => Math.max(0, s - 1));
  };

  const need = KIDS_VIEW.reward.need;
  const pct = Math.min(1, stars / need);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 100 }}>
      <ScreenHeader title="Kids" subtitle="Supervised" onBack={onBack} />

      <View style={{ padding: 16 }}>
        {/* Greeting */}
        <View style={{ marginBottom: 16, alignItems: 'center' }}>
          <LinearGradient
            colors={[hueColor(KIDS_VIEW.kid.hue, 0.75), hueColor(KIDS_VIEW.kid.hue, 0.5, 0.18)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
            }}>
            <Text style={{ fontSize: 36, color: '#fff', fontWeight: '700' }}>
              {KIDS_VIEW.kid.avatar}
            </Text>
          </LinearGradient>
          <Text style={{ color: colors.fg, fontSize: 26, fontWeight: '600' }}>
            Hi, {KIDS_VIEW.kid.name}!
          </Text>
          <Text style={{ color: colors.fg2, fontSize: 13, marginTop: 4 }}>
            You've got {stars} ⭐ today
          </Text>
        </View>

        {/* Reward bar */}
        <Tile
          style={{
            marginBottom: 14,
            backgroundColor: colors.accentSoft,
            borderColor: colors.accentBorder,
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}>
            <Text style={{ color: colors.fg, fontSize: 13, fontWeight: '600' }}>
              🎬 {KIDS_VIEW.reward.name}
            </Text>
            <Text style={{ color: colors.fg2, fontSize: 12 }}>
              {stars} / {need}
            </Text>
          </View>
          <View
            style={{
              height: 10,
              backgroundColor: colors.hairline,
              borderRadius: 99,
              overflow: 'hidden',
              marginBottom: 6,
            }}>
            <LinearGradient
              colors={[hueColor(60, 0.7), hueColor(30, 0.7, 0.18)]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 99 }}
            />
          </View>
          <Text style={{ color: colors.fg3, fontSize: 11 }}>
            {Math.max(0, need - stars)} more stars to go!
          </Text>
        </Tile>

        {/* Today's plan */}
        <Text
          style={{
            color: colors.fg,
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 8,
            paddingHorizontal: 4,
          }}>
          Today's plan
        </Text>
        <View style={{ gap: 6, marginBottom: 16 }}>
          {today.map((t, i) => (
            <Tile
              key={i}
              onPress={() => toggle(i)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                opacity: t.done ? 0.55 : 1,
              }}>
              <Text style={{ fontSize: 28, lineHeight: 30 }}>{t.t}</Text>
              <Text
                style={{
                  flex: 1,
                  color: colors.fg,
                  fontSize: 14,
                  fontWeight: '500',
                  textDecorationLine: t.done ? 'line-through' : 'none',
                }}>
                {t.label}
              </Text>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  borderWidth: t.done ? 0 : 2,
                  borderColor: colors.hairlineStrong,
                  backgroundColor: t.done ? hueColor(60, 0.7) : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {t.done && <Text style={{ fontSize: 16 }}>⭐</Text>}
              </View>
            </Tile>
          ))}
        </View>

        {/* Messages */}
        <Text
          style={{
            color: colors.fg,
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 8,
            paddingHorizontal: 4,
          }}>
          Messages
        </Text>
        <View style={{ gap: 8, marginBottom: 16 }}>
          {KIDS_VIEW.asks.map((a, i) => (
            <Tile key={i}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 6,
                }}>
                <Text style={{ color: colors.fg3, fontSize: 11, fontWeight: '600' }}>
                  {a.from}
                </Text>
                <Text style={{ color: colors.fg3, fontSize: 10 }}>· {a.when}</Text>
              </View>
              <Text style={{ color: colors.fg, fontSize: 13 }}>"{a.text}"</Text>
              {a.status === 'pending' && (
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                  <Pressable
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: colors.accent,
                      alignItems: 'center',
                    }}>
                    <Text style={{ color: '#06060e', fontSize: 12, fontWeight: '600' }}>
                      Yes!
                    </Text>
                  </Pressable>
                  <Pressable
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: colors.surfaceStrong,
                      alignItems: 'center',
                    }}>
                    <Text style={{ color: colors.fg2, fontSize: 12 }}>Not now</Text>
                  </Pressable>
                </View>
              )}
              {a.status === 'celebrate' && (
                <View
                  style={{
                    marginTop: 8,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: 'rgba(251,191,36,0.18)',
                    alignItems: 'center',
                  }}>
                  <Text style={{ color: colors.fg, fontSize: 12 }}>
                    🎉 +1 star! Mom got the message.
                  </Text>
                </View>
              )}
            </Tile>
          ))}
        </View>

        {/* Family pulse */}
        <Text
          style={{
            color: colors.fg,
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 8,
            paddingHorizontal: 4,
          }}>
          Where everyone is
        </Text>
        <Tile>
          <View style={{ gap: 10 }}>
            {KIDS_VIEW.family.map((f, i) => (
              <View
                key={i}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: hueColor(f.hue, 0.7),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text style={{ fontSize: 20 }}>{f.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.fg, fontSize: 13, fontWeight: '600' }}>
                    {f.who}
                  </Text>
                  <Text style={{ color: colors.fg2, fontSize: 11 }}>{f.status}</Text>
                </View>
              </View>
            ))}
          </View>
        </Tile>

        <Pressable
          style={{
            marginTop: 16,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
          }}>
          <Text
            style={{
              fontSize: 11,
              color: colors.fg3,
              fontFamily: monoFont,
              letterSpacing: 1,
            }}>
            🔒 PARENT SETTINGS
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
