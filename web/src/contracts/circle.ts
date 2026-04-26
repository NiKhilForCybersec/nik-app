/* Nik — family circle contract.
 *
 * Read/write the user's family circle. Each row represents a person
 * (you, partner, kid, parent, caregiver) with rich denormalized
 * profile data in JSONB until those fields earn their own dashboards.
 *
 * Privacy categories + trust tiers are configuration constants that
 * live alongside the contract because they're consumed by
 * `canCircleView()` — the helper every screen uses to decide
 * what to render for a given (viewer, owner, category) triple.
 */

import { z } from 'zod';
import { defineOp } from '../lib/operations';

// ── Privacy matrix configuration ────────────────────────────

export const PRIVACY_CATEGORIES = [
  { id: 'health',   label: 'Health snapshot',  sub: 'sleep, steps, heart' },
  { id: 'meds',     label: 'Medications',      sub: 'names, doses, adherence' },
  { id: 'mood',     label: 'Mood & diary',     sub: "today's mood, weekly trend" },
  { id: 'cycle',    label: 'Cycle',            sub: 'phase, predictions' },
  { id: 'schedule', label: "Today's schedule", sub: 'meetings, classes, plans' },
  { id: 'location', label: 'Location',         sub: 'where you are now' },
  { id: 'care',     label: 'Care notes',       sub: 'allergies, conditions, doctors' },
  { id: 'score',    label: 'Nik Score',        sub: 'wellness score & streaks' },
  { id: 'diary',    label: 'Diary entries',    sub: 'last entry preview' },
] as const;

export type PrivacyCategoryId = (typeof PRIVACY_CATEGORIES)[number]['id'];

export const TRUST_TIERS: Record<
  'inner' | 'family' | 'kid' | 'caregiver',
  { label: string; desc: string; cats: PrivacyCategoryId[] }
> = {
  inner:     { label: 'Inner',     desc: 'Partner / primary caregiver',
               cats: ['health','meds','mood','cycle','schedule','location','care','score','diary'] },
  family:    { label: 'Family',    desc: 'Adults in the circle',
               cats: ['health','schedule','location','score','care'] },
  kid:       { label: 'Kids',      desc: 'Children — limited',
               cats: ['schedule','location','score'] },
  caregiver: { label: 'Caregiver', desc: 'Health-focused',
               cats: ['health','meds','care','schedule','location'] },
};

// ── Schema ─────────────────────────────────────────────────

export const Relation = z.enum([
  'self', 'partner', 'child', 'parent', 'sibling',
  'grandparent', 'caregiver', 'friend', 'family',
]);

export const Status = z.enum(['online', 'away', 'offline']);
export const ShareTier = z.enum(['inner', 'family', 'kid', 'caregiver', 'custom']);

export const CircleMember = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  member_id: z.string(),
  name: z.string(),
  role: z.string(),
  relation: Relation,
  age: z.number().int().nullable(),
  hue: z.number().int(),
  is_self: z.boolean(),
  status: Status,
  location: z.string().nullable(),
  last_seen_at: z.string().nullable(),
  birthday: z.string().nullable(),
  blood_type: z.string().nullable(),
  share_tier: ShareTier,
  custom_cats: z.array(z.string()),
  profile: z.record(z.string(), z.unknown()),
  care_recipient: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type CircleMember = z.infer<typeof CircleMember>;

// ── Helper used by screens ──────────────────────────────────

/** Sharing matrix shape: matrix[ownerMemberId]?.[viewerMemberId] = tierKey | { cats: string[] } */
export type SharingMatrix = Record<string, Record<string, string | { cats: string[] }>>;

/** Can `viewerId` see `ownerId`'s `category`?
 *
 *  Backwards-compatible with the original `data/circle.ts` signature so the
 *  CircleScreen + CircleSheets keep working unchanged. The matrix is built
 *  by CircleScreen from the `circle_members.share_tier` / `custom_cats`
 *  columns.
 */
export function canCircleView(
  viewerId: string,
  ownerId: string,
  category: string,
  sharing: SharingMatrix = {},
): boolean {
  if (viewerId === ownerId) return true;
  const tier = sharing?.[ownerId]?.[viewerId];
  if (!tier) return false;
  if (typeof tier === 'object') return tier.cats?.includes(category);
  const t = TRUST_TIERS[tier as keyof typeof TRUST_TIERS];
  return t ? t.cats.includes(category as PrivacyCategoryId) : false;
}

// ── Ops ─────────────────────────────────────────────────────

