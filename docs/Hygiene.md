# Development + memory hygiene

How we keep this project sane across long Claude Code sessions, multiple authors, and 1M+ context windows.

## What survives a context wipe (intentionally)

When a chat fills up and gets compressed (or a brand-new session starts), these survive:

| Layer | Where | Survives because |
|---|---|---|
| **Architectural pillars** | `~/.claude/projects/-Users-nikhil-NIK/memory/project_nik_architecture.md` | Long-term memory file, auto-loaded per session |
| **Project context for AI** | [`CLAUDE.md`](../CLAUDE.md) | Auto-loaded by Claude Code on session start |
| **Wiki** | [`docs/`](.) — Architecture, Pillars, Registry, Integrations, Backlog, Decisions | Markdown, version-controlled |
| **Decision log** | [`docs/Decisions/00X.md`](Decisions/) | One ADR per major choice with date + rationale |
| **Code-level register** | [`web/src/contracts/`](../web/src/contracts/), [`INVENTORY.md`](../INVENTORY.md) | Imported by hooks + MCP, lint-enforced |
| **Wiring-check CI** | [`scripts/check-wiring.mjs`](../scripts/check-wiring.mjs), `.github/workflows/ci.yml` | Runs on every push |

## What does NOT survive (do NOT rely on)

- The **chat history** of any one Claude session
- **In-flight TODO lists** (those are session-local)
- **Unsaved decisions** — write them to [`docs/Decisions/`](Decisions/) before moving on
- **"I'll fix that later"** — drop a Backlog entry or a TODO with a file path

## Memory-write triggers (when to update what)

| Action | Update |
|---|---|
| New architectural rule established | Pillars file in `~/.claude/.../memory/` + `docs/Architectural Pillars.md` |
| Picked X over Y for a non-obvious reason | New `docs/Decisions/00N.md` |
| Added a new contract op or UI command | `INVENTORY.md` table + the contract file is its own register |
| Added a new screen | `<Name>Screen.manifest.ts` + entry in `INVENTORY.md` screens list |
| Added a new helper hook or function | `INVENTORY.md` § 2 or § 3 |
| Added a new Supabase table | New migration file + `INVENTORY.md` § 7 |
| Added a new MCP tool | Auto via the registry — but call out new categories in `docs/Registry.md` |
| Started a new feature direction | Update `docs/Backlog.md` with phasing |
| Made a perf/cost trade | Document in the relevant feature's manifest (`aiAffordances`) or in `docs/Decisions/` if architectural |

## Memory-read triggers (when Claude should re-load context)

Claude should automatically pull these in for any non-trivial work:
- Read `CLAUDE.md` first (auto-loaded)
- Check `~/.claude/.../memory/MEMORY.md` index for pinned facts (auto-loaded)
- For any change touching contracts, read `INVENTORY.md` first
- For any architectural change, read the relevant `docs/Decisions/` first
- For any new feature, read `docs/Backlog.md` to check it's not already planned differently

## Dev workflow conventions

### Adding a feature (the canonical loop)

1. **Migration** — add `supabase/migrations/YYYYMMDDXXXXXX_<feature>.sql` with table + RLS + triggers.
2. **Contract** — add `web/src/contracts/<feature>.ts` with Zod schemas + `defineOp` entries.
3. **Re-export** — add to `web/src/contracts/index.ts`.
4. **Seed** (dev only) — add `seedSample<Feature>IfEmpty(userId)` to `web/src/lib/auth.ts`.
5. **Screen wiring** — `useOp(myFeature.list, {})` etc. Replace any local mock state.
6. **Manifest** — fill in `<Name>Screen.manifest.ts` with `reads`, `writes`, `commands`, `permissions`, `aiAffordances`.
7. **Inventory** — add to `INVENTORY.md` (ops table + Supabase tables table).
8. **Verify** — `tsc --noEmit`, `node scripts/check-wiring.mjs`, screenshot in browser preview.
9. **Commit** — atomic: one feature per commit, with the migration + contract + screen + manifest + INVENTORY all in the same change. CI enforces.

### Don'ts

- **Don't call `supabase.from(…)` directly inside a screen.** Wiring-check fails the build.
- **Don't add a dependency without recording why** — note it in the commit message.
- **Don't write a "TODO" with no owner.** Either fix it or open a `docs/Backlog.md` entry.
- **Don't mutate UI state in ways the AI can't reach.** New UI mutation = new `defineCommand` entry.
- **Don't bypass the manifest.** If a screen needs a new op, declare it in the manifest first, then use it.
- **Don't bake locale-specific defaults into seeds** (per pillar 14 — app is universal).

### Commit hygiene

- **One feature, one commit** when possible. The migration + contract + screen + manifest + INVENTORY all in one change.
- **Real commit messages** — what changed, what the user can now do that they couldn't before, what's deferred. The recent log is mostly good ([github.com/NiKhilForCybersec/nik-app/commits/main](https://github.com/NiKhilForCybersec/nik-app/commits/main)).
- **Co-author Claude when AI-assisted.** Already configured in commits.

## Long-session survival kit (for the 1M-context concern)

When a session is approaching its limit:
1. **Snapshot before compaction** — the user can ask Claude to "summarise everything we've shipped this session into a `docs/Sessions/YYYY-MM-DD.md` file" so the work is captured outside chat.
2. **Verify CLAUDE.md is current** — if architectural rules shifted during the session, they need to be in `CLAUDE.md` + the memory file before the chat compresses.
3. **Push everything** — uncommitted code is the riskiest state. CI green + pushed = safe.
4. **Index the work** — make sure `INVENTORY.md` lists the new bits.
5. **Update Backlog** — note what's "next next" so a fresh session can pick it up.

A new session's first 5 minutes should be:
- Read `CLAUDE.md` (auto)
- Read `INVENTORY.md`
- Skim `docs/Backlog.md` § "Just shipped"
- Skim `docs/Decisions/` for any new ADRs since last session

Then it's fully primed. No "what's the architecture again?" question needed.

## See also

- [[Registry]] — the contract pattern
- [[Architectural Pillars]] — load-bearing rules
- [[Backlog]] — what's next
- [[Decisions]] — why we chose X
- [`INVENTORY.md`](../INVENTORY.md) — flat register
