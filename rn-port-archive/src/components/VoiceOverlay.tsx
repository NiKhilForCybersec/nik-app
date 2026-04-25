import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, monoFont } from '../theme';
import { Icon } from './Icon';

export const VoiceOverlay = ({ onClose }: { onClose: () => void }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(6,6,14,0.92)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}>
      <Text
        style={{
          color: colors.fg3,
          fontSize: 11,
          letterSpacing: 2,
          fontFamily: monoFont,
          marginBottom: 30,
        }}>
        LISTENING…
      </Text>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <LinearGradient
          colors={[colors.accent, colors.accent2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 140,
            height: 140,
            borderRadius: 70,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name="mic" size={48} color="#06060e" />
        </LinearGradient>
      </Animated.View>
      <View style={{ flexDirection: 'row', gap: 4, marginTop: 28 }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <View
            key={i}
            style={{
              width: 3,
              height: 8 + Math.abs(Math.sin(i)) * 24,
              borderRadius: 2,
              backgroundColor: colors.accent,
              opacity: 0.4 + Math.abs(Math.sin(i)) * 0.6,
            }}
          />
        ))}
      </View>
      <Pressable
        onPress={onClose}
        style={{
          marginTop: 50,
          paddingHorizontal: 22,
          paddingVertical: 12,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.hairline,
        }}>
        <Text style={{ color: colors.fg, fontSize: 13, letterSpacing: 1 }}>Cancel</Text>
      </Pressable>
    </View>
  );
};
