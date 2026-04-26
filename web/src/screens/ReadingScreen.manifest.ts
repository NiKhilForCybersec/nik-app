import { defineScreen } from '../lib/screen-manifest';
import { items } from '../contracts';

export const manifest = defineScreen({
  id: 'reading',
  reads: [items.list],
  writes: [items.create, items.update, items.archive],
  commands: [],
  permissions: ['items.read', 'items.write'],
  aiAffordances: [
    'Add <book> to my reading list',
    'Mark <book> as read',
    "What's on my reading list?",
  ],
});
