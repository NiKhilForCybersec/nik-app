import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, hueColor } from '../theme';

type Props = {
  name: string;
  size?: number;
  hue: number;
  status?: 'online' | 'away' | 'offline';
  ring?: boolean;
};

const statusColor = {
  online: colors.ok,
  away: colors.warn,
  offline: colors.fg3,
};

export const Avatar = ({ name, size = 40, hue, status, ring }: Props) => {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');
  return (
    <View style={{ width: size, height: size }}>
      <LinearGradient
        colors={[hueColor(hue, 0.78), hueColor(hue + 60, 0.55, 0.22)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: ring ? 2 : 1,
          borderColor: ring ? colors.accent : 'rgba(0,0,0,0.4)',
        }}>
        <Text style={{ color: '#06060e', fontWeight: '700', fontSize: size * 0.36 }}>
          {initials}
        </Text>
      </LinearGradient>
      {status && (
        <View
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: size * 0.14,
            backgroundColor: statusColor[status],
            borderWidth: 2,
            borderColor: colors.bg,
          }}
        />
      )}
    </View>
  );
};
