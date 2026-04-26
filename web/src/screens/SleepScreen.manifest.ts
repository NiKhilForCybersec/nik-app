import { defineScreen } from '../lib/screen-manifest';
import { sleep } from '../contracts/sleep';

export const manifest = defineScreen({
  id: 'sleep',
  reads: [sleep.recent],
  writes: [sleep.log, sleep.addDream],
  commands: [],
  permissions: ['sleep.read', 'sleep.write'],
  aiAffordances: [
    'How did I sleep last night?',
    'Log a dream for me',
    'When should I go to bed tonight?',
    'Show me my 7-day trend',
  ],
  integrations: ['apple-health', 'google-health'],
});
