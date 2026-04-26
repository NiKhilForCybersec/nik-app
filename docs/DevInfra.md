# Dev infrastructure

The Nik app's live dev console + parallel review agents live in a **separate sibling project**: [`~/nik-dev-infra/`](../../nik-dev-infra/).

Run it alongside `npm run dev` (in a different terminal) to get always-on agents watching this codebase, surfacing drift / hardcoded data / wiring issues in real time at http://localhost:5174.

## Why separate

- Doesn't bloat Nik's bundle / dependencies
- Has its own Claude Code session for extending agents without context-switching
- Findings persist across Nik dev sessions (the daemon keeps running)
- Cost / observability isolated
- Eventually extractable as `npx <name> <project-path>` for any TS project

## Two-session workflow

```
Terminal A:  cd ~/NIK              && claude       # Nik features (this repo)
Terminal B:  cd ~/nik-dev-infra    && claude       # Extend agents
Terminal C:  cd ~/nik-dev-infra    && npm start    # Daemon (:5175) + UI (:5174)
Terminal D:  cd ~/NIK/web          && npm run dev  # Nik app at :5173
```

Browser tabs:
- `:5173` — Nik app
- `:5174` — dev-infra console (always-on)

## Integration surface

Two files in this repo are the only "contract" between Nik and the dev infra:

1. **[`docs/Concerns.md`](Concerns.md)** — append-only log of user concerns. Both sessions write here. The dev-infra `concerns` agent (Phase 2) parses it, classifies open vs resolved, surfaces relevant findings.

2. **[`AGENTS.md`](../AGENTS.md)** (= [CLAUDE.md](../CLAUDE.md)) — auto-loaded by any Claude Code session running with `--add-dir ~/NIK`. Dev-infra agents inherit this when they spawn `claude -p`. Single source of truth for "what is Nik".

That's it. The dev infra READS the Nik codebase; it never WRITES. Nik fixes happen in this session.

## CI scripts that stay here

- [`scripts/check-wiring.mjs`](../scripts/check-wiring.mjs) — manifest drift check; CI runs it on every push, dev-infra `drift` agent also spawns it
- [`scripts/build-inventory.mjs`](../scripts/build-inventory.mjs) — regenerates `docs/Inventory.generated.md`; manual / pre-commit
