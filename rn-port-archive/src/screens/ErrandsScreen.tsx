import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polyline } from 'react-native-svg';
import { Tile, ScreenHeader } from '../components';
import { colors, monoFont } from '../theme';
import type { NavProps } from '../router';

type ErrandItem = {
  id: number;
  t: string;
  where: string;
  when: string;
  addr: string;
  done: boolean;
};

type Stop = { name: string; t: string; kind: 'errand' | 'home' };

const INITIAL_ERRANDS: ErrandItem[] = [
  { id: 1, t: 'Pick up dry cleaning', where: 'Lupita Cleaners', when: 'Today', addr: '7 min', done: false },
  { id: 2, t: 'Grab eggs, oat milk, sourdough', where: 'Whole Foods', when: 'Today', addr: '11 min', done: false },
  { id: 3, t: "Drop off Anya's prescription", where: 'CVS · Atlantic Ave', when: 'Today', addr: '9 min', done: false },
  { id: 4, t: 'Return Amazon package', where: 'UPS Store', when: 'This week', addr: '6 min', done: false },
  { id: 5, t: 'Mail birthday card to Mom', where: 'USPS', when: 'This week', addr: '6 min', done: true },
];

const OPTIMIZED: Stop[] = [
  { name: 'Lupita Cleaners', t: '4 min', kind: 'errand' },
  { name: 'CVS · Atlantic', t: '6 min walk', kind: 'errand' },
  { name: 'UPS Store', t: '2 min walk', kind: 'errand' },
  { name: 'Whole Foods', t: '5 min walk', kind: 'errand' },
  { name: 'Home', t: '8 min', kind: 'home' },
];

export default function ErrandsScreen({ onBack }: NavProps) {
  const [items, setItems] = useState<ErrandItem[]>(INITIAL_ERRANDS);
  const toggle = (id: number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  const remaining = items.filter((i) => !i.done).length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 100 }}>
      <ScreenHeader
        title="Errands"
        subtitle={`${remaining} open · 35 min of tasks`}
        onBack={onBack}
      />

      <View style={{ paddingHorizontal: 16 }}>
        {/* AI route */}
        <Tile
          style={{
            padding: 14,
            marginBottom: 12,
            backgroundColor: colors.accentSoft,
            borderColor: colors.accentBorder,
            overflow: 'hidden',
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 10,
            }}>
            <Text
              style={{
                fontSize: 10,
                color: colors.fg3,
                fontFamily: monoFont,
                letterSpacing: 1.5,
              }}>
              AETHER ROUTED IT
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: colors.ok,
                fontFamily: monoFont,
              }}>
              SAVES 18 MIN
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center', paddingBottom: 4 }}>
            {OPTIMIZED.map((stop, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ alignItems: 'center', minWidth: 64 }}>
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor:
                        stop.kind === 'home' ? colors.accent : colors.surfaceStrong,
                      borderWidth: stop.kind === 'home' ? 0 : 1,
                      borderColor: colors.hairlineStrong,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text
                      style={{
                        color: stop.kind === 'home' ? '#06060a' : colors.fg2,
                        fontSize: 10,
                        fontWeight: '600',
                      }}>
                      {i + 1}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 9,
                      color: colors.fg2,
                      marginTop: 4,
                      fontWeight: '500',
                      textAlign: 'center',
                    }}>
                    {stop.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 8,
                      color: colors.fg3,
                      fontFamily: monoFont,
                    }}>
                    {stop.t.toUpperCase()}
                  </Text>
                </View>
                {i < OPTIMIZED.length - 1 && (
                  <View style={{ width: 24, marginTop: -22, paddingHorizontal: 4 }}>
                    <Svg width="100%" height={2}>
                      <Polyline
                        points="0,1 100,1"
                        stroke={colors.hairlineStrong}
                        strokeWidth={1}
                      />
                    </Svg>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
            <Pressable style={{ flex: 1 }}>
              <LinearGradient
                colors={[colors.accent, colors.accent2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}>
                <Text style={{ color: '#06060a', fontSize: 12, fontWeight: '600' }}>
                  Start route
                </Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 10,
                backgroundColor: colors.surfaceStrong,
              }}>
              <Text style={{ color: colors.fg2, fontSize: 12 }}>Map</Text>
            </Pressable>
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
          ALL ERRANDS
        </Text>

        <View style={{ gap: 6 }}>
          {items.map((it) => (
            <Tile
              key={it.id}
              style={{
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                opacity: it.done ? 0.4 : 1,
              }}>
              <Pressable
                onPress={() => toggle(it.id)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: it.done ? 0 : 1.5,
                  borderColor: colors.hairlineStrong,
                  backgroundColor: it.done ? colors.accent : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {it.done && (
                  <Svg width={12} height={12} viewBox="0 0 24 24">
                    <Polyline
                      points="20 6 9 17 4 12"
                      stroke="#06060a"
                      strokeWidth={3}
                      fill="none"
                    />
                  </Svg>
                )}
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.fg,
                    textDecorationLine: it.done ? 'line-through' : 'none',
                  }}>
                  {it.t}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: colors.fg3,
                    fontFamily: monoFont,
                    marginTop: 2,
                  }}>
                  {it.where.toUpperCase()} · {it.addr.toUpperCase()}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 10,
                  color: colors.fg2,
                  fontFamily: monoFont,
                }}>
                {it.when.toUpperCase()}
              </Text>
            </Tile>
          ))}
        </View>

        <Pressable
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 14,
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: colors.hairlineStrong,
            alignItems: 'center',
          }}>
          <Text style={{ fontSize: 12, color: colors.fg2 }}>+ Add errand · or speak it</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
