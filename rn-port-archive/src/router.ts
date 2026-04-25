export type ScreenId =
  | 'home'
  | 'chat'
  | 'habits'
  | 'fitness'
  | 'profile'
  | 'family'
  | 'familyops'
  | 'circle'
  | 'meds'
  | 'diary'
  | 'focus'
  | 'score'
  | 'sleep'
  | 'money'
  | 'brief'
  | 'vault'
  | 'errands'
  | 'couple'
  | 'kids'
  | 'onboard'
  | 'settings'
  | 'more'
  | 'voice'
  | 'quests';

export type NavProps = {
  onNav: (s: ScreenId) => void;
  onBack: () => void;
  onVoice: () => void;
};
