// agent.ts — the iMessage runner. Wires transport → batcher → chatReply (Grok) →
// paced bubbles, with the live effects:
//   • rate-limit + batch    — debounce a spam burst into ONE turn (batcher)
//   • quote-reply on spam    — when they fire several texts, reply anchored to them
//   • occasional tapbacks    — an emphasize/love every now and then, not every msg
//   • idle auto-reset        — no inbound for a while → drop pending (soft reset)
//   • /reset · /restart · /reflect · /help commands
// Everything runs THROUGH the Grok API (chatReply + /reflect's runStory).
import { InputBatcher } from './batcher.js';
import {
  connect,
  reconnect,
  onInboundMessage,
  sendBubbles,
  sendReaction,
  markRead,
  type InboundMessage,
  type ValidTapback,
} from './transport.js';
import { splitIntoBubbles } from './bubbles.js';
import { chatReply } from './chat.js';
import { log } from './log.js';
import { store } from '../store.js';
import { runStory } from '../run.js';
import { seedDemoUser, DEMO_USER_ID } from '../seed.js';

const IDLE_RESET_MS = 8 * 60 * 1000; // no inbound for 8 min → drop pending (soft reset)

const lastGuid = new Map<string, string>();
const idleTimers = new Map<string, ReturnType<typeof setTimeout>>();

function armIdle(phone: string): void {
  const prev = idleTimers.get(phone);
  if (prev) clearTimeout(prev);
  idleTimers.set(
    phone,
    setTimeout(() => {
      log.info('imessage_idle_reset', { phone });
      batcher.cancelPending(phone);
    }, IDLE_RESET_MS),
  );
}

// Reactions in DOT's own texting style — it tapbacks like a person does, matched
// to what they said (haha at funny, ❤️ at warm, ‼️ at heavy, ? at confusing, 👍 at
// agreement). A 30s cooldown keeps it expressive but not on every single message.
const lastTapbackAt = new Map<string, number>();
const TAPBACK_COOLDOWN_MS = 30_000;

function pickReaction(text: string): ValidTapback | null {
  const t = text.toLowerCase();
  if (/\b(lol|lmao+|lmfao|haha+|hah|hehe|jk)\b|😂|🤣|💀/.test(t)) return 'laugh';
  if (/(thank|thx|love (you|u|ya|that)|appreciate|miss (you|u)|grateful|you'?re the best|sweet of you)|🥰|❤️|🩵/.test(t)) return 'love';
  if (/(panic|can.?t breathe|cant breathe|falling apart|scratch|sleep forever|hurts?|scared|terrified|alone|exhaust|overwhelm|breaking down|can.?t do this|sobbing|crying)/.test(t)) return 'emphasize';
  if (/(i don.?t know|idk|what do i (do|even)|is (that|this) (normal|bad|okay|ok)|am i (crazy|overreacting)|does that make sense|right\?)\s*$/.test(t)) return 'question';
  if (/^(yeah|yea|yep|yup|true|facts|exactly|right|same|fr|forreal|mood|ok same)\b/.test(t)) return 'like';
  return null;
}

function maybeTapback(phone: string, guid: string | null, userText: string): void {
  if (!guid) return;
  const t = Date.now();
  if (t - (lastTapbackAt.get(phone) ?? 0) < TAPBACK_COOLDOWN_MS) return; // not on every message
  const reaction = pickReaction(userText);
  if (!reaction) return; // only react when one genuinely fits
  lastTapbackAt.set(phone, t);
  void sendReaction(phone, guid, reaction).catch((e) => log.warn('tapback_failed', e));
}

async function dispatch(phone: string, text: string): Promise<void> {
  const guid = lastGuid.get(phone) || null;
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  if (lower.startsWith('/reset')) {
    store.reset(DEMO_USER_ID);
    seedDemoUser();
    await sendBubbles(phone, ['fresh start 🙂', "tell me — what's been going on?"]);
    return;
  }
  if (lower.startsWith('/restart')) {
    await reconnect();
    await sendBubbles(phone, ["reconnected — i'm here."]);
    return;
  }
  if (lower.startsWith('/reflect')) {
    const userMsgs = store
      .getMessages(DEMO_USER_ID, 50)
      .filter((m) => m.role === 'user')
      .map((m) => m.content);
    const transcript = userMsgs.length ? userMsgs.join(' ') : undefined; // undefined → the seeded demo spiral
    const r = await runStory({ userId: DEMO_USER_ID, transcript });
    await sendBubbles(phone, splitIntoBubbles(r.feelingValidation), guid);
    await sendBubbles(phone, splitIntoBubbles(r.story.delta));
    return;
  }
  if (lower.startsWith('/help')) {
    await sendBubbles(phone, ['just text me how you feel.', 'commands: /reflect · /reset · /restart']);
    return;
  }

  void markRead(phone);
  // The batcher joins a multi-message burst with "\n" → that's our spam signal.
  const spammed = trimmed.split('\n').filter(Boolean).length >= 2;
  const reply = await chatReply({ userId: DEMO_USER_ID, text: trimmed }); // through Grok
  await sendBubbles(phone, splitIntoBubbles(reply), spammed ? guid : null);
}

const batcher = new InputBatcher(dispatch, { batchWindowMs: 3500 });

export async function start(): Promise<void> {
  await connect();
  seedDemoUser(); // the synthetic record /reflect grounds against
  onInboundMessage(async (msg: InboundMessage) => {
    if (msg.tapback) {
      log.info('inbound_tapback', { phone: msg.phone, reaction: msg.tapback.reactionType });
      return; // a reaction is signal, not a turn
    }
    if (!msg.text.trim()) return;
    lastGuid.set(msg.phone, msg.guid ?? '');
    armIdle(msg.phone);
    maybeTapback(msg.phone, msg.guid, msg.text);
    const ok = batcher.addMessage(msg.phone, msg.text);
    if (!ok) await sendBubbles(msg.phone, ["hey, slow down a sec — i'm still here, just catching up 🙂"]);
  });
  log.info('imessage_agent_ready', {});
}
