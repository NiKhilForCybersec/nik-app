import React from 'react';
import { Text, View } from 'react-native';
import { colors, monoFont } from '../theme';

type Tone = 'accent' | 'ok' | 'warn' | 'danger' | 'neutral';
type Size = 'sm' | 'md';

const toneMap: Record<Tone, { bg: string; fg: string; bd: string }> = {
  accent: { bg: colors.accentSoft, fg: colors.accent, bd: colors.accentBorder },
  ok: { bg: colors.okSoft, fg: colors.ok, bd: 'rgba(52,211,153,0.4)' },
  warn: { bg: colors.warnSoft, fg: colors.warn, bd: 'rgba(251,191,36,0.4)' },
  danger: { bg: 'rgba(248,113,113,0.18)', fg: colors.danger, bd: 'rgba(248,113,113,0.4)' },
  neutral: { bg: colors.surface, fg: colors.fg2, bd: colors.hairline },
};

export const Chip = ({
  tone = 'neutral',
  size = 'md',
  children,
}: {
  tone?: Tone;
  size?: Size;
  children: React.ReactNode;
}) => {
  const t = toneMap[tone];
  const px = size === 'sm' ? 8 : 12;
  const py = size === 'sm' ? 3 : 5;
  const fs = size === 'sm' ? 9 : 11;
  return (
    <View
      style={{
        paddingHorizontal: px,
        paddingVertical: py,
        borderRadius: 999,
        backgroundColor: t.bg,
        borderColor: t.bd,
        borderWidth: 1,
        alignSelf: 'flex-start',
      }}>
      <Text style={{ color: t.fg, fontSize: fs, fontFamily: monoFont, letterSpacing: 1 }}>
        {children}
      </Text>
    </View>
  );
};
