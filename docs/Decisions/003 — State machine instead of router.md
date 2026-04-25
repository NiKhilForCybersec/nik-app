# 003 — State machine instead of router

**Date:** 2026-04-25
**Status:** accepted (provisional)

## Context

Once we had a real React app ([[Decisions/002 — Vite over Babel-in-browser]]), the question of routing came up. The prototype used a single `useState({screen: 'home'})` and a `switch` statement to render the active screen. No URLs, no history.

For a webview-wrapped mobile app, do we need a real router?

## Options considered

1. **Keep the prototype's state machine** — `useState<ScreenId>` + `switch`. Simple, no deps.
2. **React Router 7** — file-based or declarative routes, deep linking, browser history.
3. **TanStack Router** — type-safe routes, but smaller community.

## Decision

**Keep the state machine for now.** Already installed `react-router-dom` 7 in `web/package.json` so it's a one-import switch when needed.

Rationale:
- Webview SPAs don't get URLs from the user (the user taps tabs and screens, not address bars).
- Browser back-button in a WebView is rarely the right gesture; iOS uses swipes, Android uses the system back.
- Deep linking (`nik://family/meera`) doesn't matter until we have notifications or share-sheet links — which we don't.
- A `switch` over 20 cases is 30 lines of code. A router setup is 150+ lines and adds cognitive overhead for a non-technical maintainer reading it.

## Consequences

- **No deep linking** until we wire it up. Add via `<NavigationContainer>` or `BrowserRouter` later if needed — won't be a big migration.
- **No URL state**, so refreshing the WebView (rare) loses screen context. Acceptable.
- **`history.back()` doesn't navigate** — that's fine; the only "back" affordance in the design is a `<` chevron in screen headers.
- **Easy to unwind**: when we add the router, screens become `<Route path="/foo" element={<FooScreen/>}/>`. Each `onNav('foo')` becomes `navigate('/foo')`. Mechanical.

## When to revisit

- When push notifications need to deep-link to specific screens.
- When sharing (e.g. "Send this diary entry to Meera") needs URLs.
- When browser-side dev makes URL state useful for testing.

## Related

- [[Architecture]]
- [[Decisions]]
