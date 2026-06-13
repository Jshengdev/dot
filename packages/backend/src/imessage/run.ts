// run.ts — start the iMessage agent live. `pnpm --filter @dot/backend imessage`.
// Connects to Photon (real creds in dot/.env), seeds the demo record, listens, and
// (unless DOT_ANNOUNCE=0) texts USER_PHONE one "online" bubble so you can reply to
// test. Fail loud — a connect/env failure exits non-zero.
import { loadEnv } from './env.js';
import { start } from './agent.js';
import { startChat } from './transport.js';
import { log } from './log.js';

loadEnv();

async function main(): Promise<void> {
  await start();
  const userPhone = process.env.USER_PHONE;
  log.info('imessage_listening', { forPhone: userPhone ?? '(any)' });
  if (userPhone && process.env.DOT_ANNOUNCE !== '0') {
    try {
      // cold-start the chat (createChat) so the opener lands even with no prior thread
      await startChat(userPhone, "hey, it's dot 🟦 — text me how you're feeling whenever.");
    } catch (e) {
      log.warn('announce_failed', e);
    }
  }
  console.log('\n✅ iMessage agent live. Text the number to test. Ctrl-C to stop.\n');
}

main().catch((err) => {
  console.error('IMESSAGE AGENT FAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
});