export const circle = {
  list: defineOp({
    name: 'circle.list',
    description: 'List the user\'s family circle members (self first, then others). Each member has presence, relation, sharing tier, and a JSONB profile blob with health/meds/mood/etc.',
    kind: 'query',
    permissions: ['circle.read'],
    tags: ['circle', 'family'],
    input: z.object({}).strict(),
    output: z.array(CircleMember),
    handler: async ({ sb, userId }) => {
      if (!userId) return [];
      const { data, error } = await sb
        .from('circle_members')
        .select('*')
        .eq('user_id', userId)
        .order('is_self', { ascending: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as CircleMember[];
    },
  }),

  add: defineOp({
    name: 'circle.add',
    description: 'Add a member to the family circle. Use when the user says "add my brother", "Meera is my partner", etc.',
    kind: 'mutation',
    permissions: ['circle.write'],
    tags: ['circle', 'family'],
    input: z.object({
      memberId: z.string().min(1).max(40).regex(/^[a-z0-9_-]+$/, 'lowercase letters, numbers, _, -'),
      name: z.string().min(1).max(80),
      role: z.string().max(80).default(''),
      relation: Relation.default('family'),
      age: z.number().int().min(0).max(120).optional(),
      hue: z.number().int().min(0).max(360).default(220),
      shareTier: ShareTier.default('family'),
      birthday: z.string().max(40).optional(),
    }).strict(),
    output: CircleMember,
    handler: async ({ sb, userId }, input) => {
      if (!userId) throw new Error('Not signed in');
      const { data, error } = await sb
        .from('circle_members')
        .insert({
          user_id: userId,
          member_id: input.memberId,
          name: input.name,
          role: input.role,
          relation: input.relation,
          age: input.age ?? null,
          hue: input.hue,
          share_tier: input.shareTier,
          birthday: input.birthday ?? null,
          is_self: input.relation === 'self',
        })
        .select()
        .single();
      if (error) throw error;
      return data as CircleMember;
    },
  }),

  updateSharing: defineOp({
    name: 'circle.updateSharing',
    description: 'Change what categories a circle member can see about you. Either pick a tier (inner/family/kid/caregiver) or pass custom categories.',
    kind: 'mutation',
    permissions: ['circle.write'],
    tags: ['circle', 'family', 'privacy'],
    input: z.object({
      memberId: z.string().min(1).max(40),
      tier: ShareTier.optional(),
      customCats: z.array(z.string()).optional(),
    }).strict(),
    output: CircleMember,
    handler: async ({ sb, userId }, input) => {
      if (!userId) throw new Error('Not signed in');
      const patch: Record<string, unknown> = {};
      if (input.tier) patch.share_tier = input.tier;
      if (input.customCats) {
        patch.share_tier = 'custom';
        patch.custom_cats = input.customCats;
      }
      const { data, error } = await sb
        .from('circle_members')
        .update(patch)
        .eq('user_id', userId)
        .eq('member_id', input.memberId)
        .select()
        .single();
      if (error) throw error;
      return data as CircleMember;
    },
  }),

  setStatus: defineOp({
    name: 'circle.setStatus',
    description: 'Update presence (online/away/offline) and optional location for a circle member. Used by the device when its location/online state changes.',
    kind: 'mutation',
    permissions: ['circle.write'],
    tags: ['circle', 'presence'],
    input: z.object({
      memberId: z.string().min(1).max(40),
      status: Status,
      location: z.string().max(120).nullable().optional(),
    }).strict(),
    output: CircleMember,
    handler: async ({ sb, userId }, input) => {
      if (!userId) throw new Error('Not signed in');
      const patch: Record<string, unknown> = {
        status: input.status,
        last_seen_at: new Date().toISOString(),
      };
      if (input.location !== undefined) patch.location = input.location;
      const { data, error } = await sb
        .from('circle_members')
        .update(patch)
        .eq('user_id', userId)
        .eq('member_id', input.memberId)
        .select()
        .single();
      if (error) throw error;
      return data as CircleMember;
    },
  }),

  remove: defineOp({
    name: 'circle.remove',
    description: 'Remove a circle member. Cannot remove "self". Destructive — confirm before execution.',
    kind: 'mutation',
    mutability: 'confirm',
    permissions: ['circle.write'],
    tags: ['circle'],
    input: z.object({ memberId: z.string().min(1).max(40) }).strict(),
    output: z.object({ removed: z.boolean() }),
    handler: async ({ sb, userId }, { memberId }) => {
      if (!userId) throw new Error('Not signed in');
      if (memberId === 'self') throw new Error('Cannot remove self');
      const { error } = await sb
        .from('circle_members')
        .delete()
        .eq('user_id', userId)
        .eq('member_id', memberId);
      if (error) throw error;
      return { removed: true };
    },
  }),
} as const;
