import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Svg, { Path, Circle as SvgCircle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Tile, Icon, ScreenHeader } from '../components';
import { colors, monoFont, hueColor } from '../theme';
import type { NavProps } from '../router';

// ── Inlined mock data (from prototype diary.jsx) ──────────────────
type Media = { kind: 'photo' | 'video'; src?: string; caption?: string };
type Voice = { duration: number; transcript: string };
type Entry = {
  id: string;
  date: string;
  dateLabel: string;
  mood?: number;
  weather?: string;
  location?: string;
  title?: string;
  text?: string;
  media?: Media[];
  tags?: string[];
  aiPrompt?: string | null;
  voice?: Voice;
  pillar?: 'mind' | 'health' | 'family';
  score?: number;
};

const MOCK_DIARY: Entry[] = [
  {
    id: 'd1', date: '2026-04-25', dateLabel: 'Today',
    mood: 4, weather: '☀️ 24°', location: 'Bandra · Cafe Zoe',
    title: 'Long morning, finally',
    text: "Slept past the alarm and didn't feel guilty about it. Aanya drew a dragon at breakfast and named it Pomelo.",
    media: [{ kind: 'photo', src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', caption: 'Cafe Zoe' }],
    tags: ['family', 'aanya'],
    aiPrompt: 'You named your sleep "earned, not stolen" today. What changed?',
    voice: { duration: 47, transcript: 'Pomelo the dragon eats only mangoes apparently.' },
    pillar: 'mind', score: 5,
  },
  {
    id: 'd2', date: '2026-04-24', dateLabel: 'Yesterday',
    mood: 3, weather: '🌧 22°', location: 'Home',
    title: 'Stuck on the spec',
    text: 'The architecture diagram for the new sync engine refuses to land. Three rewrites in. Tomorrow I block 9–11 with no slack.',
    media: [], tags: ['work', 'frustration'], aiPrompt: null,
    pillar: 'mind', score: 3,
  },
  {
    id: 'd3', date: '2026-04-23', dateLabel: 'Wed · Apr 23',
    mood: 5, weather: '☀️ 26°', location: 'Versova Beach',
    title: 'First proper run since the surgery',
    text: '5km without stopping. Lungs sang. Reminded me what the body was for before laptops.',
    media: [
      { kind: 'photo', src: 'https://images.unsplash.com/photo-1502209524164-acea936639a2?w=400' },
      { kind: 'photo', src: 'https://images.unsplash.com/photo-1466721591366-2d5fba72006d?w=400' },
    ],
    tags: ['health', 'milestone'], pillar: 'health', score: 8,
  },
  {
    id: 'd4', date: '2026-04-22', dateLabel: 'Tue · Apr 22',
    mood: 4, weather: '🌤 25°', location: "Home · Anya's room",
    title: 'Bedtime story #214',
    text: 'Anya asked if grown-ups have favourite stuffed animals. I lied and said no. Pomelo would be embarrassed.',
    tags: ['family', 'kids'], media: [], pillar: 'family', score: 5,
  },
];

const ON_THIS_DAY = [
  { yearsAgo: 1, title: "Anya's 4th birthday",
    preview: 'She blew out the candles in two attempts and demanded a re-shoot.',
    date: 'Apr 25, 2025' },
  { yearsAgo: 2, title: 'Quit the agency',
    preview: 'Last day at Zenith. Drove home with the windows down. Felt like air.',
    date: 'Apr 25, 2024' },
];

// ── Sub components ────────────────────────────────────────────────
const MoodSpark = ({ values }: { values: number[] }) => {
  const w = 140, h = 28;
  const max = 5, min = 1;
  const points = values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return [x, y] as const;
  });
  const path = points
    .map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1))
    .join(' ');
  return (
    <Svg width={w} height={h} style={{ marginTop: 4, overflow: 'visible' }}>
      <Path d={path} fill="none" stroke={colors.accent} strokeWidth={1.5}
        strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <SvgCircle key={i} cx={p[0]} cy={p[1]} r={1.8}
          fill={i === points.length - 1 ? hueColor(280, 0.9, 0.18) : colors.accent} />
      ))}
    </Svg>
  );
};

const moods = ['😞', '😕', '😐', '🙂', '😊', '🤩'];

const EntryCard = ({ entry }: { entry: Entry }) => (
  <Tile style={{ padding: 12 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <Text style={{
        fontSize: 10, color: colors.fg3, fontFamily: monoFont, letterSpacing: 1,
      }}>{entry.dateLabel.toUpperCase()}</Text>
      {entry.weather && (
        <Text style={{ fontSize: 10, color: colors.fg3 }}>· {entry.weather}</Text>
      )}
      <View style={{ flex: 1 }} />
      {entry.mood !== undefined && (
        <Text style={{ fontSize: 14 }}>{moods[entry.mood]}</Text>
      )}
    </View>
    {entry.title && (
      <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 4, color: colors.fg }}>
        {entry.title}
      </Text>
    )}
    {entry.text && (
      <Text style={{ fontSize: 12, color: colors.fg2, lineHeight: 17 }} numberOfLines={3}>
        {entry.text}
      </Text>
    )}
    {entry.media && entry.media.length > 0 && (
      <View style={{ flexDirection: 'row', gap: 4, marginTop: 8 }}>
        {entry.media.slice(0, 3).map((m, i) => (
          <View key={i} style={{
            width: 70, height: 70, borderRadius: 8,
            backgroundColor: colors.surfaceStrong,
            alignItems: 'center', justifyContent: 'center',
          }}>
            {m.kind === 'video' && (
              <View style={{
                width: 22, height: 22, borderRadius: 11,
                backgroundColor: 'rgba(0,0,0,0.5)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ color: '#fff', fontSize: 10 }}>▶</Text>
              </View>
            )}
          </View>
        ))}
        {entry.media.length > 3 && (
          <View style={{
            width: 70, height: 70, borderRadius: 8,
            backgroundColor: colors.surface,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 11, color: colors.fg2 }}>+{entry.media.length - 3}</Text>
          </View>
        )}
      </View>
    )}
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap',
    }}>
      {entry.location && (
        <Text style={{ fontSize: 9, color: colors.fg3, fontFamily: monoFont }}>
          📍 {entry.location}
        </Text>
      )}
      {entry.voice && (
        <Text style={{ fontSize: 9, color: colors.fg3, fontFamily: monoFont }}>
          · 🎙 {entry.voice.duration}s
        </Text>
      )}
      {entry.tags?.slice(0, 3).map(t => (
        <Text key={t} style={{ fontSize: 9, color: colors.fg3, fontFamily: monoFont }}>
          #{t}
        </Text>
      ))}
      <View style={{ flex: 1 }} />
      {entry.score !== undefined && (
        <Text style={{ fontSize: 9, color: colors.accent, fontFamily: monoFont }}>
          +{entry.score} mind
        </Text>
      )}
    </View>
  </Tile>
);

