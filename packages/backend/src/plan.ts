// plan.ts — the CHECK-IN PLAN (the forward timer). ONE job: read what the live
// intake learned (the user's knowledge graph + the windowed stat sheet) and, in a
// SINGLE Grok call, schedule 2-4 forward check-ins — each an OBJECTIVE reminder
// tied to a real pattern in the graph, NOT a "how are you feeling" ping.
//
// This is the product thesis carried forward in time: a check-in is "you said the
// panic hits after every club event, and there's one friday — i'll be around"
// (an objective reminder anchored to a real node), never "are you ok?" (the cold
// comfort prompt the digest BANS). DOT's voice doctrine holds (validate-first,
// lowercase, short, no em-dashes, never a verdict) because the prompt below carries
// it; tune the COPY in the editable consts after the skeleton runs.
//
// Grounding (the load-bearing part): the model only sees the real graph nodes and
// the real counted stat sheet, and each check-in MUST name the node id it WATCHES,
// so every scheduled prompt is traceable back to something the person actually said
// — no invented concern.
//
// Determinism: `now` is injected (no Date.now in core logic). scheduledFor = now +
// offsetHours, with DOT_CHECKIN_SCALE compressing real days→demo minutes so the
// timer fires inside a 3-minute demo. ids come from the store.
//
// Fail loud (CONSTRAINTS): a model/parse error throws — no canned check-in masks a
// dead plan path.

import { z } from 'zod';
import { generateObject } from 'ai';
import { reasoningModel, REASONING_MODEL } from './grok.js';
import { store } from './store.js';
import type { CheckIn, GraphNode } from './types.js';

// ── The plan output schema (the ONE Grok boundary) ────────────────────────────
// 2-4 forward check-ins. Each carries the OBJECTIVE prompt (DOT's voice), the node
// id it WATCHES (the traceability anchor), a clinical reason, and offsetHours (when
// after `now` it should fire). offsetHours is the raw real-world delay; the demo
// scale compresses it on the way to scheduledFor (below) — the model reasons in
// real time, the timer fires in demo time.
export const CheckInPlanItemSchema = z.object({
  prompt: z
    .string()
    .describe(
      "What DOT will text at check-in time. DOT's voice: lowercase, short, warm, no " +
        'em-dashes, never a verdict. It is an OBJECTIVE REMINDER tied to a real pattern ' +
        'the person surfaced ("you said the panic hits after every club thing, and ' +
        "there's one friday. i'll be around after\") — NEVER \"are you ok?\" / \"how are " +
        'you feeling?\" / a generic comfort ping. anchor it to something concrete they ' +
        'actually said.',
    ),
  watching: z
    .string()
    .describe(
      'The graph node id this check-in follows up on (e.g. "symptom:insomnia" or ' +
        '"event:club_friday"). MUST be one of the node ids provided in the GRAPH block ' +
        '— this is the traceability anchor; do not invent an id.',
    ),
  reason: z
    .string()
    .describe(
      'The clinical rationale: why this pattern is worth a forward check-in (e.g. ' +
        '"panic logged after every club event; a known trigger recurs friday"). One ' +
        'sentence. This is internal reasoning, not shown to the user.',
    ),
  offsetHours: z
    .number()
    .describe(
      'When this check-in should fire, in hours AFTER now (real-world time). e.g. 24 ' +
        '= tomorrow, 72 = in three days. A positive number; sooner for sharper patterns.',
    ),
});
export type CheckInPlanItem = z.infer<typeof CheckInPlanItemSchema>;

export const CheckInPlanSchema = z.object({
  checkins: z
    .array(CheckInPlanItemSchema)
    .min(2)
    .max(4)
    .describe('2 to 4 forward check-ins, each anchored to a distinct real pattern.'),
});
export type CheckInPlan = z.infer<typeof CheckInPlanSchema>;

