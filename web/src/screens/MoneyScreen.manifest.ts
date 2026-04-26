import { defineScreen } from '../lib/screen-manifest';
import { items } from '../contracts';

export const manifest = defineScreen({
  id: 'money',
  reads: [items.list],
  writes: [],
  commands: [],
  permissions: ['items.read'],
  aiAffordances: [
    'How much am I spending this month?',
    'What bills are due this week?',
    'Total of my subscriptions',
  ],
});
