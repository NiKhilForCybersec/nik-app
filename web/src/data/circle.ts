/* Nik — Family Circle data
   Rich profiles, per-person sharing matrix, awareness log.
   Each member has health/meds/mood/diary/schedule data.
   Sharing is per-(viewer, owner, category) — owner controls what viewer sees.
*/

export const CIRCLE_MEMBERS: Record<string, any>[] = [
  {
    id: 'arjun',
    name: 'Arjun',
    role: 'You',
    relation: 'self',
    age: 36,
    hue: 220,
    self: true,
    status: 'online',
    location: 'Commute · Whitefield → MG Rd',
    lastSeen: 'now',
    birthday: 'Aug 14',
    bloodType: 'O+',
    health: {
      sleep: { last: 7.2, avgWk: 6.8, deficit: 1.4 },
      mood: { today: 'focused', trend7: ['ok','ok','low','ok','good','focused','focused'] },
      steps: 5240,
      heart: { resting: 64, hrv: 48 },
      streaks: 42,
      score: 782,
    },
    meds: [
      { name: 'Vitamin D3', dose: '60k IU · weekly', adherence: 0.86 },
      { name: 'Magnesium glycinate', dose: '400mg · nightly', adherence: 0.71 },
    ],
    care: {
      allergies: ['Penicillin (rash)'],
      conditions: ['Mild hypertension (controlled)'],
      doctors: [{ name: 'Dr. Anand', spec: 'GP', last: '6 weeks ago' }],
      insurance: 'HDFC Ergo · ●●●● 4421',
    },
    schedule: [
      { time: '15:00', text: 'Design review · Priya', kind: 'work' },
      { time: '17:00', text: 'Pickup kids', kind: 'family' },
      { time: '19:30', text: 'Train · Cult Fit', kind: 'fitness' },
    ],
    diary: {
      moodToday: 'Focused, slightly tense about review',
      lastEntry: '2h ago · "Anya drew our family today. Kept it on the fridge."',
    },
  },
  {
    id: 'meera',
    name: 'Meera',
    role: 'Partner',
    relation: 'partner',
    age: 34,
    hue: 320,
    status: 'online',
    location: 'Home',
    lastSeen: '12 min ago',
    birthday: 'Mar 22',
    bloodType: 'A+',
    health: {
      sleep: { last: 5.4, avgWk: 5.8, deficit: 7.2, alert: 'Sleep <6h for 4 nights' },
      mood: { today: 'tired', trend7: ['ok','low','low','ok','low','tired','tired'] },
      steps: 3120,
      heart: { resting: 71, hrv: 38 },
      cycle: { day: 18, phase: 'Luteal · day 4', next: 'in 10 days' },
      streaks: 12,
      score: 624,
    },
    meds: [
      { name: 'Folic acid', dose: '5mg · daily', adherence: 0.94 },
      { name: 'Iron + B12', dose: 'morning', adherence: 0.82 },
    ],
    care: {
      allergies: ['Shellfish'],
      conditions: ['PCOS · managed', 'Lower-back issues'],
      doctors: [{ name: 'Dr. Reema', spec: 'OB-GYN', last: '3 months ago' }],
    },
    schedule: [
      { time: '08:30', text: 'WFH · Q2 deck', kind: 'work' },
      { time: '17:00', text: 'Piano · Kiaan', kind: 'family' },
      { time: '21:00', text: 'Wind-down · book', kind: 'rest' },
    ],
    diary: {
      moodToday: 'Drained — third bad night',
      lastEntry: 'Yesterday · "Kiaan said something kind unprompted. Wrote it down."',
    },
  },
  {
    id: 'kiaan',
    name: 'Kiaan',
    role: 'Son · 12',
    relation: 'kid-teen',
    age: 12,
    hue: 30,
    status: 'away',
    location: 'School · Inventure Academy',
    lastSeen: '08:10',
    birthday: 'Nov 02',
    bloodType: 'O+',
    health: {
      sleep: { last: 9.1, avgWk: 8.8 },
      mood: { today: 'ok', trend7: ['good','ok','ok','low','ok','good','ok'] },
      steps: 8900,
      streaks: 6,
      score: 540,
    },
    meds: [],
    care: {
      allergies: ['Peanuts (mild)'],
      conditions: [],
      doctors: [{ name: 'Dr. Kavita', spec: 'Pediatrician' }],
    },
    schedule: [
      { time: '15:30', text: 'Pickup', kind: 'family' },
      { time: '17:00', text: 'Piano', kind: 'class' },
      { time: '20:00', text: 'Reading', kind: 'rest' },
    ],
    diary: {
      moodToday: 'Quiet · math test today',
      lastEntry: 'Sunday · drawing of a dinosaur',
    },
    teenPrivacy: true, // gets some controls
  },
  {
    id: 'anya',
    name: 'Anya',
    role: 'Daughter · 8',
    relation: 'kid-young',
    age: 8,
    hue: 280,
    status: 'away',
    location: 'School · Inventure Academy',
    lastSeen: '08:10',
    birthday: 'Jun 09',
    bloodType: 'A+',
    health: {
      sleep: { last: 10.2, avgWk: 10.0 },
      mood: { today: 'happy', trend7: ['good','good','ok','good','good','good','happy'] },
      steps: 6400,
      streaks: 14,
      score: 612,
    },
    meds: [
      { name: 'Multivitamin gummy', dose: '1 · morning', adherence: 0.95 },
    ],
    care: {
      allergies: [],
      conditions: ['Mild eczema'],
      doctors: [{ name: 'Dr. Kavita', spec: 'Pediatrician' }],
    },
    schedule: [
      { time: '15:30', text: 'Pickup', kind: 'family' },
      { time: '17:30', text: 'Swim', kind: 'class' },
      { time: '20:00', text: 'Story · bath', kind: 'rest' },
    ],
    diary: {
      moodToday: 'Happy · made a new friend',
      lastEntry: 'Today · "I drew our family. Mama is a star."',
    },
    teenPrivacy: false,
  },
  {
    id: 'mom',
    name: 'Mom',
    role: 'Mother · 67',
    relation: 'parent',
    age: 67,
    hue: 150,
    status: 'online',
    location: 'Pune · Home',
    lastSeen: '40 min ago',
    birthday: 'Jan 05',
    bloodType: 'B+',
    health: {
      sleep: { last: 6.8, avgWk: 6.5 },
      mood: { today: 'lonely', trend7: ['ok','low','ok','low','low','ok','lonely'], alert: 'Hasn\'t had social contact in 3 days' },
      steps: 1800,
      heart: { resting: 76 },
      bp: { sys: 138, dia: 86, alert: 'Slightly elevated' },
      glucose: { last: 124, fasting: 'today 6am' },
      streaks: 0,
      score: 488,
    },
    meds: [
      { name: 'Telmisartan', dose: '40mg · morning', adherence: 0.62, alert: 'Missed 3x this week' },
      { name: 'Metformin', dose: '500mg · 2x daily', adherence: 0.78 },
      { name: 'Calcium + D3', dose: '1 · evening', adherence: 0.55 },
    ],
    care: {
      allergies: [],
      conditions: ['Type 2 diabetes', 'Hypertension', 'Osteoarthritis (knees)'],
      doctors: [
        { name: 'Dr. Joshi', spec: 'Cardiologist', last: '2 weeks ago' },
        { name: 'Dr. Patil', spec: 'GP', last: '1 month ago' },
      ],
      caregiver: 'Lakshmi (day-help, 9am–6pm)',
      emergency: 'Raj (brother) · +91 ●●●● ●●12',
    },
    schedule: [
      { time: '07:00', text: 'BP check + meds', kind: 'health' },
      { time: '11:00', text: 'Walk in garden', kind: 'fitness' },
      { time: '17:00', text: 'Tea · TV', kind: 'rest' },
    ],
    diary: {
      moodToday: 'Missed talking to Arjun yesterday',
      lastEntry: 'Last week · voice note about old recipes',
    },
    careRecipient: true,
  },
];

