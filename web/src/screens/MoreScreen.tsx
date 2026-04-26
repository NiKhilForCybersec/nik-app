/* Nik — More: full dashboard catalog (bento, categorised, searchable) */
import { useMemo, useState } from 'react';
import type { ScreenProps, ScreenId } from '../App';
import { I } from '../components/icons';
import { COMING_SOON_CONFIGS } from './ComingSoonScreen';

type ImplementedId = Extract<ScreenId,
  | 'home' | 'chat' | 'habits' | 'fitness' | 'profile' | 'familyops'
  | 'circle' | 'meds' | 'diary' | 'focus' | 'score' | 'sleep'
  | 'money' | 'brief' | 'vault' | 'errands' | 'couple' | 'kids'
  | 'onboard' | 'settings' | 'quests' | 'widgets' | 'stats'
>;

type MoreItem = {
  id: ImplementedId | string;       // string => "coming soon" placeholder
  icon: string;
  label: string;
  sub: string;
  hue: number;
  tag?: 'NEW' | 'SOON' | 'BETA';
  pinned?: boolean;
};

type Category = {
  id: string;
  title: string;
  subtitle: string;
  items: MoreItem[];
};

const CATEGORIES: Category[] = [
  {
    id: 'pinned',
    title: 'Pinned',
    subtitle: 'Your daily companions',
    items: [
      { id: 'brief',  icon: 'sparkle',  label: 'Daily Brief',  sub: 'Audio · curated · today',           hue: 220, tag: 'NEW', pinned: true },
      { id: 'diary',  icon: 'book',     label: 'Diary',        sub: 'Entries · mood · search',           hue: 280, tag: 'NEW', pinned: true },
      { id: 'focus',  icon: 'target',   label: 'Focus Mode',   sub: 'Sessions · sounds · timer',         hue: 150, tag: 'NEW', pinned: true },
      { id: 'score',  icon: 'sparkle',  label: 'Nik Score',    sub: 'Pillars · trend · backlog',         hue: 200, tag: 'NEW', pinned: true },
    ],
  },
  {
    id: 'health',
    title: 'Health',
    subtitle: 'Body, sleep, nutrition',
    items: [
      { id: 'meds',         icon: 'pill',      label: 'Meds',           sub: 'Schedules · Rx · adherence',  hue: 25 },
      { id: 'sleep',        icon: 'moon',      label: 'Sleep',          sub: 'Stages · dreams · wind-down', hue: 280 },
      { id: 'fitness',      icon: 'dumbbell',  label: 'Fitness',        sub: 'Coach · library · plan',      hue: 30 },
      { id: 'hydration',    icon: 'water',     label: 'Hydration',      sub: 'ml today · goal · history',   hue: 200, tag: 'NEW' },
      { id: 'nutrition',    icon: 'utensils',  label: 'Nutrition',      sub: 'Macros · meals · deficit',    hue: 60,  tag: 'NEW' },
      { id: 'cycle',        icon: 'refresh',   label: 'Cycle',          sub: 'Phase · symptoms · pred.',    hue: 320, tag: 'NEW' },
      { id: 'symptoms',     icon: 'alert',     label: 'Symptoms',       sub: 'Log + AI pattern find',       hue: 25,  tag: 'NEW' },
      { id: 'doctors',      icon: 'briefcase', label: 'Care Team',      sub: 'Doctors · history · insurance', hue: 200, tag: 'NEW' },
    ],
  },
  {
    id: 'mind',
    title: 'Mind',
    subtitle: 'Reflection, growth, focus',
    items: [
      { id: 'reading',      icon: 'book',      label: 'Reading',        sub: 'Books · highlights · queue',  hue: 280, tag: 'NEW' },
      { id: 'learning',     icon: 'brain',     label: 'Learning',       sub: 'Courses · streaks · goals',   hue: 220, tag: 'NEW' },
      { id: 'gratitude',    icon: 'heart',     label: 'Gratitude',      sub: 'Daily · 3 things',            hue: 320, tag: 'NEW' },
      { id: 'goals',        icon: 'target',    label: 'Goals',          sub: 'Year · quarter · this week',  hue: 150, tag: 'NEW' },
      { id: 'reflection',   icon: 'sparkle',   label: 'Reflection',     sub: 'Weekly · monthly · yearly',   hue: 200, tag: 'NEW' },
      { id: 'languages',    icon: 'globe',     label: 'Languages',      sub: 'Decks · streaks · listen',    hue: 60,  tag: 'NEW' },
    ],
  },
  {
    id: 'people',
    title: 'People',
    subtitle: 'The circle around you',
    items: [
      { id: 'circle',       icon: 'family',    label: 'Family Circle',  sub: 'Members · sharing · presence', hue: 150 },
      { id: 'familyops',    icon: 'users',     label: 'Family Ops',     sub: 'Tasks · alarms · routines',   hue: 220 },
      { id: 'couple',       icon: 'heart',     label: 'Couple',         sub: 'Notes · gratitude · dates',   hue: 320 },
      { id: 'kids',         icon: 'family',    label: 'Kids View',      sub: 'Routines · stars · rewards',  hue: 30 },
      { id: 'friends',      icon: 'users',     label: 'Friends',        sub: 'Touch · plans · birthdays',   hue: 280, tag: 'NEW' },
      { id: 'network',      icon: 'briefcase', label: 'Network',        sub: 'Reach-outs · intros',         hue: 220, tag: 'NEW' },
      { id: 'pets',         icon: 'heart',     label: 'Pets',           sub: 'Vet · meds · feeding',        hue: 60,  tag: 'NEW' },
      { id: 'birthdays',    icon: 'calendar',  label: 'Birthdays',      sub: 'Upcoming · gifts · cards',    hue: 320, tag: 'NEW' },
    ],
  },
  {
    id: 'money',
    title: 'Money',
    subtitle: 'Spend, save, plan',
    items: [
      { id: 'money',        icon: 'wallet',    label: 'Money',          sub: 'Budgets · bills · txns',      hue: 150 },
      { id: 'bills',        icon: 'mail',      label: 'Bills',          sub: 'Recurring · auto · alerts',   hue: 25,  tag: 'NEW' },
      { id: 'subscriptions',icon: 'refresh',   label: 'Subscriptions',  sub: 'Audit · cancel · save',       hue: 200, tag: 'NEW' },
      { id: 'investments',  icon: 'trend',     label: 'Investments',    sub: 'Portfolio · trends',          hue: 150, tag: 'NEW' },
      { id: 'receipts',     icon: 'mail',      label: 'Receipts',       sub: 'Scan · categorise · taxes',   hue: 60,  tag: 'NEW' },
    ],
  },
  {
    id: 'home',
    title: 'Home & Errands',
    subtitle: 'Day-to-day operations',
    items: [
      { id: 'errands',      icon: 'shopping',  label: 'Errands',        sub: 'Routes · GPS · shared',       hue: 200 },
      { id: 'shopping',     icon: 'shopping',  label: 'Shopping',       sub: 'Lists · stores · history',    hue: 280, tag: 'NEW' },
      { id: 'recipes',      icon: 'utensils',  label: 'Recipes',        sub: 'Save · cook · plan week',     hue: 30,  tag: 'NEW' },
      { id: 'maintenance',  icon: 'settings',  label: 'Home',           sub: 'Filters · service · warranty',hue: 220, tag: 'NEW' },
      { id: 'plants',       icon: 'flame',     label: 'Plants',         sub: 'Water · sun · health',        hue: 150, tag: 'NEW' },
      { id: 'wardrobe',     icon: 'shopping',  label: 'Wardrobe',       sub: 'Outfits · capsule · laundry', hue: 320, tag: 'NEW' },
    ],
  },
  {
    id: 'memory',
    title: 'Memory',
    subtitle: 'Hold onto what matters',
    items: [
      { id: 'vault',        icon: 'lock',      label: 'Vault',          sub: 'Photos · voice · on-this-day',hue: 280 },
      { id: 'travel',       icon: 'compass',   label: 'Travel',         sub: 'Trips · packing · docs',      hue: 200, tag: 'NEW' },
      { id: 'achievements', icon: 'sparkles',  label: 'Achievements',   sub: 'Badges · streaks · level',    hue: 60,  tag: 'NEW' },
      { id: 'bucketlist',   icon: 'target',    label: 'Bucket List',    sub: 'Dreams · steps · done',       hue: 320, tag: 'NEW' },
      { id: 'timecapsule',  icon: 'clock',     label: 'Time Capsule',   sub: 'Letters · sealed · open in N',hue: 150, tag: 'NEW' },
      { id: 'photos',       icon: 'camera',    label: 'Photos',         sub: 'Roll · favourites · timeline',hue: 30,  tag: 'NEW' },
    ],
  },
  {
    id: 'work',
    title: 'Work',
    subtitle: 'Projects, career, time',
    items: [
      { id: 'projects',     icon: 'briefcase', label: 'Projects',       sub: 'Active · sprints · log',      hue: 220, tag: 'NEW' },
      { id: 'calendar',     icon: 'calendar',  label: 'Calendar',       sub: 'Today · week · agenda',       hue: 280, tag: 'NEW' },
      { id: 'career',       icon: 'trend',     label: 'Career',         sub: 'Goals · review · next role',  hue: 150, tag: 'NEW' },
      { id: 'sideprojects', icon: 'sparkle',   label: 'Side Projects',  sub: 'Repos · ideas · cadence',     hue: 25,  tag: 'NEW' },
    ],
  },
  {
    id: 'tools',
    title: 'Tools',
    subtitle: 'App settings & utilities',
    items: [
      { id: 'profile',      icon: 'user',      label: 'Profile',        sub: 'Themes · connect · about',    hue: 280 },
      { id: 'settings',     icon: 'settings',  label: 'Settings',       sub: 'Density · notif · privacy',   hue: 220 },
      { id: 'widgets',      icon: 'grid',      label: 'Widgets',        sub: 'Edit home canvas',            hue: 200 },
      { id: 'stats',        icon: 'stats',     label: 'Growth',         sub: 'Weekly insights',             hue: 150 },
      { id: 'quests',       icon: 'sword',     label: 'Quests',         sub: 'Daily log · auto · XP',       hue: 30 },
      { id: 'chat',         icon: 'mic',       label: 'Ask Nik',        sub: 'Voice · text · suggestions',  hue: 220 },
      { id: 'onboard',      icon: 'sparkle',   label: 'Setup Flow',     sub: 'Replay onboarding',           hue: 60 },
      { id: 'habits',       icon: 'check',     label: 'Habits',         sub: 'Rituals · auto · streaks',    hue: 150 },
    ],
  },
];

