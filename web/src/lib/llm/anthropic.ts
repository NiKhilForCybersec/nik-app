/* Anthropic provider — calls Claude via a Supabase Edge Function proxy.
 *
 * In dev, you can also point it at the Anthropic API directly using
 * VITE_ANTHROPIC_DIRECT=1 (NOT for production — exposes API key in client).
 * The default + production path is the proxy at /functions/v1/llm-complete.
 */

import type {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  LLMComplexity,
} from './types';

const MODEL_MAP: Record<LLMComplexity, string> = {
  trivial: 'claude-haiku-4-5',
  medium:  'claude-sonnet-4-6',
  hard:    'claude-opus-4-7',
};

const proxyUrl =
  (import.meta.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321') +
  '/functions/v1/llm-complete';
const directKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
const useDirect = import.meta.env.VITE_ANTHROPIC_DIRECT === '1';

export class AnthropicProvider implements LLMProvider {
  readonly id = 'anthropic';
  readonly name = 'Anthropic Claude';
  readonly runsAt = 'remote' as const;
  readonly handles = ['medium', 'hard'] as const;

  isAvailable() {
    // The proxy is always reachable; direct mode requires a key.
    return useDirect ? Boolean(directKey) : true;
  }

  async complete(req: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();
    const model = MODEL_MAP[req.complexity ?? 'medium'];

    if (useDirect && directKey) {
      return this.directCall(req, model, start);
    }
    return this.proxyCall(req, model, start);
  }

  private async proxyCall(req: LLMRequest, model: string, start: number): Promise<LLMResponse> {
    const r = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...req, model }),
    });
    if (!r.ok) throw new Error(`Anthropic proxy ${r.status}: ${await r.text()}`);
    const json = await r.json();
    return {
      text: json.text ?? '',
      toolCalls: json.toolCalls ?? [],
      provider: this.id,
      model,
      usage: json.usage,
      latencyMs: Date.now() - start,
    };
  }

  private async directCall(req: LLMRequest, model: string, start: number): Promise<LLMResponse> {
    // Convert our LLMMessage[] to Anthropic Messages API shape.
    const sys = req.messages.find((m) => m.role === 'system');
    const turns = req.messages.filter((m) => m.role !== 'system');

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': directKey!,
        'anthropic-version': '2023-06-01',
        // Required for browser-direct calls. Dev only — production must
        // route via the Edge Function proxy so the key never ships.
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: (sys as { content: string } | undefined)?.content,
        messages: turns.map((m) => ({
          role: m.role === 'tool' ? 'user' : m.role,
          content: m.content,
        })),
        tools: req.tools?.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.inputSchema,
        })),
      }),
    });
    if (!r.ok) throw new Error(`Anthropic direct ${r.status}: ${await r.text()}`);
    const json = await r.json();

    const text = (json.content ?? [])
      .filter((c: { type: string }) => c.type === 'text')
      .map((c: { text: string }) => c.text)
      .join('\n');

    const toolCalls = (json.content ?? [])
      .filter((c: { type: string }) => c.type === 'tool_use')
      .map((c: { id: string; name: string; input: Record<string, unknown> }) => ({
        id: c.id,
        name: c.name,
        arguments: c.input,
      }));

    return {
      text,
      toolCalls,
      provider: this.id,
      model,
      usage: json.usage
        ? { inputTokens: json.usage.input_tokens, outputTokens: json.usage.output_tokens }
        : undefined,
      latencyMs: Date.now() - start,
    };
  }
}
