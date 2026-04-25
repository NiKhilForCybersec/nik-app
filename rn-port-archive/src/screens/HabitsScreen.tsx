import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { Tile, Chip, Ring, Icon, ScreenHeader } from '../components';
import { colors, monoFont } from '../theme';
import { MOCK, type Habit } from '../data/mock';
import type { NavProps } from '../router';

type IntegrationProps = {
  label: string;
  sub: string;
  icon: string;
  on: boolean;
  onToggle?: () => void;
};

const IntegrationChip = ({ label, sub, icon, on, onToggle }: IntegrationProps) => (
  <Pressable
    onPress={onToggle}
    style={({ pressed }) => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: 14,
      opacity: pressed ? 0.85 : 1,
    })}>
    <Icon name={icon} size={14} color={on ? colors.accent : colors.fg3} />
    <View>
      <Text style={{ fontSize: 11, color: colors.fg, fontWeight: '500' }}>{label}</Text>
      <Text
        style={{
          fontSize: 8,
          color: colors.fg3,
          fontFamily: monoFont,
          letterSpacing: 0.5,
        }}>
        {sub}
      </Text>
    </View>
    <View
      style={{
        width: 28,
        height: 16,
        borderRadius: 99,
        backgroundColor: on ? colors.accent : 'rgba(255,255,255,0.1)',
        marginLeft: 4,
        position: 'relative',
      }}>
      <View
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 14 : 2,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: '#fff',
        }}
      />
    </View>
  </Pressable>
);

type SuggHabit = {
  name: string;
  icon: Habit['icon'];
  hue: number;
  target: number;
  unit: string;
};

const SUGGESTIONS: SuggHabit[] = [
  { name: 'Journal', icon: 'brain', hue: 280, target: 1, unit: 'entry' },
  { name: 'Stretch', icon: 'flame', hue: 40, target: 15, unit: 'min' },
  { name: 'Sunlight', icon: 'flame', hue: 50, target: 20, unit: 'min' },
  { name: 'Cold shower', icon: 'water', hue: 200, target: 1, unit: 'x' },
];

const habitEmoji: Record<string, string> = {
  water: '💧',
  book: '📖',
  dumbbell: '🏋️',
  brain: '🧘',
  flame: '🔥',
  moon: '🌙',
};

