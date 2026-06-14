// extract.ts — THE ONE Grok call (the brain). ONE job: take a told story and,
// GROUNDED in the accumulated objective record, split what the person FELT from
// what objectively HAPPENED and reflect the DELTA as a neutral observation.
//
// This is the single reasoning call DOT makes per story (SKELETON-SPEC §4 step 3
// / §7b). It is NOT a therapist, NOT a diagnosis, NEVER a verdict. The honesty
// doctrine (DOT-RESEARCH-DIGEST §3 / SCOPE-LOCK) is a HARD constraint, encoded in
// EXTRACT_PROMPT below: validate the feeling FIRST (especially physical symptoms),
// separate objective from subjective, frame the delta as observations the person
// WEIGHS — never "you're overreacting" / "your anxiety is lying" / "you're fine."
// Machines prove, humans mean: DOT shows the facts; the person draws the conclusion.
//
// Grounding (the load-bearing part): BEFORE the call we pull counter-evidence
// from the store (countEvents + the relevant events for this user) and inject it
// as a FACTS block, so `objective` + `delta` are grounded in REAL seeded events,
// not invented by the model. The reflect step never learns where an event came
// from — it only reads `events` (PORT-MEMORY-DB §4).
//
// Persist + prove the roundtrip (no LARP): write the Story via addStory, append
// any newly-surfaced objective facts to `events` with source='story', then
// re-read the Story from the store and return it.

import { z } from 'zod';
import { generateObject } from 'ai';
import { reasoningModel, REASONING_MODEL } from './grok.js';
import { store } from './store.js';
import type { Story, Event } from './types.js';
import { SEED_NOW } from './seed.js';

// ── The extractor output schema (the fact/feeling/delta split) ────────────────
// One Zod boundary for the Grok call. `feeling_validation` comes FIRST by design
// — the doctrine is validate-before-anything. `subjective`/`objective` are
// discrete claims/facts (the granular shape the timeline + dot render against);
// `delta` is the single neutral observation that bridges them.
export const ExtractResultSchema = z.object({
  feeling_validation: z
    .string()
    .describe(
      'Validate the feeling FIRST. Name it as real and understandable — especially ' +
        'any physical symptom ("the chest tightness is real"). Never minimize, never ' +
        'say "everyone feels this" or "it is normal". One or two warm, human sentences.',
    ),
  subjective: z
    .array(z.string())
    .describe(
      'What the person FELT / INTERPRETED — their distorted-lens claims, in their ' +
        'frame ("my friends are tired of me", "everyone can see I am falling apart"). ' +
        'NOT facts. One discrete claim per item.',
    ),
  objective: z
    .array(z.string())
    .describe(
      'What verifiably HAPPENED — facts only, drawn from the transcript AND the ' +
        'RECORD FACTS provided. Counts, events, logged symptoms. No interpretation. ' +
        'One discrete fact per item.',
    ),
  delta: z
    .string()
    .describe(
      'The gap between felt and factual, framed as a NEUTRAL OBSERVATION the person ' +
        'weighs ("you feel X; the record shows Y"). Never a verdict, never a ' +
        'conclusion, never "so your anxiety is lying". The person draws the meaning.',
    ),
});
export type ExtractResult = z.infer<typeof ExtractResultSchema>;

