# Architectural Pillars

These are the **load-bearing rules** for Nik. Saved in Claude's long-term memory so future sessions never drift away from them. If a future change conflicts with a pillar, the pillar wins — or the pillar gets explicitly retired in [[Decisions]].

## 1. MCP-first

Every endpoint — backend Supabase ops AND frontend UI commands — is exposed as an MCP tool. The registry at [`web/src/contracts/`](../web/src/contracts/) is the single source of truth. Three consumers:
- **Humans** writing app code (`useOp`, `useDispatch`)
- **The MCP server** at [`packages/mcp-nik/`](../packages/mcp-nik/) auto-generating tools
- **The AI agent** picking from the same tool list humans see

If you add a feature, add it to the registry. The MCP tool appears automatically.

## 2. In-app Nik AI is per-user, omni-aware, can mutate UI

Every UI mutation — switch theme, add/remove/move/resize widgets, navigate between screens, complete tasks, start a focus session — flows through the **CommandBus** at [`web/src/lib/useCommand.tsx`](../web/src/lib/useCommand.tsx). The AI invokes the same commands users do, via MCP → realtime channel → device dispatcher.

The user explicitly named this as the differentiator: **"AI should be able to do anything like widget creation addition removing resizing anything on user commands."**

## 3. Pluggable LLM

Claude / GPT / Gemini / future-LLMs all callable via the MCP layer. Never hard-code Claude API calls in business logic — go through an `LLMProvider` interface. MCP tool calls work with any modern function-calling LLM.

## 4. Clean registers

Per-screen `manifest.ts` declares what each screen reads, writes, mutates, commands, and what permissions it needs. ESLint rule (planned) fails the build if a screen reaches outside its manifest. The combined registry drives:
- MCP tool catalog
- Prefetch planning
- Privacy/permission enforcement
- Dev overlay showing "what does this screen actually touch"
- The CI `wiring-check` job

## 5. No wiring breaks

Renaming or deleting an op surfaces as a TypeScript or lint error in **every** caller — never as a runtime bug. Mechanisms:
- Supabase-generated types (op signatures derived from DB schema)
- dependency-cruiser (cross-feature imports forbidden)
- Per-screen manifest ESLint rule (planned)
- Wiring-check CI job (already running)

## 6. Integrations are MCP servers

The killer use case for an AI life assistant is unifying scattered signals the user already has. Build each integration as its own MCP server:

| Integration | Server | Surfaces in |
|---|---|---|
| Gmail | `nik-mcp-gmail` | Brief, Vault, Calendar |
| iMessage / SMS | `nik-mcp-messages` | Family Circle, Couple |
| WhatsApp | `nik-mcp-whatsapp` | Family, Friends |
| Google Calendar | `nik-mcp-calendar` | Brief, Family Ops |
| Apple HealthKit | `nik-mcp-healthkit` | Habits, Sleep, Fitness |
| Spotify / Music | `nik-mcp-music` | Sleep wind-down, Focus |

**Example flow.** A movie ticket email arrives → `nik-mcp-gmail` detects it → posts to Nik backend (`brief.events.add`) → "Inception 7pm Saturday" appears on Brief screen + saved to Vault → AI can answer "when's the movie?" without you re-entering anything.

Each integration is composable + disable-able per user. See [[Integrations]] for the full spec.

## 7. AI is in every inch of the app, not just chat

Every screen has tap-to-AI affordances ("explain this", "do this for me"). The voice orb is reachable from anywhere. Long-press on widgets surfaces AI suggestions. The chat screen is one entry point — not the only one.

When designing a screen, **always include at least one AI-mediated action** and expose every meaningful interaction as a UI command in the registry so the AI can perform it on the user's behalf.

## 8. Login + onboarding can ship later

Current dev flow auto-signs-in as a seeded test user (`arjun@local.dev`). Real Google OAuth + magic link land in a later phase — does not block end-to-end feature work today. The `OnboardScreen` exists as a UI shell; it'll be wired to actual permission requests + identity creation when auth lands.

## Related

- [[Architecture]] — system layout
- [[Registry]] — the operations + commands keystone
- [[Integrations]] — Gmail / WhatsApp / Calendar / HealthKit MCP plan
- [[Decisions]] — record any deviation here, with rationale
