/* Nik — UI command bus
 *
 * Same shape as operations.ts but for things the AI can do TO the UI:
 *   - switch theme
 *   - navigate to a screen
 *   - resize a widget
 *   - dismiss a notification
 *   - reorder home tiles
 *
 * These are NOT backend ops — they mutate React state in the running app.
 * They're invoked either by:
 *   1. App code via dispatch(commands.ui.switchTheme, { theme: 'dune' })
 *   2. The AI agent via MCP tool calls → realtime channel → dispatch on device
 *
 * Both paths run through the same registry. One source of truth.
 */

import { z } from 'zod';
import type { AppState } from '../types/app-state';

export type CommandContext = {
  /** Current app state (read-only). */
  state: AppState;
  /** State setter — same React useState setter. */
  setState: (updater: (s: AppState) => AppState) => void;
};

export type CommandDef<TInput> = {
  name: string;            // e.g. "ui.switchTheme"
  description: string;     // AI-facing
  input: z.ZodType<TInput>;
  handler: (ctx: CommandContext, input: TInput) => void | Promise<void>;
  /** Whether this command should be exposed to the AI. Default: true. */
  exposeToAI?: boolean;
  /** Tags for grouping. */
  tags?: readonly string[];
};

export function defineCommand<TInput>(def: CommandDef<TInput>): CommandDef<TInput> {
  return def;
}
