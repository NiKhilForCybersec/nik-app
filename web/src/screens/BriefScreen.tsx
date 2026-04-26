/* Nik — Today's Brief.
 *
 * Reads ingested events from `events` table (movie tickets, calendar
 * events, bills, birthdays, packages — anything any integration MCP
 * server pushed in). Audio-player-shaped UI sits on top of real data.
 */

import React from 'react';
import type { ScreenProps } from '../App';
import { useOp } from '../lib/useOp';
import { events as eventOps, type Event } from '../contracts/events';

const ICONS: Record<string, string> = {
  movie_ticket:        '🎬',
  flight_booking:      '✈️',
  hotel_booking:       '🏨',
  restaurant_booking:  '🍽',
  calendar_event:      '📅',
  gmail_thread:        '✉️',
  gmail_receipt:       '🧾',
  birthday_reminder:   '🎂',
  bill_due:            '💸',
  subscription_renewal:'🔁',
  whatsapp_message:    '💬',
  sms_otp:             '🔐',
  package_delivery:    '📦',
  manual:              '📝',
  other:               '·',
};

const fmtTime = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const days = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (days === 1)  return `tomorrow · ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  if (days < 7)    return `${d.toLocaleDateString([], { weekday: 'short' })} · ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

const todayLabel = () =>
  new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });

export default function BriefScreen(_props: ScreenProps) {
  const eventsQ = useOp(eventOps.list, { limit: 12 });
  const items: Event[] = eventsQ.data ?? [];

  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [activeSeg, setActiveSeg] = React.useState(0);

  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setProgress((p) => {
        const next = p + 0.005;
        if (next >= 1) { setPlaying(false); return 1; }
        const seg = Math.min(items.length - 1, Math.floor(next * items.length));
        setActiveSeg(seg);
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [playing, items.length]);

  const totalSec = Math.max(60, items.length * 30); // ~30s narration per item
  const cur = Math.floor(progress * totalSec);
  const fmt = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const dur = fmt(totalSec);

  return (
    <div style={{ padding: '8px 16px 100px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
          {todayLabel().toUpperCase()}
        </div>
        <div className="display" style={{ fontSize: 28, fontWeight: 'var(--display-weight, 500)' as any, lineHeight: 1.1, marginTop: 4, textTransform: 'var(--display-case)' as any, letterSpacing: 'var(--display-tracking)' }}>
          Today's Brief
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 6 }}>
          {items.length} thing{items.length === 1 ? '' : 's'} from your inbox, calendar, and family
        </div>
      </div>

      {/* Player */}
      <div className="glass fade-up" style={{ padding: 18, marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0.55 0.22 var(--hue) / 0.25), transparent 70%)', pointerEvents: 'none' }}/>

        {/* Voice viz */}
        <div style={{ position: 'relative', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, marginBottom: 14 }}>
          {Array.from({ length: 48 }).map((_, i) => {
            const phase = (i / 48) - progress;
            const inWindow = Math.abs(phase) < 0.12;
            const seed = Math.sin(i * 1.3) * 0.5 + 0.5;
            const baseH = 8 + seed * 36;
            const h = playing && inWindow ? baseH * (1 + Math.sin((Date.now()/200) + i) * 0.3) : baseH;
            const passed = i / 48 < progress;
            return <div key={i} style={{ width: 2, height: h, borderRadius: 99, background: passed ? 'oklch(0.85 0.14 var(--hue))' : 'oklch(0.78 0.16 var(--hue) / 0.25)', transition: playing ? 'none' : 'height .3s' }}/>;
          })}
        </div>

        {/* Time */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
          <span>{fmt(cur)}</span>
          <span>{dur}</span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
          <div onClick={() => { const i = Math.max(0, activeSeg - 1); setActiveSeg(i); setProgress(items.length ? i / items.length : 0); }} className="tap" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-2)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
          </div>
          <div onClick={() => setPlaying(!playing)} className="tap" style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, oklch(0.78 0.16 var(--hue)), oklch(0.55 0.2 var(--hue)))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px oklch(0.55 0.22 var(--hue) / 0.4)' }}>
            {playing ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#06060a"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#06060a"><polygon points="6 4 20 12 6 20 6 4"/></svg>
            )}
          </div>
          <div onClick={() => { const i = Math.min(items.length - 1, activeSeg + 1); setActiveSeg(i); setProgress(items.length ? i / items.length : 0); }} className="tap" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-2)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
          </div>
        </div>

        {/* Speed + queue */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)', letterSpacing: 1 }}>
          <span className="tap">1.0×</span>
          <span>VOICE · MORNING</span>
          <span className="tap">QUEUE</span>
        </div>
      </div>

      {/* Transcript */}
      <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, marginBottom: 8, padding: '0 4px' }}>
        {eventsQ.isLoading ? 'LOADING' : eventsQ.error ? 'ERROR' : `${items.length} ITEMS · TAP TO FOCUS`}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.length === 0 && !eventsQ.isLoading && (
          <div className="glass" style={{ padding: 16, textAlign: 'center', fontSize: 13, color: 'var(--fg-2)' }}>
            Nothing in your feed yet. Connect Gmail or Calendar to start filling this in.
          </div>
        )}
        {items.map((ev, i) => {
          const active = i === activeSeg;
          return (
            <div
              key={ev.id}
              onClick={() => { setActiveSeg(i); setProgress(i / Math.max(1, items.length)); }}
              className="tap glass fade-up"
              style={{
                padding: 12,
                background: active ? 'oklch(0.78 0.16 var(--hue) / 0.1)' : undefined,
                borderLeft: active ? '2px solid oklch(0.78 0.16 var(--hue))' : '2px solid transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 16 }}>{ICONS[ev.kind] ?? '·'}</div>
                <div style={{ fontSize: 10, color: active ? 'oklch(0.9 0.14 var(--hue))' : 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
                  {fmtTime(ev.occurs_at)}
                </div>
                <div style={{ flex: 1, fontSize: 13, color: active ? 'var(--fg)' : 'var(--fg-2)', fontWeight: 500 }}>
                  {ev.title}
                </div>
              </div>
              {ev.body && (
                <div style={{ fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.5, marginLeft: 28 }}>
                  {ev.body}
                </div>
              )}
              {ev.location && (
                <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 4, marginLeft: 28 }}>
                  📍 {ev.location}
                </div>
              )}
              {ev.source_provider && (
                <div style={{ fontSize: 9, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginTop: 4, marginLeft: 28 }}>
                  via {ev.source_provider.toUpperCase()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
