import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, monoFont } from '../theme';

export const XPBar = ({ cur, max, level }: { cur: number; max: number; level: number }) => {
  const pct = Math.max(0, Math.min(1, cur / max));
  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}>
        <Text style={{ color: colors.fg3, fontSize: 10, fontFamily: monoFont, letterSpacing: 1 }}>
          LVL {level} · {cur}/{max}
        </Text>
        <Text style={{ color: colors.accent, fontSize: 10, fontFamily: monoFont, letterSpacing: 1 }}>
          {Math.round(pct * 100)}%
        </Text>
      </View>
      <View
        style={{
          height: 6,
          borderRadius: 99,
          backgroundColor: colors.hairline,
          overflow: 'hidden',
        }}>
        <LinearGradient
          colors={[colors.accent, colors.accent2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 99 }}
        />
      </View>
    </View>
  );
};
