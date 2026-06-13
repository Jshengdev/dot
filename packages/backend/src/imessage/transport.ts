// transport.ts — the iMessage delivery layer. Thin wrapper over
// @photon-ai/advanced-imessage-kit, lifted from doubles/src/spectrum/imessage.ts
// and adapted for DOT: self-contained env load, console logger, + replyToGuid
// (quote-reply) support for the "reply when they're spamming" effect, + reconnect.
//
// FAIL LOUD: missing env throws at load; connect failure throws. No silent retry.
// Two load-bearing inbound filters kept: drop isFromMe, de-dup by GUID (Photon is
// at-least-once — without this you double-reply, the #1 bot tell).

import { AdvancedIMessageKit } from '@photon-ai/advanced-imessage-kit';
import { loadEnv } from './env.js';
import { log } from './log.js';
import { detectTapback, type TapbackEvent } from './tapback.js';

loadEnv();

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`[imessage] FATAL: ${name} env var is required (dot/.env).`);
  return v;
}

const IMESSAGE_SERVER_URL = requireEnv('IMESSAGE_SERVER_URL');
const IMESSAGE_API_KEY = requireEnv('IMESSAGE_API_KEY');

export type ValidTapback = 'love' | 'like' | 'dislike' | 'laugh' | 'emphasize' | 'question';

export interface InboundMessage {
  phone: string;
  text: string;
  tapback?: TapbackEvent;
  guid: string | null;
  raw: unknown;
}
export type InboundHandler = (msg: InboundMessage) => Promise<void>;

let sdk: AdvancedIMessageKit | null = null;

export async function connect(): Promise<AdvancedIMessageKit> {
  if (sdk) return sdk;
  log.info('imessage_connect_start', { serverUrl: IMESSAGE_SERVER_URL.replace(/\/+$/, '') });
  const instance = new AdvancedIMessageKit({ serverUrl: IMESSAGE_SERVER_URL, apiKey: IMESSAGE_API_KEY });
  await instance.connect();
  sdk = instance;
  log.info('imessage_connect_complete', {});
  return instance;
}

/** /restart — drop the handle and reconnect fresh. */
export async function reconnect(): Promise<AdvancedIMessageKit> {
  sdk = null;
  return connect();
}

const chatGuidFor = (phone: string) => `iMessage;-;${phone}`;

export async function sendMessage(phone: string, text: string, replyToGuid?: string | null): Promise<void> {
  if (!sdk) throw new Error('[imessage] FATAL: sendMessage before connect()');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = { chatGuid: chatGuidFor(phone), message: text };
  if (replyToGuid) {
    // quote-reply: the field name differs by SDK version (1.14 = replyToGuid,
    // 1.16 = selectedMessageGuid). Set both; the server reads its own, ignores the other.
    payload.replyToGuid = replyToGuid;
    payload.selectedMessageGuid = replyToGuid;
  }
  await sdk.messages.sendMessage(payload);
  log.info('imessage_send', { phone, length: text.length, reply: !!replyToGuid });
}

/** Cold-start a 1:1 chat with a number and send the first message (createChat).
 *  Needed for the proactive opener / check-in when no thread exists yet — a plain
 *  sendMessage to a never-before-seen chat 404s (chat not found). */
export async function startChat(phone: string, message: string): Promise<void> {
  if (!sdk) throw new Error('[imessage] FATAL: startChat before connect()');
  await sdk.chats.createChat({ addresses: [phone], message, service: 'iMessage' });
  log.info('imessage_chat_created', { phone, length: message.length });
}

export async function sendReaction(phone: string, messageGuid: string, reaction: ValidTapback): Promise<void> {
  if (!sdk) throw new Error('[imessage] FATAL: sendReaction before connect()');
  await sdk.messages.sendReaction({ chatGuid: chatGuidFor(phone), messageGuid, reaction });
  log.info('imessage_reaction', { phone, reaction });
}

export async function startTyping(phone: string): Promise<void> {
  if (!sdk) return;
  try {
    await sdk.chats.startTyping(chatGuidFor(phone));
  } catch (e) {
    log.warn('typing_start_failed', e);
  }
}
export async function stopTyping(phone: string): Promise<void> {
  if (!sdk) return;
  try {
    await sdk.chats.stopTyping(chatGuidFor(phone));
  } catch (e) {
    log.warn('typing_stop_failed', e);
  }
}
export async function markRead(phone: string): Promise<void> {
  if (!sdk) return;
  try {
    await sdk.chats.markChatRead(chatGuidFor(phone));
  } catch (e) {
    log.warn('mark_read_failed', e);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// Cadence feels ALIVE + uneven: a longer bubble visibly "takes longer to type",
// plus jitter so no two gaps match.
const bubbleDelay = (t: string) => 400 + Math.min(900, t.length * 9) + Math.floor(Math.random() * 500);

/** Send a reply as paced 1-5 bubbles. If replyToGuid is set, the FIRST bubble
 *  quote-replies their message (the spam-reply effect); the rest send plain. */
export async function sendBubbles(phone: string, content: string[], replyToGuid?: string | null): Promise<void> {
  for (let i = 0; i < content.length; i++) {
    const bubble = content[i] ?? '';
    if (i > 0) {
      void startTyping(phone);
      await sleep(bubbleDelay(bubble));
    }
    await sendMessage(phone, bubble, i === 0 ? replyToGuid : null);
  }
  void stopTyping(phone);
  log.info('imessage_send_bubbles', { phone, bubbles: content.length, reply: !!replyToGuid });
}

// Inbound dedup — Photon is at-least-once. Bounded in-memory set of seen GUIDs.
const seenInboundGuids = new Set<string>();
const SEEN_GUID_LIMIT = 1000;

export function onInboundMessage(handler: InboundHandler): void {
  if (!sdk) throw new Error('[imessage] FATAL: onInboundMessage before connect()');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sdk.on('new-message', (msg: any) => {
    void (async () => {
      const phone: string = msg.handle?.address ?? (msg.handleId ? String(msg.handleId) : '');
      if (!phone) {
        log.warn('inbound_no_phone', {});
        return;
      }
      if (msg.isFromMe) return; // never reply to our own echoes
      const guid: string | null = msg.guid ?? msg.id ?? null;
      if (guid) {
        if (seenInboundGuids.has(guid)) {
          log.warn('inbound_duplicate_dropped', { guid });
          return;
        }
        seenInboundGuids.add(guid);
        if (seenInboundGuids.size > SEEN_GUID_LIMIT) {
          seenInboundGuids.delete(seenInboundGuids.values().next().value as string);
        }
      }
      const text: string = msg.text ?? '';
      const tapback = detectTapback(msg) ?? undefined;
      try {
        await handler({ phone, text, tapback, guid, raw: msg });
      } catch (err) {
        // Don't rethrow — that would kill the SDK event loop. One bad turn != dead bot.
        log.error('inbound_handler_threw', err);
      }
    })();
  });
  log.info('imessage_inbound_handler_registered', {});
}
