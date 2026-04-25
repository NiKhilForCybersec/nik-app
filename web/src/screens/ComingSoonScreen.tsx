/* Nik — Premium "coming soon" preview screen.
   Shown when user taps a SOON-tagged dashboard from More.
   Tailored per-feature via state.comingSoon config. */

import { motion } from 'framer-motion';
import type { ScreenProps } from '../App';
import { I } from '../components/icons';
import { Chip, HUDCorner } from '../components/primitives';

type FeatureBenefit = { icon: string; label: string; sub: string };
type FeaturePreview = {
  kind: 'list' | 'grid' | 'chart';
  items: { label: string; sub?: string; right?: string }[];
};

export type ComingSoonConfig = {
  id: string;
  name: string;
  category: string;
  hue: number;
  icon: string;
  tagline: string;
  description: string;
  eta: string;
  benefits: FeatureBenefit[];
  preview: FeaturePreview;
  whyItMatters?: string;
};

// Per-feature configs — each SOON item has a tailored preview page.
export const COMING_SOON_CONFIGS: Record<string, ComingSoonConfig> = {
  hydration: {
    id: 'hydration',
    name: 'Hydration',
    category: 'Health',
    hue: 200,
    icon: 'water',
    tagline: 'Drink your way to bright',
    description: 'Tap to log a glass. Auto-detect from smart bottles. Nik nudges you when you fall behind without being annoying.',
    eta: 'Q2 2026',
    benefits: [
      { icon: 'droplet', label: 'One-tap log', sub: '+1 glass · widget · voice' },
      { icon: 'bell',    label: 'Smart nudges', sub: 'Only when you actually need water' },
      { icon: 'trend',   label: 'Pattern view', sub: 'Compare to sleep + mood' },
    ],
    preview: {
      kind: 'grid',
      items: [
        { label: '6 / 8', sub: 'glasses today' },
        { label: '2.1 L', sub: '11am · 1pm · 4pm' },
        { label: '+12%',  sub: 'vs last week' },
      ],
    },
    whyItMatters: 'You sleep 18 min better on days you hit your hydration target.',
  },
  nutrition: {
    id: 'nutrition',
    name: 'Nutrition',
    category: 'Health',
    hue: 60,
    icon: 'utensils',
    tagline: 'Macros without the spreadsheet',
    description: 'Snap a photo, Nik logs it. Track macros, deficits, and what actually fuels your good days — no more obsessive scales.',
    eta: 'Q2 2026',
    benefits: [
      { icon: 'camera',   label: 'Snap to log', sub: 'Photo → portion + macros' },
      { icon: 'sparkle',  label: 'Pattern AI', sub: 'What did you eat on great days?' },
      { icon: 'shield',   label: 'No shaming', sub: 'No counts that aren\'t useful' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'Idli + chutney',     sub: 'Breakfast · 8:14am', right: '420 kcal' },
        { label: 'Curd rice + pickle', sub: 'Lunch · 1:30pm',     right: '610 kcal' },
        { label: 'Apple + 2 dates',    sub: 'Snack · 4pm',        right: '180 kcal' },
      ],
    },
    whyItMatters: 'Tracking only the ratio of plants vs processed beats counting calories for most people.',
  },
  cycle: {
    id: 'cycle',
    name: 'Cycle',
    category: 'Health',
    hue: 320,
    icon: 'refresh',
    tagline: 'Your rhythm, respected',
    description: 'Phase tracking, symptom log, predictive nudges for energy and mood. Privacy-first — never leaves your device.',
    eta: 'Q2 2026',
    benefits: [
      { icon: 'lock',     label: 'Local-only',   sub: 'Nothing sent to a server' },
      { icon: 'sparkle',  label: 'Pre-PMS heads up', sub: 'Nik plans softer days' },
      { icon: 'family',   label: 'Partner share', sub: 'Optional · what helps · what hurts' },
    ],
    preview: {
      kind: 'grid',
      items: [
        { label: 'Day 18',  sub: 'Luteal · day 4' },
        { label: '~10d',    sub: 'till next' },
        { label: 'Soft',    sub: 'today\'s energy' },
      ],
    },
    whyItMatters: 'Most cycle apps sell your data. This one literally cannot.',
  },
  symptoms: {
    id: 'symptoms',
    name: 'Symptoms',
    category: 'Health',
    hue: 25,
    icon: 'alert',
    tagline: 'Spot what no doctor will',
    description: 'Log anything: headache, fatigue, mood dip, stomach. Nik finds patterns across food, sleep, weather, cycle — and shows you the trigger.',
    eta: 'Q3 2026',
    benefits: [
      { icon: 'plus',     label: '5-second log', sub: 'Voice or tap, no forms' },
      { icon: 'sparkles', label: 'Pattern AI',   sub: 'After 14 days you get triggers' },
      { icon: 'briefcase',label: 'Doctor export',sub: 'PDF for your next visit' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'Mild headache', sub: 'Tue 3pm · 2h after coffee #3', right: 'caffeine?' },
        { label: 'Stomach off',   sub: 'Wed 10am · day after dosa',     right: 'gluten?'  },
        { label: 'Low energy',    sub: 'Sat all day · slept 5h fri',    right: 'sleep deficit' },
      ],
    },
    whyItMatters: '4 in 5 chronic symptoms have an environmental trigger you\'d find with 14 days of logging.',
  },
  doctors: {
    id: 'doctors',
    name: 'Care Team',
    category: 'Health',
    hue: 200,
    icon: 'briefcase',
    tagline: 'Your whole care team in one place',
    description: 'Doctors, dentists, vets — names, contacts, last visit, next visit. Insurance card, prescriptions, lab results. One tap to share with anyone.',
    eta: 'Q3 2026',
    benefits: [
      { icon: 'phone',     label: 'One-tap call',     sub: 'Doctor + insurance from anywhere' },
      { icon: 'calendar',  label: 'Visit history',    sub: 'When · why · what was said' },
      { icon: 'shield',    label: 'Emergency mode',   sub: 'Lock-screen → care team' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'Dr. Anand · GP',    sub: 'Last: 6 weeks ago · Manipal',  right: 'Call' },
        { label: 'Dr. Joshi · Cardio',sub: 'Mom · 2 weeks ago',            right: 'Call' },
        { label: 'Dr. Kavita · Paeds',sub: 'Kids · BiAnnual due',          right: 'Book' },
      ],
    },
    whyItMatters: 'Average ER visit asks 4 questions you should already have written down.',
  },

  // ── Mind ──
  reading: {
    id: 'reading',
    name: 'Reading',
    category: 'Mind',
    hue: 280,
    icon: 'book',
    tagline: 'Your second brain for books',
    description: 'Pull highlights from Kindle + Apple Books. Search across everything you\'ve ever read. Nik resurfaces the right quote on the right day.',
    eta: 'Q2 2026',
    benefits: [
      { icon: 'sparkle', label: 'Auto-import', sub: 'Kindle / Apple Books / pdf' },
      { icon: 'search',  label: 'Across everything', sub: 'Find any line you\'ve highlighted' },
      { icon: 'bell',    label: 'Right quote, right time', sub: 'Resurface relevant lines' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'Atomic Habits',     sub: '127 highlights · 89% read', right: 'James Clear' },
        { label: 'The Psychology of Money', sub: '42 highlights · finished', right: 'Morgan Housel' },
        { label: 'Sapiens',           sub: 'page 240 · 6 weeks idle', right: 'Yuval Harari' },
      ],
    },
    whyItMatters: 'You forget 80% of what you read in 7 days unless something resurfaces it.',
  },
  learning: {
    id: 'learning',
    name: 'Learning',
    category: 'Mind',
    hue: 220,
    icon: 'brain',
    tagline: 'Skill stack, not endless courses',
    description: 'Track what you\'re learning across courses, books, projects. Spaced repetition for what matters. Quit-or-commit prompts for what\'s stalled.',
    eta: 'Q3 2026',
    benefits: [
      { icon: 'target',   label: 'Active goals',  sub: '~3 at a time, not 30' },
      { icon: 'refresh',  label: 'Spaced recall', sub: 'Anki-style for what stuck' },
      { icon: 'check',    label: 'Quit gracefully', sub: 'Nik nudges out the stale stuff' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'TypeScript',  sub: 'Mon-Wed-Fri · 22 days streak',   right: '78%' },
        { label: 'Tabla',       sub: 'Sat morning · with tutor',        right: '4w' },
        { label: 'Mandarin',    sub: 'Stalled · 19 days idle',          right: 'Quit?' },
      ],
    },
    whyItMatters: 'Knowing 3 things deeply beats grazing 30.',
  },
  gratitude: {
    id: 'gratitude',
    name: 'Gratitude',
    category: 'Mind',
    hue: 320,
    icon: 'heart',
    tagline: 'Three things, every evening',
    description: 'A 30-second daily ritual that compounds. See your year through what made you grateful. Optional shared with partner.',
    eta: 'Q2 2026',
    benefits: [
      { icon: 'sparkle',  label: '30 seconds', sub: 'Voice or tap, before bed' },
      { icon: 'family',   label: 'Optional partner', sub: 'See each other\'s' },
      { icon: 'calendar', label: 'Year-end recap', sub: 'A film of your year' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'Anya named her drawing Pomelo', sub: 'today',  right: '🌟' },
        { label: 'Mom called for no reason',      sub: 'yesterday', right: '🌟' },
        { label: 'PR ship date moved to next week', sub: '2 days ago', right: '🌟' },
      ],
    },
    whyItMatters: 'Daily gratitude is one of the most-replicated mental-health interventions in research.',
  },
  goals: {
    id: 'goals',
    name: 'Goals',
    category: 'Mind',
    hue: 150,
    icon: 'target',
    tagline: 'Years, quarters, this week',
    description: 'OKR-style trees connecting today\'s tiny wins to what you actually want by year-end. Nik nudges when you drift.',
    eta: 'Q2 2026',
    benefits: [
      { icon: 'target',   label: 'Year → quarter → week', sub: 'Visible chain' },
      { icon: 'sparkles', label: 'Drift detection', sub: 'When did you last move on this?' },
      { icon: 'check',    label: 'Today\'s 1 thing', sub: 'The next concrete step' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'Ship Nik public beta',  sub: 'Q2 · 12 weeks',  right: '34%' },
        { label: 'Sub-3:30 marathon',     sub: 'Q4 · 26 weeks',  right: '12%' },
        { label: 'Dad-2.0 project',       sub: 'Q3 · ongoing',   right: 'qual.' },
      ],
    },
    whyItMatters: 'Goals you can see weekly are 3x more likely to land than ones you re-find in a doc.',
  },
  reflection: {
    id: 'reflection',
    name: 'Reflection',
    category: 'Mind',
    hue: 200,
    icon: 'sparkle',
    tagline: 'Weekly, monthly, yearly reviews',
    description: 'Guided prompts. Auto-pulled signals (sleep, focus, mood). Nik writes the first draft, you edit. 15 minutes a Sunday becomes self-knowledge.',
    eta: 'Q3 2026',
    benefits: [
      { icon: 'calendar',  label: 'Sunday block', sub: '15 min, recurring' },
      { icon: 'sparkles',  label: 'Pre-filled draft', sub: 'Nik summarises your week' },
      { icon: 'trend',     label: 'Year over year', sub: 'See the deltas that matter' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'This week',       sub: '2 wins · 1 stuck · 1 surprise', right: '15 min' },
        { label: 'April recap',     sub: '4 themes · 1 lesson',          right: '40 min' },
        { label: '2026 mid-year',   sub: 'in 8 weeks',                    right: '90 min' },
      ],
    },
  },
  languages: {
    id: 'languages',
    name: 'Languages',
    category: 'Mind',
    hue: 60,
    icon: 'globe',
    tagline: 'Daily streaks, real conversations',
    description: 'Vocab decks, listening practice, conversational drills with AI. Track your real fluency, not gamified XP.',
    eta: 'Q3 2026',
    benefits: [
      { icon: 'mic',     label: 'Talk to AI', sub: 'Real conversations, your pace' },
      { icon: 'refresh', label: 'Spaced decks', sub: 'What stuck · what slipped' },
      { icon: 'trend',   label: 'Real fluency', sub: 'Not just streaks' },
    ],
    preview: {
      kind: 'grid',
      items: [
        { label: 'Tamil',   sub: '14d streak · A2' },
        { label: 'Spanish', sub: '0d · paused 2w' },
        { label: 'Hindi',   sub: 'native' },
      ],
    },
  },

  // ── People ──
  friends: {
    id: 'friends',
    name: 'Friends',
    category: 'People',
    hue: 280,
    icon: 'users',
    tagline: 'Stay in touch, on purpose',
    description: 'Last-seen tracker, birthday alerts, shared memories. Nik nudges you to reach out before someone slips off the map.',
    eta: 'Q3 2026',
    benefits: [
      { icon: 'bell',      label: 'Drift nudges', sub: 'Haven\'t talked in 3 months?' },
      { icon: 'calendar',  label: 'Birthday queue', sub: 'Upcoming · gifts · cards' },
      { icon: 'sparkle',   label: 'Conversation starters', sub: 'Your last 3 chats' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'Aarav Sharma',   sub: 'Last: 11 weeks ago',  right: '☎' },
        { label: 'Priya Iyer',     sub: 'Birthday in 6 days',   right: '🎁' },
        { label: 'Rohit + Anjali', sub: 'New baby — congrats?', right: '✉' },
      ],
    },
    whyItMatters: 'You meaningfully see ~8 people a year as an adult. Nik helps you spend that intentionally.',
  },
  network: {
    id: 'network',
    name: 'Network',
    category: 'People',
    hue: 220,
    icon: 'briefcase',
    tagline: 'Your professional graph',
    description: 'Who you met, when, why, what to follow up on. Connection requests for intros. Pulls warm context before any call.',
    eta: 'Q3 2026',
    benefits: [
      { icon: 'sparkle',   label: 'Pre-call brief', sub: '2 min before any meeting' },
      { icon: 'family',    label: 'Warm intros',    sub: 'Who can I introduce to whom?' },
      { icon: 'refresh',   label: 'Follow-up loop', sub: 'Nudges so chats don\'t die' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'Vikram Mehta',  sub: 'Met: SaaSBoomi · investor', right: 'follow up' },
        { label: 'Alia Khan',     sub: 'New role at Razorpay',      right: 'congrats' },
        { label: 'Suresh Iyer',   sub: 'Old colleague · MBA now',   right: 'reconnect' },
      ],
    },
  },
  pets: {
    id: 'pets',
    name: 'Pets',
    category: 'People',
    hue: 60,
    icon: 'heart',
    tagline: 'Vet, meds, food — for the furry ones',
    description: 'Vet reminders, vaccination schedule, weight tracking, food preferences. Photos from happy moments and recent funny ones.',
    eta: 'Q3 2026',
    benefits: [
      { icon: 'pill',     label: 'Vet schedule', sub: 'Vaccines, deworm, checkup' },
      { icon: 'camera',   label: 'Pet vault',    sub: 'Photos + favourite moments' },
      { icon: 'family',   label: 'Caretakers',   sub: 'Walker, sitter, vet — one tap' },
    ],
    preview: {
      kind: 'grid',
      items: [
        { label: '🐶 Pomelo',  sub: '4y · vacc due Mar' },
        { label: '🐱 Mochi',   sub: '7y · pre-diabetic' },
      ],
    },
  },
  birthdays: {
    id: 'birthdays',
    name: 'Birthdays',
    category: 'People',
    hue: 320,
    icon: 'calendar',
    tagline: 'Never forget · always thoughtful',
    description: 'Auto-pulled from contacts. 7 days, 3 days, 1 day, day-of nudges. Gift ideas based on what they\'ve shared. Wishlist sync.',
    eta: 'Q2 2026',
    benefits: [
      { icon: 'bell',      label: 'Tiered nudges',  sub: '7d → gift, 1d → message' },
      { icon: 'sparkles',  label: 'Gift ideas',     sub: 'Based on their interests' },
      { icon: 'heart',     label: 'Wishlist sync',  sub: 'Pull from Amazon / pinterest' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'Meera',  sub: 'Mar 22 · in 11 mo',  right: '💍' },
        { label: 'Anya',   sub: 'Jun 9 · in 7 weeks', right: '🎂' },
        { label: 'Mom',    sub: 'Jan 5 · passed',     right: '🎁' },
      ],
    },
  },

  // ── Money ──
  bills: {
    id: 'bills',
    name: 'Bills',
    category: 'Money',
    hue: 25,
    icon: 'mail',
    tagline: 'Auto-detect, auto-remind, auto-pay',
    description: 'Pulls bills from Gmail. Tracks recurring payments. Alerts before auto-debit. Catches duplicate charges and price hikes.',
    eta: 'Q3 2026',
    benefits: [
      { icon: 'sparkle',  label: 'Inbox detect',  sub: 'No manual entry' },
      { icon: 'alert',    label: 'Hike alerts',   sub: 'Netflix went up ₹50?' },
      { icon: 'refresh',  label: 'Pay or split',  sub: 'Tag to roommate / partner' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'Tata Power',   sub: 'Due Apr 28 · ₹3,420',  right: 'auto' },
        { label: 'Airtel Fiber', sub: 'Due May 2 · ₹1,499',   right: 'auto' },
        { label: 'Society',      sub: 'Due May 5 · ₹14,800',  right: 'manual' },
      ],
    },
  },
  subscriptions: {
    id: 'subscriptions',
    name: 'Subscriptions',
    category: 'Money',
    hue: 200,
    icon: 'refresh',
    tagline: 'Audit, cancel, save',
    description: 'Finds every recurring charge. Flags ones you haven\'t used in 30+ days. One-tap cancel for ones with cancel APIs.',
    eta: 'Q3 2026',
    benefits: [
      { icon: 'sparkles', label: 'Found it all',     sub: 'Even the ones you forgot' },
      { icon: 'eye',      label: 'Usage detection',  sub: 'When did you last open this?' },
      { icon: 'close',    label: 'One-tap cancel',   sub: 'When the service supports it' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'Netflix',      sub: '₹649/mo · last used 2d ago', right: 'keep' },
        { label: 'Adobe CC',     sub: '₹1,799/mo · idle 47 days',   right: 'cancel' },
        { label: 'Hotstar+VIP',  sub: '₹299/mo · idle 3 mo',         right: 'cancel' },
      ],
    },
    whyItMatters: 'Average household has ₹4,200/mo in subscriptions, ₹1,800 of which goes unused.',
  },
  investments: {
    id: 'investments',
    name: 'Investments',
    category: 'Money',
    hue: 150,
    icon: 'trend',
    tagline: 'Portfolio, not panic',
    description: 'Connects to Zerodha, Groww, mutual fund platforms. Single dashboard. Long-term lens — Nik hides daily noise unless you ask.',
    eta: 'Q4 2026',
    benefits: [
      { icon: 'sparkle',  label: 'All in one',      sub: 'Stocks · MF · gold · FD · crypto' },
      { icon: 'shield',   label: 'Long-term lens',  sub: 'No daily-jitter dopamine' },
      { icon: 'trend',    label: 'Goal tracking',   sub: 'On pace for retirement?' },
    ],
    preview: {
      kind: 'grid',
      items: [
        { label: '₹47.2L', sub: 'total · +12% YoY' },
        { label: '₹38.4L', sub: 'equity · 81%' },
        { label: '₹5.8L',  sub: 'liquid · 12%' },
      ],
    },
  },
  receipts: {
    id: 'receipts',
    name: 'Receipts',
    category: 'Money',
    hue: 60,
    icon: 'mail',
    tagline: 'Snap → categorise → ready for taxes',
    description: 'Photo a receipt. Nik OCRs and files it. Tax-deductible items auto-tagged. Export Excel for your CA in March.',
    eta: 'Q3 2026',
    benefits: [
      { icon: 'camera',   label: 'OCR + file',  sub: '2 seconds per receipt' },
      { icon: 'briefcase',label: 'Tax-tagged',  sub: 'Auto-find deductibles' },
      { icon: 'sparkle',  label: 'CA export',   sub: 'CSV in March' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'BigBasket',  sub: 'Apr 18 · ₹2,840',  right: 'home' },
        { label: 'Adobe CC',   sub: 'Apr 14 · ₹1,799',  right: 'work · 80%' },
        { label: 'OYO booking',sub: 'Apr 10 · ₹4,200',  right: 'travel' },
      ],
    },
  },

  // ── Home ──
  shopping: {
    id: 'shopping',
    name: 'Shopping',
    category: 'Home',
    hue: 280,
    icon: 'shopping',
    tagline: 'Lists that everyone can edit',
    description: 'Shared lists with family. Auto-suggests from your usual cart. Routes you optimally inside Nature\'s Basket vs BigBasket.',
    eta: 'Q3 2026',
    benefits: [
      { icon: 'family',   label: 'Shared with Meera', sub: 'See her edits live' },
      { icon: 'sparkle',  label: 'Auto-suggest', sub: 'You always run out of x' },
      { icon: 'location', label: 'Aisle routing', sub: 'Quickest path inside the store' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'Curd',       sub: 'Meera · 2 hr ago',      right: '500g' },
        { label: 'Bananas',    sub: 'You · this morning',    right: '6' },
        { label: 'Atta',       sub: 'Auto · usually weekly', right: '5kg' },
      ],
    },
  },
  recipes: {
    id: 'recipes',
    name: 'Recipes',
    category: 'Home',
    hue: 30,
    icon: 'utensils',
    tagline: 'What\'s for dinner, solved',
    description: 'Saved recipes from anywhere. Weekly meal plan in one tap. Auto-pulls ingredients to your shopping list.',
    eta: 'Q3 2026',
    benefits: [
      { icon: 'sparkle',  label: 'Plan a week',    sub: '3-5 dinners · breakfast routine' },
      { icon: 'shopping', label: 'Auto-shop',      sub: 'Ingredients → list' },
      { icon: 'family',   label: 'Family voting',  sub: 'Kiaan vetoes baigan' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'Amma\'s sambar',   sub: 'Saved · made 6×',      right: '40 min' },
        { label: 'Khichdi',          sub: 'Saved · weeknight',    right: '20 min' },
        { label: 'Pesto pasta',      sub: 'Saved · kids fav',     right: '25 min' },
      ],
    },
  },
  maintenance: {
    id: 'maintenance',
    name: 'Home',
    category: 'Home',
    hue: 220,
    icon: 'settings',
    tagline: 'Filters · service · warranty',
    description: 'When did the AC last get serviced? When does the geyser warranty run out? Nik tracks the small home stuff before it becomes the big home stuff.',
    eta: 'Q3 2026',
    benefits: [
      { icon: 'refresh', label: 'Service log', sub: 'Last AC service · next due' },
      { icon: 'shield',  label: 'Warranty timer', sub: 'Geyser warranty: 14 mo left' },
      { icon: 'phone',   label: 'Trusted vendors', sub: 'Plumber, AC guy, electrician' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'AC · drawing room',  sub: 'Last serviced 4 mo ago', right: 'overdue' },
        { label: 'Geyser · master',    sub: 'Warranty 14 mo left',     right: 'OK' },
        { label: 'Water purifier',     sub: 'Filter due in 3 weeks',   right: 'plan' },
      ],
    },
  },
  plants: {
    id: 'plants',
    name: 'Plants',
    category: 'Home',
    hue: 150,
    icon: 'flame',
    tagline: 'Water, light, love',
    description: 'Per-plant care schedule. Photo-based health check. AI tells you what\'s wrong before the leaves drop.',
    eta: 'Q3 2026',
    benefits: [
      { icon: 'water',   label: 'Water schedule', sub: 'Per plant, per season' },
      { icon: 'camera',  label: 'Photo health check', sub: 'Brown tips? Nik knows why' },
      { icon: 'sun',     label: 'Light tracker', sub: 'Where does it get most light?' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'Monstera · living rm',   sub: 'Water Wed', right: '3d' },
        { label: 'Snake plant · bedroom',  sub: 'Water in 11d', right: 'happy' },
        { label: 'Tulsi · balcony',        sub: 'Water daily', right: 'happy' },
      ],
    },
  },
  wardrobe: {
    id: 'wardrobe',
    name: 'Wardrobe',
    category: 'Home',
    hue: 320,
    icon: 'shopping',
    tagline: 'What you own, what you wear',
    description: 'Snap your clothes. Outfit suggester. Capsule-wardrobe goals. See what hasn\'t been worn in 6 months.',
    eta: 'Q4 2026',
    benefits: [
      { icon: 'camera',   label: 'Snap to add',   sub: 'Tap a hanger, done' },
      { icon: 'sparkle',  label: 'Outfit AI',     sub: 'What pairs with this?' },
      { icon: 'eye',      label: 'Idle-wear log', sub: 'You haven\'t worn this in 8 mo' },
    ],
    preview: {
      kind: 'grid',
      items: [
        { label: '47',  sub: 'tops · 12 worn this mo' },
        { label: '11',  sub: 'idle 6+ months' },
        { label: '3',   sub: 'capsule pieces' },
      ],
    },
  },

  // ── Memory ──
  travel: {
    id: 'travel',
    name: 'Travel',
    category: 'Memory',
    hue: 200,
    icon: 'compass',
    tagline: 'Trips, packing, docs in one place',
    description: 'Trip plans + bookings + docs. Packing lists per destination. Spend tracking on the road. Photos auto-organised by trip.',
    eta: 'Q2 2026',
    benefits: [
      { icon: 'briefcase', label: 'Packing AI',     sub: 'Per destination, per weather' },
      { icon: 'shield',    label: 'Docs vault',     sub: 'Visa, ticket, hotel · offline' },
      { icon: 'wallet',    label: 'On-trip spend',  sub: 'Live currency conversion' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'Goa · 4 nights',        sub: 'in 3 weeks',   right: '4 paxx' },
        { label: 'Coorg · weekend',       sub: 'in 12 days',   right: 'just us' },
        { label: 'Tokyo · honeymoon',     sub: 'in 8 months',  right: 'planning' },
      ],
    },
  },
  achievements: {
    id: 'achievements',
    name: 'Achievements',
    category: 'Memory',
    hue: 60,
    icon: 'sparkles',
    tagline: 'Badges, streaks, milestones',
    description: 'Unlocked when you hit meaningful thresholds. Visual museum of your year. Shareable cards for milestones that matter.',
    eta: 'Q2 2026',
    benefits: [
      { icon: 'sparkle', label: 'Earned, not given', sub: 'Real thresholds, not vanity' },
      { icon: 'eye',     label: 'Visual museum',     sub: 'Your year on one wall' },
      { icon: 'family',  label: 'Family share',      sub: 'Celebrate Anya\'s 100-day streak' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: '42-day streak',     sub: 'Earned today',    right: '🔥' },
        { label: 'First Focus session',sub: 'last month',     right: '🌱' },
        { label: '1000 books read',   sub: 'lifetime · 312 to go', right: '📚' },
      ],
    },
  },
  bucketlist: {
    id: 'bucketlist',
    name: 'Bucket List',
    category: 'Memory',
    hue: 320,
    icon: 'target',
    tagline: 'Dream → step → done',
    description: 'Big aspirations broken into the next concrete step. Nik nudges quarterly: are you still on this path? Visual progress for the long ones.',
    eta: 'Q3 2026',
    benefits: [
      { icon: 'sparkles', label: 'Dream to plan',  sub: 'Decompose into steps' },
      { icon: 'calendar', label: 'Quarterly check', sub: 'Still want this?' },
      { icon: 'check',    label: 'Mark and frame', sub: 'Done items become memories' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'Run a marathon',  sub: '3 of 7 milestones',   right: 'on track' },
        { label: 'Live in Japan',   sub: '0 of 12 · early',     right: 'dreaming' },
        { label: 'Learn tabla',     sub: '6 mo in · solid',     right: 'on track' },
      ],
    },
  },
  timecapsule: {
    id: 'timecapsule',
    name: 'Time Capsule',
    category: 'Memory',
    hue: 150,
    icon: 'clock',
    tagline: 'Letters to your future self',
    description: 'Write today. Open in 1, 5, 10, 25 years. Photo + voice + text capsules. Nik delivers them on the right day.',
    eta: 'Q3 2026',
    benefits: [
      { icon: 'lock',     label: 'Sealed until date', sub: 'Even from yourself' },
      { icon: 'mic',      label: 'Voice + photo',    sub: 'Not just text' },
      { icon: 'family',   label: 'For others too',   sub: 'Letter to Anya, age 18' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'To Anya, age 18',  sub: 'opens Jun 2036',   right: '10 yrs' },
        { label: 'To me, age 50',    sub: 'opens Jul 2040',    right: '14 yrs' },
        { label: 'Wedding day',      sub: 'opens Dec 2030',    right: '4 yrs' },
      ],
    },
    whyItMatters: 'Reading something you wrote 10 years ago is the closest thing to time travel.',
  },
  photos: {
    id: 'photos',
    name: 'Photos',
    category: 'Memory',
    hue: 30,
    icon: 'camera',
    tagline: 'Your roll, organised',
    description: 'Surfaces the favourites. On-this-day. Auto-grouped trips. Hides the duplicates and screenshots. Connects to Apple Photos / Google Photos.',
    eta: 'Q3 2026',
    benefits: [
      { icon: 'eye',     label: 'Best of yesterday', sub: 'Top 3 photos surface' },
      { icon: 'sparkle', label: 'On this day',      sub: '5 / 10 years ago today' },
      { icon: 'close',   label: 'Auto-clean',       sub: 'Duplicates + blurry' },
    ],
    preview: {
      kind: 'grid',
      items: [
        { label: '12,840', sub: 'photos lifetime' },
        { label: '4 trips', sub: 'this year' },
        { label: '128',     sub: 'screenshots to clean' },
      ],
    },
  },

  // ── Work ──
  projects: {
    id: 'projects',
    name: 'Projects',
    category: 'Work',
    hue: 220,
    icon: 'briefcase',
    tagline: 'Active sprints, no project tax',
    description: 'A weightless project tracker for personal use. Active project list, weekly cadence, decision log. No tickets, no Jira.',
    eta: 'Q3 2026',
    benefits: [
      { icon: 'target',   label: '~3 active', sub: 'Force-rank, no infinite WIP' },
      { icon: 'calendar', label: 'Weekly cadence', sub: 'Sunday plan, Friday recap' },
      { icon: 'sparkle',  label: 'Decision log', sub: 'Why we did what we did' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'Nik public beta',  sub: 'wk 14 · ship in 4 wks', right: '34%' },
        { label: 'Home renovation',  sub: 'paused · wait for monsoon', right: 'on hold' },
        { label: 'Weekend essay',    sub: '3 drafts in · revising', right: 'wk 3' },
      ],
    },
  },
  calendar: {
    id: 'calendar',
    name: 'Calendar',
    category: 'Work',
    hue: 280,
    icon: 'calendar',
    tagline: 'Today, week, agenda — without the noise',
    description: 'Pulls from Google + Apple. Strips spam invites. Surfaces conflicts before they bite. Auto-blocks focus + family time.',
    eta: 'Q2 2026',
    benefits: [
      { icon: 'eye',     label: 'Conflict scan',   sub: 'Double-booking · travel time' },
      { icon: 'shield',  label: 'Auto-block',      sub: 'Focus + family time defended' },
      { icon: 'sparkle', label: 'Pre-meeting prep', sub: 'Notes 2 min before' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: '3pm Design review · Priya', sub: 'in 1h 15m · prep notes ready', right: '45 min' },
        { label: '5pm Pickup Anya',            sub: 'auto-blocked',                  right: '30 min' },
        { label: '7:30pm Family dinner',       sub: 'every Tue · auto',              right: '90 min' },
      ],
    },
  },
  career: {
    id: 'career',
    name: 'Career',
    category: 'Work',
    hue: 150,
    icon: 'trend',
    tagline: 'The arc, not just the day',
    description: 'Year-end review prep · interview prep · references vault · skill stack tracking. The career stuff that\'s usually scattered across docs.',
    eta: 'Q3 2026',
    benefits: [
      { icon: 'sparkle',  label: 'Year-end pack', sub: 'Wins · stretches · asks' },
      { icon: 'briefcase',label: 'Interview prep', sub: 'Companies · loops · questions' },
      { icon: 'shield',   label: 'References vault', sub: 'Who said what about you' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'Mid-year review',  sub: 'in 6 weeks · draft started', right: 'prep' },
        { label: 'Promo packet',     sub: 'Q4 · 28 wins logged',         right: 'queue' },
        { label: 'Reference roster', sub: '4 strong · 2 stretch',         right: 'maintain' },
      ],
    },
  },
  sideprojects: {
    id: 'sideprojects',
    name: 'Side Projects',
    category: 'Work',
    hue: 25,
    icon: 'sparkle',
    tagline: 'Repos, ideas, weekly cadence',
    description: 'Pull from GitHub. Track open PRs across personal repos. Idea inbox. Weekly cadence reminder.',
    eta: 'Q4 2026',
    benefits: [
      { icon: 'sparkle', label: 'Idea inbox',      sub: 'Quick capture, weekly review' },
      { icon: 'refresh', label: 'GitHub PR tracker', sub: 'Across all your repos' },
      { icon: 'calendar',label: 'Sat morning cadence', sub: '2 hours, every week' },
    ],
    preview: {
      kind: 'list',
      items: [
        { label: 'nik (this app)', sub: '3 PRs open · me',  right: 'shipping' },
        { label: 'taut (CLI)',     sub: '14 stars · idle 2 mo', right: 'reboot?' },
        { label: 'Idea inbox',     sub: '7 unreviewed',         right: 'Sat triage' },
      ],
    },
  },
};

