import { defineScreen } from '../lib/screen-manifest';
import { items } from '../contracts';

export const manifest = defineScreen({
  id: 'shopping',
  reads: [items.list],
  writes: [items.create, items.update, items.archive],
  commands: [],
  permissions: ['items.read', 'items.write'],
  aiAffordances: [
    'Add <item> to my shopping list',
    "What's on my shopping list?",
    'Mark <item> as bought',
  ],
});
