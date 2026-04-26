import { defineScreen } from '../lib/screen-manifest';
import { cycle } from '../contracts';

export const manifest = defineScreen({
  id: 'cycle',
  reads: [cycle.today, cycle.history],
  writes: [cycle.logPeriodStart, cycle.logPeriodEnd, cycle.logSymptom, cycle.remove],
  commands: [],
  permissions: ['cycle.read', 'cycle.write'],
  aiAffordances: [
    'My period started today',
    'I have cramps',
    "What phase am I in?",
    'When is my next period?',
  ],
});