// ── PRIVACY MATRIX ─────────────────────────────────────────
// Categories you can choose to share.
export const PRIVACY_CATEGORIES = [
  { id: 'health',   label: 'Health snapshot', sub: 'sleep, steps, heart' },
  { id: 'meds',     label: 'Medications',     sub: 'names, doses, adherence' },
  { id: 'mood',     label: 'Mood & diary',    sub: 'today\'s mood, weekly trend' },
  { id: 'cycle',    label: 'Cycle',           sub: 'phase, predictions' },
  { id: 'schedule', label: 'Today\'s schedule', sub: 'meetings, classes, plans' },
  { id: 'location', label: 'Location',        sub: 'where you are now' },
  { id: 'care',     label: 'Care notes',      sub: 'allergies, conditions, doctors' },
  { id: 'score',    label: 'Nik Score',       sub: 'wellness score & streaks' },
  { id: 'diary',    label: 'Diary entries',   sub: 'last entry preview' },
];

// Trust tiers — quick presets (member can override per category)
export const TRUST_TIERS: Record<string, { label: string; desc: string; cats: string[] }> = {
  inner:    { label: 'Inner',     desc: 'Partner / primary caregiver',    cats: ['health','meds','mood','cycle','schedule','location','care','score','diary'] },
  family:   { label: 'Family',    desc: 'Adults in the circle',           cats: ['health','schedule','location','score','care'] },
  kid:      { label: 'Kids',      desc: 'Children — limited',             cats: ['schedule','location','score'] },
  caregiver:{ label: 'Caregiver', desc: 'Health-focused',                 cats: ['health','meds','care','schedule','location'] },
};