// ── The system prompt (EDITABLE — tune the doctrine here, the skeleton runs) ──
// Carries DOT's voice + the check-in thesis: objective reminder, never comfort
// ping. Leave COPY in this const so Johnny tunes tone after the skeleton runs.
export const PLAN_PROMPT = `You are DOT — a calm, objective mirror. The live intake just wrapped, and you've built a graph of what the person actually surfaced: their symptoms, the timeline, the two truths (what they felt vs what happened), any risk signal, and the context. Your ONE job now is to schedule a small set of FORWARD CHECK-INS — short texts DOT will send the person later — each anchored to a REAL pattern in that graph.

What a DOT check-in IS:
- an OBJECTIVE REMINDER tied to something concrete they told you. "you said the panic hits after every club thing, and there's one friday. i'll be around after." / "earlier you noticed you sleep worse the nights you skip dinner. just flagging it." It sets a fact they surfaced beside the moment it recurs, so the real picture doesn't get erased by their own downplaying.

What a DOT check-in is NOT (never do this):
- NOT "are you ok?", NOT "how are you feeling?", NOT "thinking of you", NOT a generic comfort ping. A bare "are you ok" erases the work — it makes them re-summarize from scratch and gives them nothing to react to. Always give them something concrete you remember.

HOW EACH PROMPT SOUNDS (DOT's voice, hold it tight):
- lowercase. short. one thought. real, like a friend who actually remembers.
- never use em-dashes. commas, periods, or a new line instead.
- never a verdict ("you're overreacting", "you're fine", "your anxiety is lying"). you set the fact beside the feeling and stop.
- never clinical words (symptom, disorder, cognitive) in the prompt itself. warm and plain.
- never sycophantic, never a checklist, never markdown.

RULES:
- Schedule 2 to 4 check-ins, each tied to a DISTINCT real pattern (don't repeat the same concern).
- Each check-in MUST name the graph node id it is WATCHING — pick from the node ids given to you. This is how the check-in stays traceable to a real thing they said. Do not invent a node id.
- Ground 'reason' in the graph + the counted record. 'reason' is your internal rationale; it is NOT shown to the person.
- Time them sensibly: sooner (next day or two) for a sharp, recurring trigger; a few days out for a slower pattern. offsetHours is real-world hours after now.
- If there is a RISK SIGNAL in the graph, the soonest check-in should gently keep a door open to a real person who can help — never analyze it, never counter it with facts.

Return the structured list exactly.`;

// ── Grounding helpers (only the real graph + stats reach the model) ───────────

/** Render the user's graph for the prompt: the node ids the check-in can WATCH,
 *  grouped by panel, plus the relations. Compact + id-forward so the model anchors
 *  each check-in to a real, namable node. */
function renderGraph(nodes: GraphNode[], edges: { source: string; target: string; type: string }[]): string {
  if (nodes.length === 0) return '(the graph is empty — no nodes were surfaced this intake)';
  const byPanel = new Map<string, GraphNode[]>();
  for (const n of nodes) {
    const bucket = byPanel.get(n.panel) ?? [];
    bucket.push(n);
    byPanel.set(n.panel, bucket);
  }
  const lines: string[] = ['NODES (id — name: summary [salience]):'];
  for (const [panel, group] of byPanel) {
    lines.push(`  [${panel}]`);
    for (const n of group) {
      lines.push(`    ${n.id} — ${n.name}: ${n.summary} [${n.salience}]`);
    }
  }
  if (edges.length > 0) {
    lines.push('RELATIONS (source -type-> target):');
    for (const e of edges) lines.push(`  ${e.source} -${e.type}-> ${e.target}`);
  }
  return lines.join('\n');
}

/** Render the windowed stat sheet: the counted record the patterns sit on top of. */
function renderStats(stats: { kind: string; count: number; window: string }[]): string {
  if (stats.length === 0) return '(no counted events in the window)';
  return stats.map((s) => `- ${s.kind}: ${s.count} in the last ${s.window}`).join('\n');
}

