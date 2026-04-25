# 006 — On-device SLM deferred to v2 (Apple Foundation Models on iOS now)

**Date:** 2026-04-25
**Status:** accepted

## Context

User asked whether to ship a small on-device LLM (their suggestion: Gemma 3n E2B, ~1.5 GB int4) bundled with the app from day one. Architecture is already SLM-ready — the `LLMProvider` interface + router slot in any new provider as one new file. The question was about **now vs later**.

A research agent benchmarked the 2026 landscape across model + runtime + bundling axes (full report: agent task `ab0d0a4271595a256`).

## Decision

**Defer the cross-platform Gemma 3n + llama.cpp work to v2.** Add an iOS-only **Apple Foundation Models** provider in the meantime — it's free, ~100 LOC of native, zero app-size cost (the model lives in iOS 26+).

**Triggers to revisit:**
- Anthropic spend > $300 / month
- 1,000+ daily active users
- India-region p95 cloud latency > 1.5s

When we do build it: **Gemma 3n E2B** (int4, GGUF, Q4_K_M) running under **llama.cpp** via a forked `@cantoo/capacitor-llama` plugin, gated behind an opt-in `Settings → Download on-device brain` flow.

## Why defer

- **One week of native plugin work** (Swift + Kotlin around llama.cpp) is real engineering and 1.5 GB is real download friction for India users on cellular.
- **Sonnet 4.6 marginal cost is small** at our current usage (zero real users yet).
- **Apple Foundation Models** gives us 80% of the on-device benefit on iPhones with iOS 26+ at near-zero cost. Android can stay cloud-only until v2.
- The architecture is ready — adding the provider later is mechanical (one file).

## Why these specific picks (when v2 happens)

**Model: Gemma 3n E2B**
- MatFormer arch → 2B effective footprint despite 6B params, fits 6 GB iPhones.
- 20–30 tok/s on iPhone 15 Pro under llama.cpp Metal.
- Multilingual including Indian English / Hinglish (target user is Indian).
- First-class tool-call template (Phi-3.5 famously lacks one; SmolLM2 BFCL is 27%).
- Commercial-friendly Gemma license.

**Runtime: llama.cpp via Capacitor plugin**
- Production Capacitor wrappers exist (`@cantoo/capacitor-llama`, `arusatech/llama-cpp`).
- GGUF format has first-class Gemma 3n support since mid-2025.
- Cross-platform (iOS Metal + Android Vulkan/JNI). MLC is faster on Apple but no maintained Capacitor plugin. MLX is iOS-only.
- Throughput is *good enough* (sub-2.5s for trivial tier) — we don't need MLC's GPU saturation.

**Bundling: First-run download, opt-in**
- App Store cellular cap is 200 MB; bundling 1.5 GB triggers warnings.
- Apple Intelligence itself is downloaded, not bundled per-app.
- Every comparable app (PrivateLLM, Pi.ai, ChatGPT) either ships cloud-only or downloads on first use.
- Default to Wi-Fi-only with cellular override.

## Quality bar (be honest)

For Nik's narrow registry (~20 tools, simple schemas) Gemma 3n at 2B effective hits ~85% trivial-tier success **with** strict schema validation + router fallback. Without those guards, don't ship — multi-tool chains and natural-language time parsing are weak spots.

## Implementation plan (when triggered)

7 days of focused work. See research agent's output for the file-by-file breakdown:
1. Capacitor plugin `nik-llm-slm` (TS + Swift + Kotlin, ~2 days)
2. First-run download UX in Settings (~1 day)
3. `web/src/lib/llm/on-device.ts` implementing `LLMProvider` (~0.5 day)
4. Router prepend (5 lines)
5. Telemetry + eval harness on 100 real Nik prompts (~1 day)
6. Sonnet fallback on parse failure (~0.5 day)
7. iOS bonus — Apple Foundation Models provider (~1 day, ships now)

## Consequences

- **Today:** zero work needed, architecture is ready.
- **Settings UI** (when built) gets a new "On-device brain" section with download status + toggle.
- **Telemetry** must be wired before SLM ships so we can compare on-device vs cloud success rates per tool.
- **Eval harness** (the 100-prompt test) becomes a CI artifact — every model upgrade replays it.

## Sources

The full research report is in agent transcript `ab0d0a4271595a256.output`. Key URLs:
- [Google Developers — Gemma 3n](https://developers.googleblog.com/en/introducing-gemma-3n-developer-guide/)
- [HF — gemma-3n-E2B-it](https://huggingface.co/google/gemma-3n-E2B-it)
- [arXiv 2511.05502 — MLX/MLC/llama.cpp comparative study](https://arxiv.org/pdf/2511.05502)
- [npm — @cantoo/capacitor-llama](https://www.npmjs.com/package/@cantoo/capacitor-llama)
- [Apple Newsroom — Foundation Models framework](https://www.apple.com/newsroom/2025/09/apples-foundation-models-framework-unlocks-new-intelligent-app-experiences/)
- [On-Device LLMs State of the Union 2026](https://v-chandra.github.io/on-device-llms/)

## Related

- [[Decisions/005 — Pluggable LLM via router]] — the abstraction this slots into
- [[Architectural Pillars]] (pillar 3 — Pluggable LLM, pillar 9 — LLM is a router)
- [[Backlog]] — adds to "When triggers fire" section
