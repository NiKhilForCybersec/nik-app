import { defineScreen } from '../lib/screen-manifest';
import { chat } from '../contracts';

export const manifest = defineScreen({
  id: 'chat',
  reads: [chat.history],
  writes: [chat.append],
  commands: [],
  permissions: ['chat.read', 'chat.write'],
  aiAffordances: [
    'Add / log / mutate anything via tool calls',
    'Ask anything (free-form Q&A)',
    'Switch theme, navigate, toggle widgets',
  ],
});
