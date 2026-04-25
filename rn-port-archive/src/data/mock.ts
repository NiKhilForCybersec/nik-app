export type Habit = {
  id: string;
  name: string;
  target: number;
  done: number;
  unit: string;
  icon: 'water' | 'book' | 'dumbbell' | 'brain' | 'flame' | 'moon';
  hue: number;
  streak: number;
  auto?: boolean;
  source?: string;
};

export type FamilyMember = {
  name: string;
  role: string;
  hue: number;
  status: 'online' | 'away' | 'offline';
  location: string;
  level: number;
  self?: boolean;
};

export type User = {
  name: string;
  title: string;
  level: number;
  xp: number;
  xpMax: number;
  streak: number;
  stats: Record<'STR' | 'INT' | 'DEX' | 'VIT' | 'FOC', number>;
};

export const MOCK = {
  user: {
    name: 'Arjun',
    title: 'Rank B Hunter',
    level: 27,
    xp: 1840,
    xpMax: 2400,
    streak: 42,
    stats: { STR: 18, INT: 24, DEX: 15, VIT: 21, FOC: 30 },
  } satisfies User,
  today: {
    date: 'Sunday, 19 April',
    weather: '24° Clear',
    location: 'Bengaluru',
  },
  habits: [
    { id: 'h1', name: 'Hydrate', target: 8, done: 6, unit: 'glasses', icon: 'water', hue: 200, streak: 12 },
    { id: 'h2', name: 'Read', target: 30, done: 22, unit: 'min', icon: 'book', hue: 280, streak: 8, source: 'Kindle' },
    { id: 'h3', name: 'Train', target: 60, done: 60, unit: 'min', icon: 'dumbbell', hue: 30, streak: 42, auto: true, source: 'GPS · Cult Fit' },
    { id: 'h4', name: 'Meditate', target: 10, done: 0, unit: 'min', icon: 'brain', hue: 150, streak: 0 },
    { id: 'h5', name: 'Walk 8k steps', target: 8000, done: 5240, unit: 'steps', icon: 'flame', hue: 40, streak: 19, auto: true, source: 'Apple Health' },
    { id: 'h6', name: 'Sleep 7h+', target: 7, done: 7, unit: 'hrs', icon: 'moon', hue: 260, streak: 5, auto: true, source: 'Health' },
  ] satisfies Habit[],
  family: [
    { name: 'Meera', role: 'Partner', hue: 320, status: 'online', location: 'Home', level: 22 },
    { name: 'Arjun', role: 'You', hue: 220, status: 'online', location: 'Commute', level: 27, self: true },
    { name: 'Kiaan', role: 'Son · 8', hue: 30, status: 'away', location: 'School', level: 9 },
    { name: 'Dadi', role: 'Grandmother', hue: 150, status: 'online', location: 'Home', level: 41 },
    { name: 'Raj', role: 'Father', hue: 260, status: 'offline', location: 'Pune', level: 38 },
  ] satisfies FamilyMember[],
};
