import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Tile, ScreenHeader } from '../components';
import { colors, monoFont, hueColor } from '../theme';
import type { NavProps } from '../router';

const VAULT = {
  collections: [
    { id: 'kids', title: 'The kids growing up', count: 1247, hue: 30, span: '2018 → today' },
    { id: 'us', title: 'Meera & me', count: 432, hue: 350, span: '2014 → today' },
    { id: 'travel', title: 'Travel', count: 318, hue: 200, span: '12 trips' },
    { id: 'parents', title: 'Mom & Dad', count: 156, hue: 80, span: 'Always' },
  ],
  onThisDay: [
    {
      year: '5 years ago',
      text: "Anya's first day of pre-K. She wore the orange dress and refused to let go of your hand.",
      hue: 60,
    },
    {
      year: '2 years ago',
      text: "Thanksgiving at your sister's. Kiaan ate three plates of mashed potatoes.",
      hue: 30,
    },
  ],
  recent: [
    { kind: 'photo', when: 'Yesterday', tag: 'Anya · piano', hue: 60 },
    { kind: 'voice', when: '2 days ago', tag: 'A note to my future self · 1:14', hue: 280 },
    { kind: 'photo', when: '3 days ago', tag: 'Sunday pancakes', hue: 40 },
    { kind: 'video', when: '4 days ago', tag: 'Kiaan riding without training wheels · 0:23', hue: 200 },
    { kind: 'photo', when: '5 days ago', tag: 'Dad on the porch', hue: 80 },
    { kind: 'photo', when: 'Last week', tag: 'Walk in Prospect Park', hue: 140 },
  ],
  places: [
    { x: 25, y: 35, n: 412, label: 'Brooklyn' },
    { x: 60, y: 50, n: 86, label: 'Catskills' },
    { x: 70, y: 25, n: 48, label: 'Boston' },
    { x: 35, y: 70, n: 124, label: 'Lisbon' },
    { x: 80, y: 75, n: 32, label: 'Tokyo' },
  ],
} as const;

type ViewKey = 'collections' | 'recent' | 'places';

