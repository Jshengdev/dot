// tapback.ts — detect an iMessage reaction (tapback) from a raw SDK inbound.
// Lifted from doubles/src/conversation/tapback.ts (DETECTION only — no DB write).
// A tapback is SIGNAL, not a text turn; the agent routes on the `tapback` field
// so a "Liked an image" reaction is never fed to the model as garbage text.

export type ReactionType = 'love' | 'like' | 'dislike' | 'laugh' | 'emphasize' | 'question' | 'unknown';
export type TapbackSentiment = 'positive' | 'negative' | 'neutral';

export interface TapbackEvent {
  reactionType: ReactionType;
  sentiment: TapbackSentiment;
  /** GUID of the message being reacted to (Apple's associatedMessageGuid). */
  targetGuid: string | null;
  /** True when the user REMOVED a previously-applied reaction. */
  isRemoval: boolean;
}

// Apple associated_message_type codes. 2000-range = applied; 3000 = removed (= 2xxx+1000).
const REACTION_CODE_TO_TYPE: Record<number, ReactionType> = {
  2000: 'love',
  2001: 'like',
  2002: 'dislike',
  2003: 'laugh',
  2004: 'emphasize',
  2005: 'question',
};

const SENTIMENT_BY_REACTION: Record<ReactionType, TapbackSentiment> = {
  love: 'positive',
  like: 'positive',
  laugh: 'positive',
  emphasize: 'positive',
  dislike: 'negative',
  question: 'neutral',
  unknown: 'neutral',
};

export function detectTapback(raw: unknown): TapbackEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const msg = raw as Record<string, unknown>;

  // imessage-kit v2 shape (preferred if present)
  if (typeof msg.isReaction === 'boolean') {
    if (!msg.isReaction) return null;
    const rt = normalizeReactionString(msg.reactionType);
    return {
      reactionType: rt,
      sentiment: SENTIMENT_BY_REACTION[rt],
      targetGuid: typeof msg.associatedMessageGuid === 'string' ? msg.associatedMessageGuid : null,
      isRemoval: msg.isReactionRemoval === true,
    };
  }

  // advanced-imessage-kit v1 shape (the SDK in use)
  const rawType = msg.associatedMessageType;
  if (rawType === undefined || rawType === null) return null;
  const code = typeof rawType === 'number' ? rawType : parseInt(String(rawType), 10);
  if (!Number.isFinite(code) || code === 0) return null;

  const isRemoval = code >= 3000 && code < 4000;
  const baseCode = isRemoval ? code - 1000 : code;
  const reactionType = REACTION_CODE_TO_TYPE[baseCode] ?? 'unknown';

  return {
    reactionType,
    sentiment: SENTIMENT_BY_REACTION[reactionType],
    targetGuid: typeof msg.associatedMessageGuid === 'string' ? msg.associatedMessageGuid : null,
    isRemoval,
  };
}

function normalizeReactionString(v: unknown): ReactionType {
  if (typeof v !== 'string') return 'unknown';
  const lower = v.toLowerCase();
  if (lower in SENTIMENT_BY_REACTION) return lower as ReactionType;
  if (lower === 'heart' || lower === 'loved') return 'love';
  if (lower === 'thumbsup' || lower === 'liked') return 'like';
  if (lower === 'thumbsdown' || lower === 'disliked') return 'dislike';
  if (lower === 'ha' || lower === 'laughed') return 'laugh';
  if (lower === '!!' || lower === 'emphasized' || lower === 'exclaim') return 'emphasize';
  if (lower === '?' || lower === 'questioned') return 'question';
  return 'unknown';
}
