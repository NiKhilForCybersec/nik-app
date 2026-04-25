import React from 'react';
import { Pressable, View, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../theme';

type Props = {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export const Tile = ({ onPress, style, children }: Props) => {
  const inner = (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.hairline,
          borderWidth: 1,
          borderRadius: 18,
          padding: 14,
        },
        style,
      ]}>
      {children}
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      {inner}
    </Pressable>
  );
};
