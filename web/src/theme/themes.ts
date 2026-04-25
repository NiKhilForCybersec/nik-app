/* Nik — THEME UNIVERSES
   Each theme is a full design system, not a color swap. Includes:
   - palette (bg, surface, fg, accent, hue) for light/dark
   - type stack (display, body, mono) + casing rules
   - vocabulary (what "quest" / "level" / "user" are called)
   - iconStyle ('line' | 'chunk' | 'ornate' | 'glyph')
   - motif (decorative SVG patterns, overlay effects)
   - motion (breathe speed, transition curve)
*/

export type Vocab = {
  userTitle: string;
  hudLabel: string;
  levelWord: string;
  xpWord: string;
  quest: string;
  quests: string;
  habit: string;
  habits: string;
  streak: string;
  greet: string;
  emergent: string;
  rankPrefix: string;
  voiceWake: string;
  priority: readonly string[];
};

export type Theme = {
  id: string;
  name: string;
  subtitle: string;
  tag: string;
  mode: 'dark' | 'light';
  hue: number;
  fonts: {
    display: string;
    body: string;
    mono: string;
    displayWeight: number;
    displayCase: string;
    displayTracking: string;
  };
  palette: {
    bg: string;
    bg2: string;
    surface: string;
    fg: string;
    fg2: string;
    fg3: string;
    hairline: string;
    hairlineStrong: string;
    accent: string;
    accent2: string;
    ok: string;
    warn: string;
    danger: string;
  };
  vocab: Vocab;
  iconStyle: string;
  motif: string;
  motion: { breathe: number; curve: string };
  bg: string;
};

