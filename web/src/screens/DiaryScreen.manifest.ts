import { defineScreen } from '../lib/screen-manifest';
import { diary } from '../contracts/diary';

export const manifest = defineScreen({
  id: 'diary',
  reads: [diary.list],
  writes: [diary.create, diary.update, diary.archive],
  commands: [],
  permissions: ['diary.read', 'diary.write'],
  aiAffordances: [
    'Write a diary entry for me',
    'Show me bright days from this month',
    'What was on my mind a week ago?',
    'Help me reflect on this week',
  ],
});
