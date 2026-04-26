# Inventory

A flat register of every contract, hook, helper, primitive, screen, contract, table, and Edge Function in this repo. Updated alongside meaningful changes; if it drifts from reality, run `node scripts/inventory-check.mjs` (planned) to surface diffs.

## How to read this

- **Contracts** are the "things Nik can do" — backend ops + UI commands. They auto-flow into the MCP server.
- **Hooks** wrap contracts for React. Never call Supabase directly outside these.
- **Helpers** are the wiring code (auth, supabase client, theme, native wrappers).
- **Primitives + components** are the design-system parts.
- **Screens** read contracts via hooks. Each has a sibling `.manifest.ts` declaring its surface.
- **Tables + Edge Functions** are the Supabase backend.

If you add something here, also add it to the appropriate `index.ts` re-export. If you remove something, the wiring-check CI job will tell you which screens still depend on it.

---

## 1. Contracts (the registry)

Files: [`web/src/contracts/`](web/src/contracts/)

### Backend operations (ops)

| Op name | File | Kind | Purpose |
|---|---|---|---|
| `habits.list` | habits.ts | query | List user's habits, ordered by hue |
| `habits.get` | habits.ts | query | Single habit by id |
| `habits.create` | habits.ts | mutation | Add a new habit |
| `habits.bump` | habits.ts | mutation | Increment done count by N |
| `habits.reset` | habits.ts | mutation | Reset today's done to 0 |
| `habits.remove` | habits.ts | mutation | Delete a habit |
| `events.list` | events.ts | query | Ingested events feed (movies, flights, bills, …) |
| `events.ingest` | events.ts | mutation | Insert event from an integration MCP server |
| `events.markRead` | events.ts | mutation | Mark event read |
| `events.pin` | events.ts | mutation | Pin event to surface on Home/Brief |
| `events.archive` | events.ts | mutation | Soft-delete event |
| `diary.list` | diary.ts | query | Diary entries newest-first |
| `diary.create` | diary.ts | mutation | Write new entry |
| `diary.update` | diary.ts | mutation | Edit existing entry |
| `diary.archive` | diary.ts | mutation | Soft-delete entry |
| `score.get` | score.ts | query | Score snapshot (total, pillars, rank) |
| `score.recent` | score.ts | query | Recent ledger entries |
| `score.backlog` | score.ts | query | Unresolved missed-task backlog |
| `score.resolveBacklog` | score.ts | mutation | Mark backlog item resolved |
| `sleep.recent` | sleep.ts | query | N most-recent nights |
| `sleep.log` | sleep.ts | mutation | Upsert a night (idempotent on date) |
| `sleep.addDream` | sleep.ts | mutation | Append dream to a logged night |
| `familyOps.tasks` | familyOps.ts | query | Pending family tasks |
| `familyOps.alarms` | familyOps.ts | query | Active alarm clusters |
| `familyOps.toggleTask` | familyOps.ts | mutation | Mark task done/pending |
| `familyOps.reassignTask` | familyOps.ts | mutation | Hand task to other parent |
| `familyOps.toggleAlarmCluster` | familyOps.ts | mutation | Master enable/disable cluster |
| `intents.schedule` | intents.ts | mutation | "In 2 weeks remind me X" |
| `intents.list` | intents.ts | query | Pending + recent intents |
| `intents.cancel` | intents.ts | mutation | Cancel a pending intent |
| `memory.save` | intents.ts | mutation | Long-term memory entry (preference / fact / goal / context) |
| `memory.list` | intents.ts | query | List active memories |
| `memory.archive` | intents.ts | mutation | Soft-delete a memory |

**Total: 33 backend ops.**

### UI commands (CommandBus, AI-dispatchable)

