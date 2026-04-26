import { defineScreen } from '../lib/screen-manifest';
import { items } from '../contracts';
export const manifest = defineScreen({
  id: 'nutrition',
  reads: [items.list],
  writes: [items.create, items.update, items.archive],
  commands: [],
  permissions: ['items.read', 'items.write'],
  aiAffordances: [
    'Add an item to my Nutrition list',
    "What is on my Nutrition list?",
  ],
});
