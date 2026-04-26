# Active context

> Cline / Roo memory-bank pattern. **Read this first** at the start of every Claude Code session — it's the rolling state of "where we are right now," updated at the end of each session.

## Right now (last updated: 2026-04-26)

### What we're working on

Killing the remaining mock-data clusters and giving the AI/MCP layer access to every dashboard the user can see — including the SOON ones. The visible UI hasn't fully caught up; under the hood it has.

### What just shipped (this session)

- **Real LLM in chat** — Anthropic Claude primary, OpenAI fallback. MockLLM deleted. Verified end-to-end with real prompts (`POST api.anthropic.com/v1/messages → 200`).
- **AI tool-use loop** — Chat sends the full registry catalog (47 tools) to the LLM. UI commands dispatch via CommandBus; backend ops execute as the user via Supabase RLS. Verified `habits.create`, `quests.create`, `ui.switchTheme` in single + multi-tool turns.
- **Registry collision fix** — `operations` was built by spreading per-namespace objects, so colliding short keys (`list`, `get`, `create`) silently overwrote each other. Catalog went from 28 to 47+ tools. Same fix applies to the MCP server.
- **Auth UI** — real AuthScreen (email + password + demo button + SOON-badged Google/Apple/SAML). Sign-out wired in Profile · About.
- **Chat persistence** — `chat_messages` table + `chat.history` / `chat.append` / `chat.clear` ops. Conversations survive reload, tool-call telemetry stored in JSONB.
- **Family circle** — `circle_members` table + `circle.list`/`add`/`updateSharing`/`setStatus`/`remove` ops. `web/src/data/circle.ts` deleted; CircleScreen + CircleSheets read from contract via a thin `toLegacy` projection. Privacy categories + trust tiers + `canCircleView()` live alongside the contract.
- **Phase A: generic `items` contract** — single table backing 22 of the 33 SOON More-tab dashboards (reading, shopping, recipes, plants, wardrobe, travel, bucket list, photos, birthdays, friends, pets, subscriptions, bills, receipts, investments, achievements, goals, career, side projects, network, care team, reflection, etc.). Discriminated by `kind`. AI can already create / list / update / archive any of them via Chat or MCP — even though their More tiles still display SOON until Phase C builds the screens.

### Where we paused

Phase A shipped — the data layer + AI accessibility for ~22 SOON features is live. **Phase B (custom-shape contracts: Hydration extension, Cycle, Symptoms, Languages, Time Capsule, Calendar integration, Doctors)** and **Phase C (pretty screens for every Phase A + B item)** are next. Each is a follow-on session.

### Blocked / pending

- **Production deploy** — local Supabase only. Vector container fails on Colima sometimes; reset with `supabase stop && colima restart`.
- **MCP HTTP transport** — server is stdio only. HTTP + per-user JWT bearer is needed before Telegram harness ships.
- **AI realtime channel** — server-side AI tool calls reaching the device's CommandBus. Spec'd, not built.
- **Vite bundles `VITE_*` env into the client** — fine for local dev; production needs a Supabase Edge Function proxy at `functions/llm-complete` so API keys don't ship in the bundle.

## Next 5 actions (in order)

1. **Telegram harness** — small Node service that talks to Anthropic Sessions API per-Telegram-user, mounted with the same MCP server. Lets the user text Nik from anywhere.
2. **Phase B start** — pick the highest-value custom contract (Cycle? Hydration extension? Calendar integration?) and ship it.
3. **Phase C start** — wire one or two of the Phase A items to a real screen (Reading or Shopping is the cleanest first cut).
4. **Production proxy** — Supabase Edge Function `llm-complete` that holds ANTHROPIC + OPENAI keys server-side; flip `useDirect` off in `web/src/lib/llm/anthropic.ts`.
5. **AI realtime channel** — `pending_commands` table + Supabase realtime subscription + CommandBus delivery.

## Long-running concerns

- **Auth UI** — done for v1 (email + password). OAuth Google/Apple/SAML deferred to v2.
- **Android target** — only iOS via Capacitor.
- **HealthKit MCP plugin** — Capacitor MCP bridge for on-device tools is the v2 version of integration servers.

## Where Claude should look first when starting a fresh session

1. [`AGENTS.md`](../AGENTS.md) (= [CLAUDE.md](../CLAUDE.md)) — auto-loaded
2. This file — `docs/activeContext.md`
3. [`docs/progress.md`](progress.md) — milestone log
4. [`INVENTORY.md`](../INVENTORY.md) — what exists
5. [`docs/Backlog.md`](Backlog.md) — what's next
6. Recent `docs/Decisions/*.md` files
