/* Nik — chat persistence contract.
 *
 * The Chat screen replays the last N messages on mount + appends new ones
 * as the conversation grows. Tool calls + tool results are stored as
 * JSONB so the AI can resume the exact context after a reload.
 */

import { z } from 'zod';
import { defineOp } from '../lib/operations';

export const ChatRole = z.enum(['user', 'assistant', 'tool']);

export const ChatToolCall = z.object({
  id: z.string(),
  name: z.string(),
  arguments: z.record(z.string(), z.unknown()),
});

export const ChatMessage = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: ChatRole,
  content: z.string(),
  tool_calls: z.array(ChatToolCall),
  tool_call_id: z.string().nullable(),
  provider: z.string().nullable(),
  model: z.string().nullable(),
  latency_ms: z.number().int().nullable(),
  created_at: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessage>;

export const chat = {
  history: defineOp({
    name: 'chat.history',
    description: 'List recent chat messages, oldest first. Used by the Chat screen on mount to replay the conversation.',
    kind: 'query',
    permissions: ['chat.read'],
    tags: ['chat'],
    input: z.object({
      limit: z.number().int().positive().max(500).default(100),
    }).strict(),
    output: z.array(ChatMessage),
    handler: async ({ sb, userId }, { limit }) => {
      if (!userId) return [];
      const { data, error } = await sb
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return ((data ?? []) as ChatMessage[]).reverse();
    },
  }),

  append: defineOp({
    name: 'chat.append',
    description: 'Append a single message to the chat log. Used internally by the Chat screen — not usually called by the AI directly.',
    kind: 'mutation',
    permissions: ['chat.write'],
    exposeToAI: false,
    tags: ['chat'],
    input: z.object({
      role: ChatRole,
      content: z.string().default(''),
      toolCalls: z.array(ChatToolCall).default([]),
      toolCallId: z.string().optional(),
      provider: z.string().optional(),
      model: z.string().optional(),
      latencyMs: z.number().int().optional(),
    }).strict(),
    output: ChatMessage,
    handler: async ({ sb, userId }, input) => {
      if (!userId) throw new Error('Not signed in');
      const { data, error } = await sb
        .from('chat_messages')
        .insert({
          user_id: userId,
          role: input.role,
          content: input.content,
          tool_calls: input.toolCalls,
          tool_call_id: input.toolCallId ?? null,
          provider: input.provider ?? null,
          model: input.model ?? null,
          latency_ms: input.latencyMs ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as ChatMessage;
    },
  }),

  clear: defineOp({
    name: 'chat.clear',
    description: 'Delete all chat history for the current user. Use only when the user explicitly asks to start over.',
    kind: 'mutation',
    permissions: ['chat.write'],
    tags: ['chat'],
    input: z.object({}).strict(),
    output: z.object({ deleted: z.number().int() }),
    handler: async ({ sb, userId }) => {
      if (!userId) throw new Error('Not signed in');
      const { count, error } = await sb
        .from('chat_messages')
        .delete({ count: 'exact' })
        .eq('user_id', userId);
      if (error) throw error;
      return { deleted: count ?? 0 };
    },
  }),
} as const;
