import { defineScreen } from '../lib/screen-manifest';
import { circle } from '../contracts';

export const manifest = defineScreen({
  id: 'circle',
  reads: [circle.list],
  writes: [circle.add, circle.updateSharing, circle.setStatus, circle.remove],
  commands: [],
  permissions: ['circle.read', 'circle.write'],
  aiAffordances: [
    'Add <person> to my family circle',
    'Share my <category> with <person>',
    'Mark <person> as offline',
  ],
});
