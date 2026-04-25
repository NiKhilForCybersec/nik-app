# Themes

The theme system isn't just colors — each theme is a full **design system**: palette, type stack, vocabulary, motion curve, motif overlays.

## The 5 universes

| ID | Name | Mode | Vibe | Vocab | Fonts |
|---|---|---|---|---|---|
| `solo-leveling` | Solo Leveling | dark | Anime HUD, electric blue, youth default | Hunter / Quest / Rank E–S | Space Grotesk + Inter |
| `ghibli` | Studio Ghibli | light | Soft paper, watercolor, adult default | Wanderer / Errand / gentle–urgent | Fraunces + Lora |
| `dragon-ball` | Dragon Ball | dark | Scouter HUD, power levels, orange/blue | Saiyan / Battle / 1k–MAX PL | Bungee + Rubik |
| `dune` | Dune | dark | Arrakis ochre, House Atreides, noble | Noble / Directive / V–I | Cinzel + Cormorant Garamond |
| `avengers` | Avengers | dark | Stark HUD, holo amber, JARVIS | Agent / Mission / Clearance 5–1 | Orbitron + Rajdhani |

The default is `ghibli`. Set in `web/src/App.tsx` → `DEFAULTS.theme`.

## Anatomy of a theme

```ts
type Theme = {
  id: string;
  name: string;
  subtitle: string;
  tag: string;
  mode: 'dark' | 'light';
  hue: number;                     // base accent hue (0-360, oklch H channel)
  fonts: { display, body, mono, displayWeight, displayCase, displayTracking };
  palette: { bg, bg2, surface, fg, fg2, fg3, hairline, hairlineStrong, accent, accent2, ok, warn, danger };
  vocab: { userTitle, hudLabel, levelWord, xpWord, quest, quests, habit, habits, streak, greet, emergent, rankPrefix, voiceWake, priority };
  iconStyle: 'line' | 'chunk' | 'ornate';
  motif: 'scanlines' | 'watercolor' | 'hexgrid' | 'sand' | 'circuit';
  motion: { breathe: number; curve: string };  // CSS animation timing
  bg: string;  // optional radial-gradient backdrop
};
```

## How a theme gets applied

`applyTheme(themeId: string)` (in `web/src/theme/themes.ts`):
1. Looks up the theme by id (falls back to `solo-leveling`).
2. Writes 20+ CSS custom properties to `document.documentElement.style`:
   - `--hue`, `--fg`, `--fg-2`, `--fg-3`, `--accent`, `--accent-2`, `--ok`, `--warn`, `--danger`
   - `--theme-bg`, `--theme-bg2`, `--theme-surface`, `--theme-gradient`, `--hairline`, `--hairline-strong`
   - `--font-display`, `--font-body`, `--font-mono`, `--display-weight`, `--display-case`, `--display-tracking`
   - `--breathe-duration`
   - Mode-adaptive: `--sheet-bg`, `--sheet-fg`, `--input-bg`, `--scrim`, `--grabber`
3. Sets `data-theme`, `data-motif`, `data-mode` attributes on `:root` so `styles.css` can target them with `[data-theme="ghibli"] .glass { ... }` style overrides.

Vocab is read separately by screens via `getThemeVocab(themeId)` — that's why the same Habit list might show as "Rituals" in solo-leveling and "Practices" in ghibli.

## The cascade

CSS in `web/src/styles.css` references the vars:
```css
.glass {
  background: var(--surface);
  border: 1px solid var(--hairline);
  backdrop-filter: blur(20px);
}
.display { font-family: var(--font-display); font-weight: var(--display-weight); }
.mono    { font-family: var(--font-mono); }
.xp-fill {
  background: linear-gradient(90deg, oklch(0.78 0.16 var(--hue)), oklch(0.60 0.22 calc(var(--hue) + 60)));
}
```

When the theme switches, the vars change → all `.glass` / `.display` / `oklch(... var(--hue))` colors update simultaneously without re-rendering React.

## Adding a new theme

1. Open `web/src/theme/themes.ts`.
2. Add a new key to `THEMES`. Match the `Theme` type — every field is required.
3. Use [oklch.com](https://oklch.com) to design a palette in OkLCh (perceptually uniform).
4. Pick fonts. Add the Google Fonts URL to `<link href="...">` in `web/index.html`.
5. The new theme appears automatically in `SettingsScreen`'s theme picker (which iterates `Object.values(THEMES)`).

## Why oklch?

- Perceptually uniform — equal numerical changes feel like equal visual changes.
- Consistent saturation across hues (no mud-brown problem).
- Native CSS support in all modern browsers and WebKit (iOS 15.4+, Android Chrome 111+).
- Lets us derive accent variants by hue rotation: `oklch(0.78 0.16 calc(var(--hue) + 60))`.

## Related

- [[Architecture]]
- [[Build & Run]]
- [[Decisions/004 — Theme system]]
