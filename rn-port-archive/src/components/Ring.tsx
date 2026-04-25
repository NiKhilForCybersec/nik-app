import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, hueColor } from '../theme';

type Props = {
  size?: number;
  pct: number;
  sw?: number;
  hue?: number;
};

export const Ring = ({ size = 48, pct, sw = 3, hue = 280 }: Props) => {
  const r = (size - sw) / 2;
  const c = r * 2 * Math.PI;
  const dash = c * Math.min(Math.max(pct, 0), 1);
  const id = `g${hue}`;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={hueColor(hue, 0.85)} />
            <Stop offset="1" stopColor={hueColor(hue + 60, 0.7)} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.hairline}
          strokeWidth={sw}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${id})`}
          strokeWidth={sw}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
};
