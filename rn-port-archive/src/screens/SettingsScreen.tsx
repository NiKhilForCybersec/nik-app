import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { Tile, Icon, ScreenHeader } from '../components';
import { colors, monoFont } from '../theme';
import type { NavProps } from '../router';

type SettingsItem = { k: string; t: string; sub: string; danger?: boolean };
type SettingsSection = { head: string; items: SettingsItem[] };

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    head: 'You',
    items: [
      { k: 'profile', t: 'Name, photo, voice', sub: 'Ravi · Morning calm voice' },
      { k: 'rhythm', t: 'Daily rhythm', sub: 'Up 6:45 · bed 23:15' },
      { k: 'health', t: 'Health profile', sub: 'Connected · Apple Health' },
    ],
  },
  {
    head: 'Nik',
    items: [
      { k: 'voice', t: 'Voice & tone', sub: 'Morning calm · 1.0× · whispers' },
      { k: 'autonomy', t: 'How proactive should I be?', sub: "Suggest, don't auto-act" },
      { k: 'memory', t: 'Memory & forgetting', sub: 'Forgets weekly · keeps milestones' },
      { k: 'brief', t: "Today's Brief", sub: '6:50 AM · 4 minutes · 7 sections' },
    ],
  },
  {
    head: 'Permissions',
    items: [
      { k: 'cal', t: 'Calendar', sub: 'iCloud + Google · read & write' },
      { k: 'health2', t: 'Health & fitness', sub: 'Sleep, steps, workouts' },
      { k: 'loc', t: 'Location', sub: 'While using · errand routing' },
      { k: 'contacts', t: 'Contacts', sub: 'Read only · for nudges' },
      { k: 'photos', t: 'Photos', sub: 'On-device · for vault & memories' },
    ],
  },
  {
    head: 'Family',
    items: [
      { k: 'circle', t: 'Your circle', sub: 'Meera, Anya, Kiaan, Mom, Sister' },
      { k: 'roles', t: 'Roles & sharing', sub: 'What each person sees' },
      { k: 'kidmode', t: 'Kids mode', sub: 'Anya · supervised' },
    ],
  },
  {
    head: 'Privacy',
    items: [
      { k: 'data', t: 'Your data', sub: 'On-device first · cloud opt-in' },
      { k: 'export', t: 'Export everything', sub: 'JSON + media archive' },
      { k: 'delete', t: 'Delete account', sub: 'All data, irreversible', danger: true },
    ],
  },
  {
    head: 'Aesthetic',
    items: [
      { k: 'theme', t: 'Theme universe', sub: '12 universes · current: Nik Noir' },
      { k: 'font', t: 'Typography', sub: 'Editorial serif · larger' },
      { k: 'density', t: 'Density', sub: 'Comfortable' },
      { k: 'haptics', t: 'Haptics & sound', sub: 'Subtle · system' },
    ],
  },
];

const THEME_UNIVERSES = [
  { k: 'noir', t: 'Nik Noir' },
  { k: 'dawn', t: 'Soft Dawn' },
  { k: 'forest', t: 'Forest' },
  { k: 'ghibli', t: 'Studio' },
];

export default function SettingsScreen({ onBack }: NavProps) {
  const [open, setOpen] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>('noir');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 100 }}>
      <ScreenHeader title="Settings" subtitle="Settings" onBack={onBack} />

      <View style={{ paddingHorizontal: 16 }}>
        {/* Search */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: colors.surfaceStrong,
            marginBottom: 16,
          }}>
          <Icon name="compass" size={14} color={colors.fg3} />
          <Text style={{ fontSize: 13, color: colors.fg3 }}>Search settings</Text>
        </View>

        {SETTINGS_SECTIONS.map((sec) => (
          <View key={sec.head} style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 10,
                color: colors.fg3,
                fontFamily: monoFont,
                letterSpacing: 1.5,
                marginBottom: 8,
                paddingHorizontal: 4,
              }}>
              {sec.head.toUpperCase()}
            </Text>
            <Tile style={{ padding: 0, overflow: 'hidden' }}>
              {sec.items.map((it, i) => {
                const isOpen = open === it.k;
                const isThemeRow = it.k === 'theme';
                return (
                  <View key={it.k}>
                    <Pressable
                      onPress={() => setOpen(isOpen ? null : it.k)}
                      style={({ pressed }) => ({
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        borderBottomWidth: i < sec.items.length - 1 ? 1 : 0,
                        borderBottomColor: colors.hairline,
                        opacity: pressed ? 0.7 : 1,
                      })}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            color: it.danger ? colors.warn : colors.fg,
                            fontWeight: '500',
                          }}>
                          {it.t}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.fg3, marginTop: 2 }}>
                          {it.sub}
                        </Text>
                      </View>
                      <Icon
                        name={isOpen ? 'chevron' : 'chevR'}
                        size={14}
                        color={colors.fg3}
                      />
                    </Pressable>

                    {isOpen && isThemeRow && (
                      <View
                        style={{
                          paddingHorizontal: 16,
                          paddingBottom: 14,
                          borderBottomWidth: i < sec.items.length - 1 ? 1 : 0,
                          borderBottomColor: colors.hairline,
                        }}>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {THEME_UNIVERSES.map((u) => {
                            const active = theme === u.k;
                            return (
                              <Pressable
                                key={u.k}
                                onPress={() => setTheme(u.k)}
                                style={{
                                  paddingHorizontal: 12,
                                  paddingVertical: 8,
                                  borderRadius: 10,
                                  backgroundColor: active
                                    ? colors.accentSoft
                                    : colors.surfaceStrong,
                                  borderWidth: 1,
                                  borderColor: active ? colors.accent : colors.hairline,
                                }}>
                                <Text
                                  style={{
                                    fontSize: 12,
                                    color: active ? colors.accent : colors.fg,
                                    fontWeight: active ? '600' : '400',
                                  }}>
                                  {u.t}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    {isOpen && !isThemeRow && (
                      <View
                        style={{
                          paddingHorizontal: 16,
                          paddingBottom: 14,
                          borderBottomWidth: i < sec.items.length - 1 ? 1 : 0,
                          borderBottomColor: colors.hairline,
                        }}>
                        <Text style={{ fontSize: 11, color: colors.fg3, lineHeight: 16 }}>
                          Detail panel for "{it.t}" — full controls coming in v2.
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </Tile>
          </View>
        ))}

        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Text
            style={{
              fontSize: 10,
              color: colors.fg3,
              fontFamily: monoFont,
              letterSpacing: 1,
            }}>
            NIK · 1.4.2 · BUILD 8801
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
