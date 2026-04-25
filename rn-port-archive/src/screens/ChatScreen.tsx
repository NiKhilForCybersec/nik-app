import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Tile, Chip, Icon } from '../components';
import { colors, monoFont } from '../theme';
import type { NavProps } from '../router';

type Msg = {
  from: 'user' | 'ai';
  text: string;
  time: string;
  actions?: string[];
};

const INITIAL_MSGS: Msg[] = [
  {
    from: 'ai',
    text:
      'Good morning, Arjun. Your gym session was logged at 7:02am — 58 min. Great job on the streak.',
    time: '8:14am',
  },
  { from: 'user', text: 'Set a reminder to call mom tonight', time: '8:15am' },
  {
    from: 'ai',
    text:
      "Done. 7:30pm works — she's usually free then. I'll also pull up her recent photos so you have something to talk about.",
    time: '8:15am',
    actions: ['Open reminder', 'Dismiss'],
  },
  { from: 'user', text: "Also move my 3pm if I'm still at lunch", time: '8:16am' },
  {
    from: 'ai',
    text:
      'Moved to 3:30pm. Priya confirmed. I noticed you skipped meditation yesterday — want me to slot 10 min after the design review?',
    time: '8:16am',
    actions: ['Add quest', 'Not today'],
  },
];

const SUGGESTIONS = ['Plan my evening', 'Move my 3pm', 'How am I doing today?', 'Add a quest'];

const PRIMARY_ACTIONS = new Set(['Confirm', 'Open reminder', 'Add quest']);

function getReply(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('evening'))
    return "Tonight's plan: 6pm groceries (you'll be near), 7:30pm call with Mom, 9pm wind-down + meditate. I'll block focus hours between. Sound good?";
  if (t.includes('3pm'))
    return 'Moved to 3:30pm. Priya confirmed — she appreciated the heads-up. I\'ve added 15 min of prep before the call.';
  if (t.includes('how'))
    return "You're ahead on training (+18%), behind on hydration (-25%), and hit 4 of 7 habits. Sleep quality was great last night — 8.2h, 92% efficient. Keep going.";
  if (t.includes('quest'))
    return "New quest logged. I'll notify you when context aligns — location, time, or energy level.";
  return "Got it. I'll factor that into your day and let you know if anything shifts.";
}

export default function ChatScreen({ onVoice }: NavProps) {
  const [msgs, setMsgs] = useState<Msg[]>(INITIAL_MSGS);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [msgs, thinking]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const next: Msg[] = [...msgs, { from: 'user', text: t, time: 'now' }];
    setMsgs(next);
    setInput('');
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setMsgs([
        ...next,
        { from: 'ai', text: getReply(t), time: 'now', actions: ['Confirm', 'Change'] },
      ]);
    }, 1400);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.hairline,
        }}>
        <LinearGradient
          colors={[colors.accent, colors.accent2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View
            style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors.bg }}
          />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.fg, fontSize: 16, fontWeight: '500' }}>Nik</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <View
              style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.ok }}
            />
            <Text
              style={{
                color: colors.ok,
                fontSize: 10,
                fontFamily: monoFont,
                letterSpacing: 1,
              }}>
              LEARNING · 2,840 MEMORIES
            </Text>
          </View>
        </View>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.hairline,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name="brain" size={14} color={colors.fg2} />
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 10 }}>
        {msgs.map((m, i) => (
          <View
            key={i}
            style={{
              alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '82%',
            }}>
            {m.from === 'ai' && (
              <Text
                style={{
                  fontSize: 9,
                  color: colors.accent,
                  fontFamily: monoFont,
                  letterSpacing: 1,
                  marginBottom: 4,
                  marginLeft: 2,
                }}>
                NIK · {m.time.toUpperCase()}
              </Text>
            )}
            {m.from === 'user' ? (
              <LinearGradient
                colors={['rgba(167,139,250,0.25)', 'rgba(236,72,153,0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 18,
                  borderBottomRightRadius: 4,
                  borderWidth: 1,
                  borderColor: colors.accentBorder,
                }}>
                <Text style={{ color: colors.fg, fontSize: 13, lineHeight: 19 }}>{m.text}</Text>
              </LinearGradient>
            ) : (
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 18,
                  borderTopLeftRadius: 4,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                }}>
                <Text style={{ color: colors.fg, fontSize: 13, lineHeight: 19 }}>{m.text}</Text>
              </View>
            )}
            {m.actions && (
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {m.actions.map((a) => {
                  const primary = PRIMARY_ACTIONS.has(a);
                  return (
                    <Pressable
                      key={a}
                      style={({ pressed }) => ({
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 99,
                        backgroundColor: primary
                          ? colors.accentSoft
                          : 'rgba(255,255,255,0.05)',
                        borderWidth: 1,
                        borderColor: primary ? colors.accentBorder : colors.hairline,
                        opacity: pressed ? 0.8 : 1,
                      })}>
                      <Text
                        style={{
                          color: primary ? colors.accent : colors.fg2,
                          fontSize: 11,
                          fontWeight: '500',
                        }}>
                        {a}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        ))}
        {thinking && (
          <View
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 18,
              borderTopLeftRadius: 4,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.hairline,
              flexDirection: 'row',
              gap: 4,
              alignItems: 'center',
            }}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.accent,
                  opacity: 0.4 + i * 0.2,
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Suggestions */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 6 }}>
        {SUGGESTIONS.map((s) => (
          <Pressable
            key={s}
            onPress={() => send(s)}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 99,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.hairline,
              opacity: pressed ? 0.8 : 1,
            })}>
            <Text style={{ color: colors.fg2, fontSize: 12 }}>{s}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Input */}
      <View
        style={{
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
        <Tile
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 99,
          }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
            placeholder="Ask or command…"
            placeholderTextColor={colors.fg3}
            style={{
              flex: 1,
              color: colors.fg,
              fontSize: 13,
              paddingVertical: 6,
            }}
          />
          <Pressable
            onPress={onVoice}
            style={({ pressed }) => ({
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: colors.accentSoft,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.8 : 1,
            })}>
            <Icon name="mic" size={15} color={colors.accent} />
          </Pressable>
        </Tile>
        <Pressable
          onPress={() => send(input)}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <LinearGradient
            colors={[colors.accent, colors.accent2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Icon name="arrowUp" size={16} color={colors.bg} strokeWidth={2.2} />
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
