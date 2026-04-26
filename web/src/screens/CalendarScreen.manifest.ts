import { defineScreen } from '../lib/screen-manifest';
import { calendar, events } from '../contracts';

export const manifest = defineScreen({
  id: 'calendar',
  reads: [calendar.today, calendar.upcoming],
  writes: [calendar.create, events.archive],
  commands: [],
  permissions: ['events.read', 'events.write'],
  aiAffordances: [
    "Schedule <X> for <when>",
    "What's on today?",
    "What does my week look like?",
  ],
});
