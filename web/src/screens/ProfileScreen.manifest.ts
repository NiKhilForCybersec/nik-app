import { defineScreen } from '../lib/screen-manifest';
import { profile } from '../contracts';

export const manifest = defineScreen({
  id: 'profile',
  reads: [profile.get],
  writes: [],
  commands: [],
  permissions: ['profile.read'],
  aiAffordances: [
    'Switch to a different theme',
    'Update my goal',
    'Change my Nik persona',
  ],
});
