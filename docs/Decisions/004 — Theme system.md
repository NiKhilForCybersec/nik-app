# 004 — Theme system

**Date:** 2026-04-25
**Status:** accepted

## Context

The design ships 5 theme universes (Solo Leveling, Studio Ghibli, Dragon Ball, Dune, Avengers). Each is more than a color swap — different fonts, vocabulary ("Hunter" vs "Wanderer"), motion curves, motif overlays.

Themes need to switch instantly without jank, work in both light + dark modes, and not require re-rendering the whole tree.

## Options considered

1. **CSS custom properties + `data-theme` attribute** — write theme tokens to `:root`, let CSS cascade.
2. **React Context + inline style props** — pass theme through context, every component reads `theme.palette.fg`.
3. **CSS-in-JS (styled-components / emotion)** — runtime theming via `<ThemeProvider>`.
4. **Tailwind dark-mode pattern + plugin** — utility classes with theme variants.

## Decision

**CSS custom properties + `data-theme` attribute, set imperatively.**

`applyTheme(themeId)` writes ~25 CSS vars to `document.documentElement.style`:
```ts
r.style.setProperty('--hue', String(t.hue));
r.style.setProperty('--accent', t.palette.accent);
r.style.setProperty('--font-display', t.fonts.display);
// ...
r.setAttribute('data-theme', themeId);
r.setAttribute('data-mode', t.mode);
```

Components reference vars in inline styles or via the global stylesheet:
```css
.glass { background: var(--surface); border: 1px solid var(--hairline); }
```
```tsx
<div style={{ color: 'oklch(0.78 0.16 var(--hue))' }} />
```

## Why not Context?

- Context propagation triggers a re-render of every consumer when theme changes. CSS vars change without any React work.
- The prototype already used CSS vars; porting to Context would mean rewriting every screen.
- Inline `style={{ color: theme.palette.fg }}` is verbose and breaks the prototype's pattern.

## Why not Tailwind?

- The design uses oklch with `var(--hue)` arithmetic: `oklch(0.78 0.16 calc(var(--hue) + 60))`. Tailwind doesn't support this naturally.
- Adding a new theme would require regenerating Tailwind config.
- Bundle size: Tailwind + Just-In-Time still adds a layer over what's already working.

## Consequences

- **Switching themes is instant** — no React re-render needed. Tested: `applyTheme('avengers')` updates the entire UI in one frame.
- **Theme is global state outside React** — there's no `useTheme()` hook. To read the current theme in JS (for `getThemeVocab`), call `getTheme(state.theme)` from `App.tsx`'s state. Acceptable since theme is set in one place.
- **Adding a theme is a single `THEMES['name'] = { ... }` entry** in `web/src/theme/themes.ts`. Plus the new font in `web/index.html`'s Google Fonts link.
- **CSS-vars in inline styles** require browser support (all modern browsers + WKWebView 12+). No fallback needed for our targets.
- **`data-mode="light"` triggers cascade overrides** in `styles.css` for things that need different treatment in light vs dark (sheet backgrounds, scrim, etc).

## Related

- [[Themes]] — the system explained for users adding themes
- [[Architecture]]
- The prototype's theme defs: [`web/src/theme/themes.ts`](../../web/src/theme/themes.ts)
