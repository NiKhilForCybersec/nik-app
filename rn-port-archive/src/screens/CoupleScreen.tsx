import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Tile, ScreenHeader } from '../components';
import { colors, monoFont, hueColor } from '../theme';
import type { NavProps } from '../router';

type Thread =
  | {
      id: number;
      kind: 'shared-note';
      t: string;
      items: string[];
      updated: string;
      who: string;
      text?: undefined;
      when?: undefined;
    }
  | {
      id: number;
      kind: 'gratitude' | 'question' | 'memory';
      text: string;
      who: string;
      when: string;
      t?: undefined;
      items?: undefined;
      updated?: undefined;
    };

const COUPLE: {
  partner: { name: string; hue: number };
  streak: number;
  nextDate: { day: string; t: string; where: string; kids: string };
  threads: Thread[];
  agreements: Array<{ t: string; since: string }>;
} = {
  partner: { name: 'Meera', hue: 350 },
  streak: 11,
  nextDate: { day: 'Saturday', t: '7:30 PM', where: 'Olmsted', kids: 'Sitter booked' },
  threads: [
    {
      id: 1,
      kind: 'shared-note',
      t: 'Things to do before March',
      items: ['Renew passports', 'Book the cabin', 'Call the dentist re: Anya'],
      updated: '2h ago',
      who: 'Both',
    },
    {
      id: 2,
      kind: 'gratitude',
      text: 'You handled school pickup three days in a row when my work blew up. I noticed.',
      who: 'Meera',
      when: 'Yesterday',
    },
    {
      id: 3,
      kind: 'question',
      text: "What's one thing you want more of from me this month?",
      who: 'Nik',
      when: 'Today',
    },
    {
      id: 4,
      kind: 'memory',
      text: 'Six years ago today: that disastrous camping trip in the rain. We laughed for an hour in the car.',
      who: 'Nik',
      when: 'Today',
    },
  ],
  agreements: [
    { t: 'Phones away at dinner', since: 'May' },
    { t: 'One real date a week', since: 'August' },
    { t: 'No work talk after 9pm', since: 'Sep' },
  ],
};

const kindBg = (kind: Thread['kind']) => {
  if (kind === 'gratitude') return 'rgba(244,114,182,0.15)';
  if (kind === 'question') return colors.accentSoft;
  return colors.surfaceStrong;
};

export default function CoupleScreen({ onBack }: NavProps) {
  const c = COUPLE;
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 100 }}>
      <ScreenHeader title="Us" subtitle="Shared · with Meera" onBack={onBack} />

      <View style={{ paddingHorizontal: 16 }}>
        {/* Streak header */}
        <Tile style={{ padding: 16, marginBottom: 12, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ flexDirection: 'row' }}>
              <LinearGradient
                colors={[hueColor(220, 0.65, 0.18), hueColor(220, 0.45, 0.16)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: colors.bg,
                }}>
                <Text style={{ fontSize: 14, color: '#fff', fontWeight: '600' }}>R</Text>
              </LinearGradient>
              <LinearGradient
                colors={[hueColor(350, 0.7, 0.18), hueColor(350, 0.5, 0.18)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: colors.bg,
                  marginLeft: -12,
                }}>
                <Text style={{ fontSize: 14, color: '#fff', fontWeight: '600' }}>M</Text>
              </LinearGradient>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: colors.fg, fontWeight: '500' }}>
                Ravi & Meera
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  color: colors.fg3,
                  fontFamily: monoFont,
                  marginTop: 2,
                }}>
                {c.streak}-WEEK DATE STREAK · 8Y TOGETHER
              </Text>
            </View>
          </View>
        </Tile>

        {/* Next date */}
        <Tile style={{ padding: 14, marginBottom: 14 }}>
          <Text
            style={{
              fontSize: 10,
              color: colors.fg3,
              fontFamily: monoFont,
              letterSpacing: 1.5,
              marginBottom: 8,
            }}>
            NEXT DATE
          </Text>
          <Text style={{ fontSize: 18, color: colors.fg, fontWeight: '500' }}>
            {c.nextDate.day}, {c.nextDate.t}
          </Text>
          <Text style={{ fontSize: 12, color: colors.fg2, marginTop: 2 }}>
            {c.nextDate.where} · {c.nextDate.kids}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
            {['Reroute', 'Order Lyft', 'Sitter check'].map((l) => (
              <Pressable
                key={l}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: colors.surfaceStrong,
                }}>
                <Text style={{ fontSize: 11, color: colors.fg2 }}>{l}</Text>
              </Pressable>
            ))}
          </View>
        </Tile>

        <Text
          style={{
            fontSize: 10,
            color: colors.fg3,
            fontFamily: monoFont,
            letterSpacing: 1.5,
            marginBottom: 8,
            paddingHorizontal: 4,
          }}>
          SHARED THREADS
        </Text>

        <View style={{ gap: 8, marginBottom: 14 }}>
          {c.threads.map((t) => (
            <Tile key={t.id} style={{ padding: 14 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                }}>
                <View
                  style={{
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 99,
                    backgroundColor: kindBg(t.kind),
                  }}>
                  <Text
                    style={{
                      fontSize: 9,
                      color: colors.fg,
                      fontFamily: monoFont,
                      letterSpacing: 0.5,
                    }}>
                    {t.kind.toUpperCase()}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 10,
                    color: colors.fg3,
                    fontFamily: monoFont,
                  }}>
                  {(t.who || '').toUpperCase()} ·{' '}
                  {(t.when || t.updated || '').toUpperCase()}
                </Text>
              </View>

              {t.t && (
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.fg,
                    fontWeight: '500',
                    marginBottom: 6,
                  }}>
                  {t.t}
                </Text>
              )}

              {t.text && (
                <Text style={{ fontSize: 13, color: colors.fg, lineHeight: 20 }}>{t.text}</Text>
              )}

              {t.items && (
                <View style={{ gap: 4, marginTop: 4 }}>
                  {t.items.map((it, i) => (
                    <View
                      key={i}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 4,
                          borderWidth: 1.5,
                          borderColor: colors.hairlineStrong,
                        }}
                      />
                      <Text style={{ fontSize: 12, color: colors.fg2 }}>{it}</Text>
                    </View>
                  ))}
                </View>
              )}

              {t.kind === 'question' && (
                <Pressable
                  style={{
                    marginTop: 10,
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: colors.surfaceStrong,
                    alignItems: 'center',
                  }}>
                  <Text style={{ fontSize: 11, color: colors.fg2 }}>Answer privately</Text>
                </Pressable>
              )}
            </Tile>
          ))}
        </View>

        <Text
          style={{
            fontSize: 10,
            color: colors.fg3,
            fontFamily: monoFont,
            letterSpacing: 1.5,
            marginBottom: 8,
            paddingHorizontal: 4,
          }}>
          OUR AGREEMENTS
        </Text>

        <Tile style={{ padding: 12, gap: 8 }}>
          {c.agreements.map((a, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: 8,
                borderBottomWidth: i < c.agreements.length - 1 ? 1 : 0,
                borderBottomColor: colors.hairline,
              }}>
              <Text style={{ fontSize: 13, color: colors.fg }}>{a.t}</Text>
              <Text
                style={{
                  fontSize: 10,
                  color: colors.fg3,
                  fontFamily: monoFont,
                }}>
                SINCE {a.since.toUpperCase()}
              </Text>
            </View>
          ))}
        </Tile>
      </View>
    </ScrollView>
  );
}
