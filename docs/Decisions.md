# Decisions

Architectural decisions, in chronological order. Each lives in its own file in [[Decisions]] for granular linking.

## Index

- [[Decisions/001 — Capacitor over React Native]] — why we ditched the RN port
- [[Decisions/002 — Vite over Babel-in-browser]] — why we re-engineered after the visual proof
- [[Decisions/003 — State machine instead of router]] — single useState, no React Router (yet)
- [[Decisions/004 — Theme system]] — CSS custom properties, oklch, 5 universes
- [[Decisions/005 — Pluggable LLM via router]] — `LLMProvider` interface + router for on-device SLM + cloud LLMs
- [[Decisions/006 — On-device SLM deferred to v2]] — picked Gemma 3n + llama.cpp for v2; Apple Foundation Models on iOS in the meantime

## How to add one

If you make a non-obvious technical choice, drop a file in `docs/Decisions/00N — Title.md` with this shape:

```md
# 00N — Title

**Date:** YYYY-MM-DD
**Status:** accepted | superseded | proposed

## Context
What problem prompted the decision.

## Options considered
1. Option A — pros, cons
2. Option B — pros, cons
3. Option C — pros, cons

## Decision
What we picked.

## Consequences
What changes downstream because of this. Things to watch out for.
```

Then add a link from this index file. Don't edit older decisions — supersede them with a new file.
