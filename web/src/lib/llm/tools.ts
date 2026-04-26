/* Nik — chat tool catalog + dispatcher.
 *
 * Bridges the Operations + Commands registry into the LLM tool-use loop.
 *
 *   buildToolCatalog() → an LLMTool[] the model can call
 *   executeToolCall()  → runs an op handler against Supabase, OR dispatches
 *                        a UI command via the CommandBus
 *
 * Names use a slash separator in the LLM-facing layer because some tool-use
 * APIs (notably Anthropic's) treat dots in tool names as illegal. We map
 * back to the registry's dotted name when executing.
 */

import { operations, commands } from '../../contracts';
import type { OperationDef } from '../operations';
import type { CommandDef } from '../commands';
import { supabase } from '../supabase';
import type { LLMTool, LLMToolCall } from './types';
import { zodToJsonSchema } from './zodToJsonSchema';

const NAME_SEP = '__';
const toLLMName = (name: string) => name.replace(/\./g, NAME_SEP);
const fromLLMName = (name: string) => name.replace(new RegExp(NAME_SEP, 'g'), '.');

// Build a name→op map up front. The exported `operations` object in
// contracts/index.ts is keyed by short name (e.g. `list`, `bump`),
// so different namespaces' `list` ops would shadow each other if we
// looked up by key. Iterating `Object.values()` gives each registered
// op exactly once, with its full dotted `.name`.
const opByName = new Map<string, OperationDef<unknown, unknown>>();
for (const op of Object.values(operations) as OperationDef<unknown, unknown>[]) {
  opByName.set(op.name, op);
}
const cmdByName = new Map<string, CommandDef<unknown>>();
for (const cmd of Object.values(commands) as CommandDef<unknown>[]) {
  cmdByName.set(cmd.name, cmd);
}

/** All registered ops keyed by full dotted name (`habits.list` etc). */
export function getOpRegistry(): ReadonlyMap<string, OperationDef<unknown, unknown>> {
  return opByName;
}
/** All registered UI commands keyed by full dotted name (`ui.switchTheme` etc). */
export function getCmdRegistry(): ReadonlyMap<string, CommandDef<unknown>> {
  return cmdByName;
}

export function buildToolCatalog(): LLMTool[] {
  const tools: LLMTool[] = [];
  for (const op of opByName.values()) {
    if (op.exposeToAI === false) continue;
    // Hide derived-mutation ops from the AI entirely. Reads are always
    // safe (a `derived` query is just informative); the policy only
    // applies to writes.
    if (op.kind === 'mutation' && op.mutability === 'derived') continue;
    tools.push({
      name: toLLMName(op.name),
      description: op.description,
      inputSchema: zodToJsonSchema(op.input as never) as Record<string, unknown>,
    });
  }
  for (const cmd of cmdByName.values()) {
    tools.push({
      name: toLLMName(cmd.name),
      description: cmd.description,
      inputSchema: zodToJsonSchema(cmd.input as never) as Record<string, unknown>,
    });
  }
  return tools;
}

export type ExecuteCtx = {
  userId?: string;
  dispatch: (name: string, args: Record<string, unknown>) => unknown;
};

export type ExecuteResult = {
  /** Original LLM-facing tool name (with `__`). */
  toolCall: LLMToolCall;
  /** Registry-style dotted name. */
  registryName: string;
  /** True if this was a UI command (dispatched via CommandBus). */
  ui: boolean;
  /** Result returned by the op handler, or null for UI commands. */
  result: unknown;
  /** Error message if the call threw. */
  error?: string;
};

export async function executeToolCall(
  tc: LLMToolCall,
  ctx: ExecuteCtx,
): Promise<ExecuteResult> {
  const registryName = fromLLMName(tc.name);
  const base: Pick<ExecuteResult, 'toolCall' | 'registryName'> = { toolCall: tc, registryName };

  // UI commands → dispatch via CommandBus.
  if (registryName.startsWith('ui.')) {
    try {
      ctx.dispatch(registryName, tc.arguments);
      return { ...base, ui: true, result: { ok: true } };
    } catch (e) {
      return { ...base, ui: true, result: null, error: (e as Error).message };
    }
  }

  // Backend op → run against Supabase as the current user.
  const op = opByName.get(registryName);
  if (!op) {
    return { ...base, ui: false, result: null, error: `unknown tool: ${registryName}` };
  }
  try {
    const parsed = op.input.parse(tc.arguments);
    const result = await op.handler({ sb: supabase, userId: ctx.userId }, parsed);
    return { ...base, ui: false, result };
  } catch (e) {
    return { ...base, ui: false, result: null, error: (e as Error).message };
  }
}
