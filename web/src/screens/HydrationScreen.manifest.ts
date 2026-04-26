import { defineScreen } from '../lib/screen-manifest';
import { hydration } from '../contracts';

export const manifest = defineScreen({
  id: 'hydration',
  reads: [hydration.today, hydration.recent],
  writes: [hydration.log, hydration.remove],
  commands: [],
  permissions: ['hydration.read', 'hydration.write'],
  aiAffordances: [
    'I had a glass of water',
    'Log 500 ml',
    'How much have I drunk today?',
  ],
});
