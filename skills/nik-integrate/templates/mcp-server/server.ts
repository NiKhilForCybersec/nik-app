/* Nik — MCP server.
 *
 * Exposes the entire Nik registry (operations + commands) as MCP tools.
 * One tool per registry entry. Generated automatically — when you add an
 * op or command, the tool appears here next time the server starts.
 *
 * Two transports:
 *   - stdio (for Claude Desktop, IDE clients, local agents)
 *   - HTTP (for Anthropic Messages API mcp_servers param, future)
 *
 * Run: pnpm mcp:dev (uses tsx) or `node --import tsx src/server.ts`
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { zodToJsonSchema } from './zodToJsonSchema.js';

import { habits } from '../../../web/src/contracts/habits.js';
import { ui } from '../../../web/src/contracts/ui-commands.js';

// ── Supabase client (server uses service-role for now; per-user JWT in v2) ─
const supabaseUrl = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  '';
const sb = createClient(supabaseUrl, supabaseKey);

// ── Build tool catalog from the registry ────────────────────────────────
const operationTools = Object.values(habits)
  .filter((op) => op.exposeToAI !== false)
  .map((op) => ({
    name: op.name,
    description: op.description,
    inputSchema: zodToJsonSchema(op.input as z.ZodType),
    _kind: 'operation' as const,
    _ref: op,
  }));

const commandTools = Object.values(ui)
  .filter((cmd) => cmd.exposeToAI !== false)
  .map((cmd) => ({
    name: cmd.name,
    description: `[UI command — affects the running app] ${cmd.description}`,
    inputSchema: zodToJsonSchema(cmd.input as z.ZodType),
    _kind: 'command' as const,
    _ref: cmd,
  }));

const TOOLS = [...operationTools, ...commandTools];
const TOOL_INDEX = new Map(TOOLS.map((t) => [t.name, t]));

// ── Server ──────────────────────────────────────────────────────────────
const server = new Server(
  { name: 'nik-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map(({ name, description, inputSchema }) => ({
    name,
    description,
    inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const tool = TOOL_INDEX.get(req.params.name);
  if (!tool) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${req.params.name}` }],
      isError: true,
    };
  }

  if (tool._kind === 'operation') {
    const op = tool._ref as { input: z.ZodType; handler: (ctx: { sb: any; userId?: string }, input: any) => Promise<unknown> };
    try {
      const input = op.input.parse(req.params.arguments ?? {});
      const userId = (req.params.arguments as Record<string, unknown> | undefined)?.['__userId'] as string | undefined;
      const result = await op.handler({ sb, userId }, input);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (e: any) {
      return {
        content: [{ type: 'text', text: `Error: ${e.message ?? String(e)}` }],
        isError: true,
      };
    }
  }

  // UI commands can't be executed server-side — they need the device.
  // Return a "deferred" payload that the orchestrator forwards to the
  // user's app over realtime.
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            __deferred: 'ui-command',
            name: tool.name,
            arguments: req.params.arguments ?? {},
          },
          null,
          2,
        ),
      },
    ],
  };
});

// ── Boot ────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `[nik-mcp] ready · ${operationTools.length} operations + ${commandTools.length} commands`,
  );
}

main().catch((e) => {
  console.error('[nik-mcp] fatal', e);
  process.exit(1);
});
