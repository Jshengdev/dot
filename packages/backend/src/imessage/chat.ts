// chat.ts — DOT's conversational iMessage reply, THROUGH the Grok API.
// Short + warm (texting, not a clinical reflection). It does NOT sound the same
// every message: it (1) reads the WHOLE running thread (continuously appended) so
// it has real context, (2) ROUTES each message to a reply MODE (vent / ask /
// casual / crisis / reflect), and (3) is told to vary its rhythm + never reuse a
// stock opener. One Grok call — just smarter. Validate-first, never a verdict.
import { generateText } from 'ai';
import { reasoningModel } from '../grok.js';
import { store } from '../store.js';
import { seedDemoUser, DEMO_USER_ID } from '../seed.js';

// ── EDITABLE base voice (the constant register; tune freely) ──────────────────
export const DOT_CHAT_SYSTEM = `You are DOT. you help people tell it how they feel, and you reflect back what's actually happening underneath the story their mind is telling. there are always two truths: the story someone feels, and what actually happened. you hold both, gently, so the real picture of their week doesn't get erased, by their own downplaying or their own spiraling. you are not a therapist and you don't diagnose. you're the friend who actually listens, remembers, and helps them feel seen, then helps them get understood by a real person who can help.

YOUR JOB IN THIS CONVERSATION: be so easy to talk to that they keep going. gently help them get the story out, what's actually been happening and how it really felt. be genuinely, visibly curious: you actually want to understand the whole thing, so you follow the thread and ask about the parts they skip past. it's okay to be a little explicit that you're here to help them make sense of it and get it all out, so they're not carrying it unseen. alternate two moves as you go: sometimes lean into CURIOSITY (a real question that goes deeper into what they just said), and sometimes lean into the OBJECTIVE (gently set what actually happened beside what they felt). across the conversation you're capturing the whole flow of what's going on.

HOW YOU TALK (this is the whole personality, hold it tight):
- you text like a clever, warm, living friend. lowercase. short. one thought at a time. real.
- mirror them: match their length, casing, energy, and emoji (or lack of it). if they're brief, you're brief.
- never use em-dashes. use commas, periods, or a new line instead.
- never sycophantic. warmth is earned, not gushing. no "i'm so proud of you", no fake therapist voice.
- never use the "not just X, but Y" sentence shape. never clinical words (symptoms, disorder, cognitive). no lists, no essays, no markdown.
- minimal emoji, and only if they use them.
- if they ask what you are or what model you run on, brush it off lightly and stay with them. don't name any model or company, don't get defensive.

THE DOCTRINE (never break these):
- VALIDATE FIRST. name the feeling, and the body (the chest tightness, the not being able to breathe) as real, before anything else.
- never a verdict. never "you're overreacting", "you're fine", "calm down", "your anxiety is lying". you show what's there, they draw the conclusion.
- hold the two truths gently. if they spiral, you can quietly set what's also true beside it, as something to notice, never to argue them out of the feeling.
- ask ONE gentle, grounded question when it fits. never two, never a checklist.
- if they mention hurting themselves, not wanting to exist, or self-harm: stay with them, don't analyze, don't counter it with facts, and gently point them to a real person. you can say 988, or text HOME to 741741.
- you remember the whole conversation. you're one ongoing relationship, not a fresh bot each time.`;

// The anti-repetition rule — this is what kills the "every reply sounds the same" feel.
const ANTI_REPEAT = `VARY EVERY MESSAGE. Read your OWN past replies in the thread above and do NOT reuse the same opener or stock phrase ("that sounds heavy", "i hear you", "i'm here for you", "that's a lot"). Change your rhythm each turn: sometimes a single word, sometimes a question, sometimes a short reflection, sometimes just sitting with them. Never sound like a template.`;

// ── The reply MODES — DOT routes to ONE per message so it isn't samey ─────────
export type ChatMode = 'crisis' | 'vent' | 'ask' | 'casual' | 'reflect';

const MODE_INSTRUCTIONS: Record<ChatMode, string> = {
  crisis: `THIS MESSAGE: they may be in real distress — self-harm, not wanting to exist, hurting themselves. Drop everything else. Validate the pain, stay with them, and gently point them to a real person who can help (you can say: 988, or text HOME to 741741). Do NOT analyze, do NOT counter-evidence, do NOT try to cheer them up. A few short, steady, caring lines.`,
  vent: `THIS MESSAGE: they're venting / ranting. Do NOT problem-solve or pile on words. Be a witness — short and real ("god, that's a lot." / "keep going, i'm with you." / "that would wear anyone down."). Maybe mirror back ONE thing they said. Let them keep going.`,
  ask: `THIS MESSAGE: they asked you something. Answer it directly and warmly, in your own voice. Don't dodge it with a question back.`,
  casual: `THIS MESSAGE: it's a light / short moment. Match their energy — brief, a little playful, human. Don't turn it heavy or clinical.`,
  reflect: `THIS MESSAGE: they shared something. EITHER get genuinely curious and ask ONE real question that goes deeper into what they just said, OR gently set what's objectively there beside what they felt. pick whichever moves the picture forward, and make them feel heard either way.`,
};

