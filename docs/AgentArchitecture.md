# Nik AI Agent Architecture

The architecture target for the in-app Nik AI assistant — what we have, what's missing, and the plan to upgrade. Tracked against twelve advanced agent patterns. Single source of truth for any work that touches `web/src/lib/llm/*`, `web/src/screens/ChatScreen.tsx`, or the contract registry.

> **Out of scope:** the dev-side Claude Code agent (governed by the top-level [CLAUDE.md](../CLAUDE.md) + the file-based memory system at `~/.claude/projects/.../memory/`). This document is about **the AI assistant the end user talks to inside the app**.

---

## Status snapshot (2026-04-26)

| # | Pattern | Status | Impact if added |
|---|---------|--------|-----------------|
| 1 | Persistent instruction file | ❌ Missing | High |
| 2 | Scoped context assembly | ❌ Missing | High |
| 3 | Tiered memory (hot/warm/cold) | 🟡 Partial | Medium |
| 4 | Dream consolidation | ❌ Missing | Medium |
| 5 | Progressive context compaction | ❌ Missing | Medium-High |
| 6 | Explore → Plan → Act loop | 🟡 Partial | Medium |
| 7 | Context-isolated subagents | ❌ Missing | Low-Medium |
| 8 | Fork-join parallelism | ❌ Missing | Low |
| 9 | Progressive tool expansion | ❌ Missing | Low (today) → High (when tool count grows) |
| 10 | Command risk classification | 🟡 Partial | Medium |
| 11 | Single-purpose tool design | ✅ Good | — |
| 12 | Deterministic lifecycle hooks | 🟡 Partial | Low |

**Focus order:** 1 → 2 → 5 → 3 → 10 → 4 → 6 → 12 → 9 → 7/8 (last). High-impact-with-small-radius first.

---

## 1. Persistent instruction file

**Have:** Inline SYSTEM_PROMPT strings in [ChatScreen.tsx](../web/src/screens/ChatScreen.tsx) (~30 lines) and [WidgetsScreen.tsx](../web/src/screens/WidgetsScreen.tsx) (~15 lines). Hardcoded into the components.

**Missing:** A persistent, hot-swappable instruction document the AI loads automatically. No way to refine agent behaviour without shipping new code.

**Plan:**
- New table `agent_instructions { id, user_id, scope, body, version, active, created_at }`. `scope` ∈ `'global' | 'chat' | 'widgets' | <screen_id>`.
- Contract `instructions.get({ scope })`, `instructions.update({ scope, body })`.
- ChatScreen + WidgetsScreen build their SYSTEM_PROMPT from `instructions.get('global') + '\n\n' + instructions.get(<scope>)` plus a small inline preamble (just "you are Nik" + tool-use directive).
- New screen / sheet: "AI behaviour" in Profile → user can read + tweak instruction text. Default body is the current SYSTEM_PROMPT seeded on signup.
- Future: per-conversation override (one-shot system note).

---

## 2. Scoped context assembly

**Have:** `buildToolCatalog()` in [tools.ts](../web/src/lib/llm/tools.ts) dumps every non-derived op + every UI command (~40-50 tools) into every request.

**Missing:** Selective tool inclusion based on the current screen, intent, or recent activity. No RAG, no embeddings, no tag-based filter.

**Plan (phase 1, cheap):**
- Each op already has `tags: string[]` in `defineOp`. Use them.
- New `buildToolCatalog({ scope?: string[] })` — when `scope` provided, prefer ops whose tags intersect; non-matching ops are demoted but still callable (the model can ask for a wider catalog).
- ChatScreen passes the current screen's `manifest.permissions` as the scope hint. WidgetsScreen passes `['widgets', 'home']`.
- This alone halves typical token usage.

**Plan (phase 2):**
- Embeddings index of memory rows + recent events. Per request, retrieve top-K relevant rows + inject as a "RECENT CONTEXT" preamble.
- pgvector + an OpenAI embeddings call on memory.save or via a daily background job.

---

## 3. Tiered memory

