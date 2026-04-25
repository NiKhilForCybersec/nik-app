# 005 — Pluggable LLM via router

**Date:** 2026-04-25
**Status:** accepted

## Context

User explicitly asked: "I am planning a SLM the best slm that can run along with the app, for all the basic tasks and then router the calls based on complexity to 5.5 or opus 4.7 or sonnet anything, best option, best output always available."

Implies:
- The app must NOT hard-code a single LLM
- Different tiers of complexity need different models (cost, latency, privacy)
- An on-device SLM (Phi-3 / Gemma 3 / Llama 3.2 / Qwen 2.5 — TBD) should handle the bulk
- Cloud LLMs (Claude / GPT / Gemini) handle harder reasoning
- The user must be able to swap which LLM powers their Nik

Without this, every feature couples to one provider; switching means rewriting the call sites.

## Options considered

1. **Vercel AI SDK** — multi-provider but adds another abstraction we don't fully control.
2. **OpenRouter** — single API across many models, but server hop + their pricing.
3. **Direct provider SDKs** with manual switching — no shared interface, drift everywhere.
4. **Custom `LLMProvider` interface + `LLMRouter`** — minimal, owned, MCP-shaped, slots in the on-device SLM with one new file.

## Decision

**Custom `LLMProvider` interface + `LLMRouter`.** Files at `web/src/lib/llm/`:

- `types.ts` — `LLMProvider` interface, `LLMRequest`/`LLMResponse`/`LLMComplexity` shapes. Tool-call shape mirrors MCP so providers + the registry stay in lockstep.
- `mock.ts` — `MockLLMProvider` for dev/offline/no-key. Pattern-matches on the last user message, returns canned replies + (optional) tool calls.
- `anthropic.ts` — `AnthropicProvider` calling Claude Haiku/Sonnet/Opus through a Supabase Edge Function proxy (default) or directly with `VITE_ANTHROPIC_API_KEY` (dev only).
- `router.ts` — `LLMRouter.complete()` classifies complexity (regex hints + token count), picks the first available provider that handles that tier.
- `index.ts` — barrel + `llm` singleton.

App code never names a model. It calls `llm.complete({ messages, tools })` and the router decides.

## How the future SLM drops in

```ts
// future: web/src/lib/llm/slm-onDevice.ts
class OnDeviceSLM implements LLMProvider {
  id = 'slm-phi3';
  name = 'Phi-3-mini (on-device)';
  runsAt = 'on-device' as const;
  handles = ['trivial'] as const;
  isAvailable() { return localStorage.getItem('slm-loaded') === '1'; }
  async complete(req) { /* call llama.cpp / ONNX / MLX bridge */ }
}

// router.ts
new LLMRouter([
  new OnDeviceSLM(),         // ← prepend so it's tried first for trivial
  new AnthropicProvider(),
  new MockLLMProvider(),
]);
```

No other code changes. Every screen using `useCommand` / chat / AI affordance starts using the SLM for trivial requests automatically.

## Consequences

- **Provider swap = config**, not code. The user-facing model picker (Settings) writes to a Preference, the router reads it and re-orders.
- **Telemetry**: every response carries `provider` + `model` + `latencyMs` + token usage so we can see what the router actually picks.
- **Privacy escalation rule** (deferred): a user could mark certain prompts as on-device-only — the router refuses to escalate them to cloud.
- **Tool calls flow uniformly.** When the model returns `toolCalls`, ChatScreen dispatches every `ui.*` call through `useCommand` (already shipped). Backend ops will go through the MCP server when wired.
- **Mock fallback** means the app is always usable in dev — even with no API key, no internet, just regex pattern matches.

## Validation

- Verified end-to-end in browser preview: typed "switch to ghibli theme" in Chat → MockLLMProvider matched → returned `ui.switchTheme` tool call → CommandBus dispatched → theme flipped live to Studio Ghibli.
- Type-check + wiring-check + build green on commit `<TBD>`.

## Related

- [[Architectural Pillars]] (pillar 3 — Pluggable LLM)
- [[Registry]] — the MCP tool catalog the router exposes
- [[Decisions/001 — Capacitor over React Native]]
