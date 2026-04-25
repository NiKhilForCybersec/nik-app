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
import { MockLLMProvider } from './mock';
import { AnthropicProvider } from './anthropic';

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

export class LLMRouter {
  /** Order matters — first available provider that handles the picked tier wins. */
  private providers: LLMProvider[];

  constructor(providers?: LLMProvider[]) {
    this.providers = providers ?? [
      // On-device SLM goes here when available — it'll handle 'trivial'.
      new AnthropicProvider(),
      new MockLLMProvider(),     // fallback for offline / no-key dev
    ];
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
    // Fallback to the last one (always-available mock).
    return { provider: this.providers[this.providers.length - 1], complexity };
  }

  async complete(req: LLMRequest): Promise<LLMResponse> {
    const { provider, complexity } = this.pick(req);
    return provider.complete({ ...req, complexity });
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
