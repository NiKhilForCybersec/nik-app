import { defineScreen } from '../lib/screen-manifest';

// Dev console — gated on import.meta.env.DEV. Doesn't read any single
// op directly; it introspects the whole registry. Reads are deliberate
// supabase calls outside the useOp pattern (it's a debug tool, not
// production app code).
export const manifest = defineScreen({
  id: 'dev',
  reads: [],
  writes: [],
  commands: [],
  permissions: [],
  aiAffordances: [],
});
