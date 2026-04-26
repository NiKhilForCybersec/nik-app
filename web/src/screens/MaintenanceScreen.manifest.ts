import { defineScreen } from '../lib/screen-manifest';
import { items } from '../contracts';
export const manifest = defineScreen({
  id: 'maintenance',
  reads: [items.list],
  writes: [items.create, items.update, items.archive],
  commands: [],
  permissions: ['items.read', 'items.write'],
  aiAffordances: [
    'Add an item to my Home list',
    "What is on my Home list?",
  ],
});
