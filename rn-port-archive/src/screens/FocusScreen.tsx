import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Svg, { Circle, Ellipse, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Tile, Icon } from '../components';
import { colors, hueColor, monoFont } from '../theme';
import type { NavProps } from '../router';

type Energy = 'deep' | 'medium' | 'shallow';
type Pillar = 'focus' | 'mind' | 'family';
type Stage = 'setup' | 'running' | 'paused' | 'report';
type Strictness = 'soft' | 'medium' | 'hard';

type Task = {
  id: string;
  title: string;
  energy: Energy;
  est: number;
  pillar: Pillar;
  icon: string;
};

type Distraction = { at: number; reason: string; icon: string };

const FOCUS_TASKS: Task[] = [
  { id: 't1', title: 'Spec: sync engine architecture', energy: 'deep', est: 50, pillar: 'focus', icon: 'list' },
  { id: 't2', title: 'Reply to investor thread', energy: 'shallow', est: 15, pillar: 'focus', icon: 'bell' },
  { id: 't3', title: "Read: 'Being Mortal' ch. 4", energy: 'medium', est: 30, pillar: 'mind', icon: 'book' },
  { id: 't4', title: 'Anya — homework hour', energy: 'medium', est: 45, pillar: 'family', icon: 'family' },
  { id: 't5', title: 'Inbox zero', energy: 'shallow', est: 20, pillar: 'focus', icon: 'bell' },
];

const DISTRACTION_REASONS = [
  { id: 'msg', label: 'Slack / message', icon: '💬' },
  { id: 'urge', label: 'Just an urge', icon: '🌀' },
  { id: 'kid', label: 'Kid needed me', icon: '👧' },
  { id: 'doubt', label: 'Stuck on the task', icon: '🤔' },
  { id: 'pee', label: 'Bio break', icon: '🚻' },
  { id: 'other', label: 'Something else', icon: '·' },
];

const ENERGY_PRESETS: Record<Energy, { duration: number; break: number; label: string; desc: string }> = {
  deep: { duration: 50, break: 10, label: 'Deep · 50/10', desc: 'Long horizon, no shallow work' },
  medium: { duration: 30, break: 5, label: 'Steady · 30/5', desc: 'Focused but flexible' },
  shallow: { duration: 15, break: 3, label: 'Quick · 15/3', desc: 'Burst through it' },
};

const HUE = 270;

