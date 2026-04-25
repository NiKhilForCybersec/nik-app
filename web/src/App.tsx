import { useCallback, useEffect, useState } from 'react';
import { applyTheme, getTheme } from './theme/themes';
import { TabBar, VoiceOverlay } from './components/shell';
import { Toast } from './components/primitives';
import { MOCK } from './data/mock';
import { setStatusBar, prefs } from './native/capacitor';

import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';
import HabitsScreen from './screens/HabitsScreen';
import FitnessScreen from './screens/FitnessScreen';
import ProfileScreen from './screens/ProfileScreen';
import MoreScreen from './screens/MoreScreen';
import FamilyOpsScreen from './screens/FamilyOpsScreen';
import CircleScreen from './screens/CircleScreen';
import MedsScreen from './screens/MedsScreen';
import DiaryScreen from './screens/DiaryScreen';
import FocusScreen from './screens/FocusScreen';
import ScoreScreen from './screens/ScoreScreen';
import SleepScreen from './screens/SleepScreen';
import MoneyScreen from './screens/MoneyScreen';
import BriefScreen from './screens/BriefScreen';
import VaultScreen from './screens/VaultScreen';
import ErrandsScreen from './screens/ErrandsScreen';
import CoupleScreen from './screens/CoupleScreen';
import KidsScreen from './screens/KidsScreen';
import OnboardScreen from './screens/OnboardScreen';
import SettingsScreen from './screens/SettingsScreen';
import QuestsScreen from './screens/QuestsScreen';
import WidgetsScreen from './screens/WidgetsScreen';
import StatsScreen from './screens/StatsScreen';
import ComingSoonScreen from './screens/ComingSoonScreen';

export type ScreenId =
  | 'home' | 'chat' | 'habits' | 'fitness' | 'profile' | 'more'
  | 'familyops' | 'family' | 'circle' | 'meds' | 'diary' | 'focus'
  | 'score' | 'sleep' | 'money' | 'brief' | 'vault' | 'errands'
  | 'couple' | 'kids' | 'onboard' | 'settings'
  | 'quests' | 'voice' | 'widgets' | 'stats'
  | 'comingsoon';

export type ScreenProps = {
  dark: boolean;
  intensity: 'soft' | 'medium' | 'full';
  aesthetic?: string;
  onNav: (s: ScreenId) => void;
  onVoice: () => void;
  onExit?: () => void;
  listening?: boolean;
  themeId?: string;
  state?: AppState;
  setState?: React.Dispatch<React.SetStateAction<AppState>>;
};

export type AppState = {
  screen: ScreenId;
  theme: string;
  intensity: 'soft' | 'medium' | 'full';
  density: 'cozy' | 'comfortable' | 'spacious';
  fontPair: string;
  persona: string;
  listening: boolean;
  notifVisible: boolean;
  aesthetic?: string;
  offline?: 'offline' | 'syncing' | null;
  comingSoon?: string | null;
};

const DEFAULTS: AppState = {
  screen: 'home',
  theme: 'solo-leveling',
  intensity: 'full',
  density: 'comfortable',
  fontPair: 'theme',
  persona: 'family',
  listening: false,
  notifVisible: true,
};

type PersistedPrefs = Pick<AppState, 'theme' | 'intensity' | 'density' | 'fontPair' | 'persona'>;
const PREFS_KEY = 'nik:prefs:v1';