// Default tier per (viewer → owner) relationship.
// Owner (key) → viewer (key) → tier.
// Each member's preferences live here.
export const DEFAULT_SHARING: Record<string, Record<string, any>> = {
  arjun:  { meera: 'inner',  kiaan: 'kid',  anya: 'kid',  mom: 'family' },
  meera:  { arjun: 'inner',  kiaan: 'kid',  anya: 'kid',  mom: 'family' },
  kiaan:  { arjun: 'family', meera: 'family', anya: 'kid', mom: 'family' },
  anya:   { arjun: 'family', meera: 'family', kiaan: 'kid', mom: 'family' },
  mom:    { arjun: 'caregiver', meera: 'caregiver', kiaan: 'family', anya: 'family' },
};

// View log — who viewed what about you, when.
// Keyed by viewer; values are events.
export const VIEW_LOG = [
  { viewer: 'meera', owner: 'arjun', section: 'health',   when: 'today · 9:14am' },
  { viewer: 'meera', owner: 'arjun', section: 'schedule', when: 'today · 9:14am' },
  { viewer: 'meera', owner: 'arjun', section: 'mood',     when: 'today · 9:15am' },
  { viewer: 'arjun', owner: 'meera', section: 'health',   when: 'today · 8:02am' },
  { viewer: 'arjun', owner: 'mom',   section: 'meds',     when: 'today · 8:04am' },
  { viewer: 'arjun', owner: 'mom',   section: 'health',   when: 'today · 8:04am' },
  { viewer: 'meera', owner: 'mom',   section: 'meds',     when: 'yesterday · 6:30pm' },
  { viewer: 'arjun', owner: 'kiaan', section: 'schedule', when: 'today · 7:50am' },
  { viewer: 'arjun', owner: 'anya',  section: 'mood',     when: 'today · 7:51am' },
  { viewer: 'meera', owner: 'arjun', section: 'health',   when: 'yesterday · 11pm' },
  { viewer: 'meera', owner: 'arjun', section: 'health',   when: 'yesterday · 7pm' },
];

// Concern alerts — surfaced when consented.
export const CIRCLE_ALERTS = [
  { ownerId: 'meera', kind: 'sleep',   level: 'amber', text: 'Sleep <6h for 4 nights', cta: 'Send a soft check-in' },
  { ownerId: 'mom',   kind: 'meds',    level: 'red',   text: 'Telmisartan missed 3x — BP elevated', cta: 'Call now' },
  { ownerId: 'mom',   kind: 'mood',    level: 'amber', text: 'No social contact for 3 days', cta: 'Schedule a video call' },
  { ownerId: 'kiaan', kind: 'mood',    level: 'soft',  text: 'Quieter than usual today', cta: 'Ask about school' },
];

// Helper: can viewer see (ownerId, category)?
export function canCircleView(
  viewerId: string,
  ownerId: string,
  category: string,
  sharing: Record<string, Record<string, any>> = DEFAULT_SHARING,
): boolean {
  if (viewerId === ownerId) return true;
  const tier = sharing?.[ownerId]?.[viewerId];
  if (!tier) return false;
  if (typeof tier === 'object') {
    // custom override
    return tier.cats?.includes(category);
  }
  return TRUST_TIERS[tier]?.cats?.includes(category) ?? false;
}

// Convenience aggregate export — some screens may import a single CIRCLE object.
export const CIRCLE = {
  members: CIRCLE_MEMBERS,
  categories: PRIVACY_CATEGORIES,
  privacyCategories: PRIVACY_CATEGORIES,
  tiers: TRUST_TIERS,
  trustTiers: TRUST_TIERS,
  sharing: DEFAULT_SHARING,
  defaultSharing: DEFAULT_SHARING,
  viewLog: VIEW_LOG,
  alerts: CIRCLE_ALERTS,
  canView: canCircleView,
};
