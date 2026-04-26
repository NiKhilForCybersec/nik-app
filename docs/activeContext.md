# Active context

> Cline / Roo memory-bank pattern. **Read this first** at the start of every Claude Code session — it's the rolling state of "where we are right now," updated at the end of each session.

## Right now (last updated: 2026-04-25)

### What we're working on
Migrating the remaining hardcoded mock-data screens (Home, Chat, Profile, Quests) to read from Supabase via the registry. 6 of 21 screens are already DB-backed.

### What just shipped (this session)
- Operations + Commands registry (`web/src/contracts/`) — 33 backend ops + 8 UI commands
- Per-screen manifests + `wiring-check` CI lint
- Pluggable `LLMProvider` + `LLMRouter` (Mock + Anthropic; SLM-ready)
- ChatScreen wired through LLM router; `ui.switchTheme` tool call actually flips theme live
- `scheduled_intents` + `user_memories` tables + `intents-tick` Edge Function
- Generic `events` + `integrations` tables for the integration-MCP feed
- 6 screens fully DB-backed: Habits, Brief, Diary, Score, Sleep, Family Ops
- Distributable `nik-integrate` Claude Skill for porting the pattern to other apps
- `INVENTORY.md` (flat register) + `docs/Hygiene.md` (this dev/memory doc)
- AGENTS.md symlink → CLAUDE.md (cross-tool standard)

### Decisions logged this session
- [Decisions/005] Pluggable LLM via router
- [Decisions/006] On-device SLM deferred to v2 (Apple Foundation Models on iOS now; Gemma 3n + llama.cpp later when triggers fire)

### Where we paused
After committing the MOCK-removal pass (`ddc3387`), we added INVENTORY.md + Hygiene.md and started adopting Cline-style memory-bank pattern. Next: run a `build-inventory.mjs` script to auto-regenerate the inventory.

### What's blocked / pending
- **Vector container on Colima** failed once during db reset; works after `supabase stop && colima restart`. Note for new sessions.
- Score backlog seeded with `gentle: false` for 3 of 4 entries (Supabase array-insert null padding). Resolved via explicit per-row defaults; pattern documented in `Gotchas.md`.

## Next 5 actions (in order)

1. **`scripts/build-inventory.mjs`** — AST-walk `web/src/{contracts,lib,components,screens}/**` to auto-regenerate `INVENTORY.md`. Stops it from drifting.
2. **Migrate Home → Supabase** — Home reads `MOCK.user`/`MOCK.habits`/`MOCK.notifications`. Move user → `profiles`, notifications → derive from `events` + `score_events`.
3. **Migrate Chat persistence** — `chat_messages` table, store conversation + tool-call history, replace local React state.
4. **Migrate Profile** — straight read from `profiles` table (already exists).
5. **Migrate Quests** — `quests` table (separate from habits — quests are auto-triggerable by GPS/time/etc.).

After all 4 above, every visible screen in the tab bar reads from Supabase. Then we can delete `web/src/data/mock.ts` entirely.

## Long-running concerns

- **AI realtime channel** — when AI server-side dispatches `ui.*`, how does it reach the device? Postgres LISTEN/NOTIFY → Supabase realtime → device CommandBus. Spec'd, not built.
- **Auth UI** — currently auto-signs-in seeded dev user. Real Google OAuth via Supabase Auth, then proper onboarding. Whole separate session.
- **Android target** — only iOS added so far via Capacitor.
- **HealthKit MCP plugin** — needs native Swift/Kotlin work; the Capacitor MCP bridge for on-device tools is the v2 version of integration servers.

## Where Claude should look first when starting a fresh session

1. [`AGENTS.md`](../AGENTS.md) (= [CLAUDE.md](../CLAUDE.md)) — auto-loaded
2. This file — `docs/activeContext.md`
3. [`docs/progress.md`](progress.md) — what milestones we've crossed
4. [`INVENTORY.md`](../INVENTORY.md) — what exists
5. [`docs/Backlog.md`](Backlog.md) — what's next
6. Recent `docs/Decisions/*.md` files — why we picked X over Y