| Command | File | Purpose |
|---|---|---|
| `ui.switchTheme` | ui-commands.ts | Switch theme universe |
| `ui.navigateTo` | ui-commands.ts | Navigate to screen |
| `ui.setIntensity` | ui-commands.ts | soft / medium / full |
| `ui.setDensity` | ui-commands.ts | cozy / comfortable / spacious |
| `ui.dismissNotif` | ui-commands.ts | Dismiss toast |
| `ui.startListening` | ui-commands.ts | Open voice overlay |
| `ui.stopListening` | ui-commands.ts | Close voice overlay |
| `ui.showOfflineBanner` | ui-commands.ts | Show offline / syncing banner |

**Total: 8 UI commands.**

---

## 2. React hooks

| Hook | File | Purpose |
|---|---|---|
| `useOp(op, input, opts?)` | lib/useOp.ts | TanStack Query wrapper for a query op |
| `useOpMutation(op)` | lib/useOp.ts | TanStack mutation wrapper, auto-invalidates by op namespace |
| `useAuth()` | lib/auth.ts | Supabase auth + dev sign-up + idempotent seeds |
| `useCommand()` | lib/useCommand.tsx | Get the CommandBus dispatcher |
| `useDispatch(cmd)` | lib/useCommand.tsx | Type-safe dispatcher for one specific command |

---

## 3. Helpers / wiring

| Symbol | File | Purpose |
|---|---|---|
| `defineOp` | lib/operations.ts | Create a typed op definition |
| `defineCommand` | lib/commands.ts | Create a typed UI command definition |
| `defineScreen` | lib/screen-manifest.ts | Create a screen manifest |
| `supabase` | lib/supabase.ts | Singleton Supabase client (env-driven) |
| `hasSupabase()` | lib/supabase.ts | True if env keys are set |
| `CommandBusProvider` | lib/useCommand.tsx | React context provider mounted at root |
| `applyTheme(id)` | theme/themes.ts | Write theme CSS variables to `:root` |
| `getTheme(id)` | theme/themes.ts | Lookup theme by id |
| `getThemeVocab(id)` | theme/themes.ts | Theme-specific vocab (Hunter / Wanderer / etc.) |
| `scoreToRank(score, themeId?)` | theme/score.ts | Score → rank label per theme |
| `setStatusBar(mode)` | native/capacitor.ts | iOS status bar style |
| `prefs.get/set/remove` | native/capacitor.ts | Capacitor Preferences (per-device persistence) |
| `getLocation()` | native/capacitor.ts | One-shot GPS via Capacitor Geolocation |
| `isNative` | native/capacitor.ts | True on iOS/Android |
| `seedSampleHabitsIfEmpty(userId)` | lib/auth.ts | Idempotent dev seed |
| `seedSampleEventsIfEmpty(userId)` | lib/auth.ts | Idempotent dev seed |
| `seedSampleDiaryIfEmpty(userId)` | lib/auth.ts | Idempotent dev seed |
| `seedSampleScoreIfEmpty(userId)` | lib/auth.ts | Idempotent dev seed |
| `seedSampleSleepIfEmpty(userId)` | lib/auth.ts | Idempotent dev seed |
| `seedSampleFamilyOpsIfEmpty(userId)` | lib/auth.ts | Idempotent dev seed |

---

## 4. LLM layer

| Symbol | File | Purpose |
|---|---|---|
| `LLMProvider` (interface) | lib/llm/types.ts | Interchangeable provider contract |
| `LLMRequest` / `LLMResponse` / `LLMTool` / `LLMToolCall` / `LLMComplexity` | lib/llm/types.ts | Shared shapes |
| `MockLLMProvider` | lib/llm/mock.ts | Regex-matched canned replies for dev/offline |
| `AnthropicProvider` | lib/llm/anthropic.ts | Claude Haiku/Sonnet/Opus via Edge Function proxy or direct |
| `LLMRouter` | lib/llm/router.ts | Classifier + provider picker |
| `llm` (singleton) | lib/llm/router.ts | App-wide router instance |

---

## 5. Components

### Primitives ([`components/primitives.tsx`](web/src/components/primitives.tsx))
Ring · XPBar · Avatar · Chip · VoiceOrb · Waveform · HUDCorner · Toast · GradientDefs · Placeholder · IOSDevice · AndroidDevice

