import { defineScreen } from '../lib/screen-manifest';
import { circle } from '../contracts';

export const manifest = defineScreen({
  id: 'circle',
  reads: [circle.list, circle.listInvites],
  writes: [
    circle.add, circle.updateSharing, circle.setStatus, circle.remove,
    circle.createInvite, circle.acceptInvite, circle.revokeInvite,
  ],
  commands: [],
  permissions: ['circle.read', 'circle.write'],
  aiAffordances: [
    'Add <person> to my family circle',
    'Invite <person> to share my circle',
    'Share my <category> with <person>',
    'Mark <person> as offline',
  ],
});
