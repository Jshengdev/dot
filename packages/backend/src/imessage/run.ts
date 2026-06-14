// run.ts — start the iMessage agent live. `pnpm --filter @dot/backend imessage`.
// Connects to Photon (real creds in dot/.env), seeds the demo record, listens, and
// (unless DOT_ANNOUNCE=0) texts USER_PHONE one "online" bubble so you can reply to
// test. Fail loud — a connect/env failure exits non-zero.
import { createServer } from 'node:http';
import { loadEnv } from './env.js';
import { start } from './agent.js';
import { startChat, sendBubbles } from './transport.js';
import { splitIntoBubbles } from './bubbles.js';
import { CHECKINS } from './checkins.js';
import { log } from './log.js';

loadEnv();

// A tiny HTTP trigger so the WEB frontend can advance the staggered check-ins:
// click a tab -> GET http://localhost:8790/checkin/<n> -> DOT texts check-in n to
// USER_PHONE. CORS-open (the local demo's browser calls it cross-origin).
const TRIGGER_PORT = 8790;

// Deliver one check-in as paced bubbles, AWAITED, with a cold-start fallback: a
// plain sendBubbles to a never-seen thread 404s, so on failure we createChat with
// the first bubble (warming the thread) and send the rest. Throws if THAT fails
// too — the caller turns the throw into a visible 500 (no silent stub).
async function deliverCheckin(phone: string, text: string): Promise<void> {
  const bubbles = splitIntoBubbles(text);
  try {
    await sendBubbles(phone, bubbles);
  } catch (e) {
    log.warn('checkin_send_retry_via_createchat', e);
    await startChat(phone, bubbles[0] ?? text); // cold-start the thread
    if (bubbles.length > 1) await sendBubbles(phone, bubbles.slice(1));
  }
}

function startTriggerServer(): void {
  const phone = process.env.USER_PHONE;
  createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    // health probe — the web frontend pings this to confirm the agent is reachable
    if (req.url === '/' || req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, phone: !!phone, count: CHECKINS.length }));
      return;
    }
    const m = req.url?.match(/^\/checkin\/(\d+)/);
    if (m) {
      if (!phone) {
        res.writeHead(503, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'USER_PHONE not set in .env' }));
        return;
      }
      const n = Number(m[1]);
      const text = CHECKINS[n];
      if (!text) {
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'unknown checkin', count: CHECKINS.length }));
        return;
      }
      // AWAIT the real send — 200 only after it actually lands; 500 (loud) if not.
      deliverCheckin(phone, text)
        .then(() => {
          log.info('checkin_sent', { n });
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ sent: n, of: CHECKINS.length }));
        })
        .catch((e) => {
          log.error('checkin_send_failed', e);
          res.writeHead(500, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e), checkin: n }));
        });
      return;
    }
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'unknown route', count: CHECKINS.length }));
  }).listen(TRIGGER_PORT, () => log.info('checkin_trigger_listening', { port: TRIGGER_PORT, forPhone: phone ?? '(none)' }));
}

async function main(): Promise<void> {
  await start();
  startTriggerServer(); // the web "next check-in" trigger
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