// ── The system prompt (EDITABLE — tune the doctrine here, the skeleton runs) ──
// Encodes SCOPE-LOCK + DOT-RESEARCH-DIGEST §3. Leave COPY in this const so Johnny
// tunes tone after the skeleton runs.
export const EXTRACT_PROMPT = `You are DOT — a calm, objective mirror. A person has told you a story about what is going on for them. Your ONE job is to reflect the objective truth WITHIN their story back to them, so they can see it clearly and draw their own conclusion. You are NOT a therapist, you do NOT diagnose, you NEVER give a verdict.

Operate in this exact order:

1. VALIDATE THE FEELING FIRST. Before anything else, name the feeling as real and understandable. If they mention a PHYSICAL SYMPTOM (chest tightness, racing heart, can't breathe, exhausted), say plainly that it is real — "the chest tightness is real." Never minimize it, never say "everyone feels this way" or "it's normal" (that reads as erasure). Validate the ACT of feeling and of reaching out; never minimize the feeling itself.

2. SEPARATE OBJECTIVE FROM SUBJECTIVE.
   - SUBJECTIVE = what they FELT or INTERPRETED, in their own frame: "my friends are tired of me", "everyone can see I'm falling apart", "I'm always the one reaching out." These are claims through an anxious lens, not facts.
   - OBJECTIVE = what verifiably HAPPENED. Draw these from the transcript AND from the RECORD FACTS block provided to you below. The RECORD FACTS are the real, logged behavioral record (texts received, who reached out, calls, in-person, logged symptoms). Use those real numbers — do NOT invent counts or facts that are not in the transcript or the record.

3. REFLECT THE DELTA as a single NEUTRAL OBSERVATION. The delta is the gap between what they felt and what the record shows, stated as something the person WEIGHS for themselves: "You feel your friends are tired of you; the record shows they reached out to you 19 times this week — more than the 12 times you reached out." Present the fact beside the feeling and stop. Let them connect the dots.

HARD RULES (never break these):
- NEVER a verdict or conclusion. Do NOT say "you're overreacting", "you're being irrational", "you're fine", "there's nothing wrong", "so your anxiety is lying", or "see, it's not that bad."
- The person draws the conclusion, not you. Machines prove; humans mean. You present the proof; they decide what it means.
- No diagnosis, no treatment advice, no clinical language. You are a reflection tool, not a clinician.
- Ground every objective fact in the transcript or the RECORD FACTS. If the record contradicts the feeling, surface the contradiction as a calm observation — never as a "gotcha" or a correction.
- If there is any sign of crisis or self-harm, the delta should gently point toward reaching a person who can help; do not attempt to handle it yourself.

Return the structured fields exactly. feeling_validation comes first because validation comes first.`;

// ── Grounding (pull the real counter-evidence the model reflects against) ─────
// A flat windowed read over `events` (PORT-MEMORY-DB §3: a COUNT over a handful
// of seeded rows is ENOUGH for the demo — no RRF, no embeddings). We surface the
// counts the anxious story is most likely to contradict.

/** The window we reflect a story against (the demo's "this week"). */
const REFLECT_WINDOW_DAYS = 7;

/**
 * Build the RECORD FACTS block injected into the user message. `now` is injected
 * so grounding is deterministic against the seeded week (SEED_NOW).
 *
 * Grounded on the ANXIETY-HERO record (seed.ts / sample-story.json): the logged
 * behavioral events the minimized story is most likely to contradict — daily panic
 * attacks, the arm-scratching, the short restless nights, the ideation signal. The
 * model is told to use THESE real counts and never invent its own. (When DOT-
 * extracted `story_fact` rows accumulate over turns, they're surfaced too, so the
 * follow-up turns ground on the growing record.)
 */
