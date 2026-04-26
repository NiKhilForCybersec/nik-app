import { defineScreen } from '../lib/screen-manifest';
import { items } from '../contracts';

export const manifest = defineScreen({
  id: 'birthdays',
  reads: [items.list],
  writes: [items.create, items.update, items.archive],
  commands: [],
  permissions: ['items.read', 'items.write'],
  aiAffordances: [
    "Add <person>'s birthday on <date>",
    'Whose birthday is coming up?',
    'Remind me of birthdays this month',
  ],
});
