/* Nik — kind-aware item rendering profiles.
 *
 * Each `ItemKind` (reading, bills, plants, birthdays, …) gets a
 * profile that tells ItemsListScreen + ListPreview widget how to
 * display its items in a domain-rich way: header stats, primary
 * metric per row, enriched meta line, quick actions.
 *
 * Adding a new domain = one entry in KIND_PROFILES. Falls back to
 * the generic profile for any kind that hasn't been customised yet.
 */

import React from 'react';
import type { Item } from '../../contracts/items';
import { I } from '../icons';

export type HeaderStat = {
  label: string;
  value: string;
  hue?: number;
};

export type RowAccent = {
  /** Big label on the right (e.g. "$50", "5d", "Sat"). */
  badge?: string;
  /** Optional small icon next to the title. */
  inlineIcon?: keyof typeof I;
  /** Hue override for this row. */
  hue?: number;
  /** Row tone — 'urgent' renders red-tinted; 'soon' amber; default neutral. */
  tone?: 'default' | 'soon' | 'urgent' | 'ok';
  /** Sub-line below the title (replaces body / meta). */
  sub?: React.ReactNode;
};

export type KindProfile = {
  /** "$" / "books" / etc. — singular noun for empty state copy. */
  noun: string;
  /** Header summary stats — small chip row above the list. */
  headerStats?: (items: Item[]) => HeaderStat[];
  /** Per-row accent: badge + tone + sub. */
  row?: (item: Item) => RowAccent;
  /** Additional fields shown in the add row (after title). Returns
   *  controls; each control should manage its own state via the parent
   *  setMeta callback. */
  addExtras?: (ctx: AddCtx) => React.ReactNode;
  /** Sort comparator. Default: createdAt desc. */
  sort?: (a: Item, b: Item) => number;
};

export type AddCtx = {
  meta: Record<string, unknown>;
  setMeta: (next: Record<string, unknown>) => void;
  hue: number;
};

// ── Helpers ────────────────────────────────────────────────────

