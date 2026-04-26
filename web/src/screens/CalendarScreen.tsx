/* Nik — Calendar screen.
 *
 * Today's agenda + the next 7 days, manual quick-add, archive on tap.
 * Reads via the calendar contract (today / upcoming) and writes via
 * calendar.create — both are wrappers around the unified events table
 * so anything a future Google / Apple integration ingests appears here
 * automatically.
 */

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ScreenProps } from '../App';
import { I } from '../components/icons';
import { Chip, HUDCorner } from '../components/primitives';
import { useOp, useOpMutation } from '../lib/useOp';
import { calendar as calendarOps } from '../contracts/calendar';
import { events as eventsOps } from '../contracts/events';
import type { Event } from '../contracts/events';

const HUE = 280;

export default function CalendarScreen(_p: ScreenProps) {
  const { data: today = [] } = useOp(calendarOps.today, {});
  const { data: upcoming = [] } = useOp(calendarOps.upcoming, { days: 7 });
  const create = useOpMutation(calendarOps.create);
  const archive = useOpMutation(eventsOps.archive);
  const qc = useQueryClient();

  const [title, setTitle] = React.useState('');
  const [date, setDate] = React.useState(() => {
    const d = new Date(); d.setMinutes(d.getMinutes() + 60); d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [busy, setBusy] = React.useState(false);

  const add = async () => {
    if (!title.trim() || !date) return;
    setBusy(true);
    try {
      await create.mutateAsync({ title: title.trim(), occursAt: new Date(date).toISOString() });
      setTitle('');
      await qc.invalidateQueries({ queryKey: ['calendar.today'] });
      await qc.invalidateQueries({ queryKey: ['calendar.upcoming'] });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (e: Event) => {
    await archive.mutateAsync({ id: e.id });
    await qc.invalidateQueries({ queryKey: ['calendar.today'] });
    await qc.invalidateQueries({ queryKey: ['calendar.upcoming'] });
  };

  // Group upcoming by date (excluding today, since today renders separately).
  const todayKey = new Date().toDateString();
  const grouped = React.useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const e of upcoming) {
      if (!e.occurs_at) continue;
      const d = new Date(e.occurs_at);
      if (d.toDateString() === todayKey) continue;
      const key = d.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [upcoming, todayKey]);

  return (
    <div style={{ padding: '8px 16px 100px', color: 'var(--fg)' }}>
      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)' }}>
            {fmtDate(new Date()).toUpperCase()}
          </div>
          <div className="display" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.1, marginTop: 4 }}>
            Calendar
          </div>
        </div>
        <Chip tone={today.length ? 'accent' : 'default'} size="lg">
          {today.length} TODAY
        </Chip>
      </div>

      {/* Quick add */}
      <div className="glass scanlines fade-up" style={{
        padding: 14, marginBottom: 18, position: 'relative', overflow: 'hidden',
        background: `linear-gradient(135deg, oklch(0.78 0.16 ${HUE} / 0.10), transparent 70%)`,
        borderColor: `oklch(0.78 0.16 ${HUE} / 0.28)`,
      }}>
        <HUDCorner position="tl" /><HUDCorner position="tr" /><HUDCorner position="bl" /><HUDCorner position="br" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `oklch(0.78 0.16 ${HUE} / 0.22)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <I.calendar size={16} stroke={`oklch(0.92 0.14 ${HUE})`} />
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Add an event…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--fg)', fontSize: 14, fontFamily: 'var(--font-body)',
            }}
          />
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              background: 'oklch(1 0 0 / 0.06)', border: '1px solid var(--hairline)',
              borderRadius: 8, padding: '4px 8px', color: 'var(--fg-2)', fontSize: 11,
              fontFamily: 'var(--font-mono)', outline: 'none',
            }}
          />
          <div onClick={() => !busy && add()} className="tap" style={{
            width: 36, height: 36, borderRadius: 10,
            background: title.trim() && date
              ? `linear-gradient(135deg, oklch(0.78 0.16 ${HUE}), oklch(0.55 0.22 ${HUE + 60}))`
              : 'oklch(1 0 0 / 0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            opacity: busy || !title.trim() ? 0.5 : 1,
            boxShadow: title.trim() ? `0 0 12px oklch(0.78 0.16 ${HUE} / 0.4)` : 'none',
          }}>
            <I.plus size={16} stroke={title.trim() ? '#06060a' : 'var(--fg-3)'} sw={2.2} />
          </div>
        </div>
      </div>

      {/* Today */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
          TODAY
        </div>
        {today.length === 0 && (
          <div className="glass" style={{
            padding: 18, textAlign: 'center', color: 'var(--fg-3)',
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 0.5,
          }}>
            NOTHING SCHEDULED
          </div>
        )}
        {today.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {today.map((e) => <Row key={e.id} event={e} hue={HUE} onRemove={() => remove(e)} highlight />)}
          </div>
        )}
      </div>

      {/* Upcoming days */}
      {grouped.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: 2, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
            NEXT 7 DAYS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {grouped.map(([dateKey, evts]) => (
              <div key={dateKey}>
                <div style={{ fontSize: 11, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5, marginBottom: 5 }}>
                  {fmtDayHeader(dateKey)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {evts.map((e) => <Row key={e.id} event={e} hue={HUE} onRemove={() => remove(e)} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {grouped.length === 0 && today.length === 0 && (
        <div style={{ marginTop: 22, textAlign: 'center', fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5, lineHeight: 1.6 }}>
          Connect Google or Apple Calendar to auto-fill from your existing schedule.
          <br />Until then, tap above to add events manually.
        </div>
      )}
    </div>
  );
}

const Row: React.FC<{ event: Event; hue: number; onRemove: () => void; highlight?: boolean }> = ({ event, hue, onRemove, highlight }) => {
  const time = event.occurs_at ? fmtTime(event.occurs_at) : 'no time';
  return (
    <div className="glass fade-up" style={{
      padding: 10, display: 'flex', alignItems: 'center', gap: 10, borderRadius: 10,
      background: highlight
        ? `linear-gradient(135deg, oklch(0.78 0.16 ${hue} / 0.12), transparent 70%)`
        : undefined,
      borderColor: highlight ? `oklch(0.78 0.16 ${hue} / 0.3)` : undefined,
    }}>
      <div style={{
        width: 56, flexShrink: 0, fontSize: 11, fontFamily: 'var(--font-mono)',
        color: `oklch(0.92 0.14 ${hue})`, letterSpacing: 0.5,
      }}>
        {time}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {event.title}
        </div>
        {(event.body || event.location) && (
          <div style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.location && <span>{event.location}</span>}
            {event.location && event.body && ' · '}
            {event.body && <span>{event.body}</span>}
          </div>
        )}
      </div>
      <div onClick={onRemove} className="tap" style={{
        width: 28, height: 28, borderRadius: 8, opacity: 0.5,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <I.close size={13} stroke="var(--fg-3)" />
      </div>
    </div>
  );
};

function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function fmtDayHeader(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff === 1) return 'TOMORROW · ' + d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();
}
