import { defineScreen } from '../lib/screen-manifest';
import { widgets } from '../contracts';

// WidgetsScreen body is still placeholder — full playground rebuild
// is the next session of work (see docs/Concerns.md). Manifest
// declares the contract eagerly so the dev-infra agents know
// the screen will own these reads/writes.
export const manifest = defineScreen({
  id: 'widgets',
  reads: [widgets.list],
  writes: [widgets.install, widgets.move, widgets.resize, widgets.configure, widgets.remove, widgets.reset],
  commands: [],
  permissions: ['widgets.read', 'widgets.write'],
  aiAffordances: [
    'Add a <kind> widget to my home',
    'Show my hydration on home',
    'Move the streak counter to the top',
    'Reset my home layout',
  ],
});
