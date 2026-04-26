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
import { chat } from './chat';
import { circle } from './circle';
import { items } from './items';

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
export { chat } from './chat';
export { circle, PRIVACY_CATEGORIES, TRUST_TIERS, canCircleView } from './circle';
export type { CircleMember, PrivacyCategoryId } from './circle';
export { items, ItemKind } from './items';
export type { Item } from './items';

// Flat registry — single source of truth consumed by MCP server,
// dev overlay, and the in-app LLM tool catalog. Keyed by full dotted
// name so collisions across namespaces (every namespace has a `list`,
// `get`, `create`, etc.) don't silently overwrite ops.
function flattenOps(...groups: Record<string, OperationDef<any, any>>[]): Record<string, OperationDef<any, any>> {
  const out: Record<string, OperationDef<any, any>> = {};
  for (const g of groups) {
    for (const op of Object.values(g)) {
      if (out[op.name]) throw new Error(`duplicate op name: ${op.name}`);
      out[op.name] = op;
    }
  }
  return out;
}
function flattenCmds(...groups: Record<string, CommandDef<any>>[]): Record<string, CommandDef<any>> {
  const out: Record<string, CommandDef<any>> = {};
  for (const g of groups) {
    for (const cmd of Object.values(g)) {
      if (out[cmd.name]) throw new Error(`duplicate command name: ${cmd.name}`);
      out[cmd.name] = cmd;
    }
  }
  return out;
}

export const operations = flattenOps(
  habits, intents, memory, events, diary, score, sleep, familyOps, profile, quests, chat, circle, items,
);

export const commands = flattenCmds(ui);

/** All operations + commands as a flat array, for the MCP server + tool catalog. */
export const REGISTRY = {
  operations: Object.values(operations) as OperationDef<any, any>[],
  commands: Object.values(commands) as CommandDef<any>[],
} as const;

/** The shape of every "thing Nik can do" name. */
export type OperationName = keyof typeof operations;
export type CommandName = keyof typeof commands;