**Have:**
- Hot: chat history (last 100 rows) loaded each render via `useOp(chatOps.history, { limit: 100 })` ([ChatScreen.tsx](../web/src/screens/ChatScreen.tsx)).
- Cold: `user_memories` table + `memory.save / memory.list` ops ([intents.ts](../web/src/contracts/intents.ts)).

**Missing:**
- **Warm tier**: pinned + recently-used memories that auto-inject into every request (today they're never injected; the model has to call `memory.list` manually).
- Eviction / archival policy.
- Embedding-based retrieval to surface relevant cold memories.

**Plan:**
- `memory.list({ limit, scope?: 'pinned' | 'recent' | 'all' })`. New `pinned` boolean on `user_memories`.
- ChatScreen pulls `memory.list({ scope: 'pinned' })` + `memory.list({ scope: 'recent', limit: 10 })` and prepends them as a small "CONTEXT" block in the system prompt (token budget: ≤500 tokens).
- Phase-2 RAG: phase 2 of pattern #2 above feeds this tier too.

---

## 4. Dream consolidation

**Have:** Nothing. `intents-tick` Edge Function exists ([supabase/functions/intents-tick/](../supabase/functions/intents-tick/)) but it only fires scheduled callbacks; it doesn't summarize.

**Missing:** Background process that compresses recent activity into long-term insights.

**Plan:**
- New Edge Function `dream-consolidate`, scheduled nightly via `pg_cron`.
- Per user with activity in last 24h: pull yesterday's chat + score events + new diary entries + completed quests → call LLM with a "summarize the day, extract durable preferences" prompt → write outputs to `user_memories` (kind = 'consolidated').
- The next day's chats see those memories via the warm tier (#3 above).
- Bonus: weekly consolidation pass that compresses 7 days of consolidated memories into a "this week" summary.

---

## 5. Progressive context compaction

**Have:** Tool-use loop caps at 4 hops ([ChatScreen.tsx](../web/src/screens/ChatScreen.tsx)) but `llmHistory` keeps appending — no trimming.

**Missing:** When history exceeds a token threshold, no summarization or sliding window.

**Plan:**
- `compactHistory(messages, targetTokens)` helper in `web/src/lib/llm/`.
- Before each `llm.complete` call, if approximate token count of `llmHistory` > 6000:
  - Take messages older than the most-recent 20 turns.
  - Send them to the LLM with "summarize the user's stated facts, preferences, and unresolved threads in ≤200 tokens" prompt.
  - Replace those turns with a single `{ role: 'system', content: 'EARLIER: <summary>' }` message.
- Persist the summary so subsequent renders don't re-summarize.

---

## 6. Explore → Plan → Act loop

**Have:** Basic "call LLM, execute tools, repeat" cycle. System prompt says "do not just describe what you would do."

**Missing:** Multi-stage reasoning. No explicit "plan" step before tool dispatch.

**Plan (phase 1, no infra change):**
- For complex requests (heuristic: HARD complexity or message length > 200 chars), inject a planning preamble: "Before calling tools, write a 3-line plan in plain text. Then execute it."
- Cheap; lets the model think out loud first.

**Plan (phase 2):**
- Two-stage explicit pipeline: plan call (no tools) → execute call (with tools, plan in prompt).
- Surfaces the plan in the chat UI ("Nik is planning…" → "Nik is doing: …").

---

## 7. Context-isolated subagents

**Have:** Nothing.

**Missing:** Spawn a sub-call with its own context window for a specific sub-task (e.g., "summarize my journal", "audit my privacy settings").

**Plan:**
- `llm.complete` already accepts `messages` — building a fresh-context sub-call is one new helper: `llm.subtask({ instruction, tools? }) → string`.
- Use cases: large-list scans, multi-domain analyses, "research this for me" requests.
- Keep parent context untouched; merge subagent result back via a single tool-result message.
- Defer until we hit a real use case (low priority today).

---

## 8. Fork-join parallelism

**Have:** Sequential `for (const tc of response.toolCalls) { await … }`.

**Missing:** Parallel tool dispatch.

**Plan:** Trivial change — `await Promise.all(toolCalls.map(executeToolCall))`. But: tools that mutate the same row could race. Add a serialization rule for ops with overlapping tags (`['hydration','write']` etc.) → still parallel for unrelated ops.

---

## 9. Progressive tool expansion

**Have:** None — full catalog every request.

**Missing:** Reveal tools on demand.

**Plan (deferred):** Once tool count > 80 or token-cost becomes an issue, introduce a `tools.search({ query })` meta-tool. The first request only includes core nav + read tools; the model calls `tools.search` to pull in domain tools as it needs them. Until then, the scoped-context approach in #2 is enough.

---

## 10. Command risk classification

**Have:** `mutability: 'direct' | 'derived' | 'confirm'` defined in [operations.ts](../web/src/lib/operations.ts). Derived ops are filtered out of the AI catalog. Confirm ops stay in the catalog with system-prompt guidance to confirm.

**Missing:**
- Enforced pre-hook: if AI calls a confirm op without an immediately-preceding user "yes", refuse and require confirmation.
- Audit log of all tool calls with risk class.
- Autonomous loop (when added) MUST hard-skip confirm ops without explicit pre-authorization.

**Plan:**
- `executeToolCall` gains a pre-hook: if `op.mutability === 'confirm'`, check the last 2 user turns for an explicit confirmation marker (regex: `/^(yes|confirm|do it|go ahead)/i`). If absent, return a synthetic tool-result asking for confirmation instead of executing.
- Add `audit_events` table: `{ user_id, op_name, args, result, risk, occurred_at }`. Insert from a wrapper around `executeToolCall`.

---

## 11. Single-purpose tool design

**Have:** ✅ 18 contract files, each focused. `habits.bump`, `habits.remove`, `memory.save`, `intents.schedule` — all single-purpose.

**Missing:** Nothing material. `widgets.install` accepts widgetType + position + config but those are configuration, not multi-purpose.

**Plan:** Keep as-is. Audit any new ops against this principle.

---

## 12. Deterministic lifecycle hooks

**Have:** Pre-op auth via Supabase RLS + every handler receives `userId` from `useAuth`.

**Missing:**
- Post-hook audit log (see #10).
- Standard error envelope (some handlers throw, some return `{ ok: false }`).
- Pre-hook for confirm-op enforcement.

**Plan:**
- `defineOp` gains optional `pre?: (ctx, input) => void | Promise<void>` and `post?: (ctx, input, output) => void | Promise<void>` fields. The op runner calls them before/after the handler. Audit logging is a global post-hook applied to all mutations.

---

## Cross-cutting decisions

- **Where the AI's instructions live:** in `agent_instructions` (#1). Components import from a single helper `getAgentPrompt({ scope })`.
- **Where memories live:** `user_memories` (existing). Warm tier (#3) decides what surfaces.
- **Where lifecycle policy lives:** `defineOp` opts (#12) + the op runner. No leaks into individual handlers.
- **Token budget per request (target):**
  - Static system prompt: ≤300 tokens
  - Persistent instructions: ≤500 tokens
  - Memory context (warm tier): ≤500 tokens
  - Tool catalog: ≤2000 tokens
  - Chat history: ≤6000 tokens
  - User turn: variable
  - Total: usually ≤10k input tokens before the model reasons.

---

## Roadmap

1. **#1 + #10** (instructions file + confirm-op enforcement) — small, high impact. ~3-4 hours.
2. **#2 phase 1 + #3 warm tier** (tag-scoped tools + pinned memory injection) — ~3 hours.
3. **#5 + #12** (compaction + lifecycle hooks) — ~4 hours.
4. **#4** (dream consolidation Edge Function + cron) — ~3 hours.
5. **#6** (planning preamble) — ~1 hour.
6. **#9 / #7 / #8** — defer until needed.

Total to "advanced agent" status: ~15 hours of focused work.

---

## When this file changes

Update [docs/Policy.md](Policy.md) → "Architectural pillars" if the change is load-bearing (e.g. a new pillar like "Persistent instructions are the contract for AI behaviour"). Update the matching memory file at `~/.claude/.../memory/project_agent_architecture_plan.md` so future Claude Code sessions can pick up the plan without re-deriving it.
