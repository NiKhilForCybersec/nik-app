/* OpenAI provider — calls GPT via the Chat Completions API.
 *
 * Dev path uses VITE_OPENAI_API_KEY directly from the client (Vite
 * bundles VITE_* vars into the bundle — fine for local dev only).
 * Production should proxy through a Supabase Edge Function so the
 * key never leaves the server. The proxy URL is the same shape as
 * the Anthropic one — flip USE_PROXY to true once that ships.
 */

import type {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  LLMComplexity,
  LLMToolCall,
} from './types';

const MODEL_MAP: Record<LLMComplexity, string> = {
  trivial: 'gpt-4o-mini',
  medium:  'gpt-4o',
  hard:    'gpt-4o',
};

const directKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;

export class OpenAIProvider implements LLMProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI GPT';
  readonly runsAt = 'remote' as const;
  readonly handles = ['trivial', 'medium', 'hard'] as const;

  isAvailable() {
    return Boolean(directKey);
  }

  async complete(req: LLMRequest): Promise<LLMResponse> {
    if (!directKey) throw new Error('OpenAI API key missing — set VITE_OPENAI_API_KEY');
    const start = Date.now();
    const model = MODEL_MAP[req.complexity ?? 'medium'];

    const messages = req.messages.map((m) => {
      if (m.role === 'tool') {
        return { role: 'tool' as const, content: m.content, tool_call_id: m.tool_call_id };
      }
      if (m.role === 'assistant' && m.toolCalls?.length) {
        return {
          role: 'assistant' as const,
          content: m.content || null,
          tool_calls: m.toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
          })),
        };
      }
      return { role: m.role, content: m.content };
    });

    const tools = req.tools?.map((t) => ({
      type: 'function' as const,
      function: { name: t.name, description: t.description, parameters: t.inputSchema },
    }));

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${directKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        tools,
        max_tokens: 1024,
      }),
    });
    if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
    const json = await r.json();
    const choice = json.choices?.[0]?.message ?? {};

    const toolCalls: LLMToolCall[] = (choice.tool_calls ?? []).map(
      (tc: { id: string; function: { name: string; arguments: string } }) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: safeParse(tc.function.arguments),
      }),
    );

    return {
      text: choice.content ?? '',
      toolCalls,
      provider: this.id,
      model,
      usage: json.usage
        ? { inputTokens: json.usage.prompt_tokens, outputTokens: json.usage.completion_tokens }
        : undefined,
      latencyMs: Date.now() - start,
    };
  }
}

function safeParse(s: string): Record<string, unknown> {
  try { return JSON.parse(s); } catch { return {}; }
}
