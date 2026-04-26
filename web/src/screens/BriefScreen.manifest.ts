import { defineScreen } from '../lib/screen-manifest';
import { events } from '../contracts/events';

export const manifest = defineScreen({
  id: 'brief',
  reads: [events.list],
  writes: [events.markRead, events.pin, events.archive],
  commands: [],
  permissions: ['events.read', 'events.write'],
  aiAffordances: [
    'What\'s on today?',
    'When\'s the movie?',
    'When does my next flight leave?',
    'Show me bills due this week',
    'Is anything overdue?',
  ],
  integrations: ['gmail', 'calendar'],
});
