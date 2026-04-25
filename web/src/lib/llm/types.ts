/* Nik — LLM provider types.
 *
 * The shared shape every model-backed provider implements: cloud
 * (Anthropic, OpenAI, Gemini), on-device SLM, mock for tests. The
 * router picks one per request based on complexity.
 *
 * Tool-call shape mirrors the MCP tool catalog so providers can be
 * swapped without changing how the registry is consumed.
 */

export type LLMRole = 'system' | 'user' | 'assistant' | 'tool';

export type LLMMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | {
      role: 'assistant';
      content: string;
      /** Optional tool calls the model decided to make. */
      toolCalls?: LLMToolCall[];
    }
  | {
      role: 'tool';
      content: string;
      tool_call_id: string;
    };

export type LLMToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type LLMTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export type LLMComplexity =
  | 'trivial'   // recall, single-step tool call, classification → on-device SLM
  | 'medium'    // multi-step reasoning, single tool chain → Sonnet
  | 'hard';     // agentic, long context, hardest reasoning → Opus / GPT-5.5

export type LLMRequest = {
  messages: LLMMessage[];
  tools?: LLMTool[];
  /** Hint from the caller — router may override based on its own classifier. */
  complexity?: LLMComplexity;
  /** Per-user identity so the provider can scope tool calls. */
  userId?: string;
  /** Streaming enable — provider may ignore. */
  stream?: boolean;
};

export type LLMResponse = {
  /** Text the assistant produced (may be empty if it only called tools). */
  text: string;
  /** Tool calls the model wants the orchestrator to execute. */
  toolCalls: LLMToolCall[];
  /** Provider that handled the request — for telemetry + cost tracking. */
  provider: string;
  /** Model id within the provider. */
  model: string;
  /** Token usage. */
  usage?: { inputTokens: number; outputTokens: number };
  /** Total wall-clock latency in ms. */
  latencyMs?: number;
};

export interface LLMProvider {
  /** Globally unique identifier — used in telemetry, never user-facing. */
  readonly id: string;
  /** Human-readable name for the model picker UI. */
  readonly name: string;
  /** Where this provider runs. */
  readonly runsAt: 'on-device' | 'remote';
  /** Which complexity tiers this provider should handle.
   *  Router uses this to decide candidates per request. */
  readonly handles: readonly LLMComplexity[];
  /** Whether the provider is available right now (e.g. has its API key set,
   *  or the SLM model file is downloaded). */
  isAvailable(): boolean | Promise<boolean>;
  /** Run a single non-streaming completion. */
  complete(req: LLMRequest): Promise<LLMResponse>;
}
