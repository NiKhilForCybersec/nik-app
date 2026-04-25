/* Nik — Chat (AI voice + text) screen */
import React from 'react';
import type { ScreenProps } from '../App';
import { MOCK } from '../data/mock';
import { I } from '../components/icons';
import { VoiceOrb, Waveform } from '../components/primitives';
import { llm } from '../lib/llm';
import { useCommand } from '../lib/useCommand';

type ChatMsg = {
  from: 'user' | 'ai';
  text: string;
  time: string;
  actions?: string[];
};

export default function ChatScreen({ listening, onVoice, setState }: ScreenProps) {
  const [msgs, setMsgs] = React.useState<ChatMsg[]>(MOCK.chatHistory as ChatMsg[]);
  const [input, setInput] = React.useState('');
  const [thinking, setThinking] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, thinking]);

  const dispatch = useCommand();
  const send = async (text: string) => {
    if (!text.trim()) return;
    const nu: ChatMsg[] = [...msgs, { from: 'user', text, time: 'now' }];
    setMsgs(nu);
    setInput('');
    setThinking(true);
    try {
      const response = await llm.complete({
        messages: [
          { role: 'system', content: 'You are Nik, an in-app personal assistant. Be concise. Use tools when the user asks for an action.' },
          ...nu.map((m): { role: 'user' | 'assistant'; content: string } => ({
            role: m.from === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        ],
      });
      // Dispatch any UI commands the model wants to run.
      for (const tc of response.toolCalls) {
        if (tc.name.startsWith('ui.')) dispatch(tc.name, tc.arguments);
      }
      setMsgs([
        ...nu,
        {
          from: 'ai',
          text: response.text || (response.toolCalls.length ? '✓ Done.' : '…'),
          time: 'now',
          actions: response.toolCalls.length ? undefined : ['Open reminder', 'Dismiss'],
        },
      ]);
    } catch (e) {
      setMsgs([...nu, { from: 'ai', text: `Sorry — ${(e as Error).message}`, time: 'now' }]);
    } finally {
      setThinking(false);
    }
  };

  const suggestions = ['Plan my evening', 'Move my 3pm', 'How am I doing today?', 'Add a quest'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px 10px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--hairline)' }}>
        <VoiceOrb size={42} listening={listening}/>
        <div style={{ flex: 1 }}>
          <div className="display" style={{ fontSize: 16, fontWeight: 500 }}>Nik</div>
          <div style={{ fontSize: 10, color: 'oklch(0.78 0.15 150)', fontFamily: 'var(--font-mono)', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'oklch(0.78 0.15 150)' }}/>
            {listening ? 'LISTENING…' : 'LEARNING · 2,840 MEMORIES'}
          </div>
        </div>
        <div onClick={() => { setState?.((x) => ({ ...x, listening: false, screen: 'home' })); }} className="tap" style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--glass)', border: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I.close size={16} stroke="var(--fg)"/>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.map((m, i) => (
          <div key={i} className="fade-up" style={{
            alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '82%',
          }}>
            {m.from === 'ai' && (
              <div style={{ fontSize: 9, color: 'oklch(0.9 0.14 var(--hue))', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 4, marginLeft: 2 }}>NIK · {m.time.toUpperCase()}</div>
            )}
            <div style={{
              padding: '10px 14px', borderRadius: m.from === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
              background: m.from === 'user'
                ? 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue) / 0.25), oklch(0.65 0.22 calc(var(--hue) + 60) / 0.15))'
                : 'var(--surface)',
              border: '1px solid ' + (m.from === 'user' ? 'oklch(0.78 0.16 var(--hue) / 0.3)' : 'var(--hairline)'),
              backdropFilter: 'blur(20px)',
              fontSize: 13, lineHeight: 1.5, color: 'var(--fg)',
            }}>{m.text}</div>
            {m.actions && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {m.actions.map(a => (
                  <div key={a} className="tap" style={{
                    padding: '5px 10px', borderRadius: 99, fontSize: 11,
                    background: a === 'Confirm' || a === 'Open reminder' || a === 'Add quest'
                      ? 'oklch(0.78 0.16 var(--hue) / 0.2)'
                      : 'oklch(1 0 0 / 0.05)',
                    border: '1px solid ' + (a === 'Confirm' || a === 'Open reminder' || a === 'Add quest' ? 'oklch(0.78 0.16 var(--hue) / 0.4)' : 'var(--hairline)'),
                    color: a === 'Confirm' || a === 'Open reminder' || a === 'Add quest' ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-2)',
                    fontFamily: 'var(--font-body, Inter)', fontWeight: 500,
                  }}>{a}</div>
                ))}
              </div>
            )}
          </div>
        ))}
        {thinking && (
          <div className="fade-up" style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: '4px 18px 18px 18px', background: 'var(--surface)', border: '1px solid var(--hairline)' }}>
            <Waveform active bars={5} height={14}/>
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div style={{ padding: '0 16px 8px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {suggestions.map(s => (
          <div key={s} onClick={() => send(s)} className="tap" style={{
            padding: '6px 12px', borderRadius: 99, fontSize: 12,
            background: 'var(--glass)', border: '1px solid var(--hairline)',
            color: 'var(--fg-2)', whiteSpace: 'nowrap', flexShrink: 0,
          }}>{s}</div>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '8px 12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="glass" style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '6px 6px 6px 14px', borderRadius: 99 }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send(input)}
            placeholder="Ask or command…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--fg)', fontSize: 13, fontFamily: 'var(--font-body, Inter)' }}/>
          <div onClick={onVoice} className="tap" style={{
            width: 34, height: 34, borderRadius: '50%',
            background: listening ? 'oklch(0.78 0.16 var(--hue))' : 'oklch(0.78 0.16 var(--hue) / 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <I.mic size={15} stroke={listening ? '#06060a' : 'oklch(0.9 0.14 var(--hue))'}/>
          </div>
        </div>
        <div onClick={() => send(input)} className="tap" style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.22 calc(var(--hue) + 60)))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px oklch(0.78 0.16 var(--hue) / 0.5)',
        }}>
          <I.arrowUp size={16} stroke="#06060a" sw={2.2}/>
        </div>
      </div>
    </div>
  );
}

// (Old hand-rolled `getReply` deleted — replies now come from `llm.complete()`
//  which routes to the right provider via web/src/lib/llm/router.ts.)
