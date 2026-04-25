import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Tile, ScreenHeader } from '../components';
import { colors, hueColor, monoFont } from '../theme';
import type { NavProps } from '../router';

type Segment = { t: string; label: string; body: string };

const BRIEF: { date: string; duration: string; segments: Segment[] } = {
  date: 'Friday, Nov 29',
  duration: '4:12',
  segments: [
    {
      t: '0:00',
      label: 'Good morning',
      body: "6:45 wake. You slept 7h 24m — better than your two-week average. Sky's overcast in Brooklyn, 38°F. No rain until evening.",
    },
    {
      t: '0:34',
      label: "Today's shape",
      body: 'Three meetings, all before lunch. Then a clear afternoon — Maya blocked it for you Tuesday, remember? Pickup at 4:15. Anya has piano at 5:30.',
    },
    {
      t: '1:18',
      label: 'On your mind',
      body: "You wanted to call your dad. It's been 11 days. He's probably at the market — try after 2pm his time.",
    },
    {
      t: '1:52',
      label: 'One nudge',
      body: "You've got a soft commitment to send Carlos the Q4 outline by EOW. 90 minutes of focus time on it would do it.",
    },
    {
      t: '2:30',
      label: 'Money & home',
      body: 'Rent clears Sunday. Groceries are getting low — eggs, oat milk, the bread Anya likes. Whole Foods has them all.',
    },
    {
      t: '3:08',
      label: 'Read later',
      body: "I saved that piece on attention you started yesterday. It's 18 minutes. The bus ride home is 22.",
    },
    {
      t: '3:42',
      label: 'A small thing',
      body: "It's Meera's mom's birthday tomorrow. You wrote yourself a note in October to remember. Want me to draft a card?",
    },
  ],
};

const HUE = 280;

export default function BriefScreen({ onBack }: NavProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0.18);
  const [activeSeg, setActiveSeg] = useState(1);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setProgress((p) => {
        const next = p + 0.004;
        if (next >= 1) {
          setPlaying(false);
          return 1;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [playing]);

  const totalSec = 4 * 60 + 12;
  const cur = Math.floor(progress * totalSec);
  const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 100 }}>
      <ScreenHeader title="Today's Brief" subtitle={BRIEF.date} onBack={onBack} />

      <View style={{ paddingHorizontal: 16 }}>
        {/* Player */}
        <Tile style={{ marginBottom: 14, paddingVertical: 18 }}>
          {/* Voice viz */}
          <View
            style={{
              height: 60,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              marginBottom: 14,
            }}>
            {Array.from({ length: 48 }).map((_, i) => {
              const seed = Math.sin(i * 1.3) * 0.5 + 0.5;
              const baseH = 8 + seed * 36;
              const passed = i / 48 < progress;
              return (
                <View
                  key={i}
                  style={{
                    width: 2,
                    height: baseH,
                    borderRadius: 99,
                    backgroundColor: passed ? hueColor(HUE, 0.85, 0.14) : `${hueColor(HUE, 0.78)}40`,
                  }}
                />
              );
            })}
          </View>

          {/* Time */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}>
            <Text style={{ fontSize: 10, color: colors.fg3, fontFamily: monoFont }}>{fmt(cur)}</Text>
            <Text style={{ fontSize: 10, color: colors.fg3, fontFamily: monoFont }}>
              {BRIEF.duration}
            </Text>
          </View>

          {/* Controls */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 22,
            }}>
            <Pressable
              onPress={() => setProgress((p) => Math.max(0, p - 0.05))}
              style={{
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{ fontSize: 22, color: colors.fg2 }}>⏮</Text>
            </Pressable>
            <Pressable onPress={() => setPlaying(!playing)}>
              <LinearGradient
                colors={[hueColor(HUE, 0.78), hueColor(HUE, 0.55, 0.2)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={{ fontSize: 22, color: '#06060a' }}>{playing ? '⏸' : '▶'}</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={() => setProgress((p) => Math.min(1, p + 0.05))}
              style={{
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{ fontSize: 22, color: colors.fg2 }}>⏭</Text>
            </Pressable>
          </View>

          {/* Speed + queue */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 14,
            }}>
            <Text style={{ fontSize: 10, color: colors.fg3, fontFamily: monoFont, letterSpacing: 1 }}>
              1.0×
            </Text>
            <Text style={{ fontSize: 10, color: colors.fg3, fontFamily: monoFont, letterSpacing: 1 }}>
              VOICE · MORNING
            </Text>
            <Text style={{ fontSize: 10, color: colors.fg3, fontFamily: monoFont, letterSpacing: 1 }}>
              QUEUE
            </Text>
          </View>
        </Tile>

        {/* Transcript */}
        <Text
          style={{
            fontSize: 10,
            color: colors.fg3,
            fontFamily: monoFont,
            letterSpacing: 1.5,
            marginBottom: 8,
            paddingHorizontal: 4,
          }}>
          TRANSCRIPT
        </Text>
        <View style={{ gap: 4 }}>
          {BRIEF.segments.map((seg, i) => {
            const active = i === activeSeg;
            return (
              <Pressable
                key={i}
                onPress={() => {
                  setActiveSeg(i);
                  setProgress(i / BRIEF.segments.length);
                }}>
                <Tile
                  style={{
                    backgroundColor: active ? colors.accentSoft : colors.surface,
                    borderLeftWidth: 2,
                    borderLeftColor: active ? colors.accent : 'transparent',
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'baseline',
                      gap: 8,
                      marginBottom: 4,
                    }}>
                    <Text
                      style={{
                        fontSize: 10,
                        color: active ? colors.accent : colors.fg3,
                        fontFamily: monoFont,
                        letterSpacing: 1,
                      }}>
                      {seg.t}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.fg2,
                        fontWeight: '500',
                        letterSpacing: 0.3,
                      }}>
                      {seg.label}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      color: active ? colors.fg : colors.fg2,
                      lineHeight: 20,
                    }}>
                    {seg.body}
                  </Text>
                </Tile>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}
