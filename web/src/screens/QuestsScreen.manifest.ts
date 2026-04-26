import { defineScreen } from '../lib/screen-manifest';
import { quests } from '../contracts';

export const manifest = defineScreen({
  id: 'quests',
  reads: [quests.list],
  writes: [],
  commands: [],
  permissions: ['quests.read'],
  aiAffordances: [
    'Add a quest: <title>',
    'How many XP today?',
    'Mark <quest> done',
  ],
});