const ALL_ITEMS = CATEGORIES.flatMap(c => c.items.map(it => ({ ...it, category: c.title })));

const isImplemented = (id: string) =>
  ['home','chat','habits','fitness','profile','familyops','circle','family','meds','diary',
   'focus','score','sleep','money','brief','vault','errands','couple','kids','onboard',
   'settings','quests','widgets','stats','more',
   // Phase C — items-backed dashboards
   'reading','shopping','birthdays','hydration','calendar','cycle',
   'nutrition','symptoms','doctors',
   'learning','gratitude','goals','reflection','languages',
   'friends','network','pets',
   'bills','subscriptions','investments','receipts',
   'recipes','maintenance','plants','wardrobe',
   'travel','achievements','bucketlist','timecapsule','photos',
   'projects','career','sideprojects',
  ].includes(id);

export default function MoreScreen({ onNav, setState }: ScreenProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return ALL_ITEMS.filter(it =>
      it.label.toLowerCase().includes(q) ||
      it.sub.toLowerCase().includes(q) ||
      it.category.toLowerCase().includes(q),
    );
  }, [search]);

  const handleTap = (item: MoreItem) => {
    if (isImplemented(item.id)) {
      onNav(item.id as ScreenId);
      return;
    }
    // Navigate to the premium ComingSoon page with the item's tailored config.
    if (!setState) return;
    const cfg = COMING_SOON_CONFIGS[item.id];
    setState((x: any) => ({
      ...x,
      screen: 'comingsoon',
      comingSoon: item.label,
      comingSoonConfig: cfg ?? {
        id: item.id, name: item.label, category: 'Coming soon',
        hue: item.hue, icon: item.icon, eta: 'Q4 2026',
        tagline: item.sub, description: 'This dashboard is on the roadmap. Tap notify to be the first to try it.',
        benefits: [], preview: { kind: 'list' as const, items: [] },
      },
    }));
  };

  return (
    <div style={{ padding: '8px 16px 100px', color: 'var(--fg)' }}>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)' }}>
          {ALL_ITEMS.length} DASHBOARDS · {CATEGORIES.length} CATEGORIES
        </div>
        <div className="display" style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.05, marginTop: 4, letterSpacing: -0.5 }}>
          Everything Nik can do
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 6, lineHeight: 1.5 }}>
          Tap any tile to open. Stuff marked <b style={{ color: 'oklch(0.85 0.14 var(--hue))' }}>SOON</b> is on the roadmap.
        </div>
      </div>

      {/* Search */}
      <div className="glass" style={{
        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
        borderRadius: 14,
      }}>
        <I.search size={16} stroke="var(--fg-3)"/>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search dashboards…"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--fg)', fontSize: 14, fontFamily: 'var(--font-body)',
          }}
        />
        {search && (
          <div className="tap" onClick={() => setSearch('')} style={{ color: 'var(--fg-3)', fontSize: 12 }}>✕</div>
        )}
      </div>

      {/* Filtered results */}
      {filtered ? (
        <div>
          <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: 1.5, fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
            {filtered.length} MATCH{filtered.length === 1 ? '' : 'ES'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {filtered.map(it => <Tile key={it.id + it.label} item={it} onTap={() => handleTap(it)}/>)}
          </div>
        </div>
      ) : (
        <>
          {CATEGORIES.map(cat => (
            <div key={cat.id} style={{ marginBottom: 24 }}>
              <div style={{
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10,
              }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)' }}>
                    {cat.title.toUpperCase()}
                  </div>
                  <div className="display" style={{ fontSize: 16, fontWeight: 500, color: 'var(--fg-2)', marginTop: 2 }}>
                    {cat.subtitle}
                  </div>
                </div>
                <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
                  {cat.items.length}
                </div>
              </div>
              {cat.id === 'pinned' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {cat.items.map(it => <PinnedTile key={it.id + it.label} item={it} onTap={() => handleTap(it)}/>)}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {cat.items.map(it => <Tile key={it.id + it.label} item={it} onTap={() => handleTap(it)}/>)}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

const Tile = ({ item, onTap }: { item: MoreItem; onTap: () => void }) => {
  const Ic = I[item.icon] || I.grid;
  const soon = item.tag === 'SOON';
  return (
    <div onClick={onTap} className="glass tap fade-up" style={{
      padding: 12, borderRadius: 14,
      display: 'flex', gap: 10, alignItems: 'center', minWidth: 0,
      opacity: soon ? 0.72 : 1,
      borderColor: soon ? undefined : `oklch(0.78 0.16 ${item.hue} / 0.18)`,
      background: soon ? undefined : `linear-gradient(135deg, oklch(0.78 0.16 ${item.hue} / 0.06), transparent 70%)`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: `oklch(0.78 0.16 ${item.hue} / 0.18)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Ic size={16} stroke={`oklch(0.9 0.14 ${item.hue})`}/>
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.label}
          </div>
          {item.tag && (
            <div style={{
              fontSize: 8, padding: '1px 5px', borderRadius: 99,
              background: item.tag === 'SOON'
                ? 'oklch(1 0 0 / 0.06)'
                : `oklch(0.78 0.16 ${item.hue} / 0.25)`,
              color: item.tag === 'SOON'
                ? 'var(--fg-3)'
                : `oklch(0.9 0.14 ${item.hue})`,
              fontFamily: 'var(--font-mono)', letterSpacing: 0.5, flexShrink: 0,
            }}>{item.tag}</div>
          )}
        </div>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.sub}
        </div>
      </div>
    </div>
  );
};

const PinnedTile = ({ item, onTap }: { item: MoreItem; onTap: () => void }) => {
  const Ic = I[item.icon] || I.grid;
  return (
    <div onClick={onTap} className="glass tap fade-up scanlines" style={{
      padding: 14, borderRadius: 18, position: 'relative', overflow: 'hidden',
      aspectRatio: '1 / 1',
      background: `linear-gradient(135deg, oklch(0.78 0.16 ${item.hue} / 0.22), oklch(0.55 0.22 ${item.hue + 60} / 0.12))`,
      borderColor: `oklch(0.78 0.16 ${item.hue} / 0.4)`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: `oklch(0.78 0.16 ${item.hue} / 0.3)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 12px oklch(0.78 0.16 ${item.hue} / 0.4)`,
        }}>
          <Ic size={18} stroke={`oklch(0.95 0.12 ${item.hue})`}/>
        </div>
        {item.tag && (
          <div style={{
            fontSize: 8, padding: '2px 6px', borderRadius: 99,
            background: `oklch(0.78 0.16 ${item.hue} / 0.3)`,
            color: `oklch(0.95 0.14 ${item.hue})`,
            fontFamily: 'var(--font-mono)', letterSpacing: 0.5,
          }}>{item.tag}</div>
        )}
      </div>
      <div className="display" style={{
        fontSize: 18, fontWeight: 500, marginTop: 'auto',
        position: 'absolute', bottom: 38, left: 14, right: 14,
        color: 'var(--fg)',
      }}>{item.label}</div>
      <div style={{
        position: 'absolute', bottom: 14, left: 14, right: 14,
        fontSize: 10, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5,
      }}>{item.sub}</div>
    </div>
  );
};
