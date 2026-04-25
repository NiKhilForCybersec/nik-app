/* Nik — mock data */

export const MOCK: Record<string, any> = {
  user: {
    name: 'Arjun',
    title: 'Rank B Hunter',
    level: 27,
    xp: 1840,
    xpMax: 2400,
    streak: 42,
    stats: { STR: 18, INT: 24, DEX: 15, VIT: 21, FOC: 30 },
  },
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
  ],
  quests: [
    { id: 'q1', title: 'Complete 60 min workout', rank: 'B', xp: 180, status: 'done', auto: true, trigger: 'GPS · Cult Fit' },
    { id: 'q2', title: 'Deep focus — 2 hrs no phone', rank: 'A', xp: 240, status: 'active', progress: 0.6 },
    { id: 'q3', title: 'Reply to 3 family messages', rank: 'C', xp: 60, status: 'active', progress: 0.33 },
    { id: 'q4', title: 'Read 30 pages', rank: 'C', xp: 80, status: 'active', progress: 0.73 },
    { id: 'q5', title: 'Meditate before sleep', rank: 'D', xp: 40, status: 'pending' },
  ],
  tasks: [
    { id: 't1', title: 'Pick up groceries', when: 'Today · 6pm', by: 'Meera', near: true },
    { id: 't2', title: 'Call Dad — anniversary plan', when: 'Tomorrow', by: 'You', shared: true },
    { id: 't3', title: 'Design review with Priya', when: 'Today · 3pm', by: 'Calendar' },
  ],
  family: [
    { name: 'Meera', role: 'Partner', hue: 320, status: 'online', location: 'Home', level: 22 },
    { name: 'Arjun', role: 'You', hue: 220, status: 'online', location: 'Commute', level: 27, self: true },
    { name: 'Kiaan', role: 'Son · 8', hue: 30, status: 'away', location: 'School', level: 9 },
    { name: 'Dadi', role: 'Grandmother', hue: 150, status: 'online', location: 'Home', level: 41 },
    { name: 'Raj', role: 'Father', hue: 260, status: 'offline', location: 'Pune', level: 38 },
  ],
  chatHistory: [
    { from: 'ai', text: 'Good morning, Arjun. Your gym session was logged at 7:02am — 58 min. Great job on the streak.', time: '8:14am' },
    { from: 'user', text: 'Set a reminder to call mom tonight', time: '8:15am' },
    { from: 'ai', text: "Done. 7:30pm works — she's usually free then. I'll also pull up her recent photos so you have something to talk about. 🪄", time: '8:15am', actions: ['Open reminder', 'Dismiss'] },
    { from: 'user', text: 'Also move my 3pm if I\'m still at lunch', time: '8:16am' },
    { from: 'ai', text: 'Moved to 3:30pm. Priya confirmed. I noticed you skipped meditation yesterday — want me to slot 10 min after the design review?', time: '8:16am', actions: ['Add quest', 'Not today'] },
  ],
  notifications: [
    { kind: 'gps', title: 'You\'re near Nature\'s Basket', body: 'Meera added Groceries 12 min ago. Pick them up on your way?', time: 'now', action: 'Accept quest' },
    { kind: 'family', title: 'Kiaan finished homework quest', body: '+40 XP · Kiaan reached Lvl 9', time: '14m' },
    { kind: 'habit', title: 'Hydration below target', body: '2 glasses behind pace. Drink one now?', time: '32m' },
    { kind: 'system', title: 'Weekly insights ready', body: 'You slept 7.4h avg — 12% better than last week', time: '1h' },
  ],
};
