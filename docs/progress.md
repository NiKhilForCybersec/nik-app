# Progress log

> Cline / Roo memory-bank pattern. Append-only milestone log so a fresh Claude session can grok how we got here in 30 seconds. **Newest at top.**

## 2026-04-25 (single intensive build day)

### Architecture (anchored)
- ✅ Capacitor + React 19 + TS + Vite as the app shell ([Decisions/001](Decisions/001%20%E2%80%94%20Capacitor%20over%20React%20Native.md))
- ✅ Vite over Babel-in-browser ([Decisions/002](Decisions/002%20%E2%80%94%20Vite%20over%20Babel-in-browser.md))
- ✅ State machine over react-router ([Decisions/003](Decisions/003%20%E2%80%94%20State%20machine%20instead%20of%20router.md))
- ✅ CSS-vars + `data-mode` theme system ([Decisions/004](Decisions/004%20%E2%80%94%20Theme%20system.md))
- ✅ Pluggable LLM via custom `LLMRouter` ([Decisions/005](Decisions/005%20%E2%80%94%20Pluggable%20LLM%20via%20router.md))
- ✅ On-device SLM deferred to v2 — Apple Foundation Models on iOS now ([Decisions/006](Decisions/006%20%E2%80%94%20On-device%20SLM%20deferred%20to%20v2.md))

### Patterns shipped
- ✅ Operations + Commands registry — single source of truth for "what Nik can do"
- ✅ CommandBus — AI dispatches UI mutations through the same handlers users do
- ✅ Per-screen `manifest.ts` + `wiring-check` CI lint
- ✅ MCP server scaffolding at `packages/mcp-nik/`
- ✅ Distributable Claude Skill `skills/nik-integrate/` (18 templates copied verbatim)
- ✅ AGENTS.md symlink → CLAUDE.md (cross-tool standard)
- ✅ Cline-style memory bank: `activeContext.md` + `progress.md`
- ✅ `INVENTORY.md` flat register (manual; `build-inventory.mjs` planned)
- ✅ `docs/Hygiene.md` — dev + memory hygiene practices

### Backend
- ✅ Supabase local stack (Colima Docker) running, analytics disabled
- ✅ 13 Supabase tables: profiles, habits, scheduled_intents, user_memories, events, integrations, diary_entries, user_scores, score_events, score_backlog, sleep_nights, family_tasks, family_alarms — all RLS-protected
- ✅ Database functions: `habit_bump`, `intents_tick`, `handle_new_user`, `touch_updated_at`
- ✅ Edge Function: `intents-tick` (cron worker for scheduled intents)

### Screens migrated to live Supabase data (6/21)
- ✅ Habits — first end-to-end loop, proven the pattern
- ✅ Brief — events feed (Gmail/Calendar pattern)
- ✅ Diary — full CRUD, mood sparkline computed live
- ✅ Score — snapshot + ledger + backlog
- ✅ Sleep — 7-night chart + dreams
- ✅ Family Ops — tasks + alarm clusters
- ⏳ Home / Chat / Profile / Quests — next session

### Process
- ✅ GitHub repo public at [github.com/NiKhilForCybersec/nik-app](https://github.com/NiKhilForCybersec/nik-app)
- ✅ CI green: type-check + build + wiring-check on every push
- ✅ Long-term memory: 14 architectural pillars saved to `~/.claude/.../memory/`
- ✅ Obsidian-style wiki: 12 docs under `docs/`

## What's NOT done

- Backend hosted (still local-only Supabase)
- Real auth (Google OAuth) — currently auto-signs-in dev user
- Android target
- AI realtime channel for cross-device UI commands
- 15 more screens to migrate
- HealthKit / Gmail / Calendar integration MCP servers (infra ready; servers not built)
- Native Capacitor plugin for on-device SLM (deferred to v2)

See [`Backlog.md`](Backlog.md) for the full forward map.