// ── Demo-time compression ─────────────────────────────────────────────────────
// DOT_CHECKIN_SCALE is a divisor that compresses real days into demo minutes so the
// forward timer actually fires inside a 3-minute demo. Default 1 (real time). e.g.
// SCALE=1440 turns a 24h offset into 1 real minute (24*3600/1440 = 60s).
function checkInScale(): number {
  const raw = process.env.DOT_CHECKIN_SCALE;
  if (!raw) return 1;
  const n = Number(raw);
  // Guard a bad env value loudly-ish: fall back to real time rather than NaN math.
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** scheduledFor = now + (offsetHours / scale), as ISO. The scale shrinks the wait
 *  for the demo; with scale=1 it's the true real-world delay. */
function scheduledForFrom(now: string, offsetHours: number, scale: number): string {
  const compressedHours = offsetHours / scale;
  const ms = Date.parse(now) + compressedHours * 3_600_000;
  return new Date(ms).toISOString();
}

// ── The one call ──────────────────────────────────────────────────────────────

export interface BuildPlanInput {
  userId: string;
  /** Injected "now" — the base time check-ins are scheduled forward from. */
  now: string;
}

/**
 * buildPlan — read the user's graph + stat sheet, make ONE Grok call for a
 * 2-4 item check-in plan (each an objective reminder anchored to a real node),
 * convert to CheckIn rows (scheduledFor = now + offsetHours, scaled for the demo),
 * persist them via the store, and return the rows.
 *
 * Fail loud: a model/parse error throws — no canned check-in masks a dead plan.
 */
export async function buildPlan(input: BuildPlanInput): Promise<CheckIn[]> {
  const { userId, now } = input;

  if (!store.getUser(userId)) {
    throw new Error(`buildPlan: no user '${userId}' in the store. Seed first (seedDemoUser()).`);
  }

  // 1. GROUND — the real graph (what the intake surfaced) + the counted stat sheet.
  const graph = store.getGraph(userId);
  const stats = store.statSheet(userId, { now });

  // 2. THE ONE GROK CALL — the forward check-in plan, anchored to real nodes.
  const { object: plan } = await generateObject({
    model: reasoningModel,
    schema: CheckInPlanSchema,
    system: PLAN_PROMPT,
    prompt:
      `THE GRAPH (what this person surfaced in the intake — anchor each check-in to ` +
      `one of these node ids):\n${renderGraph(graph.nodes, graph.edges)}\n\n` +
      `THE COUNTED RECORD (the logged behavioral events the patterns sit on):\n` +
      `${renderStats(stats)}\n\n` +
      `Now schedule 2-4 forward check-ins. Each is an objective reminder tied to a ` +
      `distinct real pattern above, in DOT's voice, naming the node id it watches.`,
  });

  // 3. CONVERT to CheckIn rows. scheduledFor is the demo-scaled forward time; the
  //    store assigns ids (we leave id empty so addCheckIns mints them).
  const scale = checkInScale();
  const rows: CheckIn[] = plan.checkins.map((item) => ({
    id: '', // store.addCheckIns mints the id (counter-backed, deterministic)
    userId,
    prompt: item.prompt,
    watching: item.watching,
    reason: item.reason,
    scheduledFor: scheduledForFrom(now, item.offsetHours, scale),
    status: 'pending' as const,
    createdAt: now,
  }));

  // 4. PERSIST the plan (the forward timer). Re-read so we return rows with real ids.
  store.addCheckIns(rows);

  // 5. Return THIS plan's rows (the just-scheduled ones), soonest first. We filter
  //    the user's full list down to the pending rows created at this `now` so a
  //    re-run doesn't return stale check-ins from an earlier plan.
  return store
    .getCheckIns(userId)
    .filter((c) => c.createdAt === now && c.status === 'pending');
}

// Re-export the resolved model slug so a caller/test can print which model ran.
export { REASONING_MODEL };
