// batcher.ts — input batcher. Lifted from doubles/src/conversation/input-batcher.ts.
// Pure timing/debounce + rate-limit: when a user fires several texts fast, batch them
// into ONE turn (don't reply to a half-finished thought); cap runaway spam. No LLM —
// the semantic work happens after flush, in the dispatcher (chatReply).
import { log } from './log.js';

const BATCH_WINDOW_MS = 3500; // batch fires this long after the LAST message (catches a rant)
const RATE_LIMIT_MAX = 60; // per-user sliding cap
const RATE_LIMIT_WINDOW_MS = 60_000; // ...per minute (tighter for a live demo)

// Commands that bypass batching (fire immediately + cancel pending).
const IMMEDIATE_COMMAND_RE = /^(\/reset|\/restart|\/reflect|\/help|stop|resume)(\s|$)/i;

export type BatchDispatcher = (userPhone: string, batchedText: string) => Promise<void>;

interface PendingBatch {
  texts: string[];
  timer: ReturnType<typeof setTimeout>;
}

export class InputBatcher {
  private pending = new Map<string, PendingBatch>();
  private processing = new Set<string>();
  private mergeBuffer = new Map<string, string[]>();
  private rateWindow = new Map<string, number[]>();

  constructor(
    private readonly dispatcher: BatchDispatcher,
    private readonly opts: { batchWindowMs?: number; rateLimitMax?: number; rateLimitWindowMs?: number } = {},
  ) {}

  private get batchWindowMs(): number {
    return this.opts.batchWindowMs ?? BATCH_WINDOW_MS;
  }

  /** Add an inbound text. Returns false if rate-limited (caller drops + warns the user). */
  addMessage(userPhone: string, text: string): boolean {
    if (!this.checkRateLimit(userPhone)) {
      log.warn('input_batcher_rate_limited', { phone: userPhone });
      return false;
    }
    if (IMMEDIATE_COMMAND_RE.test(text.trim())) {
      this.cancelPending(userPhone);
      log.info('input_batcher_immediate_command', { phone: userPhone, text: text.slice(0, 40) });
      void this.dispatch(userPhone, text);
      return true;
    }
    if (this.processing.has(userPhone)) {
      const buf = this.mergeBuffer.get(userPhone) ?? [];
      buf.push(text);
      this.mergeBuffer.set(userPhone, buf);
      return true;
    }
    const existing = this.pending.get(userPhone);
    if (existing) {
      clearTimeout(existing.timer);
      existing.texts.push(text);
      existing.timer = setTimeout(() => this.flush(userPhone), this.batchWindowMs);
    } else {
      const timer = setTimeout(() => this.flush(userPhone), this.batchWindowMs);
      this.pending.set(userPhone, { texts: [text], timer });
    }
    return true;
  }

  private flush(userPhone: string): void {
    const batch = this.pending.get(userPhone);
    if (!batch) return;
    this.pending.delete(userPhone);
    const joined = batch.texts.join('\n'); // multi-line join => the dispatcher detects "spam"
    log.info('input_batcher_flush', { phone: userPhone, bubbleCount: batch.texts.length });
    void this.dispatch(userPhone, joined);
  }

  private async dispatch(userPhone: string, text: string): Promise<void> {
    this.processing.add(userPhone);
    try {
      await this.dispatcher(userPhone, text);
    } catch (err) {
      log.error('input_batcher_dispatch_threw', err, { phone: userPhone });
    } finally {
      this.processing.delete(userPhone);
      const buffered = this.mergeBuffer.get(userPhone);
      if (buffered && buffered.length > 0) {
        this.mergeBuffer.delete(userPhone);
        // RE-BATCH messages that arrived while DOT was replying — do NOT fire a 2nd
        // reply now. A continuing rant keeps extending the batch; DOT replies ONCE
        // when they actually pause (the "let me finish ranting" fix).
        for (const t of buffered) this.addMessage(userPhone, t);
      }
    }
  }

  cancelPending(userPhone: string): void {
    const existing = this.pending.get(userPhone);
    if (existing) {
      clearTimeout(existing.timer);
      this.pending.delete(userPhone);
    }
  }

  hasPending(userPhone: string): boolean {
    return this.pending.has(userPhone);
  }

  private checkRateLimit(userPhone: string): boolean {
    const max = this.opts.rateLimitMax ?? RATE_LIMIT_MAX;
    const windowMs = this.opts.rateLimitWindowMs ?? RATE_LIMIT_WINDOW_MS;
    const now = Date.now();
    const hits = (this.rateWindow.get(userPhone) ?? []).filter((t) => now - t < windowMs);
    if (hits.length >= max) {
      this.rateWindow.set(userPhone, hits);
      return false;
    }
    hits.push(now);
    this.rateWindow.set(userPhone, hits);
    return true;
  }

  destroy(): void {
    for (const [, batch] of this.pending) clearTimeout(batch.timer);
    this.pending.clear();
    this.processing.clear();
    this.mergeBuffer.clear();
    this.rateWindow.clear();
  }
}
