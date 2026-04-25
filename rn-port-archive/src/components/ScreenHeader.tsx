import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Icon } from './Icon';
import { colors, monoFont } from '../theme';

export const ScreenHeader = ({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
    }}>
    {onBack && (
      <Pressable
        onPress={onBack}
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.hairline,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}>
        <Icon name="chevL" size={18} color={colors.fg} />
      </Pressable>
    )}
    <View style={{ flex: 1 }}>
      {subtitle && (
        <Text
          style={{
            color: colors.fg3,
            fontSize: 10,
            fontFamily: monoFont,
            letterSpacing: 1.5,
          }}>
          {subtitle.toUpperCase()}
        </Text>
      )}
      <Text style={{ color: colors.fg, fontSize: 22, fontWeight: '600', marginTop: 2 }}>
        {title}
      </Text>
    </View>
    {right}
  </View>
);
