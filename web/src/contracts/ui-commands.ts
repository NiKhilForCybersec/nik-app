/* Nik — UI commands the AI can dispatch to mutate the running app.
 *
 * Each command takes (state, setState) and an input. The AI invokes
 * them via MCP → realtime channel → device-side dispatcher.
 */

import { z } from 'zod';
import { defineCommand } from '../lib/commands';

export const ThemeId = z.enum([
  'solo-leveling', 'ghibli', 'dragon-ball', 'dune', 'avengers',
]);

const screenIds = [
  'home', 'chat', 'habits', 'fitness', 'profile', 'more',
  'familyops', 'family', 'circle', 'meds', 'diary', 'focus',
  'score', 'sleep', 'money', 'brief', 'vault', 'errands',
  'couple', 'kids', 'onboard', 'settings',
  'quests', 'voice', 'widgets', 'stats', 'comingsoon',
] as const;
export const ScreenIdEnum = z.enum(screenIds);

export const ui = {
  switchTheme: defineCommand({
    name: 'ui.switchTheme',
    description: 'Switch the active theme universe. Use when the user says "switch to ghibli", "go dark", "try dragon ball mode", etc. The change applies instantly via CSS variables — no reload.',
    tags: ['ui', 'theme'],
    input: z.object({ theme: ThemeId }).strict(),
    handler: ({ setState }, { theme }) => {
      setState((s) => ({ ...s, theme }));
    },
  }),

  navigateTo: defineCommand({
    name: 'ui.navigateTo',
    description: 'Navigate to a specific screen. Use when the user says "open habits", "show me the family circle", "take me home", etc.',
    tags: ['ui', 'nav'],
    input: z.object({ screen: ScreenIdEnum }).strict(),
    handler: ({ setState }, { screen }) => {
      setState((s) => ({ ...s, screen, notifVisible: false }));
    },
  }),

  setIntensity: defineCommand({
    name: 'ui.setIntensity',
    description: 'Set the gamification intensity. "soft" hides chrome, "medium" is balanced, "full" leans into HUD aesthetic.',
    tags: ['ui', 'theme'],
    input: z.object({ intensity: z.enum(['soft', 'medium', 'full']) }).strict(),
    handler: ({ setState }, { intensity }) => {
      setState((s) => ({ ...s, intensity }));
    },
  }),

  setDensity: defineCommand({
    name: 'ui.setDensity',
    description: 'Set the layout density. "cozy" is tighter, "comfortable" is default, "spacious" gives more breathing room.',
    tags: ['ui', 'theme'],
    input: z.object({ density: z.enum(['cozy', 'comfortable', 'spacious']) }).strict(),
    handler: ({ setState }, { density }) => {
      setState((s) => ({ ...s, density }));
    },
  }),

  dismissNotif: defineCommand({
    name: 'ui.dismissNotif',
    description: 'Dismiss the currently-visible notification toast.',
    tags: ['ui', 'notif'],
    input: z.object({}).strict(),
    handler: ({ setState }) => {
      setState((s) => ({ ...s, notifVisible: false }));
    },
  }),

  startListening: defineCommand({
    name: 'ui.startListening',
    description: 'Open the voice listening overlay (the AI conversation UI).',
    tags: ['ui', 'voice'],
    input: z.object({}).strict(),
    handler: ({ setState }) => {
      setState((s) => ({ ...s, listening: true }));
    },
  }),

  stopListening: defineCommand({
    name: 'ui.stopListening',
    description: 'Close the voice listening overlay.',
    tags: ['ui', 'voice'],
    input: z.object({}).strict(),
    handler: ({ setState }) => {
      setState((s) => ({ ...s, listening: false }));
    },
  }),

  showOfflineBanner: defineCommand({
    name: 'ui.showOfflineBanner',
    description: 'Show the offline / syncing banner.',
    tags: ['ui', 'system'],
    input: z.object({ kind: z.enum(['offline', 'syncing']).nullable() }).strict(),
    handler: ({ setState }, { kind }) => {
      setState((s) => ({ ...s, offline: kind }));
    },
  }),
} as const;
