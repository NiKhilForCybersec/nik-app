export const colors = {
  bg: '#06060e',
  bgEnd: '#10101e',
  surface: 'rgba(255,255,255,0.04)',
  surfaceStrong: 'rgba(255,255,255,0.07)',
  hairline: 'rgba(255,255,255,0.08)',
  hairlineStrong: 'rgba(255,255,255,0.14)',
  fg: '#f4f4f8',
  fg2: 'rgba(244,244,248,0.65)',
  fg3: 'rgba(244,244,248,0.4)',
  accent: '#a78bfa',
  accent2: '#ec4899',
  accentSoft: 'rgba(167,139,250,0.18)',
  accentBorder: 'rgba(167,139,250,0.4)',
  ok: '#34d399',
  okSoft: 'rgba(52,211,153,0.18)',
  warn: '#fbbf24',
  warnSoft: 'rgba(251,191,36,0.18)',
  danger: '#f87171',
  flame: '#fb923c',
};

export const hueColor = (hue: number, l = 0.85, c = 0.16) => {
  const h = ((hue % 360) + 360) % 360;
  const sat = Math.min(c * 4, 1);
  const light = Math.round(l * 100);
  return `hsl(${h}, ${Math.round(sat * 100)}%, ${light}%)`;
};

export const monoFont = 'Menlo';
