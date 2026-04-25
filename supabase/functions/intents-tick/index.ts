/* Nik — intents tick worker.
 *
 * Supabase Edge Function (Deno runtime). Run by pg_cron on a 1-min cron
 * (`SELECT cron.schedule('nik-intents', '* * * * *', $$ select net.http_post(...) $$)`).
 *
 * Calls the SQL function intents_tick() which atomically marks pending
 * intents whose fire_at has passed as 'fired' and returns them. For each
 * returned row, dispatches the relevant action.
 *
 * Today: just logs. Wire push notifications + AI ping in subsequent commits.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Intent = {
  id: string;
  user_id: string;
  fire_at: string;
  kind: 'notify' | 'ai_ping' | 'create_dashboard' | 'check_in' | 'custom';
  payload: Record<string, unknown>;
  source: string | null;
};

Deno.serve(async (_req) => {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) {
    return new Response('missing service-role config', { status: 500 });
  }
  const sb = createClient(url, serviceKey);

  const { data, error } = await sb.rpc('intents_tick');
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const fired = (data ?? []) as Intent[];
  const dispatched: { id: string; kind: string; ok: boolean }[] = [];

  for (const intent of fired) {
    try {
      await dispatch(sb, intent);
      dispatched.push({ id: intent.id, kind: intent.kind, ok: true });
    } catch (e) {
      console.error(`[intents-tick] dispatch failed for ${intent.id}:`, e);
      await sb
        .from('scheduled_intents')
        .update({ status: 'failed', failure_reason: (e as Error).message })
        .eq('id', intent.id);
      dispatched.push({ id: intent.id, kind: intent.kind, ok: false });
    }
  }

  return new Response(
    JSON.stringify({ fired: fired.length, dispatched }),
    { headers: { 'content-type': 'application/json' } },
  );
});

async function dispatch(sb: ReturnType<typeof createClient>, intent: Intent) {
  switch (intent.kind) {
    case 'notify':
      // TODO: push to APNs/FCM via Capacitor push tokens table.
      console.log(`[notify] ${intent.user_id}: ${intent.payload.message}`);
      return;

    case 'ai_ping':
      // TODO: call llm.complete() with payload.prompt + the user's context;
      // store the assistant's message into a `notifications` table the app polls.
      console.log(`[ai_ping] ${intent.user_id}: ${intent.payload.prompt}`);
      return;

    case 'create_dashboard':
      // TODO: insert a row in user_dashboards so More menu picks it up.
      console.log(`[create_dashboard] ${intent.user_id}: ${JSON.stringify(intent.payload)}`);
      return;

    case 'check_in':
      // TODO: schedule an ai_ping or write a notification asking how X went.
      console.log(`[check_in] ${intent.user_id}: ${intent.payload.subject}`);
      return;

    case 'custom':
      console.log(`[custom] ${intent.user_id}: ${JSON.stringify(intent.payload)}`);
      return;
  }
}
