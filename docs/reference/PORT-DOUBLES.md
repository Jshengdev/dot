# PORT-DOUBLES.md — porting the Doubles conversational engine into DOT

> **What this is.** A map for lifting the working conversational backend + iMessage layer from
> the `doubles` repo (`~/code/doubles`) into DOT. You are porting **fresh** (no git history,
> retyped/adapted), so this names the reusable PRIMITIVES, what each one is, the file it lives in,
> and honestly which ones DOT should take as-is vs. adapt. **Backend + iMessage only — ignore
> Doubles' frontend, scrapers, onboarding wizard, and persona/MBTI machinery.**
>
> DOT's need (from `docs/GOAL.md`): **voice/iMessage entry → continuous conversation → extract a
> "story" → reflect objective facts back.** Keep that target in view; most of the convo plumbing
> is reusable, the agent personality/anti-detection layer is not.

---

## 1. How the conversational engine works (the loop)

One inbound message becomes one reply through a single, observable pipeline. Plain-language flow,
with the file that owns each step:

1. **A message arrives.** Photon's iMessage SDK fires a `new-message` event. The router normalizes
   it to `{ phone, text, tapback, guid }`, drops the bot's own echoes and duplicate deliveries.
   → `src/spectrum/imessage.ts`
2. **The router decides what to do with it.** Allowlist filter, then debounce: rapid-fire bubbles
   are batched into ONE turn (so the bot doesn't reply to a half-typed thought). Reactions/tapbacks
   are recorded as signal, never a reply. → `src/index.ts` (`routeInbound`) + `src/conversation/input-batcher.ts`
3. **The turn runs.** On batch flush, `runTurn({ userPhone, inboundText })` is the heart:
   - writes the inbound to the `messages` table (history = source of truth),
   - **assembles context** — 7 layers pulled from Postgres *in parallel* into one `ContextPacket`
     (history, memory, conversation-state, etc.),
   - runs the agent pipeline (Doubles: Thinker → Talker → Critic regen-loop; DOT will collapse this),
   - writes the outbound to `messages`, returns the reply.
   → `src/orchestrator/index.ts` + `src/context/assembler.ts`
4. **Context + memory accumulate automatically** because every turn appends to `messages`, and the
   memory layer re-reads the last N messages + ranks stored facts (`shadow_entities`) by relevance
   each turn. There is no separate "memory write" step in the chat loop — **the message log IS the
   memory**, plus a fact store that's queried (RRF-ranked) per turn. → `src/context/layers/memory.ts`
5. **The LLM is called** through one gateway: `generate(messages, { model, agentName, turnId })`.
   It's a thin OpenRouter wrapper that returns text + cost/latency and logs every call.
   → `src/llm/openrouter.ts`
6. **The reply goes out** split into 1–5 natural iMessage bubbles with human typing-pacing.
   → `src/conversation/bubble-split.ts` + `sendBubbles()` in `src/spectrum/imessage.ts`

The whole thing is **fail-loud**: no canned fallback strings, errors log structurally, silence is a
valid honest response. (Edit map + behavior levers: `docs/voice-agents.md`.)

---

## 2. The iMessage router (`src/spectrum/imessage.ts`)

This is the delivery layer — a thin wrapper over `@photon-ai/advanced-imessage-kit`. **Depends only
on**: two env vars (`IMESSAGE_SERVER_URL`, `IMESSAGE_API_KEY`), the SDK, and a logger. No DB, no LLM.
That isolation is exactly why it's clean to lift.

- **Receive:** `connect()` opens the SDK; `onInboundMessage(handler)` subscribes to `new-message`,
  normalizes each event to an `InboundMessage`, filters `isFromMe`, **de-dupes by GUID** (Photon is
  at-least-once — without this you double-reply, the #1 bot tell), and hands clean objects to your
  handler. Errors in the handler are logged but NOT re-thrown, so one bad turn can't kill the listener.
- **Send:** `sendMessage(phone, text)` (chatGuid = `iMessage;-;<phone>`); `sendBubbles(phone, content[], nudge)`
  sends a paced multi-bubble reply with a typing indicator between bubbles; `sendReaction()` applies a
  tapback; `markRead` / `startTyping` / `stopTyping` are non-critical UX (they swallow their own errors).

**Lift for DOT's "continuous conversation in iMessage":** take `connect()`, `onInboundMessage()`,
`sendMessage()`, `sendBubbles()`, and the typing/read helpers **almost verbatim**. The GUID-dedup set
and the `isFromMe` filter are load-bearing — keep them. This file is your iMessage transport, full stop.

---

## 3. The PRIMITIVES (the most important section)

Each is a self-contained reusable piece. Name · one-line purpose · file to lift from.

| Primitive | Purpose (one line) | Lift from |
|---|---|---|
| **Message router / transport** | Connect to iMessage, receive normalized inbounds (deduped), send bubbled replies. | `src/spectrum/imessage.ts` |
| **Inbound batcher** | Debounce rapid bubbles into one turn; rate-limit; bypass for commands. Pure timing, no LLM. | `src/conversation/input-batcher.ts` |
| **Bubble splitter** | Reshape one reply string into 1–5 human-feeling iMessage bubbles + an optional trailing "nudge". Pure functions. | `src/conversation/bubble-split.ts` |
| **Turn orchestrator** | Run one inbound→reply turn: persist inbound, build context, call the model(s), persist outbound. The loop's spine. | `src/orchestrator/index.ts` |
| **Context assembler** | Fan out N independent "context layers" in parallel into one typed `ContextPacket` the model consumes. | `src/context/assembler.ts` (+ `src/context/types.ts`) |
| **Conversation-state layer** | Surface multi-turn signals from recent history (recent topics, topic-shift markers) with pure regex + DB pulls, no LLM. | `src/context/layers/conversation.ts` |
| **Memory layer (RRF retrieval)** | Each turn, rank stored facts by semantic+keyword+recency (Reciprocal Rank Fusion) and return the top-K + full chat history. | `src/context/layers/memory.ts` |
| **Embeddings** | Local MiniLM 384-d vectors (no API) for semantic similarity in the memory layer. | `src/memory/embeddings.ts` |
| **LLM client** | The single OpenRouter gateway — `generate(messages, opts)` returns text + cost/latency, logs every call, fails loud. | `src/llm/openrouter.ts` |
| **DB substrate** | Idempotent Postgres schema; `messages` is the conversation source-of-truth, `shadow_entities`/`entity_embeddings` are the fact memory. | `src/memory/schema.ts` + `src/memory/connection.ts` |
| **Story/fact extractor** | LLM read over a corpus → structured signals (theme/type/insight/confidence/evidence). The "extract a story" analog. | `src/ingestion/extractors/life-synthesis.ts` |

The mental model: **transport (1) → batcher (2) → orchestrator (4) → {context assembler (5) → layers
(6,7) → LLM (9)} → bubble splitter (3) → transport (1)**, with the DB (10) as the spine memory.

---

## 4. What to PORT into DOT vs. leave behind

DOT's journey = **voice/iMessage entry → continuous conversation → extract a "story" → reflect
objective facts back.** Mapping Doubles' pieces onto it:

**Port as-is (transport + plumbing — reusable nearly verbatim):**
- `imessage.ts` — the entire iMessage transport. This IS DOT's "iMessage entry" + reply delivery.
- `input-batcher.ts` + `bubble-split.ts` — these make a text bot feel continuous and human. Direct lift.
- `openrouter.ts` — one LLM gateway; keep the fail-loud + cost-logging shape, swap model slugs.
- `memory/connection.ts` + the `users` / `messages` tables from `schema.ts` — the minimum spine that
  makes conversation *continuous* (history persisted, re-read each turn). Take these two tables; you
  do NOT need the 12 others on day one.

**Port but ADAPT (the shape is right, the content is DOT's):**
- **Orchestrator** (`orchestrator/index.ts`) — keep the skeleton (persist inbound → build context →
  call model → persist outbound), but **collapse Doubles' 3-agent Thinker/Talker/Critic regen loop
  into ONE call** for DOT. DOT isn't impersonating anyone, so the shape-picker, voice-critic, and
  forbidden-phrase regen machinery are overkill. Keep the Recovery-as-silence idea only if useful.
- **Context assembler + layers** — keep the parallel-fan-out *pattern* (`assembler.ts`), but DOT
  only needs ~2 layers: **conversation history** and **what's-known-so-far (the story being built)**.
  Drop identity/voice/personality layers. `conversation.ts`'s topic/transition detection is a nice
  cheap signal for "is the user changing subject" — optional.
- **Memory layer (RRF)** — port if DOT's "reflect facts back" needs to *retrieve* relevant prior
  facts mid-conversation. If DOT just accumulates one growing story per session, you may not need
  RRF ranking at all — a flat read of the session's facts is simpler. Take `embeddings.ts` only if
  you keep semantic retrieval.
- **Story extractor** (`life-synthesis.ts`) — this is the closest analog to DOT's "extract a story
  and reflect objective facts." Its shape (digest the corpus → LLM → typed `{theme, insight,
  confidence, evidence}` signals, drop low-confidence) is **exactly** the pattern DOT wants, but
  retarget the input from an email inbox to the **conversation transcript**, and retarget the output
  to DOT's "objective facts" contract (`docs/CONTRACTS.md`). Reuse the pattern, rewrite the prompt.

**Leave behind (Doubles-specific, not DOT's problem):**
- All of `src/scrape/`, `src/persona/`, `src/personality/`, `src/voice/`, MBTI, the onboarding wizard,
  and the impersonation/anti-AI-detection content in the agent prompts (`docs/voice-agents.md`'s
  IMPOSTOR_FRAME, adversarial-probe detection, em-dash policing). DOT is an honest assistant, not a
  double — none of the "don't sound like a bot pretending to be you" machinery applies.
- The 12 onboarding/persona/footprint tables in `schema.ts`. Start with `users` + `messages` and add
  a `facts`/`story` table shaped to DOT's contract.
- `tapback` handling, verification-by-code, the phone-allowlist multi-bot guard — nice-to-haves, not
  on DOT's demo path.

**Honest gotchas:** the whole engine assumes **Postgres** (Neon) and an **OpenRouter** key — confirm
both are in `docs/KEYS.md` before porting. The memory layer downloads a ~30 MB MiniLM model on first
embed (cold-start latency) — only inherit that if you keep semantic retrieval. And everything is
**fail-loud by design**: don't "helpfully" add try/catch fallbacks during the port — that's the
behavior DOT's `docs/CONSTRAINTS.md` (no silent stubs) also wants.