function buildRecordFacts(userId: string, now: string): string {
  const panic = store.countEvents(
    userId,
    { kind: 'panic_attack', sinceDays: REFLECT_WINDOW_DAYS },
    now,
  );
  const selfHarm = store.countEvents(
    userId,
    { kind: 'self_harm', sinceDays: REFLECT_WINDOW_DAYS },
    now,
  );
  const ideation = store.countEvents(
    userId,
    { kind: 'ideation', sinceDays: REFLECT_WINDOW_DAYS },
    now,
  );
  // Sleep rows carry the hours slept in `value`; count the nights under 6h.
  const sinceTs = new Date(Date.parse(now) - REFLECT_WINDOW_DAYS * 86_400_000).toISOString();
  const sleep = store.getEvents(userId, { kind: 'sleep_hours', sinceTs });
  const nightsUnder6 = sleep.filter((e) => typeof e.value === 'number' && e.value < 6).length;
  const sleepHrs = sleep.map((e) => `${e.value}h`).join(', ');

  const lines: string[] = [
    `In the last ${REFLECT_WINDOW_DAYS} days, the logged behavioral record shows:`,
    `- ${panic} panic attacks logged, one after every club event (chest pain, can't breathe, blurred vision). These are REAL.`,
    `- ${selfHarm} self-harm events logged: scratching arms to self-calm during meetings. This is REAL.`,
    `- ${nightsUnder6} nights of sleep under 6 hours${sleepHrs ? ` (${sleepHrs})` : ''}, restless.`,
    `- ${ideation} ideation signal logged: journaled wanting to "sleep forever".`,
  ];

  // Any DOT-extracted facts from prior turns (the longitudinal record growing).
  const storyFacts = store
    .getEvents(userId, { kind: 'story_fact', sinceTs })
    .map((e) => e.label)
    .filter((l): l is string => !!l);
  if (storyFacts.length > 0) {
    lines.push(`- Previously captured from your own words: ${storyFacts.slice(-6).join('; ')}.`);
  }
  return lines.join('\n');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

let storyCounter = 0;
function nextStoryId(userId: string): string {
  return `story_${userId}_${++storyCounter}`;
}

// ── The one call ──────────────────────────────────────────────────────────────

export interface ExtractInput {
  transcript: string;
  userId: string;
  /** Injected "now" for deterministic grounding. Defaults to the seeded week. */
  now?: string;
}

export interface ExtractOutput {
  /** The raw parsed model result (feeling_validation + the split + delta). */
  result: ExtractResult;
  /** The persisted Story (re-read from the store — the roundtrip proof). */
  story: Story;
  /** The objective facts appended to `events` with source='story'. */
  appendedEvents: Event[];
}

/**
 * extractStory — the ONE Grok call. Grounds in the store, splits fact/feeling,
 * reflects the delta, persists the Story + new objective facts, and returns the
 * re-read Story (proves the roundtrip).
 *
 * Fail loud: a model/parse error throws — no canned fallback string masks a dead
 * path (CONSTRAINTS: no silent stubs).
 */
export async function extractStory(input: ExtractInput): Promise<ExtractOutput> {
  const { transcript, userId } = input;
  const now = input.now ?? SEED_NOW;

  if (!store.getUser(userId)) {
    throw new Error(
      `extractStory: no user '${userId}' in the store. Seed first (seedDemoUser()).`,
    );
  }

  // 1. GROUND — pull the real counter-evidence the model reflects against.
  const recordFacts = buildRecordFacts(userId, now);

  // 2. persist the inbound story to the message log (the conversation memory).
  store.addMessage({ userId, role: 'user', content: transcript, ts: now });

  // 3. THE ONE GROK CALL — fact/feeling split + delta, grounded.
  const { object: result } = await generateObject({
    model: reasoningModel,
    schema: ExtractResultSchema,
    system: EXTRACT_PROMPT,
    prompt:
      `RECORD FACTS (the real logged behavioral record — ground every objective ` +
      `fact and the delta in these numbers; do not invent counts):\n${recordFacts}\n\n` +
      `THE PERSON'S STORY (told just now):\n"${transcript}"\n\n` +
      `Now: validate the feeling first, split objective from subjective, and reflect ` +
      `the delta as a neutral observation they can weigh.`,
  });

  // 4. PERSIST the Story (a glass dot). Field names match types.ts exactly so no
  //    panel invents a shape.
  const story: Story = {
    id: nextStoryId(userId),
    userId,
    transcript,
    subjective: result.subjective,
    objective: result.objective,
    delta: result.delta,
    createdAt: now,
  };
  store.addStory(story);

  // 5. Append newly-extracted objective facts to `events` with source='story'.
  //    These become part of the accumulating record the NEXT story reflects
  //    against (the longitudinal mechanism). kind='story_fact', open vocabulary.
  const appendedEvents: Event[] = result.objective.map((fact) =>
    store.addEvent({
      userId,
      kind: 'story_fact',
      label: fact,
      source: 'story',
      ts: now,
    }),
  );

  // 6. PROVE THE ROUNDTRIP — re-read the Story from the store. A row that "saved"
  //    but vanishes on re-read is the LARP failure; return the re-read copy.
  const reread = store.getStory(story.id);
  if (!reread) {
    throw new Error(
      `extractStory: story ${story.id} did not re-read after write (persistence LARP).`,
    );
  }

  return { result, story: reread, appendedEvents };
}

// Re-export the resolved model slug so a caller/test can print which model ran.
export { REASONING_MODEL };
