import { defineScreen } from '../lib/screen-manifest';
import { profile, habits, quests, score, hydration, sleep, circle, diary, events, items, widgets } from '../contracts';

export const manifest = defineScreen({
  id: 'home',
  reads: [
    profile.get, habits.list, quests.list, score.get, hydration.today,
    sleep.recent, circle.list, diary.list, events.list, items.list,
    widgets.list,
  ],
  writes: [widgets.reset],
  commands: [],
  permissions: [
    'profile.read', 'habits.read', 'quests.read', 'score.read',
    'hydration.read', 'sleep.read', 'circle.read', 'diary.read',
    'events.read', 'items.read', 'widgets.read', 'widgets.write',
  ],
  aiAffordances: [
    'How am I doing today?',
    "What's my next quest?",
    'Bump <habit> by N',
    'Add a <kind> widget to my home',
  ],
});
