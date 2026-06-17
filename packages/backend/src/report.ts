// report.ts — assemble the UNIQUE, provider-ready report from the LIVE knowledge
// graph (replaces run.ts's scripted SUMMARY). ONE job: read getGraph + statSheet
// and shape them into the SOAP Subjective/Objective record a clinician sees — the
// patient's felt claims on one side, the counted facts on the other, plus the gaps
// between them and any risk signal — WITHOUT a model call (pure assembly).
//
// This is the graph-backed sibling of run.ts buildReport(): same SOAP S/O spine
// (and the same not-a-diagnosis guardrail header), but the rows come from the live
// graph the intake built turn-by-turn — claim_subjective nodes are the S column,
// fact_objective nodes + the counted statSheet lines are the O column, the
// minimizes/contradicts edges become the neutrally-phrased GAP, risk_signal nodes
// become the RISK list, and the panel slices give the symptoms/timeline cards.
//
// HARD GUARDRAIL (PROVIDER-REPORT.md §4): DOT NEVER emits Assessment or Plan. This
// file surfaces only what the patient said and what was counted — the S/O boundary
// IS the safety line. Pure reads, deterministic: `now` is injected, never Date.now.

import { store } from './store.js';
import type { ClinicalSignal, Graph, GraphEdge, GraphNode, SignalKind } from './types.js';

// ── Signal-kind → provider-facing phrase (the classified objective lines). ────
const SIGNAL_LABELS: Record<SignalKind, string> = {
  panic_attack: 'panic attacks',
  self_harm: 'self-harm',
  ideation: 'ideation',
  sleep_disturbance: 'sleep disturbance',
  somatic: 'physical symptoms',
  other: 'noted',
};

/** Render one classified signal as a provider O line — the count PLUS the meta that
 *  says how to read it (stated vs inferred, the count basis, severity, confidence), so
 *  no number is taken on faith and a single mention reads as 1, not many. */
function signalLine(s: ClinicalSignal): string {
  const label = SIGNAL_LABELS[s.kind] ?? s.kind.replace(/_/g, ' ');
  const when = s.timeframe ? ` ${s.timeframe}` : '';
  const sev = s.severity != null ? `, severity ${s.severity}/10` : '';
  const basis = s.countBasis === 'single-mention' ? s.status : `${s.status}, ${s.countBasis}`;
  return `${label}: ${s.count}${when} (${basis}${sev}, ${s.confidence} confidence)`;
}

// The edge types that express a fact/feeling GAP — where the told story and the
// counted record pull apart. These become the neutrally-phrased gap lines.
const GAP_EDGE_TYPES = new Set<GraphEdge['type']>(['minimizes', 'contradicts']);

// ── The typed report (the live, graph-backed superset of run.ts ReportSO) ─────
// The first five fields ARE ReportSO (so a surface that renders the scripted
// report renders this one unchanged); the rest are the live-graph surfaces.

/** One panel card — a node lifted onto its intake panel (symptoms / timeline). */
export interface ReportCard {
  id: string; // the node's typed id (the merge key — traceable)
  name: string; // short display label
  summary: string; // one sentence
  salience: 'low' | 'med' | 'high';
  evidenceTurnIds: string[]; // the turns that grounded it (every line is traceable)
}

/** The provider report — SOAP Subjective/Objective ONLY, assembled from the graph.
 *  header/preparedFor/date/subjective/objective match run.ts ReportSO exactly; the
 *  gap/risk/symptoms/timeline fields surface the live graph the intake built. */
export interface LiveReport {
  /** Header line — states the guardrail plainly (PROVIDER-REPORT.md §3). */
  header: string;
  preparedFor: string; // the patient name (or the userId if unnamed)
  date: string; // the report date (the injected `now`, YYYY-MM-DD)
  /** S — what the patient FELT / claimed (claim_subjective node summaries). */
  subjective: string[];
  /** O — counted, measurable facts (fact_objective summaries + statSheet counts). */
  objective: string[];
  /** The GAP — where the told story and the counted record diverge, phrased
   *  neutrally (from minimizes/contradicts edges). Never a verdict — a noticing. */
  gap: string[];
  /** RISK — surfaced risk_signal nodes (drives the calm 988 routing upstream). */
  risk: string[];
  /** The symptoms panel — symptom nodes as cards (loudest first). */
  symptoms: ReportCard[];
  /** The timeline panel — event/timeframe nodes as cards (loudest first). */
  timeline: ReportCard[];
  /** The classified clinical signals — the validated meta format that IS the objective
   *  record: each carries kind/status/count/countBasis/severity/confidence/basis so a
   *  reader can classify every data point without guessing. */
  signals: ClinicalSignal[];
}

