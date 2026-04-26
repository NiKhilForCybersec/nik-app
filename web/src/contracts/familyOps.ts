/* Nik — Family Ops contract.
 *
 * Tasks + alarms shared between the parent(s) for kids' routines.
 */

import { z } from 'zod';
import { defineOp } from '../lib/operations';

export const TaskRecurrence = z.enum([
  'none', 'weekday', 'tue-thu', 'monthly_nth', 'custom',
]);

export const FamilyTask = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  time_of_day: z.string().nullable(),
  due_at: z.string().nullable(),
  owner: z.string().nullable(),
  paired_with: z.string().nullable(),
  kids: z.array(z.string()),
  recurrence: TaskRecurrence,
  recurrence_payload: z.record(z.string(), z.unknown()),
  geofence_lat: z.number().nullable(),
  geofence_lng: z.number().nullable(),
  geofence_label: z.string().nullable(),
  status: z.enum(['pending', 'done', 'snoozed', 'cancelled']),
  created_by: z.enum(['user', 'ai', 'voice', 'integration', 'system']),
  source: z.string().nullable(),
  archived_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type FamilyTask = z.infer<typeof FamilyTask>;

export const FamilyAlarm = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  cluster_name: z.string(),
  active_days: z.array(z.number().int()),
  alarms: z.array(z.object({
    kid: z.string(),
    time: z.string(),
    label: z.string().optional(),
  })),
  voice_phrase: z.string().nullable(),
  master_enabled: z.boolean(),
  archived_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type FamilyAlarm = z.infer<typeof FamilyAlarm>;

export const familyOps = {
  tasks: defineOp({
    name: 'familyOps.tasks',
    description: 'List pending family tasks (chores, pickups, school runs). Each task is assignable to a parent + one or more kids.',
    kind: 'query',
    permissions: ['familyOps.read'],
    tags: ['family', 'tasks'],
    input: z.object({}).strict(),
    output: z.array(FamilyTask),
    handler: async ({ sb, userId }) => {
      if (!userId) return [];
      const { data, error } = await sb
        .from('family_tasks')
        .select('*')
        .eq('user_id', userId)
        .is('archived_at', null)
        .order('time_of_day', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as FamilyTask[];
    },
  }),

  alarms: defineOp({
    name: 'familyOps.alarms',
    description: 'List active alarm clusters (morning routine, school run, bedtime).',
    kind: 'query',
    permissions: ['familyOps.read'],
    tags: ['family', 'alarms'],
    input: z.object({}).strict(),
    output: z.array(FamilyAlarm),
    handler: async ({ sb, userId }) => {
      if (!userId) return [];
      const { data, error } = await sb
        .from('family_alarms')
        .select('*')
        .eq('user_id', userId)
        .is('archived_at', null)
        .order('cluster_name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as FamilyAlarm[];
    },
  }),

  toggleTask: defineOp({
    name: 'familyOps.toggleTask',
    description: 'Mark a family task done (or pending if it was already done).',
    kind: 'mutation',
    permissions: ['familyOps.write'],
    tags: ['family', 'tasks'],
    input: z.object({
      id: z.string().uuid(),
      status: z.enum(['pending', 'done', 'snoozed', 'cancelled']).default('done'),
    }).strict(),
    output: FamilyTask,
    handler: async ({ sb }, { id, status }) => {
      const { data, error } = await sb
        .from('family_tasks').update({ status }).eq('id', id).select().single();
      if (error) throw error;
      return data as FamilyTask;
    },
  }),

  reassignTask: defineOp({
    name: 'familyOps.reassignTask',
    description: 'Hand a family task off to the other parent (or remove the pair).',
    kind: 'mutation',
    permissions: ['familyOps.write'],
    tags: ['family', 'tasks'],
    input: z.object({
      id: z.string().uuid(),
      owner: z.string(),
      pairedWith: z.string().nullable().default(null),
    }).strict(),
    output: FamilyTask,
    handler: async ({ sb }, { id, owner, pairedWith }) => {
      const { data, error } = await sb
        .from('family_tasks')
        .update({ owner, paired_with: pairedWith })
        .eq('id', id).select().single();
      if (error) throw error;
      return data as FamilyTask;
    },
  }),

  toggleAlarmCluster: defineOp({
    name: 'familyOps.toggleAlarmCluster',
    description: 'Master enable/disable for a whole alarm cluster.',
    kind: 'mutation',
    permissions: ['familyOps.write'],
    tags: ['family', 'alarms'],
    input: z.object({ id: z.string().uuid(), enabled: z.boolean() }).strict(),
    output: FamilyAlarm,
    handler: async ({ sb }, { id, enabled }) => {
      const { data, error } = await sb
        .from('family_alarms').update({ master_enabled: enabled }).eq('id', id).select().single();
      if (error) throw error;
      return data as FamilyAlarm;
    },
  }),
} as const;
