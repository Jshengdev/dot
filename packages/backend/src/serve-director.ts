// serve-director.ts — the BONUS dashboard visual (NOT the gate). Serves dotRun on
// a plain Node http server so `npx inngest-cli@latest dev` (keyless; dashboard at
// http://127.0.0.1:8288) can discover the function and show the SAME durable steps
// the CLI gate (test-director.ts) asserts — extract → classify → reflect →
// finalize, with the human-on-risk pause rendered as a "waiting for signal" step.
//
// Run (two terminals):
//   1)  pnpm --filter @dot/backend serve            # this server on :3939
//   2)  npx inngest-cli@latest dev -u http://127.0.0.1:3939/api/inngest
//   then open http://127.0.0.1:8288 and trigger a `dot/run.requested` event:
//     { "name": "dot/run.requested",
//       "data": { "userId": "demo", "transcript": "my friends barely replied..." } }
//
// DEV is keyless (no signing/event key needed locally). Inngest CLOUD keys are ⏳
// from Johnny (docs/KEYS.md) — when present, set INNGEST_SIGNING_KEY/EVENT_KEY and
// the same handler serves Cloud unchanged.
//
// To resume a PAUSED (crisis) run from the dashboard, send the per-run clearance
// signal `dot/human.cleared:<runId>` (see director.ts clearanceSignal()).

import { createServer } from 'inngest/node';
import { inngest, functions } from './director.js';
// seed the demo user so a dashboard-triggered run has the counter-evidence to
// reflect against (the same record the gate uses).
import { seedDemoUser } from './seed.js';

const PORT = Number(process.env.PORT ?? 3939);

// Default to KEYLESS dev mode so the local Inngest dev server discovers the
// function with no signing/event key. Set INNGEST_DEV=0 + the Cloud keys
// (INNGEST_SIGNING_KEY / INNGEST_EVENT_KEY — ⏳ from Johnny, docs/KEYS.md) to
// serve Inngest Cloud with the same handler.
if (process.env.INNGEST_DEV === undefined) process.env.INNGEST_DEV = '1';

seedDemoUser();

const server = createServer({ client: inngest, functions });

server.listen(PORT, () => {
  console.log(`DOT director served on http://127.0.0.1:${PORT}/api/inngest`);
  console.log('Point the Inngest dev server at it:');
  console.log(`  npx inngest-cli@latest dev -u http://127.0.0.1:${PORT}/api/inngest`);
  console.log('Then open the dashboard:  http://127.0.0.1:8288');
});
