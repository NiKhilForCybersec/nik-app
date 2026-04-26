/* Nik — per-screen manifest.
 *
 * Each screen has a sibling `<Name>Screen.manifest.ts` that declares
 * exactly what it touches: which ops it reads, which it mutates, which
 * UI commands it dispatches, which permission strings it needs, and what
 * AI affordances it offers.
 *
 * Three uses:
 *   1. The `scripts/check-wiring.mjs` CI verifier compares this manifest
 *      to the actual JSX usage. Drift fails the build.
 *   2. The MCP server can introspect "what does the user see right now"
 *      (current screen → manifest → list of relevant tools).
 *   3. Devs (and future LLM-assisted edits) can read one file to
 *      understand what a screen depends on without grepping the JSX.
 */

import type { OperationDef } from './operations';
import type { CommandDef } from './commands';

export type ScreenManifest = {
  /** Matches the ScreenId in router. */
  id: string;
  /** Operations the screen reads (queries). */
  reads: readonly OperationDef<any, any>[];
  /** Operations the screen mutates (writes). */
  writes: readonly OperationDef<any, any>[];
  /** UI commands the screen dispatches. */
  commands: readonly CommandDef<any>[];
  /** Permission strings required to render this screen. */
  permissions: readonly string[];
  /** AI affordances this screen exposes — natural-language phrases the
   *  user can speak to do screen-relevant actions. Surfaces in the tap-to-AI
   *  context menu and feeds the AI's "what can I do here" prompt. */
  aiAffordances?: readonly string[];
  /** Optional integrations this screen depends on (Gmail, Calendar, etc.).
   *  Used to gate the screen behind integration consent. */
  integrations?: readonly string[];
};

export function defineScreen(m: ScreenManifest): ScreenManifest {
  return m;
}
