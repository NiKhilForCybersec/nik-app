import React, { useState, useCallback } from 'react';
import { SafeAreaView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from './src/theme';
import { TabBar, VoiceOverlay } from './src/components';
import type { ScreenId, NavProps } from './src/router';
import { makePlaceholder } from './src/screens/PlaceholderScreen';
import { HomeScreen } from './src/screens/HomeScreen';

// Real screens (lazy-importable; fall back to placeholders until ported)
const screenRegistry: Partial<Record<ScreenId, React.ComponentType<NavProps>>> = {};
const safeImport = <T,>(loader: () => T, fallback: T): T => {
  try {
    return loader();
  } catch {
    return fallback;
  }
};

// Each port adds itself here as it lands
import ChatScreen from './src/screens/ChatScreen';
import HabitsScreen from './src/screens/HabitsScreen';
import FitnessScreen from './src/screens/FitnessScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MoreScreen from './src/screens/MoreScreen';
import FamilyOpsScreen from './src/screens/FamilyOpsScreen';
import CircleScreen from './src/screens/CircleScreen';
import MedsScreen from './src/screens/MedsScreen';
import DiaryScreen from './src/screens/DiaryScreen';
import FocusScreen from './src/screens/FocusScreen';
import ScoreScreen from './src/screens/ScoreScreen';
import SleepScreen from './src/screens/SleepScreen';
import MoneyScreen from './src/screens/MoneyScreen';
import BriefScreen from './src/screens/BriefScreen';
import VaultScreen from './src/screens/VaultScreen';
import ErrandsScreen from './src/screens/ErrandsScreen';
import CoupleScreen from './src/screens/CoupleScreen';
import KidsScreen from './src/screens/KidsScreen';
import OnboardScreen from './src/screens/OnboardScreen';
import SettingsScreen from './src/screens/SettingsScreen';

screenRegistry.chat = ChatScreen;
screenRegistry.habits = HabitsScreen;
screenRegistry.fitness = FitnessScreen;
screenRegistry.profile = ProfileScreen;
screenRegistry.more = MoreScreen;
screenRegistry.familyops = FamilyOpsScreen;
screenRegistry.circle = CircleScreen;
screenRegistry.family = CircleScreen;
screenRegistry.meds = MedsScreen;
screenRegistry.diary = DiaryScreen;
screenRegistry.focus = FocusScreen;
screenRegistry.score = ScoreScreen;
screenRegistry.sleep = SleepScreen;
screenRegistry.money = MoneyScreen;
screenRegistry.brief = BriefScreen;
screenRegistry.vault = VaultScreen;
screenRegistry.errands = ErrandsScreen;
screenRegistry.couple = CoupleScreen;
screenRegistry.kids = KidsScreen;
screenRegistry.onboard = OnboardScreen;
screenRegistry.settings = SettingsScreen;

const placeholderFor = (id: ScreenId) =>
  makePlaceholder(id.charAt(0).toUpperCase() + id.slice(1), 'Section');

export default function App() {
  const [history, setHistory] = useState<ScreenId[]>(['home']);
  const [listening, setListening] = useState(false);
  const screen = history[history.length - 1];

  const onNav = useCallback((s: ScreenId) => {
    setHistory((h) => (h[h.length - 1] === s ? h : [...h, s]));
  }, []);
  const onBack = useCallback(() => {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  }, []);
  const onVoice = useCallback(() => setListening(true), []);
  const closeVoice = useCallback(() => setListening(false), []);

  const navProps: NavProps = { onNav, onBack, onVoice };

  const Cmp = screen === 'home' ? HomeScreen : screenRegistry[screen] ?? placeholderFor(screen);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <View style={{ flex: 1 }}>
        <Cmp {...navProps} />
      </View>
      {screen !== 'chat' && screen !== 'focus' && (
        <TabBar active={screen} onNav={onNav} onVoice={onVoice} />
      )}
      {listening && <VoiceOverlay onClose={closeVoice} />}
    </SafeAreaView>
  );
}
