import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Tile, ScreenHeader } from '../components';
import { colors, monoFont } from '../theme';
import type { NavProps } from '../router';

const MONEY = {
  balance: 12480,
  currency: '$',
  delta30: -340,
  budgets: [
    { cat: 'Groceries', spent: 412, cap: 600, icon: 'shopping' },
    { cat: 'Dining', spent: 285, cap: 250, icon: 'utensils' },
    { cat: 'Transport', spent: 78, cap: 200, icon: 'car' },
    { cat: 'Family', spent: 540, cap: 800, icon: 'users' },
    { cat: 'Health', spent: 95, cap: 200, icon: 'heart' },
  ],
  bills: [
    { name: 'Rent', amt: 2400, when: 'Dec 1', auto: true },
    { name: 'Internet', amt: 65, when: 'Dec 4', auto: true },
    { name: 'Spotify', amt: 16, when: 'Dec 8', auto: true },
    { name: "Kiaan's piano", amt: 180, when: 'Dec 10', auto: false },
  ],
  recent: [
    { merchant: 'Whole Foods', amt: -86.4, cat: 'Groceries', when: '2h ago' },
    { merchant: 'Uber', amt: -14.2, cat: 'Transport', when: 'yesterday' },
    { merchant: 'Salary · Acme', amt: 4200, cat: 'Income', when: 'Nov 28' },
    { merchant: "Joe's Pizza", amt: -42.5, cat: 'Dining', when: 'Nov 28' },
  ],
} as const;

type TabKey = 'overview' | 'bills' | 'recent';

export default function MoneyScreen({ onBack }: NavProps) {
  const [tab, setTab] = useState<TabKey>('overview');
  const m = MONEY;

  const tabs: Array<[TabKey, string]> = [
    ['overview', 'Budgets'],
    ['bills', 'Bills'],
    ['recent', 'Activity'],
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 100 }}>
      <ScreenHeader title="Money" subtitle="Money · November" onBack={onBack} />

      <View style={{ paddingHorizontal: 16 }}>
        {/* Net balance */}
        <Tile style={{ marginBottom: 12, overflow: 'hidden' }}>
          <Text
            style={{
              color: colors.fg3,
              fontSize: 10,
              fontFamily: monoFont,
              letterSpacing: 1.5,
            }}>
            NET BALANCE
          </Text>
          <Text
            style={{
              color: colors.fg,
              fontSize: 38,
              fontWeight: '500',
              marginTop: 4,
              lineHeight: 42,
            }}>
            {m.currency}
            {m.balance.toLocaleString()}
          </Text>
          <Text
            style={{
              color: m.delta30 < 0 ? colors.warn : colors.ok,
              fontSize: 12,
              marginTop: 4,
            }}>
            {m.delta30 < 0 ? '↓' : '↑'} {m.currency}
            {Math.abs(m.delta30)} in 30 days
          </Text>
        </Tile>

        {/* Nik noticed */}
        <Tile
          style={{
            marginBottom: 12,
            backgroundColor: colors.accentSoft,
            borderColor: colors.accentBorder,
          }}>
          <Text
            style={{
              color: colors.fg3,
              fontSize: 10,
              fontFamily: monoFont,
              letterSpacing: 1.5,
              marginBottom: 4,
            }}>
            NIK NOTICED
          </Text>
          <Text style={{ color: colors.fg, fontSize: 13, lineHeight: 19 }}>
            You're <Text style={{ fontWeight: '700' }}>$35 over</Text> on Dining this month. Want to
            skip Friday takeout to stay on track?
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
            <Pressable style={{ flex: 1 }}>
              <LinearGradient
                colors={[colors.accent, colors.accent2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 8,
                  borderRadius: 9,
                  alignItems: 'center',
                }}>
                <Text style={{ color: '#06060a', fontSize: 11, fontWeight: '600' }}>
                  Skip Friday
                </Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 9,
                backgroundColor: colors.surfaceStrong,
              }}>
              <Text style={{ color: colors.fg2, fontSize: 11 }}>Maybe later</Text>
            </Pressable>
          </View>
        </Tile>

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
            const active = tab === k;
            return (
              <Pressable
                key={k}
                onPress={() => setTab(k)}
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

        {tab === 'overview' && (
          <View style={{ gap: 8 }}>
            {m.budgets.map((b) => {
              const pct = Math.min(1, b.spent / b.cap);
              const over = b.spent > b.cap;
              return (
                <Tile key={b.cat} style={{ padding: 12 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}>
                    <Text style={{ color: colors.fg, fontSize: 13, fontWeight: '500' }}>
                      {b.cat}
                    </Text>
                    <Text
                      style={{
                        color: over ? colors.warn : colors.fg2,
                        fontSize: 11,
                        fontFamily: monoFont,
                      }}>
                      {m.currency}
                      {b.spent} / {b.cap}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 6,
                      backgroundColor: colors.surfaceStrong,
                      borderRadius: 99,
                      overflow: 'hidden',
                    }}>
                    {over ? (
                      <View
                        style={{
                          width: `${pct * 100}%`,
                          height: '100%',
                          backgroundColor: colors.warn,
                        }}
                      />
                    ) : (
                      <LinearGradient
                        colors={[colors.accent2, colors.accent]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ width: `${pct * 100}%`, height: '100%' }}
                      />
                    )}
                  </View>
                </Tile>
              );
            })}
          </View>
        )}

        {tab === 'bills' && (
          <View style={{ gap: 8 }}>
            {m.bills.map((b, i) => (
              <Tile
                key={i}
                style={{
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: colors.surfaceStrong,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.fg3,
                      fontFamily: monoFont,
                    }}>
                    {b.when.split(' ')[1]}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.fg, fontSize: 13, fontWeight: '500' }}>
                    {b.name}
                  </Text>
                  <Text
                    style={{
                      color: colors.fg3,
                      fontSize: 10,
                      fontFamily: monoFont,
                      marginTop: 2,
                    }}>
                    {b.when.toUpperCase()} · {b.auto ? 'AUTO-PAY' : 'MANUAL'}
                  </Text>
                </View>
                <Text
                  style={{
                    color: colors.fg,
                    fontSize: 13,
                    fontFamily: monoFont,
                    fontWeight: '500',
                  }}>
                  {m.currency}
                  {b.amt}
                </Text>
              </Tile>
            ))}
          </View>
        )}

        {tab === 'recent' && (
          <View style={{ gap: 6 }}>
            {m.recent.map((t, i) => (
              <Tile
                key={i}
                style={{
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.fg, fontSize: 13 }}>{t.merchant}</Text>
                  <Text
                    style={{
                      color: colors.fg3,
                      fontSize: 10,
                      fontFamily: monoFont,
                      marginTop: 2,
                    }}>
                    {t.cat.toUpperCase()} · {t.when.toUpperCase()}
                  </Text>
                </View>
                <Text
                  style={{
                    color: t.amt > 0 ? colors.ok : colors.fg,
                    fontSize: 13,
                    fontFamily: monoFont,
                    fontWeight: '500',
                  }}>
                  {t.amt > 0 ? '+' : ''}
                  {m.currency}
                  {Math.abs(t.amt).toFixed(2)}
                </Text>
              </Tile>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
