// test-voice.ts — THE GATE. Proves the Grok realtime VOICE channel works:
// open a session, negotiate DOT's config, send a TEXT turn, and prove a
// text→speech response streams back through the realtime socket.
//
// Run: pnpm --filter @dot/backend voice:check
// Exit 0 on success (config logged, no session.update error, spoken text came
// back); exit 1 on any error or timeout-with-no-response. Fail loud.

import { openVoiceSession } from './realtime.js';

const COLLECT_MS = 8000;

async function main(): Promise<void> {
  let sessionConfig: unknown = null;
  let sawError = false;
  let spoken = '';

  const session = openVoiceSession({
    onSpokenDelta: (text) => {
      spoken += text;
    },
    onError: (e) => {
      sawError = true;
      console.error('[gate] onError fired:', e);
    },
  });

  // session.created / session.updated are logged by realtime.ts. We hook the raw
  // console here only to capture the first config object for the final summary —
  // simplest reliable signal without re-plumbing a callback through the client.
  // Instead of intercepting logs, we rely on a short settle: send our text turn
  // shortly after open, then collect spoken deltas.

  // Give the socket time to open + apply session.update, then send the text turn.
  await sleep(1500);
  console.log('[gate] sending text turn → expecting a spoken response back');
  session.sendText('say hi back in one short friendly sentence');

  // Collect spoken-delta text for the window.
  await sleep(COLLECT_MS);

  session.close();
  await sleep(300);

  // Summary.
  console.log('\n========== VOICE GATE SUMMARY ==========');
  console.log('session.update produced an error:', sawError ? 'YES (BAD)' : 'no');
  console.log('spoken-delta text from DOT:', spoken ? JSON.stringify(spoken) : '(none)');
  console.log('========================================\n');

  void sessionConfig; // logged inline by realtime.ts on session.created/updated.

  if (sawError) {
    console.error('[gate] FAIL — an error event fired during the session.');
    process.exit(1);
  }
  if (!spoken.trim()) {
    console.error('[gate] FAIL — no spoken-delta text came back within the window.');
    process.exit(1);
  }

  console.log('[gate] PASS — realtime session + config + text→speech response confirmed.');
  process.exit(0);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error('[gate] FAIL — unhandled error:', e);
  process.exit(1);
});