export interface BuildLiveReportInput {
  /** Whose graph to assemble the report from. */
  userId: string;
  /** Injected "now" for the date label + the counted window (determinism). */
  now: string;
}

// ── Helpers (pure) ────────────────────────────────────────────────────────────

// Loudest node first; salience is ordinal, ties keep insertion order (stable).
const SALIENCE_RANK: Record<GraphNode['salience'], number> = { low: 0, med: 1, high: 2 };
function bySalienceDesc(a: GraphNode, b: GraphNode): number {
  return SALIENCE_RANK[b.salience] - SALIENCE_RANK[a.salience];
}

// Lift a graph node onto a panel card (the traceable, render-ready shape).
function toCard(n: GraphNode): ReportCard {
  return {
    id: n.id,
    name: n.name,
    summary: n.summary,
    salience: n.salience,
    evidenceTurnIds: n.evidenceTurnIds,
  };
}

// Index nodes by id so a gap edge can name the concepts it relates.
function nodeIndex(nodes: GraphNode[]): Map<string, GraphNode> {
  return new Map(nodes.map((n) => [n.id, n]));
}

// A short display name for a node id (prefers the node's name; falls back to the
// id itself so a dangling reference still reads — though the store drops danglers).
function label(byId: Map<string, GraphNode>, id: string): string {
  return byId.get(id)?.name ?? id;
}

// Phrase one gap edge neutrally — a noticing, never a verdict. 'minimizes' reads as
// "the story plays down X relative to Y"; 'contradicts' as "the story and the record
// disagree on X vs Y". Both name the two concepts so the clinician can trace it.
function phraseGap(byId: Map<string, GraphNode>, e: GraphEdge): string {
  const from = label(byId, e.source);
  const to = label(byId, e.target);
  if (e.type === 'minimizes') {
    return `the told story plays down "${from}" against what the record shows for "${to}"`;
  }
  // contradicts
  return `the told story and the counted record diverge on "${from}" vs "${to}"`;
}

// ── The one entry (pure assembly — no model call) ─────────────────────────────

/**
 * buildLiveReport — assemble the provider-ready report from the LIVE graph + the
 * counted stat sheet. Pure reads (getGraph + statSheet + getUser); no Grok call,
 * no Date.now. Never emits Assessment or Plan — S/O only (the guardrail).
 *
 * Subjective = claim_subjective node summaries (what they felt/claimed).
 * Objective  = fact_objective node summaries + the counted statSheet lines.
 * Gap        = minimizes/contradicts edges, phrased neutrally.
 * Risk       = risk_signal node summaries.
 * Symptoms   = symptom nodes as cards; Timeline = event/timeframe nodes as cards.
 */
export function buildLiveReport(input: BuildLiveReportInput): LiveReport {
  const { userId, now } = input;

  const graph: Graph = store.getGraph(userId);
  const byId = nodeIndex(graph.nodes);

  // S — the felt claims (claim_subjective node summaries).
  const subjective = graph.nodes
    .filter((n) => n.type === 'claim_subjective')
    .sort(bySalienceDesc)
    .map((n) => n.summary);

  // O — the extracted facts (fact_objective summaries) + the counted aggregates.
  // The aggregates render as the dated "counted signs" SOAP's O column wants;
  // story_fact counts duplicate the fact_objective rows, so skip that kind.
  const factLines = graph.nodes
    .filter((n) => n.type === 'fact_objective')
    .sort(bySalienceDesc)
    .map((n) => n.summary);

  // The classified clinical signals — the objective record in the validated meta
  // format. Each O line carries its own count basis + confidence (no regex inflation).
  const signals = store.getSignals(userId);
  const objective = [...factLines, ...signals.map(signalLine)];

  // The GAP — where the told story and the record pull apart (neutral phrasing).
  const gap = graph.edges
    .filter((e) => GAP_EDGE_TYPES.has(e.type))
    .map((e) => phraseGap(byId, e));

  // RISK — the surfaced risk_signal nodes (loudest first).
  const risk = graph.nodes
    .filter((n) => n.type === 'risk_signal')
    .sort(bySalienceDesc)
    .map((n) => n.summary);

  // The panel slices (loudest first) — symptoms vs the timeline cards.
  const symptoms = graph.nodes.filter((n) => n.type === 'symptom').sort(bySalienceDesc).map(toCard);
  const timeline = graph.nodes
    .filter((n) => n.type === 'event' || n.type === 'timeframe')
    .sort(bySalienceDesc)
    .map(toCard);

  return {
    header: 'DOT SUMMARY — patient-generated · not a medical record · not a diagnosis',
    preparedFor: store.getUser(userId)?.name ?? userId,
    date: now.slice(0, 10), // YYYY-MM-DD
    subjective,
    objective,
    gap,
    risk,
    symptoms,
    timeline,
    signals,
  };
}