export const THEMES: Record<string, Theme> = {
  'solo-leveling': {
    id: 'solo-leveling',
    name: 'Solo Leveling',
    subtitle: 'Anime HUD · electric blue · youth default',
    tag: 'Youth · HUD',
    mode: 'dark',
    hue: 220,
    fonts: {
      display: '"Space Grotesk", system-ui, sans-serif',
      body: '"Inter", system-ui, sans-serif',
      mono: '"JetBrains Mono", ui-monospace, monospace',
      displayWeight: 600,
      displayCase: 'normal',
      displayTracking: '-0.3px',
    },
    palette: {
      bg: 'oklch(0.08 0.02 260)',
      bg2: 'oklch(0.12 0.025 260)',
      surface: 'oklch(1 0 0 / 0.05)',
      fg: 'oklch(0.98 0.005 260)',
      fg2: 'oklch(0.75 0.01 260)',
      fg3: 'oklch(0.55 0.01 260)',
      hairline: 'oklch(1 0 0 / 0.08)',
      hairlineStrong: 'oklch(1 0 0 / 0.15)',
      accent: 'oklch(0.78 0.16 220)',
      accent2: 'oklch(0.55 0.22 280)',
      ok: 'oklch(0.78 0.15 150)',
      warn: 'oklch(0.82 0.17 40)',
      danger: 'oklch(0.70 0.24 25)',
    },
    vocab: {
      userTitle: 'Rank B Hunter',
      hudLabel: 'HUNTER',
      levelWord: 'LVL',
      xpWord: 'XP',
      quest: 'Quest',
      quests: 'Quests',
      habit: 'Ritual',
      habits: 'Rituals',
      streak: 'Streak',
      greet: 'Good morning,',
      emergent: 'EMERGENT · GPS',
      rankPrefix: 'RANK',
      voiceWake: 'Hey Nik',
      priority: ['E', 'D', 'C', 'B', 'A', 'S'],
    },
    iconStyle: 'line',
    motif: 'scanlines',
    motion: { breathe: 3, curve: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    bg: 'radial-gradient(ellipse 100% 50% at 50% 0%, oklch(0.3 0.2 220 / 0.4), transparent 70%)',
  },

  'ghibli': {
    id: 'ghibli',
    name: 'Studio Ghibli',
    subtitle: 'Soft paper · watercolor · adult default',
    tag: 'Adult · Calm',
    mode: 'light',
    hue: 150,
    fonts: {
      display: '"Fraunces", "Playfair Display", Georgia, serif',
      body: '"Lora", "Source Serif Pro", Georgia, serif',
      mono: '"IBM Plex Mono", ui-monospace, monospace',
      displayWeight: 500,
      displayCase: 'normal',
      displayTracking: '-0.2px',
    },
    palette: {
      bg: 'oklch(0.96 0.02 90)', // cream paper
      bg2: 'oklch(0.92 0.03 100)',
      surface: 'oklch(1 0 0 / 0.78)',
      fg: 'oklch(0.20 0.04 40)', // deep warm umber
      fg2: 'oklch(0.34 0.04 40)',
      fg3: 'oklch(0.46 0.03 50)',
      hairline: 'oklch(0.30 0.04 40 / 0.18)',
      hairlineStrong: 'oklch(0.30 0.04 40 / 0.36)',
      accent: 'oklch(0.50 0.13 145)', // moss green, deeper
      accent2: 'oklch(0.58 0.15 45)', // warm amber, deeper
      ok: 'oklch(0.55 0.14 140)',
      warn: 'oklch(0.62 0.15 60)',
      danger: 'oklch(0.52 0.20 25)',
    },
    vocab: {
      userTitle: 'Wanderer',
      hudLabel: 'TODAY',
      levelWord: 'Season',
      xpWord: 'Moments',
      quest: 'Errand',
      quests: 'Errands',
      habit: 'Practice',
      habits: 'Practices',
      streak: 'Days tending',
      greet: 'Good morning,',
      emergent: 'A NEARBY ERRAND',
      rankPrefix: 'CARE',
      voiceWake: 'Hello Nik',
      priority: ['gentle', 'mild', 'steady', 'needed', 'urgent'],
    },
    iconStyle: 'line',
    motif: 'watercolor',
    motion: { breathe: 5, curve: 'cubic-bezier(0.25, 0.1, 0.25, 1)' },
    bg: 'radial-gradient(ellipse 120% 70% at 30% 10%, oklch(0.95 0.06 90 / 0.6), transparent 60%), radial-gradient(ellipse 80% 50% at 80% 90%, oklch(0.90 0.08 145 / 0.3), transparent 60%)',
  },

  'dragon-ball': {
    id: 'dragon-ball',
    name: 'Dragon Ball',
    subtitle: 'Scouter HUD · power levels · orange/blue',
    tag: 'Anime · HUD',
    mode: 'dark',
    hue: 30,
    fonts: {
      display: '"Bungee", "Oswald", Impact, sans-serif',
      body: '"Rubik", system-ui, sans-serif',
      mono: '"JetBrains Mono", ui-monospace, monospace',
      displayWeight: 700,
      displayCase: 'uppercase',
      displayTracking: '0.5px',
    },
    palette: {
      bg: 'oklch(0.10 0.03 30)', // deep rust
      bg2: 'oklch(0.14 0.04 30)',
      surface: 'oklch(0.85 0.18 60 / 0.08)',
      fg: 'oklch(0.98 0.03 80)',
      fg2: 'oklch(0.85 0.10 60)',
      fg3: 'oklch(0.65 0.08 40)',
      hairline: 'oklch(0.85 0.18 60 / 0.15)',
      hairlineStrong: 'oklch(0.85 0.18 60 / 0.35)',
      accent: 'oklch(0.78 0.20 50)', // saiyan orange
      accent2: 'oklch(0.70 0.18 230)', // scouter blue
      ok: 'oklch(0.78 0.18 150)',
      warn: 'oklch(0.85 0.18 70)',
      danger: 'oklch(0.70 0.24 25)',
    },
    vocab: {
      userTitle: 'Saiyan Warrior',
      hudLabel: 'SCOUTER',
      levelWord: 'POWER',
      xpWord: 'PL',
      quest: 'Battle',
      quests: 'Battles',
      habit: 'Training',
      habits: 'Training',
      streak: 'Ki chain',
      greet: 'Ready up,',
      emergent: 'POWER DETECTED · GPS',
      rankPrefix: 'THREAT',
      voiceWake: 'Scouter, ',
      priority: ['1k', '5k', '9k', '9000+', 'MAX'],
    },
    iconStyle: 'chunk',
    motif: 'hexgrid',
    motion: { breathe: 1.5, curve: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)' },
    bg: 'radial-gradient(ellipse 100% 60% at 50% 0%, oklch(0.55 0.25 50 / 0.35), transparent 70%), radial-gradient(ellipse 80% 40% at 80% 100%, oklch(0.45 0.2 230 / 0.2), transparent 70%)',
  },

  'dune': {
    id: 'dune',
    name: 'Dune',
    subtitle: 'Arrakis ochre · House Atreides · noble',
    tag: 'Cinematic · Adult',
    mode: 'dark',
    hue: 40,
    fonts: {
      display: '"Cinzel", "Trajan Pro", "Playfair Display", serif',
      body: '"Cormorant Garamond", "EB Garamond", Georgia, serif',
      mono: '"Space Mono", ui-monospace, monospace',
      displayWeight: 500,
      displayCase: 'uppercase',
      displayTracking: '2.5px',
    },
    palette: {
      bg: 'oklch(0.12 0.02 50)', // deep night desert
      bg2: 'oklch(0.17 0.03 55)',
      surface: 'oklch(0.82 0.10 65 / 0.06)',
      fg: 'oklch(0.94 0.05 70)', // sand
      fg2: 'oklch(0.78 0.08 65)',
      fg3: 'oklch(0.60 0.06 60)',
      hairline: 'oklch(0.82 0.10 65 / 0.15)',
      hairlineStrong: 'oklch(0.82 0.10 65 / 0.3)',
      accent: 'oklch(0.75 0.14 65)', // dune amber
      accent2: 'oklch(0.50 0.12 20)', // spice rust
      ok: 'oklch(0.70 0.12 150)',
      warn: 'oklch(0.78 0.16 50)',
      danger: 'oklch(0.60 0.20 15)',
    },
    vocab: {
      userTitle: 'Noble of House',
      hudLabel: 'DOSSIER',
      levelWord: 'RANK',
      xpWord: 'Standing',
      quest: 'Directive',
      quests: 'Directives',
      habit: 'Discipline',
      habits: 'Disciplines',
      streak: 'Unbroken',
      greet: 'Greetings,',
      emergent: 'PROXIMITY · WAYFIND',
      rankPrefix: 'PRIORITY',
      voiceWake: 'Attend,',
      priority: ['V', 'IV', 'III', 'II', 'I'],
    },
    iconStyle: 'ornate',
    motif: 'sand',
    motion: { breathe: 4, curve: 'cubic-bezier(0.19, 1, 0.22, 1)' },
    bg: 'radial-gradient(ellipse 140% 60% at 50% 100%, oklch(0.35 0.12 50 / 0.5), transparent 60%), radial-gradient(ellipse 100% 50% at 50% 0%, oklch(0.25 0.08 40 / 0.4), transparent 70%)',
  },

  'avengers': {
    id: 'avengers',
    name: 'Avengers',
    subtitle: 'Stark HUD · holo amber · JARVIS',
    tag: 'Tactical · HUD',
    mode: 'dark',
    hue: 25,
    fonts: {
      display: '"Orbitron", "Rajdhani", sans-serif',
      body: '"Rajdhani", "Titillium Web", system-ui, sans-serif',
      mono: '"Share Tech Mono", "JetBrains Mono", monospace',
      displayWeight: 600,
      displayCase: 'uppercase',
      displayTracking: '1.5px',
    },
    palette: {
      bg: 'oklch(0.09 0.015 250)', // deep tech navy
      bg2: 'oklch(0.13 0.02 245)',
      surface: 'oklch(0.85 0.18 55 / 0.06)',
      fg: 'oklch(0.92 0.08 65)',
      fg2: 'oklch(0.78 0.14 60)',
      fg3: 'oklch(0.55 0.10 55)',
      hairline: 'oklch(0.85 0.18 55 / 0.18)',
      hairlineStrong: 'oklch(0.85 0.18 55 / 0.4)',
      accent: 'oklch(0.82 0.18 65)', // holo amber
      accent2: 'oklch(0.65 0.20 25)', // iron red
      ok: 'oklch(0.78 0.16 150)',
      warn: 'oklch(0.85 0.18 70)',
      danger: 'oklch(0.65 0.22 25)',
    },
    vocab: {
      userTitle: 'Agent',
      hudLabel: 'OPERATIVE',
      levelWord: 'CLR',
      xpWord: 'CRED',
      quest: 'Mission',
      quests: 'Missions',
      habit: 'Protocol',
      habits: 'Protocols',
      streak: 'Uptime',
      greet: 'Standing by,',
      emergent: 'INCOMING · GEO-TAG',
      rankPrefix: 'CLEARANCE',
      voiceWake: 'J.A.R.V.I.S.,',
      priority: ['5', '4', '3', '2', '1'],
    },
    iconStyle: 'line',
    motif: 'circuit',
    motion: { breathe: 2, curve: 'cubic-bezier(0.33, 1, 0.68, 1)' },
    bg: 'radial-gradient(ellipse 110% 60% at 50% 0%, oklch(0.4 0.18 55 / 0.25), transparent 70%), radial-gradient(ellipse 80% 50% at 50% 100%, oklch(0.25 0.12 250 / 0.3), transparent 70%)',
  },
};

// ── Apply theme to :root as CSS vars ───────────────
export const applyTheme = (themeId: string): void => {
  const t = THEMES[themeId] || THEMES['solo-leveling'];
  const r = document.documentElement;
  r.style.setProperty('--hue', String(t.hue));
  r.style.setProperty('--theme-bg', t.palette.bg);
  r.style.setProperty('--theme-bg2', t.palette.bg2);
  r.style.setProperty('--theme-surface', t.palette.surface);
  r.style.setProperty('--fg', t.palette.fg);
  r.style.setProperty('--fg-2', t.palette.fg2);
  r.style.setProperty('--fg-3', t.palette.fg3);
  r.style.setProperty('--hairline', t.palette.hairline);
  r.style.setProperty('--hairline-strong', t.palette.hairlineStrong);
  r.style.setProperty('--accent', t.palette.accent);
  r.style.setProperty('--accent-2', t.palette.accent2);
  r.style.setProperty('--ok', t.palette.ok);
  r.style.setProperty('--warn', t.palette.warn);
  r.style.setProperty('--danger', t.palette.danger);
  r.style.setProperty('--font-display', t.fonts.display);
  r.style.setProperty('--font-body', t.fonts.body);
  r.style.setProperty('--font-mono', t.fonts.mono);
  r.style.setProperty('--display-weight', String(t.fonts.displayWeight));
  r.style.setProperty('--display-case', t.fonts.displayCase);
  r.style.setProperty('--display-tracking', t.fonts.displayTracking);
  r.style.setProperty('--theme-gradient', t.bg);
  r.style.setProperty('--breathe-duration', t.motion.breathe + 's');
  // Mode-adaptive sheet/input vars (used by bottom sheets, notif banners, inputs)
  if (t.mode === 'light') {
    r.style.setProperty('--sheet-bg', 'oklch(0.99 0.01 90 / 0.98)');
    r.style.setProperty('--sheet-fg', t.palette.fg);
    r.style.setProperty('--input-bg', 'oklch(0.30 0.04 40 / 0.06)');
    r.style.setProperty('--scrim', 'oklch(0.30 0.04 40 / 0.45)');
    r.style.setProperty('--grabber', 'oklch(0.30 0.04 40 / 0.25)');
  } else {
    r.style.setProperty('--sheet-bg', 'oklch(0.14 0.02 260 / 0.98)');
    r.style.setProperty('--sheet-fg', '#fff');
    r.style.setProperty('--input-bg', 'oklch(1 0 0 / 0.06)');
    r.style.setProperty('--scrim', 'oklch(0 0 0 / 0.7)');
    r.style.setProperty('--grabber', 'oklch(1 0 0 / 0.2)');
  }
  r.setAttribute('data-theme', themeId);
  r.setAttribute('data-motif', t.motif);
  r.setAttribute('data-mode', t.mode);
};

// ── Get active theme (fallback-safe) ───────────────
export const getTheme = (themeId: string): Theme => THEMES[themeId] || THEMES['solo-leveling'];
export const getThemeVocab = (themeId: string): Vocab =>
  (THEMES[themeId] || THEMES['solo-leveling']).vocab;