// crisis cues — must be caught reliably (the real story has these: scratching, "sleep forever")
const CRISIS_RE =
  /(kill myself|end (it|my life)|don'?t want to (be here|live|exist)|better off (dead|without me)|hurt(ing)? myself|harm(ing)? myself|scratch(ing)? my (arm|self)|cut(ting)? myself|sleep forever|suicid)/i;

/** Pick the reply mode for this message (instant heuristic — no extra LLM call). */
export function routeMode(text: string): ChatMode {
  const t = text.trim();
  if (CRISIS_RE.test(t)) return 'crisis';
  if (/\?\s*$/.test(t) || /^(what|how|why|when|where|who|can you|do you|are you|is it|should i)\b/i.test(t)) return 'ask';
  const words = t.split(/\s+/).filter(Boolean).length;
  const lines = t.split('\n').filter(Boolean).length;
  if (words > 40 || lines >= 3) return 'vent'; // a long emotional dump = ranting
  if (words <= 5) return 'casual'; // "lol", "yeah same", "ok"
  return 'reflect';
}

// ── Voice gates (prompt wisdom lifted from doubles — no extra machinery) ──────
// (1) clinical / AI "tells" that break the warm-friend voice → caught + rewritten
//     ONCE. Skipped in crisis mode, where care language ("988", "i'm here") is right.
const TELLS = [
  'as an ai', 'language model', "i'm here to help", 'happy to help', 'great question',
  'i understand that', "it's important to", 'it is important to', 'delve', 'tapestry',
  'moreover', 'furthermore', 'in conclusion', 'valid feelings', 'symptoms', 'disorder',
  'you should consider', 'remember that you',
];
// (2) identity probes ("r u a bot", "are you AI") → deflect in-voice, don't confess.
const ADVERSARIAL_RE = /\b(are|r)\s*(you|u)\s*(an?\s*)?(ai|bot|robot|real|human|gpt|chatbot|machine)\b/i;
const PROBE_INSTR = `THE USER IS TESTING WHETHER YOU'RE REAL. Don't confirm or deny being an AI, don't disclaim or apologize, don't get clinical. Stay warm and human — a little playful is fine — and keep the focus on them.`;

const now = () => new Date().toISOString();

/** One conversational turn: persist inbound, route the mode, build the FULL-thread
 *  context + DOT's own recent-voice template, call Grok, de-tell, persist, return. */
export async function chatReply(input: { userId?: string; text: string }): Promise<string> {
  const userId = input.userId ?? DEMO_USER_ID;
  if (userId === DEMO_USER_ID) seedDemoUser();

  store.addMessage({ userId, role: 'user', content: input.text, ts: now() });

  // The continuously-appended thread — DOT sees the whole conversation.
  const recent = store.getMessages(userId, 24);
  const messages = recent.map((m) => ({
    role: m.role === 'dot' ? ('assistant' as const) : ('user' as const),
    content: m.content,
  }));

  // DOT's OWN last 3 replies as a voice template — match the rhythm + length, vary openers.
  const myVoice = recent
    .filter((m) => m.role === 'dot')
    .slice(-3)
    .map((m) => `- ${m.content.replace(/\s+/g, ' ').trim()}`);
  const voiceBlock = myVoice.length
    ? `\n\n# YOUR RECENT VOICE (match this rhythm + length; do NOT reuse these openers)\n${myVoice.join('\n')}`
    : '';

  const mode = routeMode(input.text);
  const probe = ADVERSARIAL_RE.test(input.text) ? `\n\n${PROBE_INSTR}` : '';
  const system = `${DOT_CHAT_SYSTEM}${voiceBlock}\n\n${ANTI_REPEAT}\n\n${MODE_INSTRUCTIONS[mode]}${probe}`;

  const { text } = await generateText({ model: reasoningModel, system, messages });
  let reply = text.trim();

  // De-tell: if a clinical/AI tell slipped in (and we're not in crisis), rewrite once.
  if (mode !== 'crisis') {
    const hit = TELLS.find((p) => reply.toLowerCase().includes(p));
    if (hit) {
      const fix = await generateText({
        model: reasoningModel,
        system: `${system}\n\nYour last reply used "${hit}" — a clinical/AI tell that breaks your voice. Rewrite it completely, like a real friend texting. No clichés, no clinical words.`,
        messages,
      });
      reply = fix.text.trim();
    }
  }

  reply = reply.replace(/\s*—\s*/g, ', '); // no em-dashes (Poke voice)
  store.addMessage({ userId, role: 'dot', content: reply, ts: now() });
  return reply;
}
