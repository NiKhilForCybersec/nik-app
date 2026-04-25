/* Mock LLM provider — deterministic canned responses.
 *
 * Used in dev when no API key is set, and in tests. Looks at the last
 * user message and returns the prototype's hand-written reply patterns.
 * Lets the chat screen + AI affordances work end-to-end without spending
 * tokens.
 */

import type { LLMProvider, LLMRequest, LLMResponse } from './types';

const replies: { match: RegExp; reply: string; tools?: { name: string; arguments: Record<string, unknown> }[] }[] = [
  {
    match: /remind|remember|set.*reminder/i,
    reply: 'Got it — I\'ll remind you. Want me to also add it to your calendar?',
  },
  {
    match: /move.*\d+pm|push.*back/i,
    reply: 'Moved your 3pm to 3:30pm. Priya confirmed. I noticed you skipped meditation yesterday — want me to slot 10 min after?',
  },
  {
    match: /score|how.*am.*i.*doing/i,
    reply: 'You\'re at 742, up 28 this week. Focus is your strongest pillar today; family is the one to nudge — try a 5-minute call.',
  },
  {
    match: /habit|streak/i,
    reply: 'Six rituals in flight. You\'ve held a 42-day Train streak — your longest. Hydration is 2 glasses behind. Tap + on Habits to log.',
  },
  {
    match: /switch.*theme|dark|light|change.*theme|ghibli|dragon|dune|avengers|solo/i,
    reply: 'Switching theme.',
    tools: [{ name: 'ui.switchTheme', arguments: { theme: 'ghibli' } }],
  },
  {
    match: /open|go to|show me/i,
    reply: 'Opening it.',
    tools: [{ name: 'ui.navigateTo', arguments: { screen: 'home' } }],
  },
];

const fallback = 'I hear you. (Mock LLM is in stub-mode — set VITE_ANTHROPIC_API_KEY to use the real provider.)';

export class MockLLMProvider implements LLMProvider {
  readonly id = 'mock';
  readonly name = 'Mock (dev)';
  readonly runsAt = 'on-device' as const;
  readonly handles = ['trivial', 'medium', 'hard'] as const;

  isAvailable() {
    return true;
  }

  async complete(req: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();
    const lastUser = [...req.messages].reverse().find((m) => m.role === 'user');
    const text = (lastUser as { content?: string } | undefined)?.content ?? '';
    const m = replies.find((r) => r.match.test(text));
    const reply = m?.reply ?? fallback;
    const toolCalls = (m?.tools ?? []).map((t, i) => ({
      id: `mock_${Date.now()}_${i}`,
      name: t.name,
      arguments: t.arguments,
    }));

    // Pretend to think for a beat so the UI's "thinking" indicator shows.
    await new Promise((r) => setTimeout(r, 600));

    return {
      text: reply,
      toolCalls,
      provider: this.id,
      model: 'mock-1',
      latencyMs: Date.now() - start,
    };
  }
}