// ── Main screen ────────────────────────────────────────────────────
export default function DiaryScreen({ onBack }: NavProps) {
  const [entries] = useState<Entry[]>(MOCK_DIARY);
  const [filter, setFilter] = useState<'all' | 'photos' | 'voice' | 'mood'>('all');

  const filtered = entries.filter(e => {
    if (filter === 'photos') return (e.media || []).some(m => m.kind === 'photo' || m.kind === 'video');
    if (filter === 'voice') return !!e.voice;
    if (filter === 'mood') return (e.mood || 0) >= 4;
    return true;
  });

  const last7Mood = entries.slice(0, 7).map(e => e.mood || 3).reverse();
  const avgMood = (last7Mood.reduce((a, b) => a + b, 0) / last7Mood.length).toFixed(1);

  const filters: Array<['all' | 'photos' | 'voice' | 'mood', string]> = [
    ['all', 'All'], ['photos', 'Photos'], ['voice', 'Voice'], ['mood', 'Bright days'],
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 100 }}>
      <ScreenHeader
        title="Your private record"
        subtitle={`Diary · ${entries.length} entries`}
        onBack={onBack}
      />

      <View style={{ paddingHorizontal: 16 }}>
        {/* Mood spark + on this day */}
        <Tile style={{ padding: 14, marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 9, color: colors.fg3, fontFamily: monoFont, letterSpacing: 1, marginBottom: 4,
              }}>MOOD · 7 DAYS</Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.fg }}>
                {avgMood}{' '}
                <Text style={{ fontSize: 11, color: colors.fg3, fontWeight: '400' }}>avg</Text>
              </Text>
              <MoodSpark values={last7Mood} />
            </View>
            {ON_THIS_DAY[0] && (
              <View style={{
                flex: 1.4, padding: 10, borderRadius: 10,
                backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accentBorder,
              }}>
                <Text style={{
                  fontSize: 9, color: colors.accent, fontFamily: monoFont, letterSpacing: 1, marginBottom: 4,
                }}>ON THIS DAY · {ON_THIS_DAY[0].yearsAgo}Y AGO</Text>
                <Text style={{ fontSize: 12, fontWeight: '500', color: colors.fg }}>
                  {ON_THIS_DAY[0].title}
                </Text>
                <Text style={{ fontSize: 10, color: colors.fg2, marginTop: 3, lineHeight: 13 }}
                  numberOfLines={2}>
                  {ON_THIS_DAY[0].preview}
                </Text>
              </View>
            )}
          </View>
        </Tile>

        {/* AI prompt today */}
        <Tile style={{
          padding: 12, marginBottom: 10,
          borderColor: colors.accentBorder,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <LinearGradient
              colors={[colors.accent, colors.accent2]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{
                width: 30, height: 30, borderRadius: 9,
                alignItems: 'center', justifyContent: 'center',
              }}>
              <Icon name="sparkles" size={14} color="#06060a" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 9, color: colors.accent, fontFamily: monoFont, letterSpacing: 1.5, marginBottom: 3,
              }}>NIK PROMPT · TODAY</Text>
              <Text style={{ fontSize: 13, color: colors.fg, lineHeight: 18, fontStyle: 'italic' }}>
                "What did you learn this morning that yesterday-you didn't know?"
              </Text>
              <View style={{ marginTop: 7, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 10, color: colors.accent, fontWeight: '500' }}>Answer this</Text>
                <Icon name="chevR" size={9} color={colors.accent} />
              </View>
            </View>
          </View>
        </Tile>

        {/* Filters */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {filters.map(([k, l]) => (
            <Pressable key={k} onPress={() => setFilter(k)} style={{
              paddingHorizontal: 11, paddingVertical: 6, borderRadius: 99,
              backgroundColor: filter === k ? colors.accentSoft : colors.surface,
              borderWidth: 1, borderColor: filter === k ? colors.accentBorder : colors.hairline,
            }}>
              <Text style={{ fontSize: 11, color: filter === k ? colors.accent : colors.fg2 }}>{l}</Text>
            </Pressable>
          ))}
        </View>

        {/* Entry timeline */}
        <View style={{ gap: 8 }}>
          {filtered.map(e => <EntryCard key={e.id} entry={e} />)}
        </View>
      </View>
    </ScrollView>
  );
}