export default function FocusScreen({ onBack }: NavProps) {
  const [stage, setStage] = useState<Stage>('setup');
  const [task, setTask] = useState<Task>(FOCUS_TASKS[0]);
  const [duration, setDuration] = useState(50);
  const [preset, setPreset] = useState<Energy>('deep');
  const [strictness, setStrictness] = useState<Strictness>('medium');
  const [elapsed, setElapsed] = useState(0);
  const [distractions, setDistractions] = useState<Distraction[]>([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [showReason, setShowReason] = useState(false);

  const total = duration * 60;
  const remaining = Math.max(0, total - elapsed);
  const pct = Math.min(1, elapsed / total);

  useEffect(() => {
    if (stage !== 'running') return;
    const id = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= total) {
          setStage('report');
          return total;
        }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [stage, total]);

  const startSession = () => {
    setElapsed(0);
    setDistractions([]);
    setStage('running');
  };

  const askAi = () => {
    setAiThinking(true);
    setTimeout(() => {
      const map: Record<Energy, { d: number; p: Energy }> = {
        deep: { d: 50, p: 'deep' },
        medium: { d: 30, p: 'medium' },
        shallow: { d: 15, p: 'shallow' },
      };
      const s = map[task.energy];
      setDuration(s.d);
      setPreset(s.p);
      setAiThinking(false);
    }, 600);
  };

  const logDistraction = (reason: { label: string; icon: string }) => {
    setDistractions((d) => [...d, { at: elapsed, reason: reason.label, icon: reason.icon }]);
    setShowReason(false);
  };

  if (stage === 'setup') {
    return (
      <FocusSetup
        task={task}
        setTask={setTask}
        duration={duration}
        setDuration={setDuration}
        preset={preset}
        setPreset={setPreset}
        strictness={strictness}
        setStrictness={setStrictness}
        askAi={askAi}
        aiThinking={aiThinking}
        startSession={startSession}
        onExit={onBack}
      />
    );
  }

  if (stage === 'report') {
    return (
      <FocusReport
        task={task}
        duration={duration}
        distractions={distractions}
        onExit={onBack}
        restart={() => setStage('setup')}
      />
    );
  }

  // RUNNING / PAUSED
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Lockdown bar */}
      <View
        style={{
          paddingTop: 50,
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: colors.hairline,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ok }} />
          <Text
            style={{
              color: colors.ok,
              fontSize: 10,
              fontFamily: monoFont,
              letterSpacing: 1.5,
            }}>
            FOCUS LOCKED · {strictness.toUpperCase()}
          </Text>
        </View>
        <Text style={{ color: colors.fg3, fontSize: 10, fontFamily: monoFont }}>
          {distractions.length} DISTRACTIONS
        </Text>
      </View>

      {/* Center */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <FocusTree pct={pct} distractions={distractions.length} />

        <View style={{ marginTop: 18, alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 56,
              fontWeight: '300',
              letterSpacing: -2,
              color: colors.fg,
              lineHeight: 64,
              fontVariant: ['tabular-nums'],
            }}>
            {String(Math.floor(remaining / 60)).padStart(2, '0')}:
            {String(remaining % 60).padStart(2, '0')}
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: colors.fg3,
              fontFamily: monoFont,
              letterSpacing: 1.5,
              marginTop: 6,
              textTransform: 'uppercase',
            }}>
            {task.title}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={{ marginTop: 18, width: 220 }}>
          <Svg width={220} height={14}>
            <Rect x={0} y={5} width={220} height={3} rx={1.5} fill={colors.hairline} />
            <Rect
              x={0}
              y={5}
              width={220 * pct}
              height={3}
              rx={1.5}
              fill={hueColor(HUE, 0.78)}
            />
            {distractions.map((d, i) => {
              const x = (d.at / total) * 220;
              return (
                <Circle
                  key={i}
                  cx={x}
                  cy={6.5}
                  r={3.5}
                  fill={colors.danger}
                  stroke="#fff"
                  strokeWidth={1}
                />
              );
            })}
          </Svg>
        </View>

        {stage === 'running' && (
          <Pressable
            onPress={() => setShowReason(true)}
            style={{ marginTop: 16, paddingVertical: 8, paddingHorizontal: 14 }}>
            <Text style={{ fontSize: 11, color: colors.fg3, fontFamily: monoFont, letterSpacing: 1 }}>
              + LOG DISTRACTION
            </Text>
          </Pressable>
        )}
      </View>

      {/* Distraction log */}
      {distractions.length > 0 && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Text
            style={{
              fontSize: 9,
              color: colors.fg3,
              fontFamily: monoFont,
              letterSpacing: 1.5,
              marginBottom: 6,
            }}>
            SESSION LOG
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {distractions.map((d, i) => (
                <View
                  key={i}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: 'rgba(248,113,113,0.15)',
                    borderWidth: 1,
                    borderColor: 'rgba(248,113,113,0.3)',
                  }}>
                  <Text style={{ fontSize: 10, color: colors.danger }}>
                    {d.icon} {d.reason}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Bottom controls */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: 28,
          flexDirection: 'row',
          gap: 8,
        }}>
        <Pressable
          onPress={() => setStage('setup')}
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 12,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.hairline,
            alignItems: 'center',
          }}>
          <Text style={{ fontSize: 12, color: colors.fg2 }}>End early</Text>
        </Pressable>
        <Pressable
          onPress={() => setStage(stage === 'running' ? 'paused' : 'running')}
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 12,
            backgroundColor: colors.accentSoft,
            borderWidth: 1,
            borderColor: colors.accentBorder,
            alignItems: 'center',
          }}>
          <Text style={{ fontSize: 12, color: colors.accent, fontWeight: '500' }}>
            {stage === 'paused' ? '▶ Resume' : '⏸ Pause'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onBack}
          style={{
            paddingHorizontal: 14,
            padding: 14,
            borderRadius: 12,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.hairline,
            alignItems: 'center',
          }}>
          <Text style={{ fontSize: 12, color: colors.fg2 }}>Exit</Text>
        </Pressable>
      </View>

      {/* Reason picker */}
      {showReason && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            justifyContent: 'flex-end',
          }}>
          <View
            style={{
              padding: 18,
              paddingBottom: 30,
              backgroundColor: '#16162a',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderWidth: 1,
              borderColor: colors.hairline,
            }}>
            <Text
              style={{
                fontSize: 9,
                color: colors.fg3,
                fontFamily: monoFont,
                letterSpacing: 1.5,
                marginBottom: 4,
              }}>
              WHAT PULLED YOU AWAY?
            </Text>
            <Text style={{ fontSize: 18, fontWeight: '500', color: colors.fg, marginBottom: 14 }}>
              No judgement, just data
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {DISTRACTION_REASONS.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => logDistraction(r)}
                  style={{
                    width: '48.5%',
                    padding: 12,
                    borderRadius: 10,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.hairline,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                  <Text style={{ fontSize: 16 }}>{r.icon}</Text>
                  <Text style={{ fontSize: 12, color: colors.fg }}>{r.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => setShowReason(false)}
              style={{ paddingVertical: 12, marginTop: 8, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: colors.fg3 }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Setup view ────────────────────────────────────────
type SetupProps = {
  task: Task;
  setTask: (t: Task) => void;
  duration: number;
  setDuration: (n: number) => void;
  preset: Energy;
  setPreset: (e: Energy) => void;
  strictness: Strictness;
  setStrictness: (s: Strictness) => void;
  askAi: () => void;
  aiThinking: boolean;
  startSession: () => void;
  onExit: () => void;
};

const FocusSetup = ({
  task,
  setTask,
  duration,
  setDuration,
  preset,
  setPreset,
  strictness,
  setStrictness,
  askAi,
  aiThinking,
  startSession,
  onExit,
}: SetupProps) => (
  <ScrollView
    style={{ flex: 1, backgroundColor: colors.bg }}
    contentContainerStyle={{ padding: 16, paddingBottom: 60, paddingTop: 50 }}>
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
      }}>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 11,
            color: colors.fg3,
            fontFamily: monoFont,
            letterSpacing: 2,
          }}>
          FOCUS · DEEP WORK MODE
        </Text>
        <Text
          style={{
            fontSize: 26,
            fontWeight: '500',
            color: colors.fg,
            marginTop: 4,
          }}>
          What are we doing?
        </Text>
      </View>
      <Pressable
        onPress={onExit}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 10,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.hairline,
        }}>
        <Text style={{ fontSize: 11, color: colors.fg2 }}>Exit</Text>
      </Pressable>
    </View>

    {/* Task picker */}
    <Tile style={{ marginBottom: 10 }}>
      <Text
        style={{
          fontSize: 9,
          color: colors.fg3,
          fontFamily: monoFont,
          letterSpacing: 1.5,
          marginBottom: 8,
        }}>
        SELECT TASK
      </Text>
      <View style={{ gap: 5 }}>
        {FOCUS_TASKS.map((t) => {
          const sel = task.id === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTask(t)}
              style={{
                padding: 10,
                borderRadius: 10,
                backgroundColor: sel ? colors.accentSoft : 'rgba(255,255,255,0.03)',
                borderWidth: 1,
                borderColor: sel ? colors.accentBorder : colors.hairline,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon name={t.icon} size={14} color={colors.fg2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: colors.fg }}>{t.title}</Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: colors.fg3,
                    fontFamily: monoFont,
                  }}>
                  {t.energy.toUpperCase()} · ~{t.est} min
                </Text>
              </View>
              {sel && (
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: colors.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text style={{ color: '#06060a', fontSize: 9, fontWeight: '700' }}>✓</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </Tile>

    {/* AI suggest */}
    <Pressable onPress={!aiThinking ? askAi : undefined}>
      <Tile
        style={{
          marginBottom: 10,
          backgroundColor: colors.accentSoft,
          borderColor: colors.accentBorder,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}>
        <LinearGradient
          colors={[colors.accent, colors.accent2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name="sparkles" size={14} color="#06060a" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 9,
              color: colors.accent,
              fontFamily: monoFont,
              letterSpacing: 1.5,
            }}>
            NIK SUGGESTS
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: aiThinking ? colors.fg2 : colors.fg,
              fontStyle: aiThinking ? 'italic' : 'normal',
            }}>
            {aiThinking
              ? 'Reading your task energy…'
              : `${duration}-min ${preset} session · matches your peak hours`}
          </Text>
        </View>
        <Text style={{ fontSize: 11, color: colors.accent }}>{aiThinking ? '⋯' : '⟲'}</Text>
      </Tile>
    </Pressable>

    {/* Duration */}
    <Tile style={{ marginBottom: 10 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 8,
        }}>
        <Text
          style={{
            fontSize: 9,
            color: colors.fg3,
            fontFamily: monoFont,
            letterSpacing: 1.5,
          }}>
          DURATION
        </Text>
        <Text style={{ fontSize: 22, fontWeight: '500', color: colors.fg }}>
          {duration}
          <Text style={{ fontSize: 11, color: colors.fg3, fontWeight: '400' }}> min</Text>
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
        {(Object.entries(ENERGY_PRESETS) as [Energy, (typeof ENERGY_PRESETS)[Energy]][]).map(
          ([k, p]) => {
            const sel = preset === k;
            return (
              <Pressable
                key={k}
                onPress={() => {
                  setPreset(k);
                  setDuration(p.duration);
                }}
                style={{
                  flex: 1,
                  padding: 7,
                  borderRadius: 8,
                  backgroundColor: sel ? colors.accentSoft : 'rgba(255,255,255,0.03)',
                  borderWidth: 1,
                  borderColor: sel ? colors.accentBorder : colors.hairline,
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    fontSize: 10,
                    color: sel ? colors.accent : colors.fg2,
                  }}>
                  {p.label}
                </Text>
              </Pressable>
            );
          }
        )}
      </View>
    </Tile>

    {/* Strictness */}
    <Tile style={{ marginBottom: 14 }}>
      <Text
        style={{
          fontSize: 9,
          color: colors.fg3,
          fontFamily: monoFont,
          letterSpacing: 1.5,
          marginBottom: 8,
        }}>
        STRICTNESS
      </Text>
      <View style={{ flexDirection: 'row', gap: 5 }}>
        {(
          [
            { k: 'soft', l: 'Soft', d: 'Just track' },
            { k: 'medium', l: 'Medium', d: 'Pause on leave' },
            { k: 'hard', l: 'Hard', d: 'Full lockdown' },
          ] as { k: Strictness; l: string; d: string }[]
        ).map((o) => {
          const sel = strictness === o.k;
          return (
            <Pressable
              key={o.k}
              onPress={() => setStrictness(o.k)}
              style={{
                flex: 1,
                padding: 9,
                borderRadius: 9,
                backgroundColor: sel ? colors.accentSoft : 'rgba(255,255,255,0.03)',
                borderWidth: 1,
                borderColor: sel ? colors.accentBorder : colors.hairline,
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '500',
                  color: sel ? colors.accent : colors.fg,
                }}>
                {o.l}
              </Text>
              <Text style={{ fontSize: 9, color: colors.fg3, marginTop: 2 }}>{o.d}</Text>
            </Pressable>
          );
        })}
      </View>
    </Tile>

    {/* Start CTA */}
    <Pressable onPress={startSession}>
      <LinearGradient
        colors={[colors.accent, colors.accent2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 16, borderRadius: 14, alignItems: 'center' }}>
        <Text style={{ fontWeight: '600', fontSize: 14, color: '#06060a' }}>
          Begin {duration}-min focus →
        </Text>
      </LinearGradient>
    </Pressable>
  </ScrollView>
);

// ── Tree ──────────────────────────────────────────────
const FocusTree = ({ pct, distractions }: { pct: number; distractions: number }) => {
  const stage = Math.floor(pct * 5);
  const wilt = Math.min(distractions, 3);
  const opacity = (base: number) => base - wilt * 0.15;
  return (
    <Svg width={160} height={160} viewBox="0 0 160 160">
      <Ellipse cx={80} cy={148} rx={50} ry={6} fill="rgba(80,60,40,0.4)" />
      <Rect
        x={76}
        y={140 - stage * 14}
        width={8}
        height={Math.max(6, stage * 14)}
        fill="#5a3a26"
        rx={2}
      />
      {stage >= 1 && (
        <Circle cx={80} cy={132 - stage * 12} r={8 + stage * 4} fill="#5fb56a" opacity={opacity(0.9)} />
      )}
      {stage >= 2 && (
        <Circle cx={68} cy={132 - stage * 10} r={6 + stage * 3} fill="#6abf72" opacity={opacity(0.85)} />
      )}
      {stage >= 3 && (
        <Circle cx={92} cy={132 - stage * 10} r={6 + stage * 3} fill="#6abf72" opacity={opacity(0.85)} />
      )}
      {stage >= 4 && (
        <Circle cx={80} cy={120 - stage * 12} r={8 + stage * 2} fill="#76c47a" opacity={opacity(0.9)} />
      )}
      {stage >= 5 && (
        <>
          <Circle cx={60} cy={100} r={3} fill="#f5d76e" opacity={0.8} />
          <Circle cx={100} cy={95} r={2.5} fill="#f5b96e" opacity={0.8} />
          <Circle cx={80} cy={80} r={3} fill={hueColor(HUE, 0.9)} opacity={0.9} />
        </>
      )}
    </Svg>
  );
};

// ── Report ────────────────────────────────────────────
type ReportProps = {
  task: Task;
  duration: number;
  distractions: Distraction[];
  onExit: () => void;
  restart: () => void;
};

const FocusReport = ({ task, duration, distractions, onExit, restart }: ReportProps) => {
  const focusScore = Math.max(0, 100 - distractions.length * 12);
  const xpEarned = Math.round((duration / 50) * (focusScore / 100) * 25);
  const insight =
    distractions.length === 0
      ? 'Pristine session. This belongs in your hall of fame.'
      : distractions.length <= 2
      ? `You leave most often during ${
          task.title.includes('Spec') ? 'spec work' : 'this kind of task'
        }. Try a 5-min walk before next session.`
      : 'High distraction load. Tomorrow try a shorter sprint with phone in another room.';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingTop: 50, paddingBottom: 30 }}>
      <Text
        style={{
          fontSize: 11,
          color: colors.accent,
          fontFamily: monoFont,
          letterSpacing: 2,
          marginBottom: 6,
        }}>
        SESSION COMPLETE
      </Text>
      <Text style={{ fontSize: 28, fontWeight: '500', color: colors.fg, marginBottom: 4 }}>
        {focusScore >= 90 ? 'Outstanding.' : focusScore >= 70 ? 'Good work.' : 'Done. Keep going.'}
      </Text>
      <Text style={{ fontSize: 12, color: colors.fg2, marginBottom: 18 }}>{task.title}</Text>

      {/* Big score */}
      <Tile style={{ marginBottom: 10, alignItems: 'center', paddingVertical: 18 }}>
        <Text
          style={{
            fontSize: 9,
            color: colors.fg3,
            fontFamily: monoFont,
            letterSpacing: 2,
            marginBottom: 6,
          }}>
          FOCUS SCORE
        </Text>
        <Text
          style={{
            fontSize: 64,
            fontWeight: '300',
            color: hueColor(HUE, 0.92),
            lineHeight: 70,
            fontVariant: ['tabular-nums'],
          }}>
          {focusScore}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: colors.fg3,
            fontFamily: monoFont,
            marginTop: 4,
          }}>
          +{xpEarned} XP · +{Math.round(focusScore / 10)} nik score
        </Text>
      </Tile>

      {/* Stats */}
      <Tile style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: '500', color: colors.fg }}>
              {duration}
              <Text style={{ fontSize: 10, color: colors.fg3 }}>m</Text>
            </Text>
            <Text style={{ fontSize: 9, color: colors.fg3, fontFamily: monoFont, letterSpacing: 1 }}>
              FOCUSED
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '500',
                color: distractions.length ? colors.danger : colors.fg,
              }}>
              {distractions.length}
            </Text>
            <Text style={{ fontSize: 9, color: colors.fg3, fontFamily: monoFont, letterSpacing: 1 }}>
              DISTRACTIONS
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: '500', color: colors.fg }}>
              {Math.round(duration / Math.max(1, distractions.length + 1))}
              <Text style={{ fontSize: 10, color: colors.fg3 }}>m</Text>
            </Text>
            <Text style={{ fontSize: 9, color: colors.fg3, fontFamily: monoFont, letterSpacing: 1 }}>
              AVG STREAK
            </Text>
          </View>
        </View>
      </Tile>

      {/* Distraction breakdown */}
      {distractions.length > 0 && (
        <Tile style={{ marginBottom: 10 }}>
          <Text
            style={{
              fontSize: 9,
              color: colors.fg3,
              fontFamily: monoFont,
              letterSpacing: 1.5,
              marginBottom: 8,
            }}>
            WHAT PULLED YOU AWAY
          </Text>
          {distractions.map((d, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 6,
                borderBottomWidth: i < distractions.length - 1 ? 1 : 0,
                borderBottomColor: colors.hairline,
              }}>
              <Text style={{ fontSize: 14 }}>{d.icon}</Text>
              <Text style={{ fontSize: 12, flex: 1, color: colors.fg }}>{d.reason}</Text>
              <Text style={{ fontSize: 10, color: colors.fg3, fontFamily: monoFont }}>
                at {Math.floor(d.at / 60)}:{String(d.at % 60).padStart(2, '0')}
              </Text>
            </View>
          ))}
        </Tile>
      )}

      {/* Insight */}
      <Tile
        style={{
          marginBottom: 14,
          borderColor: colors.accentBorder,
          backgroundColor: colors.accentSoft,
          flexDirection: 'row',
          gap: 10,
        }}>
        <LinearGradient
          colors={[colors.accent, colors.accent2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name="sparkles" size={12} color="#06060a" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 9,
              color: colors.accent,
              fontFamily: monoFont,
              letterSpacing: 1.5,
              marginBottom: 3,
            }}>
            NIK INSIGHT
          </Text>
          <Text style={{ fontSize: 12, color: colors.fg, lineHeight: 18 }}>{insight}</Text>
        </View>
      </Tile>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={restart}
          style={{
            flex: 1,
            padding: 13,
            borderRadius: 12,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.hairline,
            alignItems: 'center',
          }}>
          <Text style={{ fontSize: 12, color: colors.fg }}>Another session</Text>
        </Pressable>
        <Pressable
          onPress={onExit}
          style={{
            flex: 1,
            padding: 13,
            borderRadius: 12,
            backgroundColor: colors.accentSoft,
            borderWidth: 1,
            borderColor: colors.accentBorder,
            alignItems: 'center',
          }}>
          <Text style={{ fontSize: 12, color: colors.accent, fontWeight: '500' }}>Done</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};
