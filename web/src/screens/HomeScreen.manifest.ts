import { defineScreen } from '../lib/screen-manifest';
import { profile, habits, quests, score } from '../contracts';

export const manifest = defineScreen({
  id: 'home',
  reads: [profile.get, habits.list, quests.list, score.get],
  writes: [],
  commands: [],
  permissions: ['profile.read', 'habits.read', 'quests.read', 'score.read'],
  aiAffordances: [
    'How am I doing today?',
    'What\'s my next quest?',
    'Bump <habit> by N',
  ],
});