const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

export default function ComingSoonScreen({ state, setState, onNav }: ScreenProps) {
  const cfg: ComingSoonConfig | undefined = (state as any)?.comingSoonConfig
    || COMING_SOON_CONFIGS[(state as any)?.comingSoon?.toLowerCase?.() ?? ''];

  if (!cfg) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-2)' }}>
        <div className="display" style={{ fontSize: 22 }}>Nothing to preview</div>
        <div onClick={() => onNav('more')} className="tap" style={{
          marginTop: 16, padding: '10px 18px', borderRadius: 12,
          display: 'inline-block', background: 'var(--surface)', border: '1px solid var(--hairline)',
        }}>← Back to More</div>
      </div>
    );
  }

  const Ic = I[cfg.icon] || I.sparkle;
  const close = () => setState?.((x) => ({ ...x, screen: 'more' as any, comingSoon: null, comingSoonConfig: null } as any));
  const notify = () => setState?.((x) => ({ ...x, comingSoonNotified: cfg.id } as any));

  return (
    <div style={{ padding: '8px 16px 100px', color: 'var(--fg)' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div onClick={close} className="tap" style={{
          width: 36, height: 36, borderRadius: 12,
          background: 'var(--surface)', border: '1px solid var(--hairline)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <I.chevL size={16} stroke="var(--fg)"/>
        </div>
        <Chip tone="accent" size="sm">{cfg.eta}</Chip>
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }}
        className="glass scanlines"
        style={{
          padding: 22, borderRadius: 22, position: 'relative', overflow: 'hidden',
          background: `linear-gradient(135deg, oklch(0.78 0.16 ${cfg.hue} / 0.28), oklch(0.55 0.22 ${cfg.hue + 60} / 0.10))`,
          borderColor: `oklch(0.78 0.16 ${cfg.hue} / 0.4)`, marginBottom: 20,
        }}
      >
        <HUDCorner position="tl"/><HUDCorner position="tr"/>
        <HUDCorner position="bl"/><HUDCorner position="br"/>
        <div style={{
          width: 64, height: 64, borderRadius: 18, marginBottom: 14,
          background: `linear-gradient(135deg, oklch(0.78 0.16 ${cfg.hue}), oklch(0.55 0.22 ${cfg.hue + 60}))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 24px oklch(0.78 0.16 ${cfg.hue} / 0.5)`,
        }}>
          <Ic size={28} stroke="#06060a" sw={2.2}/>
        </div>
        <div style={{ fontSize: 10, color: `oklch(0.85 0.14 ${cfg.hue})`, letterSpacing: 2, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
          {cfg.category.toUpperCase()} · COMING {cfg.eta.toUpperCase()}
        </div>
        <div className="display" style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.05, letterSpacing: -0.5 }}>
          {cfg.name}
        </div>
        <div className="display" style={{ fontSize: 17, fontWeight: 400, color: `oklch(0.92 0.12 ${cfg.hue})`, marginTop: 6, lineHeight: 1.3 }}>
          {cfg.tagline}
        </div>
        <div style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.55, marginTop: 12 }}>
          {cfg.description}
        </div>
      </motion.div>

      {/* What it'll do */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)' }}>WHAT IT'LL DO</div>
        <div className="display" style={{ fontSize: 16, fontWeight: 500, color: 'var(--fg-2)', marginTop: 2, marginBottom: 12 }}>
          The promise
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cfg.benefits.map((b, i) => {
            const BIc = I[b.icon] || I.sparkle;
            return (
              <motion.div
                key={b.label} custom={i} variants={variants} initial="hidden" animate="visible"
                className="glass" style={{
                  padding: 14, borderRadius: 14,
                  display: 'flex', gap: 12, alignItems: 'center',
                  borderColor: `oklch(0.78 0.16 ${cfg.hue} / 0.18)`,
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                  background: `oklch(0.78 0.16 ${cfg.hue} / 0.18)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <BIc size={16} stroke={`oklch(0.92 0.14 ${cfg.hue})`}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg)' }}>{b.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 2 }}>{b.sub}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Mock preview */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)' }}>SNEAK PEEK</div>
        <div className="display" style={{ fontSize: 16, fontWeight: 500, color: 'var(--fg-2)', marginTop: 2, marginBottom: 12 }}>
          What you'll see
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] as any }}
          className="glass" style={{
            padding: 16, borderRadius: 18, position: 'relative',
            background: `linear-gradient(180deg, oklch(0.78 0.16 ${cfg.hue} / 0.05), transparent 70%)`,
            borderColor: `oklch(0.78 0.16 ${cfg.hue} / 0.2)`,
          }}
        >
          {cfg.preview.kind === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cfg.preview.items.length}, 1fr)`, gap: 10 }}>
              {cfg.preview.items.map((it, i) => (
                <motion.div key={i} custom={i} variants={variants} initial="hidden" animate="visible"
                  style={{
                    padding: 12, borderRadius: 12, textAlign: 'center',
                    background: `oklch(0.78 0.16 ${cfg.hue} / 0.08)`,
                    border: `1px solid oklch(0.78 0.16 ${cfg.hue} / 0.15)`,
                  }}>
                  <div className="display" style={{ fontSize: 22, fontWeight: 600, color: `oklch(0.92 0.14 ${cfg.hue})` }}>{it.label}</div>
                  {it.sub && <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5, marginTop: 4 }}>{it.sub}</div>}
                </motion.div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cfg.preview.items.map((it, i) => (
                <motion.div key={i} custom={i} variants={variants} initial="hidden" animate="visible"
                  style={{
                    padding: 10, borderRadius: 10,
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: `oklch(0.78 0.16 ${cfg.hue} / 0.05)`,
                    border: `1px solid oklch(0.78 0.16 ${cfg.hue} / 0.12)`,
                  }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{it.label}</div>
                    {it.sub && <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{it.sub}</div>}
                  </div>
                  {it.right && (
                    <div style={{
                      fontSize: 10, padding: '3px 8px', borderRadius: 99,
                      background: `oklch(0.78 0.16 ${cfg.hue} / 0.18)`,
                      color: `oklch(0.92 0.14 ${cfg.hue})`,
                      fontFamily: 'var(--font-mono)', letterSpacing: 0.3, flexShrink: 0,
                    }}>{it.right}</div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Why it matters */}
      {cfg.whyItMatters && (
        <div style={{ marginBottom: 22 }}>
          <div className="glass" style={{
            padding: 16, borderRadius: 14,
            background: `linear-gradient(135deg, oklch(0.78 0.16 ${cfg.hue} / 0.08), transparent 80%)`,
            borderColor: `oklch(0.78 0.16 ${cfg.hue} / 0.18)`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <I.sparkle size={12} stroke={`oklch(0.92 0.14 ${cfg.hue})`}/>
              <span style={{ fontSize: 9, color: `oklch(0.92 0.14 ${cfg.hue})`, fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}>
                WHY THIS MATTERS
              </span>
            </div>
            <div className="display" style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg)', lineHeight: 1.5 }}>
              {cfg.whyItMatters}
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <div onClick={notify} className="tap" style={{
          padding: '14px 20px', borderRadius: 14, textAlign: 'center',
          background: `linear-gradient(135deg, oklch(0.78 0.16 ${cfg.hue}), oklch(0.55 0.22 ${cfg.hue + 60}))`,
          color: '#06060a', fontWeight: 600, fontSize: 14,
          boxShadow: `0 0 20px oklch(0.78 0.16 ${cfg.hue} / 0.4)`,
        }}>
          {(state as any)?.comingSoonNotified === cfg.id ? '✓ You\'ll be notified' : 'Notify me when it ships'}
        </div>
        <div onClick={close} className="tap" style={{
          padding: '12px 20px', borderRadius: 14, textAlign: 'center',
          background: 'transparent', border: '1px solid var(--hairline)',
          color: 'var(--fg-2)', fontSize: 13,
        }}>
          Back to More
        </div>
      </motion.div>
    </div>
  );
}
