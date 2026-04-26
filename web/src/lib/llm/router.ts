/* Nik — LLM Router.
 *
 * Picks a provider per request based on:
 *   1. Caller hint (req.complexity)
 *   2. Heuristic classifier (token count, regex tells)
 *   3. Provider availability
 *
 * Today: Anthropic for cloud, Mock for local fallback. The future on-device
 * SLM (Phi-3 / Gemma 3 / Llama 3.2 / Qwen 2.5) drops in with no other code
 * changes — register it in the providers list, set its `handles: ['trivial']`,
 * and the router prefers it when complexity is trivial + it's available.
 *
 * The MCP layer is the abstraction the model interacts with. Models are
 * interchangeable; the registry isn't.
 */

import type {
  LLMComplexity,
  LLMProvider,
  LLMRequest,
  LLMResponse,
} from './types';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';

const TRIVIAL_HINTS = [
  /^(yes|no|maybe|hi|hey|hello|thanks|ok)\b/i,
  /^show|^open|^go to|^switch/i,
  /^what.{0,40}\?$/i,                 // single short question
  /^(add|log|mark|done|undo)\b/i,     // direct tool actions
];

const HARD_HINTS = [
  /\b(plan|strategy|analyze|explain why|step by step|reason)\b/i,
  /\b(compare|trade.?off|pros and cons)\b/i,
];

function classify(req: LLMRequest): LLMComplexity {
  if (req.complexity) return req.complexity;
  const last = [...req.messages].reverse().find((m) => m.role === 'user');
  const text = ((last as { content?: string } | undefined)?.content ?? '').trim();
  if (!text) return 'trivial';

  // Token heuristic: ~4 chars per token. Long context + tools = harder.
  const tokens = Math.ceil(text.length / 4);
  if (HARD_HINTS.some((re) => re.test(text)) || tokens > 800) return 'hard';
  if (TRIVIAL_HINTS.some((re) => re.test(text)) && tokens < 60) return 'trivial';
  return 'medium';
}

/** A single LLM call recorded for the dev console. Ring-buffered in
 *  memory only — never persisted, never shipped to anyone. */
export type LLMCallRecord = {
  id: string;
  startedAt: number;
  provider: string;
  model: string;
  complexity: LLMComplexity;
  ok: boolean;
  error?: string;
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  toolCallCount: number;
  preview: string;        // first 80 chars of last user message
  responsePreview: string; // first 80 chars of assistant text
};

const RING_MAX = 100;

export class LLMRouter {
  /** Order matters — first available provider that handles the picked tier wins. */
  private providers: LLMProvider[];

  /** In-memory ring buffer of recent calls — drives the dev console. */
  private calls: LLMCallRecord[] = [];
  private listeners = new Set<() => void>();

  constructor(providers?: LLMProvider[]) {
    this.providers = providers ?? [
      // On-device SLM goes here when available — it'll handle 'trivial'.
      new AnthropicProvider(),  // primary
      new OpenAIProvider(),     // fallback
    ];
  }

  /** Recent calls, newest first. Used by the dev console. */
  recentCalls(): readonly LLMCallRecord[] {
    return this.calls;
  }

  /** Subscribe to call-log updates. Returns unsubscribe. */
  onCalls(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private record(rec: LLMCallRecord) {
    this.calls = [rec, ...this.calls].slice(0, RING_MAX);
    for (const l of this.listeners) l();
  }

  /** Returns the chosen provider + complexity (without calling it). */
  pick(req: LLMRequest): { provider: LLMProvider; complexity: LLMComplexity } {
    const complexity = classify(req);
    for (const p of this.providers) {
      if (!p.handles.includes(complexity)) continue;
      const ok = p.isAvailable();
      if (ok === false) continue;
      return { provider: p, complexity };
    }
    // No provider available — surface a clear error rather than silently
    // routing to the wrong one. The caller will display this in chat.
    throw new Error(
      'No LLM provider available. Set VITE_ANTHROPIC_API_KEY or VITE_OPENAI_API_KEY in web/.env.local.',
    );
  }

  async complete(req: LLMRequest): Promise<LLMResponse> {
    const { provider, complexity } = this.pick(req);
    const startedAt = Date.now();
    const lastUser = [...req.messages].reverse().find((m) => m.role === 'user');
    const preview = (((lastUser as { content?: string } | undefined)?.content) ?? '').slice(0, 80);
    const id = `${startedAt}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      const r = await provider.complete({ ...req, complexity });
      this.record({
        id, startedAt, provider: r.provider, model: r.model, complexity,
        ok: true, latencyMs: r.latencyMs,
        inputTokens: r.usage?.inputTokens, outputTokens: r.usage?.outputTokens,
        toolCallCount: r.toolCalls.length, preview,
        responsePreview: (r.text ?? '').slice(0, 80),
      });
      return r;
    } catch (e) {
      this.record({
        id, startedAt, provider: provider.id, model: '?', complexity,
        ok: false, error: (e as Error).message,
        latencyMs: Date.now() - startedAt,
        toolCallCount: 0, preview, responsePreview: '',
      });
      throw e;
    }
  }

  /** Used by the model-picker UI in Settings. */
  list() {
    return this.providers.map((p) => ({
      id: p.id,
      name: p.name,
      runsAt: p.runsAt,
      handles: [...p.handles],
    }));
  }
}

/** App-wide singleton. */
export const llm = new LLMRouter();
