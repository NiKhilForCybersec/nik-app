---
name: nik-integrate
description: Help the user integrate Nik's MCP-first architecture (typed operations registry, AI-driven UI command bus, pluggable LLM router, per-screen manifests with lint enforcement, Supabase + RLS, scheduled intents, long-term memory, integration MCP servers) into their TypeScript app — either bolted onto an existing codebase OR scaffolded fresh in their preferred stack. Always ask the user about their starting point first.
---

# Nik integration skill

You're helping the user integrate the **Nik architecture** into their app. Nik is an AI-life-assistant pattern with five reusable building blocks. The user can take all of them or pick the parts they need.

This skill assumes the user already has Claude Code (or compatible) installed.

---

## Step 1 — figure out where they're starting

Before writing any code, ask the user **all four questions** in a single AskUserQuestion call. If AskUserQuestion isn't available, ask in plain text:

1. **Starting point** — `existing app` / `starting fresh`
2. **Frontend stack** — `React` / `Vue` / `Svelte` / `Solid` / `vanilla TS`
3. **Mobile shell needed?** — `web only` / `Capacitor (iOS+Android)` / `Tauri (desktop+mobile)` / `Expo (React Native)`
4. **Backend** — `Supabase` (recommended) / `Firebase` / `PlanetScale + Hono` / `convex` / `we'll talk about it later — just give me the registry pattern in-memory for now`

If they pick "existing app", also ask them to share their `package.json` + the entry file (e.g. `src/App.tsx`) so you can wire patterns idiomatically into what's already there.

---

## Step 2 — explain what they're getting (one paragraph each)

Don't dump theory. Give the user one paragraph per component, and ask which they want. Default = all five.

1. **Operations + Commands registry** — one TypeScript file per "thing the app can do." Renaming or deleting one breaks the build everywhere it was used. Lint-enforced. Drives auto-generated MCP tools.
2. **CommandBus** — the AI dispatches UI mutations (switch theme, navigate, resize widget) through the same handlers users do. No special-cased AI code paths.
3. **LLMProvider + router** — abstract LLM interface. Mock / Claude / GPT / Gemini / on-device SLM all swap behind the same `complete()` call. The router classifies prompts and picks the right model.
4. **Per-screen manifests + wiring-check** — every screen file declares which ops it reads/writes/dispatches. CI fails if drift.
5. **MCP server skeleton** — auto-generates MCP tools from the registry. Curated, not OpenAPI-converted (LLMs perform much better on hand-curated tools).

Optional add-ons (offer if the user has time / interest):
- **Supabase migrations** for `scheduled_intents`, `user_memories`, generic `events` table for integrations
- **Cron worker** Edge Function for scheduled intents
- **Per-screen `aiAffordances`** that surface as tap-to-AI menu items

---

## Step 3 — generate the integration files

For each chosen component, write the file using the templates in `templates/` (see this skill's directory). The templates are framework-agnostic where possible; some (like the React hooks) have framework-specific variants.

**Templates available** (read them when you need them):

- `templates/operations.ts` — `defineOp` helper + types
- `templates/commands.ts` — `defineCommand` helper + types
- `templates/contract.example.ts` — example contract using both
- `templates/useOp.tsx` (React) — `useOp` / `useOpMutation` hooks via TanStack Query
- `templates/useCommand.tsx` (React) — `CommandBusProvider` + `useDispatch`
- `templates/screen-manifest.ts` — `defineScreen` helper
- `templates/check-wiring.mjs` — CI script that verifies manifest ↔ JSX
- `templates/llm/types.ts` — `LLMProvider` interface
- `templates/llm/router.ts` — `LLMRouter` with classifier
- `templates/llm/mock.ts` — fallback provider
- `templates/llm/anthropic.ts` — Claude provider
- `templates/mcp-server/server.ts` — MCP server that introspects the registry
- `templates/supabase/migrations/init.sql` — base tables (profiles, RLS, touch_updated_at trigger)
- `templates/supabase/migrations/intents-and-memory.sql`
- `templates/supabase/migrations/events-and-integrations.sql`
- `templates/edge-functions/intents-tick.ts`
- `templates/ci.yml` — GitHub Actions: type-check + build + wiring-check

When the user picks **Vue/Svelte/Solid** instead of React, adapt:
- `useOp` → composable in Vue 3, store in Svelte, signal in Solid
- `CommandBusProvider` → corresponding context primitive
- The contract files (operations + commands) are framework-agnostic and don't change

When the user picks **Firebase** instead of Supabase, adapt:
- Replace `SupabaseClient` in `OperationContext` with `Firestore` + `Auth`
- Replace RLS policies with security rules in `firestore.rules`
- The contract shape stays identical

---

## Step 4 — wire it into their app

After files are generated, tell them exactly what to change in their existing code:

1. **Mount providers** in their root component (paste the snippet)
2. **Define their first contract** — pick one of their existing API endpoints + show how to define it
3. **Use the hook** — replace their existing `fetch()` / `axios` / `useEffect-fetch` pattern with `useOp`
4. **Add wiring-check to CI** — drop the script + workflow, add to their existing CI

If they have an existing app: walk through ONE of their screens together. Pick the simplest (lowest dependency surface) and migrate it as a worked example. Don't migrate everything in one go — they need to understand the pattern.

---

## Step 5 — handoff

End with:
- A `NIK-PATTERNS.md` for their repo summarising what was added
- A list of which screens / endpoints to migrate next (in priority order)
- A pointer to the full Nik repo for reference: https://github.com/NiKhilForCybersec/nik-app
- An offer to run the wiring-check + show them the first lint-enforced "this would have broken" example

---

## When NOT to use this skill

- The user just wants to chat with Claude inside an app → they need a chat widget, not the registry pattern. Point them at Vercel AI SDK or similar.
- The user wants to build a one-shot LLM tool → registry overhead doesn't pay off until ~5 endpoints.
- The user is on a backend-only project → the CommandBus + manifest layer is wasted.

In those cases, recommend simpler patterns and don't generate the registry scaffold.

---

## Recovery

If the user later wants to rip something out:

- Drop a contract file → wiring-check tells them exactly which screens still reference it
- Swap the LLM provider → one line in `router.ts`
- Disable an integration MCP server → flip a per-user toggle in settings; nothing else changes

The point of the registry is **change cost is bounded**.
