import { defineScreen } from '../lib/screen-manifest';
import { habits } from '../contracts/habits';
import { ui } from '../contracts/ui-commands';

export const manifest = defineScreen({
  id: 'habits',
  reads: [habits.list],
  writes: [habits.bump, habits.create, habits.remove],
  commands: [ui.navigateTo],
  permissions: ['habits.read', 'habits.write'],
  aiAffordances: [
    'Add a habit',
    'Mark a habit as done',
    'Show me my streaks',
    'What\'s the habit I\'m closest to completing?',
    'Hide habits I haven\'t done in a month',
  ],
});
