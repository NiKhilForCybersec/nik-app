/* Nik — LLM proxy.
 *
 * Supabase Edge Function (Deno). Sits between the browser and the
 * Anthropic / OpenAI API so the API key never ships in the client
 * bundle. The web app POSTs the same shape it would have sent
 * directly; this function adds the secret server-side and returns
 * the normalized response.
 *
 * Set keys with:
 *   supabase secrets set ANTHROPIC_API_KEY=sk-...
 *   supabase secrets set OPENAI_API_KEY=sk-...
 *
 * Deploy with:
 *   supabase functions deploy llm-complete
 *
 * The web app (web/src/lib/llm/anthropic.ts) already points at this
 * function by default; VITE_ANTHROPIC_DIRECT=1 overrides for local
 * dev where the user has put the key in .env.local.
 */

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type LLMRole = 'system' | 'user' | 'assistant' | 'tool';
type LLMMessage = {
  role: LLMRole;
  content: string;
  tool_call_id?: string;
  toolCalls?: Array<{ id: string; name: string; arguments: Record<string, unknown> }>;
};
type LLMTool = { name: string; description: string; inputSchema: Record<string, unknown> };
type LLMRequest = {
  messages: LLMMessage[];
  tools?: LLMTool[];
  model?: string;
  provider?: 'anthropic' | 'openai';
  maxTokens?: number;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') {
    return json({ error: 'POST only' }, 405);
  }

  let body: LLMRequest;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return json({ error: 'messages required' }, 400);
  }

  const provider = body.provider ?? 'anthropic';
  try {
    if (provider === 'anthropic') {
      if (!ANTHROPIC_KEY) return json({ error: 'ANTHROPIC_API_KEY not set on the function' }, 500);
      return json(await callAnthropic(body));
    }
    if (provider === 'openai') {
      if (!OPENAI_KEY) return json({ error: 'OPENAI_API_KEY not set on the function' }, 500);
      return json(await callOpenAI(body));
    }
    return json({ error: `Unknown provider: ${provider}` }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 502);
  }
});

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });

// ── Anthropic ─────────────────────────────────────────────

async function callAnthropic(req: LLMRequest) {
  const model = req.model ?? 'claude-sonnet-4-6';
  const sys = req.messages.find((m) => m.role === 'system');
  const turns = req.messages.filter((m) => m.role !== 'system');

  // Convert our message shape into Anthropic's tool-use form. Tool
  // results come back as role:'tool' in our schema; in Anthropic's
  // they're role:'user' with content:[{type:'tool_result',...}].
  const messages = turns.map((m) => {
    if (m.role === 'tool') {
      return {
        role: 'user' as const,
        content: [{
          type: 'tool_result',
          tool_use_id: m.tool_call_id,
          content: m.content,
        }],
      };
    }
    if (m.role === 'assistant' && m.toolCalls?.length) {
      const blocks: unknown[] = [];
      if (m.content) blocks.push({ type: 'text', text: m.content });
      for (const tc of m.toolCalls) {
        blocks.push({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.arguments });
      }
      return { role: 'assistant' as const, content: blocks };
    }
    return { role: m.role as 'user' | 'assistant', content: m.content };
  });

  const tools = req.tools?.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema,
  }));

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: req.maxTokens ?? 1024,
      system: (sys as { content: string } | undefined)?.content,
      messages,
      ...(tools ? { tools } : {}),
    }),
  });
  if (!r.ok) throw new Error(`Anthropic ${r.status}: ${await r.text()}`);
  const j = await r.json();

  const text = (j.content ?? [])
    .filter((c: { type: string }) => c.type === 'text')
    .map((c: { text: string }) => c.text)
    .join('\n');

  const toolCalls = (j.content ?? [])
    .filter((c: { type: string }) => c.type === 'tool_use')
    .map((c: { id: string; name: string; input: Record<string, unknown> }) => ({
      id: c.id, name: c.name, arguments: c.input,
    }));

  return {
    text,
    toolCalls,
    provider: 'anthropic',
    model,
    usage: j.usage ? { inputTokens: j.usage.input_tokens, outputTokens: j.usage.output_tokens } : undefined,
  };
}

// ── OpenAI (fallback) ─────────────────────────────────────

async function callOpenAI(req: LLMRequest) {
  const model = req.model ?? 'gpt-4o';
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
    return { role: m.role as 'system' | 'user' | 'assistant', content: m.content };
  });

  const tools = req.tools?.map((t) => ({
    type: 'function' as const,
    function: { name: t.name, description: t.description, parameters: t.inputSchema },
  }));

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: req.maxTokens ?? 1024,
      messages,
      ...(tools ? { tools } : {}),
    }),
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const choice = j.choices?.[0];
  const msg = choice?.message;

  return {
    text: msg?.content ?? '',
    toolCalls: (msg?.tool_calls ?? []).map((tc: {
      id: string; function: { name: string; arguments: string }
    }) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: tryParse(tc.function.arguments),
    })),
    provider: 'openai',
    model,
    usage: j.usage ? { inputTokens: j.usage.prompt_tokens, outputTokens: j.usage.completion_tokens } : undefined,
  };
}

const tryParse = (s: string): Record<string, unknown> => {
  try { return JSON.parse(s); } catch { return {}; }
};
