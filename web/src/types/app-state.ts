/* AppState shape — pulled out of App.tsx so non-JSX modules (commands,
 * MCP server) can import it without dragging the React app along. */

export type ScreenId =
  | 'home' | 'chat' | 'habits' | 'fitness' | 'profile' | 'more'
  | 'familyops' | 'family' | 'circle' | 'meds' | 'diary' | 'focus'
  | 'score' | 'sleep' | 'money' | 'brief' | 'vault' | 'errands'
  | 'couple' | 'kids' | 'onboard' | 'settings'
  | 'quests' | 'voice' | 'widgets' | 'stats'
  | 'comingsoon' | 'dev'
  | 'reading' | 'shopping' | 'birthdays'
  | 'nutrition' | 'symptoms' | 'doctors'
  | 'learning' | 'gratitude' | 'goals' | 'reflection' | 'languages'
  | 'friends' | 'network' | 'pets'
  | 'bills' | 'subscriptions' | 'investments' | 'receipts'
  | 'recipes' | 'maintenance' | 'plants' | 'wardrobe'
  | 'travel' | 'achievements' | 'bucketlist' | 'timecapsule' | 'photos'
  | 'projects' | 'career' | 'sideprojects';

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
