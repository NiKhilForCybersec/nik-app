import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from './Icon';
import { colors } from '../theme';
import type { ScreenId } from '../router';

const tabs: { id: ScreenId; icon: string; label: string }[] = [
  { id: 'home', icon: 'home', label: 'Home' },
  { id: 'habits', icon: 'list', label: 'Habits' },
  { id: 'voice', icon: 'mic', label: 'Voice' },
  { id: 'family', icon: 'family', label: 'Circle' },
  { id: 'more', icon: 'more', label: 'More' },
];

export const TabBar = ({
  active,
  onNav,
  onVoice,
}: {
  active: ScreenId;
  onNav: (s: ScreenId) => void;
  onVoice: () => void;
}) => (
  <View
    style={{
      position: 'absolute',
      bottom: 16,
      left: 16,
      right: 16,
      backgroundColor: 'rgba(10,10,18,0.85)',
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.hairline,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 8,
    }}>
    {tabs.map((t) => {
      const isVoice = t.id === 'voice';
      const isActive = active === t.id;
      const onPress = isVoice ? onVoice : () => onNav(t.id);
      if (isVoice) {
        return (
          <Pressable key={t.id} onPress={onPress} style={{ flex: 1, alignItems: 'center' }}>
            <LinearGradient
              colors={[colors.accent, colors.accent2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: -22,
                shadowColor: colors.accent,
                shadowOpacity: 0.6,
                shadowRadius: 12,
              }}>
              <Icon name="mic" size={22} color="#06060e" />
            </LinearGradient>
          </Pressable>
        );
      }
      return (
        <Pressable
          key={t.id}
          onPress={onPress}
          style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
          <Icon
            name={t.icon}
            size={20}
            color={isActive ? colors.accent : colors.fg3}
            strokeWidth={isActive ? 2.2 : 1.8}
          />
          <Text
            style={{
              color: isActive ? colors.accent : colors.fg3,
              fontSize: 10,
              marginTop: 3,
            }}>
            {t.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);
