import { defineScreen } from '../lib/screen-manifest';
import {
  widgets, hydration, sleep, score, profile, habits, quests,
  events, diary, circle, items,
} from '../contracts';

export const manifest = defineScreen({
  id: 'widgets',
  // The playground previews each widget at small size, so it
  // transitively reads everything the widget components read.
  reads: [
    widgets.list,
    hydration.today, sleep.recent, score.get, profile.get,
    habits.list, quests.list, events.list, diary.list,
    circle.list, items.list,
  ],
  writes: [widgets.install, widgets.move, widgets.resize, widgets.configure, widgets.remove, widgets.reset],
  commands: [],
  permissions: [
    'widgets.read', 'widgets.write',
    'hydration.read', 'sleep.read', 'score.read', 'profile.read',
    'habits.read', 'quests.read', 'events.read', 'diary.read',
    'circle.read', 'items.read',
  ],
  aiAffordances: [
    'Add a <kind> widget to my home',
    'Show my hydration on home',
    'Move the streak counter to the top',
    'Resize the score gauge to 2x1',
    'Reset my home layout',
  ],
});
