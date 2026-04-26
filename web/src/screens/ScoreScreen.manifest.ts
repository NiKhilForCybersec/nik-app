import { defineScreen } from '../lib/screen-manifest';
import { score } from '../contracts/score';

export const manifest = defineScreen({
  id: 'score',
  reads: [score.get, score.recent, score.backlog],
  writes: [score.resolveBacklog],
  commands: [],
  permissions: ['score.read', 'score.write'],
  aiAffordances: [
    'How am I doing?',
    'What\'s my Nik Score?',
    'What dragged me down this week?',
    'Show me my backlog',
    'Help me clear a missed task',
  ],
});
