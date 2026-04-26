# nik-integrate — a Claude Skill

A distributable Claude Code skill that helps any developer integrate the **Nik architecture** into their app — either bolted onto an existing TypeScript codebase or scaffolded fresh in their preferred stack.

## What it does

When invoked (via the `Skill` tool, or by typing `/nik-integrate` in Claude Code), this skill:

1. **Asks the user about their starting point** — existing app or fresh, what stack, what backend.
2. **Explains the five components** in plain language: registry, CommandBus, LLM router, manifests, MCP server.
3. **Generates the integration files** from real, battle-tested templates (the same code running in production at [github.com/NiKhilForCybersec/nik-app](https://github.com/NiKhilForCybersec/nik-app)).
4. **Wires it into the user's existing app** with one screen migrated end-to-end as a worked example.
5. **Hands off** with a `NIK-PATTERNS.md` summary and a prioritized migration list.

## What you get out of the box

| Component | Files generated | Why it matters |
|---|---|---|
| Operations + Commands registry | `lib/operations.ts`, `lib/commands.ts`, one `contracts/<feature>.ts` per domain | Renaming or deleting an op breaks the build everywhere — never as a runtime bug |
| CommandBus | `lib/useCommand.tsx` (React) or framework variant | The AI dispatches UI mutations through the same handlers users do |
| LLM router | `lib/llm/{types,router,mock,anthropic}.ts` | Multi-LLM (Mock/Claude/GPT/Gemini/on-device SLM) behind one `complete()` call |
| Per-screen manifests + lint | `lib/screen-manifest.ts`, `<Screen>.manifest.ts`, `scripts/check-wiring.mjs`, GH Actions workflow | CI fails on drift between manifests and JSX |
| MCP server | `packages/mcp/src/server.ts` + `zodToJsonSchema.ts` | Auto-registers every operation + command as an MCP tool |
| Optional: Supabase + cron | 3 migration SQLs + `intents-tick` Edge Function | Long-term memory (`user_memories`), scheduled callbacks (`scheduled_intents`), generic ingestion (`events` + `integrations`) |

## Install

### Option A — global (every Claude Code session)

```bash
mkdir -p ~/.claude/skills/nik-integrate
cp -R skills/nik-integrate/* ~/.claude/skills/nik-integrate/
```

Now any Claude Code session in any project can invoke `/nik-integrate`.

### Option B — per-project

```bash
mkdir -p .claude/skills/nik-integrate
cp -R skills/nik-integrate/* .claude/skills/nik-integrate/
```

Skill is available only inside that repo.

### Option C — share with a friend

Zip + send the whole `nik-integrate/` folder. They drop it in either location above and it works.

## What's in this folder

```
nik-integrate/
├── SKILL.md                    ← Claude reads this first; defines behavior
├── README.md                   ← this file
└── templates/
    ├── operations.ts           ← defineOp helper + types
    ├── commands.ts             ← defineCommand helper + types
    ├── contract.example.ts     ← worked example contract (notes feature)
    ├── useOp.tsx               ← React hooks (TanStack Query over registry)
    ├── useCommand.tsx          ← CommandBusProvider + useDispatch
    ├── screen-manifest.ts      ← defineScreen helper
    ├── check-wiring.mjs        ← CI verifier (manifest ↔ JSX drift detector)
    ├── ci.yml                  ← GitHub Actions workflow
    ├── llm/
    │   ├── types.ts            ← LLMProvider interface
    │   ├── router.ts           ← LLMRouter with classifier
    │   ├── mock.ts             ← Fallback / dev provider
    │   └── anthropic.ts        ← Claude provider (proxy + direct modes)
    ├── mcp-server/
    │   ├── server.ts           ← Auto-registers registry as MCP tools
    │   └── zodToJsonSchema.ts  ← Tiny Zod → JSON Schema converter
    ├── supabase/migrations/
    │   ├── 01_init_profiles_and_habits.sql
    │   ├── 02_intents_and_memory.sql
    │   └── 03_events_and_integrations.sql
    └── edge-functions/
        └── intents-tick.ts     ← Cron worker for scheduled intents
```

All templates are **the actual code from production** — no placeholder pseudocode, no "TODO: implement". They're imported directly into the user's project and they work.

## Adapting for non-React frameworks

When the user picks Vue / Svelte / Solid, the skill adapts:
- `useOp` becomes a Vue composable, Svelte store, or Solid signal
- `CommandBusProvider` uses the framework's context primitive
- Contracts (operations + commands) are framework-agnostic — they don't change

When the user picks Firebase instead of Supabase:
- `SupabaseClient` in `OperationContext` becomes `Firestore` + `Auth`
- RLS policies become Firestore security rules
- Contract shape stays identical

The skill knows these adaptations because it has Claude generate them on the fly using the templates as reference.

## When NOT to use

- Just chatting with Claude in an app → use the [Vercel AI SDK](https://sdk.vercel.ai), don't pull in a registry pattern
- One-shot LLM tool with <5 endpoints → registry overhead doesn't pay off
- Backend-only project → CommandBus + manifest don't apply

## License

Same as the parent Nik repo. Use freely.

## Source / questions

The full Nik project is at [github.com/NiKhilForCybersec/nik-app](https://github.com/NiKhilForCybersec/nik-app). Open an issue there if the skill misbehaves or you want a new template.