export default function HabitsScreen({ onBack }: NavProps) {
  const [habits, setHabits] = useState<Habit[]>(MOCK.habits);
  const [editing, setEditing] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [healthEnabled, setHealthEnabled] = useState(true);

  const bump = (id: string) =>
    setHabits((hs) =>
      hs.map((h) =>
        h.id === id ? { ...h, done: Math.min(h.target, h.done + 1) } : h,
      ),
    );
  const remove = (id: string) => setHabits((hs) => hs.filter((h) => h.id !== id));
  const add = (s: SuggHabit) =>
    setHabits((hs) => [
      ...hs,
      {
        id: 'h' + Date.now(),
        done: 0,
        streak: 0,
        name: s.name,
        icon: s.icon,
        hue: s.hue,
        target: s.target,
        unit: s.unit,
      },
    ]);

  const totalPct = habits.length
    ? habits.reduce((s, h) => s + h.done / h.target, 0) / habits.length
    : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 120 }}>
      <ScreenHeader
        title="Habits"
        subtitle="Rituals · Today"
        onBack={onBack}
        right={
          <Pressable
            onPress={() => setEditing((e) => !e)}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 99,
              backgroundColor: editing ? colors.accentSoft : colors.surface,
              borderWidth: 1,
              borderColor: editing ? colors.accentBorder : colors.hairline,
              opacity: pressed ? 0.8 : 1,
            })}>
            <Text
              style={{
                fontSize: 11,
                color: editing ? colors.accent : colors.fg2,
              }}>
              {editing ? 'Done' : 'Edit'}
            </Text>
          </Pressable>
        }
      />

      <View style={{ paddingHorizontal: 16 }}>
        {/* Hero ring */}
        <Tile
          style={{
            marginBottom: 12,
            padding: 18,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
          }}>
          <View>
            <Ring size={86} pct={totalPct} sw={6} />
            <View
              style={{
                position: 'absolute',
                width: 86,
                height: 86,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{ color: colors.fg, fontSize: 20, fontWeight: '600' }}>
                {Math.round(totalPct * 100)}%
              </Text>
              <Text style={{ color: colors.fg3, fontSize: 9, fontFamily: monoFont }}>
                COMPLETE
              </Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.fg, fontSize: 15, fontWeight: '500' }}>
              {habits.length} habits tracked
            </Text>
            <Text style={{ color: colors.fg2, fontSize: 12, marginTop: 4, lineHeight: 17 }}>
              Longest streak:{' '}
              <Text style={{ color: colors.flame, fontWeight: '700' }}>42 days</Text>. Hydrate next.
            </Text>
          </View>
        </Tile>

        {/* Integrations */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <IntegrationChip
            label="GPS"
            sub="auto-logging"
            icon="location"
            on={gpsEnabled}
            onToggle={() => setGpsEnabled((v) => !v)}
          />
          <IntegrationChip
            label="Apple Health"
            sub="12 metrics"
            icon="activity"
            on={healthEnabled}
            onToggle={() => setHealthEnabled((v) => !v)}
          />
          <IntegrationChip label="Calendar" sub="time blocks" icon="calendar" on={true} />
        </View>

        {/* Habit list */}
        <View style={{ gap: 10 }}>
          {habits.map((h) => {
            const pct = h.done / h.target;
            const done = h.done >= h.target;
            const emoji = habitEmoji[h.icon] || '✦';
            return (
              <Tile
                key={h.id}
                style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View>
                  <Ring size={52} pct={pct} sw={3} hue={h.hue} />
                  <View
                    style={{
                      position: 'absolute',
                      width: 52,
                      height: 52,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text style={{ fontSize: 18 }}>{emoji}</Text>
                  </View>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      flexWrap: 'wrap',
                    }}>
                    <Text style={{ color: colors.fg, fontSize: 14, fontWeight: '500' }}>
                      {h.name}
                    </Text>
                    {done && (
                      <Chip tone="ok" size="sm">
                        DONE
                      </Chip>
                    )}
                    {h.auto && (
                      <Chip tone="accent" size="sm">
                        AUTO
                      </Chip>
                    )}
                  </View>
                  <Text
                    style={{
                      color: colors.fg3,
                      fontSize: 10,
                      fontFamily: monoFont,
                      marginTop: 2,
                    }}>
                    {h.done} / {h.target} {h.unit} ·{' '}
                    <Text style={{ color: colors.flame }}>{h.streak}d</Text>
                    {h.source ? ` · ${h.source}` : ''}
                  </Text>
                </View>
                {editing ? (
                  <Pressable
                    onPress={() => remove(h.id)}
                    style={({ pressed }) => ({
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: 'rgba(248,113,113,0.15)',
                      borderWidth: 1,
                      borderColor: 'rgba(248,113,113,0.4)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.8 : 1,
                    })}>
                    <Icon name="close" size={14} color={colors.danger} />
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => bump(h.id)}
                    style={({ pressed }) => ({
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: done ? colors.okSoft : colors.accentSoft,
                      borderWidth: 1,
                      borderColor: done ? 'rgba(52,211,153,0.4)' : colors.accentBorder,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.8 : 1,
                    })}>
                    <Icon
                      name={done ? 'check' : 'plus'}
                      size={14}
                      color={done ? colors.ok : colors.accent}
                    />
                  </Pressable>
                )}
              </Tile>
            );
          })}
        </View>

        {/* Add habit CTA */}
        <Pressable
          style={({ pressed }) => ({
            marginTop: 12,
            padding: 14,
            borderRadius: 14,
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: colors.hairlineStrong,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: pressed ? 0.8 : 1,
          })}>
          <Icon name="plus" size={16} color={colors.fg2} />
          <Text style={{ color: colors.fg2, fontSize: 13 }}>New habit</Text>
        </Pressable>

        {/* Suggestions */}
        <Text
          style={{
            marginTop: 14,
            fontSize: 10,
            color: colors.fg3,
            fontFamily: monoFont,
            letterSpacing: 1.5,
            marginBottom: 6,
          }}>
          NIK SUGGESTS
        </Text>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {SUGGESTIONS.map((s) => (
            <Pressable
              key={s.name}
              onPress={() => add(s)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 11,
                paddingVertical: 7,
                borderRadius: 99,
                backgroundColor: colors.accentSoft,
                borderWidth: 1,
                borderColor: colors.accentBorder,
                opacity: pressed ? 0.8 : 1,
              })}>
              <Icon name="plus" size={10} color={colors.accent} />
              <Text style={{ color: colors.accent, fontSize: 11 }}>{s.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
