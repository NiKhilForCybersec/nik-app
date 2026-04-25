# Registry — the keystone of "no wiring breaks"

The registry is **one TypeScript object** that lists every thing Nik can do. Three consumers read it. Drift between them is impossible because they all import the same source.

## The shape

```
web/src/contracts/
  ├── habits.ts          ← op definitions per feature
  ├── ui-commands.ts     ← UI mutation commands
  └── index.ts           ← re-exports + flat REGISTRY array

web/src/lib/
  ├── operations.ts      ← defineOp helper + types
  ├── commands.ts        ← defineCommand helper + types
  ├── useOp.ts           ← React hooks (useOp / useOpMutation)
  ├── useCommand.tsx     ← CommandBus React context
  ├── auth.ts            ← Supabase auth + dev seed
  └── supabase.ts        ← client singleton
```

## Defining an operation

```ts
// web/src/contracts/habits.ts
import { z } from 'zod';
import { defineOp } from '../lib/operations';

export const habits = {
  bump: defineOp({
    name: 'habits.bump',
    description: 'Increment a habit\'s done count. Use when the user logs a rep.',
    kind: 'mutation',
    permissions: ['habits.write'],
    tags: ['habits'],
    input: z.object({ id: z.string().uuid(), by: z.number().int().positive().default(1) }),
    output: Habit,
    handler: async ({ sb }, { id, by }) => {
      const { data, error } = await sb.rpc('habit_bump', { habit_id: id, amount: by });
      if (error) throw error;
      return data as Habit;
    },
  }),
};
```

## Calling it from a screen

```tsx
import { useOpMutation } from '../lib/useOp';
import { habits } from '../contracts/habits';

function HabitCard({ id }) {
  const bump = useOpMutation(habits.bump);
  return <button onClick={() => bump.mutate({ id, by: 1 })}>+</button>;
}
```

## Defining a UI command (AI-dispatchable)

```ts
// web/src/contracts/ui-commands.ts
export const ui = {
  switchTheme: defineCommand({
    name: 'ui.switchTheme',
    description: 'Switch the active theme universe.',
    input: z.object({ theme: ThemeId }),
    handler: ({ setState }, { theme }) => setState((s) => ({ ...s, theme })),
  }),
};
```

The AI calls this via MCP → realtime → device dispatcher. Same handler runs.

## Three consumers

### 1. App code
Use `useOp(habits.list, {})` for reads, `useOpMutation(habits.bump)` for writes. Never `supabase.from(...)` directly — the wiring-check CI job fails the build if you do.

### 2. MCP server
[`packages/mcp-nik/src/server.ts`](../packages/mcp-nik/src/server.ts) imports the registry and auto-registers every entry as an MCP tool. Tool descriptions, inputs, and JSON Schemas come from the Zod definitions.

### 3. AI agent
The LLM (Claude, GPT, Gemini — pluggable) sees the same tool catalog the app does. When it calls a backend op, the MCP server runs it via Supabase. When it calls a UI command, the response is `__deferred: ui-command` and the orchestrator forwards it to the user's device over a realtime channel.

## What prevents drift

- **TS errors** — rename `habits.list` → `habits.listAll`, every caller (screens, MCP, tests) errors at the next compile.
- **Wiring-check CI job** — `grep` for raw Supabase calls inside `web/src/screens/`. Fails the build on first commit.
- **dependency-cruiser** (planned) — forbids cross-feature imports so a Habits screen can't accidentally couple to Score internals.
- **Per-screen manifest** (planned) — each screen declares its `reads` / `writes` / `permissions`; an ESLint rule asserts the screen JSX only calls those.

## Status

| Layer | Status |
|---|---|
| `defineOp` + `useOp` + `useOpMutation` | ✅ shipped |
| `defineCommand` + `CommandBus` | ✅ shipped |
| Habits ops (6 of them) | ✅ shipped, end-to-end with Supabase |
| MCP server skeleton | ✅ shipped, exposes all current ops + commands |
| Per-screen `manifest.ts` + lint rule | ⏳ planned |
| dependency-cruiser config | ⏳ planned |
| Score / Diary / Family ops | ⏳ next batch |

## Related

- [[Architectural Pillars]]
- [[Architecture]]
- [[Integrations]]
- [[Backlog]]