export default function VaultScreen({ onBack }: NavProps) {
  const [view, setView] = useState<ViewKey>('collections');

  const tabs: Array<[ViewKey, string]> = [
    ['collections', 'Collections'],
    ['recent', 'Recent'],
    ['places', 'Places'],
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 100 }}>
      <ScreenHeader title="Memory Vault" subtitle="Vault · 2,154 memories" onBack={onBack} />

      <View style={{ paddingHorizontal: 16 }}>
        {/* On this day */}
        <Text
          style={{
            fontSize: 10,
            color: colors.fg3,
            fontFamily: monoFont,
            letterSpacing: 1.5,
            marginBottom: 8,
          }}>
          ON THIS DAY
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
          style={{ marginBottom: 16 }}>
          {VAULT.onThisDay.map((m, i) => (
            <Tile key={i} style={{ width: 240, padding: 12 }}>
              <LinearGradient
                colors={[hueColor(m.hue, 0.7, 0.16), hueColor(m.hue, 0.35, 0.1)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  height: 90,
                  borderRadius: 10,
                  marginBottom: 10,
                  justifyContent: 'flex-end',
                  padding: 10,
                }}>
                <Text
                  style={{
                    fontSize: 10,
                    color: '#fff',
                    fontFamily: monoFont,
                    letterSpacing: 1,
                  }}>
                  {m.year.toUpperCase()}
                </Text>
              </LinearGradient>
              <Text style={{ fontSize: 12, color: colors.fg, lineHeight: 18 }}>{m.text}</Text>
            </Tile>
          ))}
        </ScrollView>

        {/* Tabs */}
        <View
          style={{
            flexDirection: 'row',
            gap: 4,
            marginBottom: 12,
            padding: 3,
            backgroundColor: colors.surfaceStrong,
            borderRadius: 12,
          }}>
          {tabs.map(([k, l]) => {
            const active = view === k;
            return (
              <Pressable
                key={k}
                onPress={() => setView(k)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 4,
                  borderRadius: 9,
                  backgroundColor: active ? colors.accentSoft : 'transparent',
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    color: active ? colors.accent : colors.fg2,
                    fontSize: 11,
                    fontWeight: active ? '600' : '400',
                  }}>
                  {l}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {view === 'collections' && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {VAULT.collections.map((c) => (
              <Pressable
                key={c.id}
                style={{ width: '48.5%' }}
                onPress={() => undefined}>
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.hairline,
                    borderWidth: 1,
                    borderRadius: 18,
                    overflow: 'hidden',
                  }}>
                  <LinearGradient
                    colors={[hueColor(c.hue, 0.7, 0.16), hueColor(c.hue, 0.3, 0.1)]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ height: 110, justifyContent: 'flex-end', padding: 10 }}>
                    <Text
                      style={{
                        alignSelf: 'flex-end',
                        fontSize: 9,
                        color: 'rgba(255,255,255,0.85)',
                        fontFamily: monoFont,
                        letterSpacing: 1,
                      }}>
                      {c.count}
                    </Text>
                  </LinearGradient>
                  <View style={{ padding: 10 }}>
                    <Text style={{ fontSize: 12, color: colors.fg, fontWeight: '500' }}>
                      {c.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        color: colors.fg3,
                        fontFamily: monoFont,
                        marginTop: 2,
                      }}>
                      {c.span.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
            <Pressable
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 14,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: colors.hairlineStrong,
                alignItems: 'center',
              }}>
              <Text style={{ fontSize: 12, color: colors.fg2 }}>+ New collection</Text>
            </Pressable>
          </View>
        )}

        {view === 'recent' && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {VAULT.recent.map((m, i) => (
              <View
                key={i}
                style={{
                  width: '32%',
                  aspectRatio: 1,
                  borderRadius: 10,
                  overflow: 'hidden',
                }}>
                <LinearGradient
                  colors={[hueColor(m.hue, 0.65, 0.16), hueColor(m.hue, 0.3, 0.08)]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1 }}>
                  {(m.kind === 'video' || m.kind === 'voice') && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        paddingHorizontal: 5,
                        paddingVertical: 2,
                        borderRadius: 99,
                        backgroundColor: 'rgba(0,0,0,0.55)',
                      }}>
                      <Text
                        style={{
                          fontSize: 8,
                          color: '#fff',
                          fontFamily: monoFont,
                          letterSpacing: 0.5,
                        }}>
                        {m.kind === 'video' ? 'VID' : 'VOX'}
                      </Text>
                    </View>
                  )}
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: 6,
                      backgroundColor: 'rgba(0,0,0,0.45)',
                    }}>
                    <Text style={{ fontSize: 9, color: '#fff', lineHeight: 12 }}>{m.tag}</Text>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </View>
        )}

        {view === 'places' && (
          <Tile style={{ height: 320, padding: 0, overflow: 'hidden' }}>
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(20,20,40,0.6)',
              }}
            />
            {VAULT.places.map((p, i) => {
              const size = Math.max(20, Math.sqrt(p.n) * 1.8);
              return (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    transform: [{ translateX: -size / 2 }, { translateY: -size / 2 }],
                    alignItems: 'center',
                  }}>
                  <View
                    style={{
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      backgroundColor: colors.accentSoft,
                      borderWidth: 1,
                      borderColor: colors.accentBorder,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text
                      style={{
                        fontSize: 10,
                        color: '#fff',
                        fontFamily: monoFont,
                        fontWeight: '600',
                      }}>
                      {p.n}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 9,
                      color: colors.fg2,
                      marginTop: 4,
                      fontFamily: monoFont,
                      letterSpacing: 1,
                    }}>
                    {p.label.toUpperCase()}
                  </Text>
                </View>
              );
            })}
          </Tile>
        )}
      </View>
    </ScrollView>
  );
}
