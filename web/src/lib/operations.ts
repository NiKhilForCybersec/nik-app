/* Nik — operations registry (architectural keystone)
 *
 * Every "thing Nik can do" is defined here once and used by THREE consumers:
 *   1. The frontend (via useOp / useOpMutation hooks)
 *   2. The backend MCP server (auto-registered as MCP tools)
 *   3. The AI agent (via the MCP tool registry)
 *
 * If you're adding a feature: define an operation here. Don't add fetch
 * calls, raw Supabase calls, or hand-rolled hooks elsewhere — the lint
 * rule (web/eslint.config.js → 'nik/no-raw-supabase') enforces this.
 *
 * Renaming or deleting an op surfaces as a TS error in every place that
 * called it. Adding a new op makes it instantly available to the AI.
 */

import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export type OperationKind = 'query' | 'mutation';

/** Mutability policy — who is allowed to write this op.
 *
 *   'direct'  — both user (via UI) and AI (via tool catalog) may invoke.
 *               Default for everything except derived metrics + destructive ops.
 *   'derived' — value is COMPUTED from other signals (triggers / Edge
 *               Functions / aggregations). Neither the AI nor the UI
 *               should attempt to write it directly. The tool catalog
 *               EXCLUDES derived mutations entirely so the AI can't try.
 *               Examples: profile.level / xp / streak, score.total.
 *   'confirm' — AI may PROPOSE but not execute autonomously; the UI
 *               should surface a confirmation sheet before commit.
 *               Examples: circle.remove, chat.clear, items.remove of
 *               many rows. Today the tool catalog still includes these
 *               (so Claude can suggest them in a turn the user is in),
 *               but the autonomous loop (when it lands) MUST skip them.
 *
 * Queries are always 'direct' regardless of tag — reads are safe. */
export type Mutability = 'direct' | 'derived' | 'confirm';

export type OperationContext = {
  sb: SupabaseClient;
  /** Authenticated user id, undefined for unauthenticated requests. */
  userId?: string;
};

export type OperationDef<TInput, TOutput> = {
  /** Globally unique tool name, dot-namespaced. e.g. "habits.list" */
  name: string;
  /** Human + AI-facing description. Used as the MCP tool description. */
  description: string;
  /** 'query' = read, cached. 'mutation' = write, invalidates. */
  kind: OperationKind;
  /** Permission strings this op requires. Drives the privacy matrix. */
  permissions: readonly string[];
  /** Zod schema for input. Produces JSON Schema for MCP automatically. */
  input: z.ZodType<TInput>;
  /** Zod schema for output. Same. */
  output: z.ZodType<TOutput>;
  /** The actual handler. Receives a Supabase client + the parsed input. */
  handler: (ctx: OperationContext, input: TInput) => Promise<TOutput>;
  /** Whether this op should be exposed to the AI. Default: true. */
  exposeToAI?: boolean;
  /** Mutability policy. Default: 'direct'. Ignored for queries. */
  mutability?: Mutability;
  /** Tags for grouping in the MCP tool catalog. */
  tags?: readonly string[];
};

/** Helper to define an operation with full type inference. */
export function defineOp<TInput, TOutput>(
  def: OperationDef<TInput, TOutput>,
): OperationDef<TInput, TOutput> {
  return def;
}

/** Type-only helper to flatten a feature module into a flat op map. */
export type FlattenOps<T> = {
  [K in keyof T]: T[K] extends OperationDef<any, any> ? T[K] : never;
};