export default function App() {
  const [state, setState] = useState<AppState>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted prefs once on mount.
  useEffect(() => {
    let alive = true;
    prefs.get<PersistedPrefs | null>(PREFS_KEY, null).then((saved) => {
      if (alive && saved) setState((x) => ({ ...x, ...saved }));
      if (alive) setHydrated(true);
    });
    return () => { alive = false; };
  }, []);

  // Persist prefs whenever the relevant fields change.
  useEffect(() => {
    if (!hydrated) return;
    void prefs.set(PREFS_KEY, {
      theme: state.theme,
      intensity: state.intensity,
      density: state.density,
      fontPair: state.fontPair,
      persona: state.persona,
    });
  }, [hydrated, state.theme, state.intensity, state.density, state.fontPair, state.persona]);

  useEffect(() => {
    applyTheme(state.theme);
    const t = getTheme(state.theme);
    if (t?.mode === 'light') document.documentElement.classList.add('light');
    else document.documentElement.classList.remove('light');
    void setStatusBar(t?.mode ?? 'dark');
  }, [state.theme]);

  useEffect(() => {
    const map = { cozy: 0.85, comfortable: 1, spacious: 1.18 } as const;
    document.documentElement.style.setProperty('--density-scale', String(map[state.density] ?? 1));
  }, [state.density]);

  useEffect(() => {
    const r = document.documentElement;
    r.classList.remove('intensity-soft', 'intensity-medium', 'intensity-full');
    r.classList.add('intensity-' + state.intensity);
  }, [state.intensity]);

  useEffect(() => {
    const t = setTimeout(() => setState((x) => ({ ...x, notifVisible: false })), 8000);
    return () => clearTimeout(t);
  }, []);

  const onNav = useCallback((s: ScreenId) => {
    setState((x) => ({ ...x, screen: s, notifVisible: false }));
  }, []);
  const onVoice = useCallback(() => setState((x) => ({ ...x, listening: true })), []);
  const closeVoice = useCallback(() => setState((x) => ({ ...x, listening: false })), []);

  const theme = getTheme(state.theme);
  const dark = theme?.mode !== 'light';

  const screenProps: ScreenProps = {
    dark,
    intensity: state.intensity,
    aesthetic: state.aesthetic,
    onNav,
    onVoice,
    themeId: state.theme,
    state,
    setState,
  };

  const renderScreen = () => {
    switch (state.screen) {
      case 'home': return <HomeScreen {...screenProps} />;
      case 'chat': return <ChatScreen {...screenProps} listening={state.listening} />;
      case 'habits': return <HabitsScreen {...screenProps} />;
      case 'fitness': return <FitnessScreen {...screenProps} />;
      case 'profile': return <ProfileScreen {...screenProps} />;
      case 'more': return <MoreScreen {...screenProps} />;
      case 'familyops': return <FamilyOpsScreen {...screenProps} />;
      case 'family':
      case 'circle': return <CircleScreen {...screenProps} />;
      case 'meds': return <MedsScreen {...screenProps} />;
      case 'diary': return <DiaryScreen {...screenProps} />;
      case 'focus': return <FocusScreen {...screenProps} onExit={() => onNav('home')} />;
      case 'score': return <ScoreScreen {...screenProps} />;
      case 'sleep': return <SleepScreen {...screenProps} />;
      case 'money': return <MoneyScreen {...screenProps} />;
      case 'brief': return <BriefScreen {...screenProps} />;
      case 'vault': return <VaultScreen {...screenProps} />;
      case 'errands': return <ErrandsScreen {...screenProps} />;
      case 'couple': return <CoupleScreen {...screenProps} />;
      case 'kids': return <KidsScreen {...screenProps} />;
      case 'onboard': return <OnboardScreen {...screenProps} />;
      case 'settings': return <SettingsScreen {...screenProps} />;
      case 'quests': return <QuestsScreen {...screenProps} />;
      case 'widgets': return <WidgetsScreen {...screenProps} />;
      case 'stats': return <StatsScreen {...screenProps} />;
      case 'comingsoon': return <ComingSoonScreen {...screenProps} />;
      default: return <HomeScreen {...screenProps} />;
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: dark
          ? 'linear-gradient(180deg, oklch(0.10 0.02 260), oklch(0.14 0.025 260))'
          : 'linear-gradient(180deg, oklch(0.98 0.005 260), oklch(0.94 0.01 260))',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 90% 40% at 50% 0%, oklch(0.5 0.22 var(--hue) / 0.25), transparent 70%)',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          paddingTop: 'max(env(safe-area-inset-top), 50px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {renderScreen()}
      </div>
      {state.notifVisible && MOCK.notifications?.[0] && (
        <Toast
          notif={MOCK.notifications[0]}
          onDismiss={() => setState((x) => ({ ...x, notifVisible: false }))}
        />
      )}
      {state.screen !== 'chat' && (
        <TabBar
          active={state.screen}
          onNav={(id: string) => onNav(id as ScreenId)}
          onVoice={() => setState((x) => ({ ...x, screen: 'chat', listening: true }))}
        />
      )}
      {state.listening && state.screen !== 'chat' && <VoiceOverlay onClose={closeVoice} />}
    </div>
  );
}
