import { defineScreen } from '../lib/screen-manifest';
import { familyOps } from '../contracts/familyOps';

export const manifest = defineScreen({
  id: 'familyops',
  reads: [familyOps.tasks, familyOps.alarms],
  writes: [familyOps.toggleTask, familyOps.reassignTask, familyOps.toggleAlarmCluster],
  commands: [],
  permissions: ['familyOps.read', 'familyOps.write'],
  aiAffordances: [
    'Reassign the school pickup to the other parent',
    'What\'s left for me today?',
    'Mute tomorrow\'s morning alarms',
    'Add a piano practice reminder for Tue + Thu',
  ],
});