const day = 86_400_000;
const daysUntil = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  return Math.round((new Date(iso).getTime() - Date.now()) / day);
};
const money = (n: unknown): string | null => {
  if (typeof n !== 'number' || !isFinite(n)) return null;
  return n >= 1000
    ? `$${(n / 1000).toFixed(1)}k`
    : `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;
};
const meta = <T = unknown>(item: Item, key: string): T | undefined =>
  (item.meta as Record<string, unknown>)[key] as T | undefined;

// ── Profiles ──────────────────────────────────────────────────

const reading: KindProfile = {
  noun: 'book',
  headerStats: (items) => {
    const reading = items.filter((i) => i.status !== 'done').length;
    const finished = items.filter((i) => i.status === 'done').length;
    const totalPages = items.reduce((s, i) => s + (Number(meta(i, 'pages') ?? 0) || 0), 0);
    return [
      { label: 'IN PROGRESS', value: String(reading), hue: 280 },
      { label: 'FINISHED', value: String(finished), hue: 150 },
      ...(totalPages ? [{ label: 'TOTAL PAGES', value: String(totalPages), hue: 220 }] : []),
    ];
  },
  row: (item) => {
    const author = meta<string>(item, 'author');
    const progress = meta<number>(item, 'progress');
    const pages = meta<number>(item, 'pages');
    return {
      sub: author ? <span>by {author}{pages ? ` · ${pages}p` : ''}</span> : pages ? <span>{pages} pages</span> : undefined,
      badge: progress != null ? `${Math.round(progress * 100)}%` : undefined,
    };
  },
  addExtras: ({ meta, setMeta, hue }) => (
    <input
      placeholder="author"
      value={(meta.author as string) ?? ''}
      onChange={(e) => setMeta({ ...meta, author: e.target.value })}
      style={miniInput(hue)}
    />
  ),
};

const bill: KindProfile = {
  noun: 'bill',
  headerStats: (items) => {
    const open = items.filter((i) => i.status !== 'done');
    const total = open.reduce((s, i) => s + (Number(meta(i, 'amount') ?? 0) || 0), 0);
    const due7 = open.filter((i) => {
      const d = daysUntil(i.occurs_at);
      return d != null && d >= 0 && d <= 7;
    }).length;
    return [
      { label: 'OPEN', value: String(open.length), hue: 25 },
      ...(total ? [{ label: 'TOTAL DUE', value: money(total) || '—', hue: 0 }] : []),
      { label: 'DUE THIS WK', value: String(due7), hue: due7 > 0 ? 25 : 150 },
    ];
  },
  row: (item) => {
    const amount = meta<number>(item, 'amount');
    const days = daysUntil(item.occurs_at);
    const autopay = meta<boolean>(item, 'autopay');
    const tone: RowAccent['tone'] =
      days != null && days < 0 ? 'urgent' :
      days != null && days <= 3 ? 'soon' : 'default';
    return {
      badge: amount != null ? money(amount) ?? undefined : undefined,
      tone,
      sub: (
        <>
          {days != null && (
            <span style={{ color: tone === 'urgent' ? 'oklch(0.78 0.18 25)' : tone === 'soon' ? 'oklch(0.85 0.16 60)' : undefined }}>
              {days < 0 ? `${-days}d overdue` : days === 0 ? 'due today' : `due in ${days}d`}
            </span>
          )}
          {autopay && <span style={{ color: 'oklch(0.78 0.15 150)' }}>· autopay</span>}
        </>
      ),
    };
  },
  addExtras: ({ meta, setMeta, hue }) => (
    <input
      placeholder="$"
      type="number"
      value={(meta.amount as number) ?? ''}
      onChange={(e) => setMeta({ ...meta, amount: e.target.value ? Number(e.target.value) : undefined })}
      style={{ ...miniInput(hue), width: 70 }}
    />
  ),
};

const plant: KindProfile = {
  noun: 'plant',
  headerStats: (items) => {
    const thirsty = items.filter((i) => {
      const last = meta<string>(i, 'lastWatered');
      const interval = (meta<number>(i, 'waterEveryDays') ?? 7);
      if (!last) return true;
      const since = (Date.now() - new Date(last).getTime()) / day;
      return since >= interval;
    }).length;
    return [
      { label: 'PLANTS', value: String(items.length), hue: 130 },
      { label: 'THIRSTY', value: String(thirsty), hue: thirsty > 0 ? 25 : 150 },
    ];
  },
  row: (item) => {
    const last = meta<string>(item, 'lastWatered');
    const interval = meta<number>(item, 'waterEveryDays') ?? 7;
    const sinceDays = last ? Math.floor((Date.now() - new Date(last).getTime()) / day) : null;
    const dueIn = sinceDays != null ? interval - sinceDays : null;
    const tone: RowAccent['tone'] =
      dueIn != null && dueIn < 0 ? 'urgent' :
      dueIn != null && dueIn <= 1 ? 'soon' :
      dueIn == null ? 'soon' : 'default';
    return {
      badge: dueIn != null
        ? (dueIn < 0 ? `+${-dueIn}d` : dueIn === 0 ? 'TODAY' : `${dueIn}d`)
        : 'NEW',
      tone,
      sub: last
        ? <span>last watered {sinceDays}d ago · every {interval}d</span>
        : <span>tap to log first watering</span>,
    };
  },
  addExtras: ({ meta, setMeta, hue }) => (
    <input
      placeholder="every N days"
      type="number"
      value={(meta.waterEveryDays as number) ?? ''}
      onChange={(e) => setMeta({ ...meta, waterEveryDays: e.target.value ? Number(e.target.value) : undefined })}
      style={{ ...miniInput(hue), width: 110 }}
    />
  ),
};

const birthday: KindProfile = {
  noun: 'birthday',
  headerStats: (items) => {
    const within30 = items.filter((i) => {
      const d = nextBirthdayDays(i.occurs_at);
      return d != null && d <= 30;
    }).length;
    return [
      { label: 'TRACKED', value: String(items.length), hue: 300 },
      { label: 'IN 30 DAYS', value: String(within30), hue: within30 > 0 ? 320 : 220 },
    ];
  },
  row: (item) => {
    const d = nextBirthdayDays(item.occurs_at);
    const age = currentAge(item.occurs_at);
    const note = meta<string>(item, 'note');
    const tone: RowAccent['tone'] =
      d != null && d <= 7 ? 'soon' : 'default';
    return {
      badge: d != null ? (d === 0 ? 'TODAY' : d === 1 ? 'TMRW' : `${d}d`) : undefined,
      tone,
      sub: (
        <>
          {age != null && <span>turns {age}</span>}
          {note && <span>· {note}</span>}
        </>
      ),
      inlineIcon: 'sparkle',
    };
  },
  sort: (a, b) => {
    const da = nextBirthdayDays(a.occurs_at) ?? 9999;
    const db = nextBirthdayDays(b.occurs_at) ?? 9999;
    return da - db;
  },
};

const subscription: KindProfile = {
  noun: 'subscription',
  headerStats: (items) => {
    const monthlyTotal = items.reduce((s, i) => {
      const amt = Number(meta(i, 'monthlyAmount') ?? 0) || 0;
      return s + amt;
    }, 0);
    return [
      { label: 'ACTIVE', value: String(items.filter((i) => i.status !== 'done').length), hue: 240 },
      ...(monthlyTotal ? [{ label: '/MONTH', value: money(monthlyTotal) || '—', hue: 25 }] : []),
    ];
  },
  row: (item) => {
    const amt = meta<number>(item, 'monthlyAmount');
    const next = meta<string>(item, 'nextRenewal');
    const days = daysUntil(next ?? item.occurs_at);
    return {
      badge: amt != null ? `${money(amt)}/mo` : undefined,
      sub: days != null ? <span>renews in {days}d</span> : undefined,
    };
  },
  addExtras: ({ meta, setMeta, hue }) => (
    <input
      placeholder="$/mo"
      type="number"
      value={(meta.monthlyAmount as number) ?? ''}
      onChange={(e) => setMeta({ ...meta, monthlyAmount: e.target.value ? Number(e.target.value) : undefined })}
      style={{ ...miniInput(hue), width: 80 }}
    />
  ),
};

const shopping: KindProfile = {
  noun: 'item',
  headerStats: (items) => {
    const open = items.filter((i) => i.status !== 'done').length;
    const done = items.filter((i) => i.status === 'done').length;
    return [
      { label: 'TO BUY', value: String(open), hue: 200 },
      ...(done > 0 ? [{ label: 'GOT IT', value: String(done), hue: 150 }] : []),
    ];
  },
  row: (item) => {
    const qty = meta<number>(item, 'qty');
    return {
      badge: qty != null && qty > 1 ? `×${qty}` : undefined,
    };
  },
};

const recipe: KindProfile = {
  noun: 'recipe',
  row: (item) => ({
    sub: meta<string>(item, 'cuisine') ? <span>{meta<string>(item, 'cuisine')}</span> : undefined,
    badge: meta<number>(item, 'minutes') ? `${meta<number>(item, 'minutes')}m` : undefined,
  }),
};

const goal: KindProfile = {
  noun: 'goal',
  headerStats: (items) => [
    { label: 'OPEN', value: String(items.filter((i) => i.status !== 'done').length), hue: 200 },
    { label: 'DONE', value: String(items.filter((i) => i.status === 'done').length), hue: 150 },
  ],
  row: (item) => {
    const progress = meta<number>(item, 'progress');
    return {
      badge: progress != null ? `${Math.round(progress * 100)}%` : undefined,
    };
  },
};

const nutrition: KindProfile = {
  noun: 'meal',
  headerStats: (items) => {
    const today = items.filter((i) => isToday(i.occurs_at ?? i.created_at));
    const cals = today.reduce((s, i) => s + (Number(meta(i, 'kcal') ?? 0) || 0), 0);
    const protein = today.reduce((s, i) => s + (Number(meta(i, 'protein_g') ?? 0) || 0), 0);
    return [
      { label: 'TODAY', value: String(today.length), hue: 30 },
      { label: 'KCAL', value: String(cals), hue: 25 },
      ...(protein ? [{ label: 'PROTEIN', value: `${protein}g`, hue: 200 }] : []),
    ];
  },
  row: (item) => {
    const kcal = meta<number>(item, 'kcal');
    return { badge: kcal != null ? `${kcal} kcal` : undefined };
  },
};

const symptoms: KindProfile = {
  noun: 'symptom',
  headerStats: (items) => {
    const recent = items.filter((i) => isWithin(i.occurs_at ?? i.created_at, 7));
    return [
      { label: 'LOGGED', value: String(items.length), hue: 0 },
      { label: 'LAST 7D', value: String(recent.length), hue: 25 },
    ];
  },
  row: (item) => {
    const sev = meta<number>(item, 'severity');
    const region = meta<string>(item, 'region');
    return {
      badge: sev != null ? `${sev}/10` : undefined,
      sub: region ? <span>{region}</span> : undefined,
      tone: sev != null && sev >= 7 ? 'urgent' : sev != null && sev >= 4 ? 'soon' : 'default',
    };
  },
};

const learning: KindProfile = {
  noun: 'topic',
  headerStats: (items) => {
    const active = items.filter((i) => i.status !== 'done').length;
    return [{ label: 'ACTIVE', value: String(active), hue: 250 }];
  },
  row: (item) => ({
    sub: meta<string>(item, 'source') ? <span>{meta<string>(item, 'source')}</span> : undefined,
    badge: meta<number>(item, 'progress') != null ? `${Math.round((meta<number>(item, 'progress') as number) * 100)}%` : undefined,
  }),
};

const trip: KindProfile = {
  noun: 'trip',
  headerStats: (items) => {
    const upcoming = items.filter((i) => {
      const d = daysUntil(i.occurs_at);
      return d != null && d >= 0;
    }).length;
    return [
      { label: 'TRIPS', value: String(items.length), hue: 200 },
      { label: 'UPCOMING', value: String(upcoming), hue: 240 },
    ];
  },
  row: (item) => {
    const d = daysUntil(item.occurs_at);
    return {
      badge: d != null ? (d < 0 ? 'past' : d === 0 ? 'TODAY' : `${d}d`) : undefined,
      sub: meta<string>(item, 'destination') ? <span>{meta<string>(item, 'destination')}</span> : undefined,
    };
  },
  sort: (a, b) => {
    const da = daysUntil(a.occurs_at) ?? 9999;
    const db = daysUntil(b.occurs_at) ?? 9999;
    return da - db;
  },
};

const investment: KindProfile = {
  noun: 'holding',
  row: (item) => {
    const value = meta<number>(item, 'value');
    const change = meta<number>(item, 'change_pct');
    return {
      badge: value != null ? money(value) ?? undefined : undefined,
      sub: change != null ? (
        <span style={{ color: change >= 0 ? 'oklch(0.78 0.15 150)' : 'oklch(0.78 0.18 25)' }}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </span>
      ) : undefined,
    };
  },
};

// ── Remaining 17 domains ──────────────────────────────────────

const doctor: KindProfile = {
  noun: 'doctor',
  headerStats: (items) => {
    const upcoming = items.filter((i) => {
      const d = daysUntil(i.occurs_at);
      return d != null && d >= 0;
    }).length;
    return [
      { label: 'CONTACTS', value: String(items.length), hue: 350 },
      { label: 'UPCOMING', value: String(upcoming), hue: upcoming > 0 ? 25 : 150 },
    ];
  },
  row: (item) => {
    const d = daysUntil(item.occurs_at);
    const specialty = meta<string>(item, 'specialty');
    return {
      badge: d != null ? (d < 0 ? 'past' : d === 0 ? 'TODAY' : `${d}d`) : undefined,
      sub: specialty ? <span>{specialty}</span> : undefined,
      tone: d != null && d <= 7 && d >= 0 ? 'soon' : 'default',
    };
  },
  addExtras: ({ meta, setMeta, hue }) => (
    <input
      placeholder="specialty"
      value={(meta.specialty as string) ?? ''}
      onChange={(e) => setMeta({ ...meta, specialty: e.target.value })}
      style={miniInput(hue)}
    />
  ),
};

const gratitude: KindProfile = {
  noun: 'gratitude',
  headerStats: (items) => {
    const today = items.filter((i) => isToday(i.created_at)).length;
    const week = items.filter((i) => isWithin(i.created_at, 7)).length;
    return [
      { label: 'TODAY', value: String(today), hue: 320 },
      { label: 'THIS WEEK', value: String(week), hue: 290 },
      { label: 'TOTAL', value: String(items.length), hue: 220 },
    ];
  },
  row: (item) => ({
    inlineIcon: 'sparkle',
    sub: item.body ? <span>{item.body.slice(0, 80)}{item.body.length > 80 ? '…' : ''}</span> : undefined,
  }),
};

const reflection: KindProfile = {
  noun: 'reflection',
  headerStats: (items) => {
    const open = items.filter((i) => i.status !== 'done').length;
    return [
      { label: 'OPEN PROMPTS', value: String(open), hue: 290 },
      { label: 'ANSWERED', value: String(items.length - open), hue: 150 },
    ];
  },
  row: (item) => ({
    sub: item.body ? <span>answered</span> : <span style={{ color: 'oklch(0.85 0.14 290)' }}>tap to answer</span>,
  }),
};

const language_deck: KindProfile = {
  noun: 'deck',
  headerStats: (items) => {
    const totalCards = items.reduce((s, i) => s + (Number(meta(i, 'cards') ?? 0) || 0), 0);
    const dueCards = items.reduce((s, i) => s + (Number(meta(i, 'due') ?? 0) || 0), 0);
    return [
      { label: 'DECKS', value: String(items.length), hue: 260 },
      ...(totalCards ? [{ label: 'CARDS', value: String(totalCards), hue: 200 }] : []),
      ...(dueCards ? [{ label: 'DUE', value: String(dueCards), hue: dueCards > 0 ? 25 : 150 }] : []),
    ];
  },
  row: (item) => {
    const due = meta<number>(item, 'due');
    const cards = meta<number>(item, 'cards');
    return {
      badge: due != null && due > 0 ? `${due} due` : cards != null ? `${cards} cards` : undefined,
      tone: due != null && due > 10 ? 'soon' : 'default',
      sub: meta<string>(item, 'language') ? <span>{meta<string>(item, 'language')}</span> : undefined,
    };
  },
};

const friend: KindProfile = {
  noun: 'friend',
  headerStats: (items) => {
    const overdue = items.filter((i) => {
      const last = meta<string>(i, 'lastContact');
      const interval = meta<number>(i, 'cadenceDays') ?? 30;
      if (!last) return true;
      const since = (Date.now() - new Date(last).getTime()) / day;
      return since >= interval;
    }).length;
    return [
      { label: 'FRIENDS', value: String(items.length), hue: 150 },
      { label: 'TIME TO MSG', value: String(overdue), hue: overdue > 0 ? 25 : 150 },
    ];
  },
  row: (item) => {
    const last = meta<string>(item, 'lastContact');
    const interval = meta<number>(item, 'cadenceDays') ?? 30;
    const sinceDays = last ? Math.floor((Date.now() - new Date(last).getTime()) / day) : null;
    const overdue = sinceDays != null ? sinceDays - interval : null;
    return {
      badge: sinceDays != null ? `${sinceDays}d` : 'NEW',
      tone: overdue != null && overdue > 0 ? 'soon' : 'default',
      sub: last ? <span>last spoke {sinceDays}d ago</span> : <span>tap to log first contact</span>,
    };
  },
};

const pet: KindProfile = {
  noun: 'pet',
  headerStats: (items) => [
    { label: 'PETS', value: String(items.length), hue: 35 },
  ],
  row: (item) => {
    const species = meta<string>(item, 'species');
    const age = meta<number>(item, 'age');
    return {
      badge: age != null ? `${age}y` : undefined,
      sub: species ? <span>{species}{age != null ? ` · ${age} years` : ''}</span> : undefined,
      inlineIcon: 'heart',
    };
  },
  addExtras: ({ meta, setMeta, hue }) => (
    <input
      placeholder="species"
      value={(meta.species as string) ?? ''}
      onChange={(e) => setMeta({ ...meta, species: e.target.value })}
      style={miniInput(hue)}
    />
  ),
};

const contact: KindProfile = {
  noun: 'contact',
  headerStats: (items) => [
    { label: 'NETWORK', value: String(items.length), hue: 220 },
  ],
  row: (item) => ({
    sub: meta<string>(item, 'role') || meta<string>(item, 'company')
      ? <span>{meta<string>(item, 'role') ?? ''}{meta<string>(item, 'company') ? ` · ${meta<string>(item, 'company')}` : ''}</span>
      : undefined,
  }),
  addExtras: ({ meta, setMeta, hue }) => (
    <input
      placeholder="role/co"
      value={(meta.role as string) ?? ''}
      onChange={(e) => setMeta({ ...meta, role: e.target.value })}
      style={miniInput(hue)}
    />
  ),
};

const receipt: KindProfile = {
  noun: 'receipt',
  headerStats: (items) => {
    const month = items.filter((i) => isWithin(i.created_at, 30));
    const monthTotal = month.reduce((s, i) => s + (Number(meta(i, 'amount') ?? 0) || 0), 0);
    return [
      { label: 'TOTAL', value: String(items.length), hue: 60 },
      { label: '30-DAY', value: String(month.length), hue: 240 },
      ...(monthTotal ? [{ label: '30-DAY $', value: money(monthTotal) || '—', hue: 25 }] : []),
    ];
  },
  row: (item) => {
    const amt = meta<number>(item, 'amount');
    const merchant = meta<string>(item, 'merchant');
    return {
      badge: amt != null ? money(amt) ?? undefined : undefined,
      sub: merchant ? <span>{merchant}</span> : undefined,
    };
  },
  addExtras: ({ meta, setMeta, hue }) => (
    <input
      placeholder="$"
      type="number"
      value={(meta.amount as number) ?? ''}
      onChange={(e) => setMeta({ ...meta, amount: e.target.value ? Number(e.target.value) : undefined })}
      style={{ ...miniInput(hue), width: 70 }}
    />
  ),
};

const home_maintenance: KindProfile = {
  noun: 'task',
  headerStats: (items) => {
    const overdue = items.filter((i) => {
      const d = daysUntil(i.occurs_at);
      return d != null && d < 0 && i.status !== 'done';
    }).length;
    return [
      { label: 'OPEN', value: String(items.filter((i) => i.status !== 'done').length), hue: 60 },
      { label: 'OVERDUE', value: String(overdue), hue: overdue > 0 ? 25 : 150 },
    ];
  },
  row: (item) => {
    const d = daysUntil(item.occurs_at);
    return {
      badge: d != null ? (d < 0 ? `+${-d}d` : d === 0 ? 'TODAY' : `${d}d`) : undefined,
      tone: d != null && d < 0 ? 'urgent' : d != null && d <= 3 ? 'soon' : 'default',
    };
  },
};

const wardrobe: KindProfile = {
  noun: 'piece',
  row: (item) => ({
    sub: meta<string>(item, 'category') ? <span>{meta<string>(item, 'category')}</span> : undefined,
    badge: meta<number>(item, 'wornCount') != null ? `×${meta<number>(item, 'wornCount')}` : undefined,
  }),
  addExtras: ({ meta, setMeta, hue }) => (
    <input
      placeholder="category"
      value={(meta.category as string) ?? ''}
      onChange={(e) => setMeta({ ...meta, category: e.target.value })}
      style={miniInput(hue)}
    />
  ),
};

const achievement: KindProfile = {
  noun: 'win',
  headerStats: (items) => {
    const month = items.filter((i) => isWithin(i.created_at, 30)).length;
    const year = items.filter((i) => isWithin(i.created_at, 365)).length;
    return [
      { label: 'TOTAL', value: String(items.length), hue: 50 },
      { label: '30-DAY', value: String(month), hue: 30 },
      { label: 'YEAR', value: String(year), hue: 220 },
    ];
  },
  row: (item) => ({
    inlineIcon: 'sparkle',
    sub: item.body ? <span>{item.body.slice(0, 80)}{item.body.length > 80 ? '…' : ''}</span> : undefined,
    badge: item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short' }).toUpperCase() : undefined,
  }),
};

const bucket_list: KindProfile = {
  noun: 'dream',
  headerStats: (items) => {
    const done = items.filter((i) => i.status === 'done').length;
    return [
      { label: 'TO DO', value: String(items.length - done), hue: 320 },
      { label: 'CHECKED', value: String(done), hue: 150 },
    ];
  },
  row: (item) => ({
    inlineIcon: 'sparkle',
    badge: item.status === 'done' ? '✓' : undefined,
    tone: item.status === 'done' ? 'ok' : 'default',
  }),
};

const time_capsule: KindProfile = {
  noun: 'capsule',
  headerStats: (items) => {
    const open = items.filter((i) => {
      const d = daysUntil(meta<string>(i, 'openAt') ?? i.occurs_at);
      return d != null && d >= 0;
    }).length;
    return [
      { label: 'CAPSULES', value: String(items.length), hue: 220 },
      { label: 'SEALED', value: String(open), hue: 280 },
    ];
  },
  row: (item) => {
    const openAt = meta<string>(item, 'openAt') ?? item.occurs_at;
    const d = daysUntil(openAt);
    return {
      badge: d != null
        ? (d < 0 ? 'OPEN' : d < 30 ? `${d}d` : d < 365 ? `${Math.round(d/30)}mo` : `${Math.round(d/365)}y`)
        : 'SEALED',
      sub: openAt ? <span>opens {new Date(openAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span> : undefined,
    };
  },
};

const photo: KindProfile = {
  noun: 'photo',
  headerStats: (items) => {
    const month = items.filter((i) => isWithin(i.created_at, 30)).length;
    return [
      { label: 'PHOTOS', value: String(items.length), hue: 290 },
      { label: '30-DAY', value: String(month), hue: 200 },
    ];
  },
  row: (item) => ({
    sub: meta<string>(item, 'caption') ? <span>{meta<string>(item, 'caption')}</span> : undefined,
    badge: item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short' }).toUpperCase() : undefined,
  }),
};

const project: KindProfile = {
  noun: 'project',
  headerStats: (items) => {
    const active = items.filter((i) => i.status !== 'done').length;
    return [
      { label: 'ACTIVE', value: String(active), hue: 220 },
      { label: 'DONE', value: String(items.length - active), hue: 150 },
    ];
  },
  row: (item) => {
    const progress = meta<number>(item, 'progress');
    return {
      badge: progress != null ? `${Math.round(progress * 100)}%` : undefined,
      sub: meta<string>(item, 'status_note') ? <span>{meta<string>(item, 'status_note')}</span> : undefined,
    };
  },
};

const side_project: KindProfile = {
  noun: 'side project',
  headerStats: (items) => [
    { label: 'BUILDING', value: String(items.filter((i) => i.status !== 'done').length), hue: 270 },
    { label: 'SHIPPED', value: String(items.filter((i) => i.status === 'done').length), hue: 150 },
  ],
  row: (item) => ({
    inlineIcon: 'sparkle',
    badge: meta<string>(item, 'stack') ?? undefined,
    sub: meta<string>(item, 'url') ? <span>{meta<string>(item, 'url')}</span> : undefined,
  }),
};

const career_note: KindProfile = {
  noun: 'note',
  headerStats: (items) => {
    const month = items.filter((i) => isWithin(i.created_at, 30)).length;
    return [
      { label: 'NOTES', value: String(items.length), hue: 240 },
      { label: '30-DAY', value: String(month), hue: 220 },
    ];
  },
  row: (item) => ({
    badge: meta<string>(item, 'kind') ?? undefined,
    sub: item.body ? <span>{item.body.slice(0, 80)}{item.body.length > 80 ? '…' : ''}</span> : undefined,
  }),
};

// ── Registry + getter ─────────────────────────────────────────

export const KIND_PROFILES: Partial<Record<string, KindProfile>> = {
  // Originals (13)
  reading, bill, plant, birthday, subscription, shopping, recipe,
  goal, nutrition, symptoms, learning, trip, investment,
  // New (17)
  doctor, gratitude, reflection, language_deck, friend, pet, contact,
  receipt, home_maintenance, wardrobe, achievement, bucket_list,
  time_capsule, photo, project, side_project, career_note,
};

const generic: KindProfile = {
  noun: 'item',
  row: () => ({}),
};

/** Resolve the profile for a kind. Always returns a valid profile —
 *  unmapped kinds get the generic fallback so the screen still works. */
export function getKindProfile(kind: string): KindProfile {
  return KIND_PROFILES[kind] ?? generic;
}

// ── Local helpers ─────────────────────────────────────────────

function nextBirthdayDays(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const dob = new Date(iso);
  if (isNaN(dob.getTime())) return null;
  const now = new Date();
  let next = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
  if (next < now) next = new Date(now.getFullYear() + 1, dob.getMonth(), dob.getDate());
  return Math.round((next.getTime() - now.getTime()) / day);
}
function currentAge(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const dob = new Date(iso);
  if (isNaN(dob.getTime())) return null;
  const next = new Date(dob.getFullYear() + Math.ceil((Date.now() - dob.getTime()) / (day * 365.25)), dob.getMonth(), dob.getDate());
  return next.getFullYear() - dob.getFullYear();
}
function isToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString();
}
function isWithin(iso: string | null | undefined, days: number): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() <= days * day;
}

const miniInput = (hue: number): React.CSSProperties => ({
  width: 90, padding: '4px 8px', borderRadius: 8,
  background: 'oklch(1 0 0 / 0.06)', border: `1px solid oklch(0.78 0.16 ${hue} / 0.30)`,
  color: 'var(--fg-2)', fontSize: 11, fontFamily: 'var(--font-mono)', outline: 'none',
});
