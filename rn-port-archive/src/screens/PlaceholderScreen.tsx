import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { ScreenHeader } from '../components';
import { colors } from '../theme';
import type { NavProps } from '../router';

export const makePlaceholder = (title: string, subtitle: string) =>
  function PlaceholderScreen({ onBack }: NavProps) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ paddingBottom: 120 }}>
        <ScreenHeader title={title} subtitle={subtitle} onBack={onBack} />
        <View
          style={{
            margin: 16,
            padding: 32,
            borderRadius: 18,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.hairline,
            alignItems: 'center',
          }}>
          <Text style={{ color: colors.fg2, fontSize: 14, textAlign: 'center' }}>
            {title} is still being ported from the prototype.
          </Text>
        </View>
      </ScrollView>
    );
  };
