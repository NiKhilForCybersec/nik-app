import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { Tile, Chip, Icon, ScreenHeader } from '../components';
import { colors, monoFont } from '../theme';
import type { NavProps, ScreenId } from '../router';

type MoreItem = {
  id: ScreenId;
  icon: string;
  label: string;
  sub: string;
  tag?: string;
};

const MORE_ITEMS: MoreItem[] = [
  { id: 'diary', icon: 'book', label: 'Diary', tag: 'NEW', sub: 'Daily · photos · voice' },
  { id: 'focus', icon: 'target', label: 'Focus Mode', tag: 'NEW', sub: 'Timer · lockdown · tree' },
  { id: 'score', icon: 'sparkle', label: 'Nik Score', tag: 'NEW', sub: '4 pillars · 0–1000' },
  { id: 'meds', icon: 'pill', label: 'Meds', sub: 'Schedules · Rx · AI add' },
  { id: 'familyops', icon: 'family', label: 'Family Ops', sub: 'Tasks · alarms · rules' },
  { id: 'family', icon: 'family', label: 'Family Circle', sub: 'Locations · XP · pings' },
  { id: 'fitness', icon: 'dumbbell', label: 'Fitness', sub: 'Coach · library · plan' },
  { id: 'sleep', icon: 'moon', label: 'Sleep', sub: 'Stages · trend · score' },
  { id: 'money', icon: 'wallet', label: 'Money', sub: 'Spend · goals · alerts' },
  { id: 'brief', icon: 'notebook', label: 'Daily Brief', sub: 'Morning rundown' },
  { id: 'vault', icon: 'vault', label: 'Vault', sub: 'Memories · docs · lock' },
  { id: 'errands', icon: 'errand', label: 'Errands', sub: 'Run list · GPS' },
  { id: 'couple', icon: 'couple', label: 'Couple', sub: 'Shared with Meera' },
  { id: 'kids', icon: 'baby', label: 'Kids', sub: 'Routines · Kiaan' },
  { id: 'circle', icon: 'family', label: 'Circle', sub: 'Wider network' },
  { id: 'quests', icon: 'list', label: 'Quests', sub: 'Daily log · XP' },
  { id: 'chat', icon: 'mic', label: 'Ask Nik', sub: 'Voice · chat' },
  { id: 'profile', icon: 'settings', label: 'Profile', sub: 'Themes · connect · settings' },
];

export default function MoreScreen({ onNav, onBack }: NavProps) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 120 }}>
      <ScreenHeader title="More" subtitle="Dashboards · 18" onBack={onBack} />

      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <Text
          style={{
            color: colors.fg3,
            fontSize: 11,
            fontFamily: monoFont,
            letterSpacing: 1.5,
          }}>
          ALL SECTIONS
        </Text>
      </View>

      <View
        style={{
          paddingHorizontal: 16,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        }}>
        {MORE_ITEMS.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => onNav(m.id)}
            style={({ pressed }) => ({
              width: '48.5%',
              opacity: pressed ? 0.85 : 1,
            })}>
            <Tile style={{ padding: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: colors.accentSoft,
                    borderWidth: 1,
                    borderColor: colors.accentBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Icon name={m.icon} size={16} color={colors.accent} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text
                      style={{ color: colors.fg, fontSize: 12, fontWeight: '600' }}
                      numberOfLines={1}>
                      {m.label}
                    </Text>
                    {m.tag && (
                      <Chip tone="accent" size="sm">
                        {m.tag}
                      </Chip>
                    )}
                  </View>
                  <Text
                    style={{
                      color: colors.fg3,
                      fontSize: 9,
                      fontFamily: monoFont,
                      letterSpacing: 0.5,
                      marginTop: 2,
                    }}
                    numberOfLines={1}>
                    {m.sub}
                  </Text>
                </View>
              </View>
            </Tile>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
