import { defineScreen } from '../lib/screen-manifest';
import { items } from '../contracts';
export const manifest = defineScreen({
  id: 'symptoms',
  reads: [items.list],
  writes: [items.create, items.update, items.archive],
  commands: [],
  permissions: ['items.read', 'items.write'],
  aiAffordances: [
    'Add an item to my Symptoms list',
    "What is on my Symptoms list?",
  ],
});
