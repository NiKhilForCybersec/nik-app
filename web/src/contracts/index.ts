/* Nik — central registry.
 *
 * Re-exports every operation and UI command. Imports here are the
 * single read of "what can Nik do". Three consumers:
 *   1. React hooks (useOp, useOpMutation, useCommand)
 *   2. MCP server (auto-generates tools)
 *   3. AI agent (sees the same registry the human code does)
 *
 * Adding a feature = add an entry to a feature file, re-export here.
 * That's it.
 */

import type { OperationDef } from '../lib/operations';
import type { CommandDef } from '../lib/commands';

import { habits } from './habits';
import { ui } from './ui-commands';
import { intents, memory } from './intents';
import { events } from './events';
import { diary } from './diary';
import { score } from './score';
import { sleep } from './sleep';
import { familyOps } from './familyOps';
import { profile } from './profile';
import { quests } from './quests';

export { habits } from './habits';
export { ui } from './ui-commands';
export { intents, memory } from './intents';
export { events } from './events';
export { diary } from './diary';
export { score } from './score';
export { sleep } from './sleep';
export { familyOps } from './familyOps';
export { profile } from './profile';
export { quests } from './quests';

// Flat registry — used by MCP tool generator + dev overlay.
export const operations = {
  ...habits,
  ...intents,
  ...memory,
  ...events,
  ...diary,
  ...score,
  ...sleep,
  ...familyOps,
  ...profile,
  ...quests,
} as const;

export const commands = {
  ...ui,
} as const;

/** All operations + commands as a flat array, for the MCP server + tool catalog. */
export const REGISTRY = {
  operations: Object.values(operations) as OperationDef<any, any>[],
  commands: Object.values(commands) as CommandDef<any>[],
} as const;

/** The shape of every "thing Nik can do" name. Useful for switch statements. */
export type OperationName = (typeof operations)[keyof typeof operations]['name'];
export type CommandName = (typeof commands)[keyof typeof commands]['name'];
