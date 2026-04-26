import { defineScreen } from '../lib/screen-manifest';
import { profile, habits, quests, score, hydration, circle, diary, events } from '../contracts';

export const manifest = defineScreen({
  id: 'home',
  reads: [
    profile.get, habits.list, quests.list, score.get, hydration.today,
    circle.list, diary.list, events.list,
  ],
  writes: [],
  commands: [],
  permissions: [
    'profile.read', 'habits.read', 'quests.read', 'score.read',
    'hydration.read', 'circle.read', 'diary.read', 'events.read',
  ],
  aiAffordances: [
    'How am I doing today?',
    "What's my next quest?",
    'Bump <habit> by N',
  ],
});