### Shell ([`components/shell.tsx`](web/src/components/shell.tsx))
TabBar · VoiceOverlay · OfflineBanner · EmptyState · SkeletonScreen

### Icons ([`components/icons.tsx`](web/src/components/icons.tsx))
~60 icons exported as `I.<name>`. Examples: water, book, dumbbell, brain, flame, moon, mic, chevR, chevL, location, sparkle, sparkles, target, heart, calendar, clock, settings, more, etc. Full list: read the file.

### Sheets ([`components/sheets/`](web/src/components/sheets/))
- `MedsSheets.tsx` — AddMedSheet · AiMedChatSheet · MedDetailSheet
- `DiarySheets.tsx` — DiaryComposeSheet · DiaryEntrySheet
- `CircleSheets.tsx` — CircleSheet · MemberDetailSheet · PrivacySheet · ViewLogSheet

---

## 6. Screens (25 total)

Wired to live Supabase data ✅ : Habits · Brief · Diary · Score · Sleep · FamilyOps
Hardcoded mock data: Home · Chat · Circle · Meds · Focus · Money · Vault · Errands · Couple · Kids · Onboard · Settings · Profile · More · Quests · Widgets · Stats · Fitness · ComingSoon

Each screen: `<Name>Screen.tsx` (component) + `<Name>Screen.manifest.ts` (registry declaration).

---

## 7. Supabase tables

| Table | Migration | Purpose |
|---|---|---|
| `profiles` | 01_init_habits | Per-user profile (name, level, XP, stats) |
| `habits` | 01_init_habits | Habit tracking |
| `scheduled_intents` | 02_intents_and_memory | "In 2 weeks remind me X" callback queue |
| `user_memories` | 02_intents_and_memory | Long-term memory the AI references |
| `events` | 03_events_and_integrations | Generic feed any integration writes to |
| `integrations` | 03_events_and_integrations | Per-user OAuth + status per service |
| `diary_entries` | 04_diary | Diary entries |
| `user_scores` | 05_score | Current score snapshot |
| `score_events` | 05_score | Append-only ledger |
| `score_backlog` | 05_score | Unresolved missed tasks |
| `sleep_nights` | 06_sleep | One row per night |
| `family_tasks` | 07_family_ops | Shared family chores |
| `family_alarms` | 07_family_ops | Cluster alarms (school morning, bedtime) |

**Total: 13 tables, all RLS-protected.**

### Database functions

- `habit_bump(habit_id, amount)` — atomic increment + streak update
- `intents_tick()` — atomic mark-and-return for due intents
- `handle_new_user()` — auto-create profile on auth.users insert
- `touch_updated_at()` — trigger function

### Edge Functions

| Function | Path | Purpose |
|---|---|---|
| `intents-tick` | supabase/functions/intents-tick/ | Cron worker — fires due intents, dispatches by kind |

---

## 8. MCP server

[`packages/mcp-nik/`](packages/mcp-nik/) — TS server that auto-registers every entry in `web/src/contracts/` as an MCP tool. Curated, not OpenAPI-converted.

- `src/server.ts` — main server (stdio transport for now; HTTP coming)
- `src/zodToJsonSchema.ts` — tiny inline Zod → JSON Schema converter (no extra deps)

---

## 9. Skill (distributable)

[`skills/nik-integrate/`](skills/nik-integrate/) — Claude Skill that ports this entire pattern (registry + CommandBus + LLM router + manifests + MCP) into another app. 18 template files copied verbatim from this repo.

---

## How to keep this honest

When you add a contract op / hook / helper / primitive / table / Edge Function:
1. Add it to its file
2. Add it to this `INVENTORY.md`
3. CI's `wiring-check` job catches drift between manifests and JSX, but **doesn't** catch unlisted helpers — that's on you (or the planned `inventory-check.mjs`).

Long-term: a `scripts/inventory-check.mjs` could AST-walk `web/src/{contracts,lib,components,screens}/**` and diff against this file, flagging additions/removals. Add it when this file goes stale once.
