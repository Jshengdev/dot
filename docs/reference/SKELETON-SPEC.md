# SKELETON-SPEC — DOT's build skeleton (the definitive shape + exact pieces to build)

> **What this is.** The authoritative build skeleton for DOT. It describes — concretely, at the
> implementation level — how DOT's runtime is assembled, what each primitive is, the exact typed
> contracts, and the exact Grok wiring. Production agents read this and build from it with their own
> judgment: wire it together, verify each stage ran, test the roundtrip.
>
> **How to read it.** This is DOT's spec, not a porting guide. Where a piece has a known-good
> implementation to crib from, it's cited as `reference implementation: <path>` so a builder can go
> look at working code — but the *shape described here is DOT's*. Build to the contracts in §8 exactly.
>
> **The discipline (from the build-constraints notes).** Build the end-to-end skeleton on stubs FIRST,
> then make nodes smart. One clear purpose per primitive. "Done" = a run command + observed output.
> If it writes or emits, prove the roundtrip. Satisfice, then stop. 9-hour clock — build the slice.

---

## 1. The shape in one diagram

The end-to-end pipeline. Each stage is one line; each is a node or a connector in the runtime.

```
[voice entry]   Grok Voice realtime session  → streams a transcript                      (connector: VoiceConnector)
      ↓
[conversation]  transcript lands in the iMessage thread, one ongoing relationship per user (connector: iMessage)
      ↓
[turn loop]     inbound msg → assemble context (≤2 layers) → ONE Grok reasoning call → reply (engine: runTurn)
      ↓
[director]      durable multi-step: extract → classify → reflect → (≤1 refine) → finalize  (Inngest: dotRun)
      ↓                                          │
[extract]       Grok text (reasoning high) splits SUBJECTIVE feeling from OBJECTIVE fact
[classify]      each item = logged event vs interpretation; risk/crisis → human branch
[reflect]       new subjective claim ⟷ accumulated `events` record  →  the DELTA
      ↓
[store]         persist story {subjective, objective, delta} + append facts to `events`   (DB: stories + events)
      ↓
[render]        Grok image-gen renders the story as a glass dot                            (output plugin: dot-render)
      ↓
[output]        tap a dot → reflect the delta · aggregate `events` → provider stat sheet   (engine: statSheet)
```

The demo moment fires at **[reflect]**: *"you said your friends hate you; they texted you 50× this
week."* DOT surfaces the delta as a neutral observation; the user draws the conclusion. (Machines
prove, humans mean — `DOT-RESEARCH-DIGEST.md` §3.)

---

## 2. The framework spine — a plugin-driven agent runtime

DOT is built as a **plugin-driven agent runtime**. There is one core that knows nothing about any
specific transport, model, or output channel; everything channel-specific (voice in, iMessage in/out,
image-gen out) is a **plugin** that conforms to one interface. This is what makes the connectors
modular: you add a connector by writing a plugin, not by editing the core.

> A reference implementation of this exact architecture exists: a runtime assembler, the plugin
> interface, and an architecture map. DOT's runtime is a slimmed version of the same spine.

### 2.1 The runtime builder — `createDot(config)`

One entry point assembles the whole runtime from a config object. It (in order):

1. **Sets the active character + model overrides** before any agent factory loads, so model resolution
   is deterministic. (`setActiveCharacter`, `setModelConfig`.)
2. **Opens the store** — in-proc `Map` first, SQLite second (see §5). One handle shared process-wide.
3. **Discovers the messaging provider** from the plugin list (first plugin that exposes one wins).
4. **Loads each plugin**: checks `requiredEnvVars` (skip with a loud warning if missing — *no silent
   stub*), calls `createTools(ctx)`, collects `createWorkflows`, merges `worldInfoEntries`.
5. **Builds the agent** with the merged tool set.
6. **Runs each plugin's `onInit`** (background services, connector warm-up).
7. **Returns** `{ runtime, store, character, plugins, startMessaging() }`.

```ts
// reference shape: a runtime assembler  (createX → createDot)
export interface DotInstance {
  store: DotStore;                    // §5
  character: CharacterDefinition;     // §2.4
  plugins: Plugin[];
  startMessaging: () => Promise<void>;// connects the messaging provider + begins the listen loop
}

export async function createDot(config: DotConfig): Promise<DotInstance> { /* the 7 steps above */ }
```

```ts
// reference shape: a runtime config module
export interface DotConfig {
  character: CharacterDefinition;
  models?: {
    agent?: string;        // the ONE conversational reasoning model (Grok)         — see §7
    extractor?: string;    // the fact/feeling split model (Grok, reasoning high)   — see §7
  };
  plugins?: Plugin[];
  databaseUrl?: string;    // optional; absent ⇒ SQLite file / in-proc Map
}

export function defineConfig(config: DotConfig): DotConfig {
  if (!config.character) throw new Error('defineConfig() requires a character.');
  return config;
}
```

### 2.2 The `Plugin` interface — the modular input/connector contract

This is the one contract every connector and output channel implements. Build it verbatim; it is the
seam the whole "add a connector later" story rides on. (Trimmed from the reference to what DOT needs —
drop the spontaneous/scheduler/CLI/observability surface for the 9-hour build; keep tools, workflows,
the messaging provider, world info, and lifecycle hooks.)

```ts
// reference implementation (full): a plugin types module  (ToolPlugin)
// DOT's trimmed Plugin contract:

export interface Plugin {
  /** Unique id (enable/disable, logging). */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Env vars that MUST be set, or the plugin is skipped with a loud warning (no silent stub). */
  requiredEnvVars?: string[];

  /** Tools merged into the agent's tool set. Receives shared services via ctx. */
  createTools(ctx: PluginContext): Record<string, Tool> | Promise<Record<string, Tool>>;

  /** Optional durable workflows registered with the runtime (e.g. the Inngest director). */
  createWorkflows?: (ctx: PluginContext) => Record<string, Workflow> | Promise<Record<string, Workflow>>;

  /**
   * The transport. If present, this plugin IS the messaging channel (send/receive).
   * Only one plugin should provide this — the first found wins.
   */
  messagingProvider?: MessagingProvider;   // §3

  /**
   * Begin receiving inbound messages. Core passes a handler; the plugin wires its transport's
   * incoming events to it and returns a stop function. (For voice: starts the realtime session.)
   */
  startListening?: (handler: MessageHandler) => Promise<(() => Promise<void>) | void>;

  /** Keyword-triggered context snippets injected into the prompt (lean base, rich on demand). */
  worldInfoEntries?: WorldInfoEntry[];

  /** Async setup after tools are built (background services, connector warm-up). */
  onInit?: (ctx: PluginContext & { store: DotStore }) => Promise<void>;
  /** Graceful cleanup on shutdown. */
  onShutdown?: () => Promise<void>;
}

export interface PluginContext {
  character: CharacterDefinition;
  messaging: MessagingProvider | null;   // the active transport (null if none loaded)
  store: DotStore;                        // §5
}
```

### 2.3 How plugins register

Registration is a list in the app config — declarative, ordered. `createDot()` does the wiring.

```ts
// reference shape: an app config file
import { defineConfig } from '@dot/core';
import dotCharacter from '@dot/character';
import voice    from '@dot/plugin-voice';      // Grok Voice entry        (§3 / §7a)
import imessage from '@dot/plugin-imessage';   // continuous conversation (§3)
import director from '@dot/plugin-director';    // Inngest routing loop    (§6)
import dotRender from '@dot/plugin-dot-render'; // Grok image-gen glass dot (§7c)

export default defineConfig({
  character: dotCharacter,
  plugins: [voice, imessage, director, dotRender],
  models: {
    agent:     'grok-4.3',                       // ⚑ confirm slug — see §7
    extractor: 'grok-4.3',                       // reasoning high — see §7b
  },
});
```

### 2.4 The model-config pattern (env > config > default)

Agent files never hard-code a model. They call a resolver with three-level precedence so an operator
can override per-process without touching code.

```ts
// reference implementation: a model-config module
let current: ModelOverrides = {};
export function setModelConfig(m: ModelOverrides | undefined) { current = m ?? {}; }

// precedence: process.env[envVar]  >  config.models[key]  >  fallback
export function resolveModel(key: keyof ModelOverrides, envVar: string, fallback: string): string {
  return process.env[envVar] ?? current[key] ?? fallback;
}
// usage in a node:  const model = resolveModel('extractor', 'DOT_EXTRACTOR_MODEL', 'grok-4.3');
```

### 2.5 The character (one tiny definition, not a personality engine)

DOT has ONE persona — the calm objective mirror — so the character is a thin config object, not the
full SillyTavern machinery. Build a minimal `CharacterDefinition`: `id`, a `card` (name, the
mirror's `systemPrompt` — the validate-first / never-invalidate / prove-not-mean doctrine from
`DOT-RESEARCH-DIGEST.md` §3), and `worldInfo` (crisis-handoff entry, attachment-handling entry).
`createCharacter()` validates required fields at boot and throws listing every problem.

> Reference: a create-character module (validation) and a character-definition interface (the full
> interface — DOT uses a small subset).

---

## 3. The connectors (inputs) as plugins

Every input is a plugin exposing a `MessagingProvider` (for a two-way channel) and/or a
`startListening` (to push inbound events into the turn loop). Core never touches transport specifics.

### 3.1 The `MessagingProvider` interface (the transport contract)

```ts
// reference implementation: a plugin types module (MessagingProvider),
//                           an iMessage plugin (a concrete impl),
//                           a second, generic transport plugin
export interface MessagingProvider {
  threadPrefix: string;                                   // memory scoping, e.g. "imessage" | "voice"
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  buildChatId(address: string): string;                   // iMessage: `iMessage;-;${address}`
  extractAddress(chatId: string): string;
  sendMessages(chatId: string, messages: string[]): Promise<void>;
  sendAttachment(o: { chatId: string; filePath: string; message?: string }): Promise<void>;
  startTyping?(chatId: string): Promise<void>;
  stopTyping?(chatId: string): Promise<void>;
  markRead?(chatId: string): Promise<void>;
}
```

### 3.2 The iMessage connector (continuous conversation, send/receive)

The transport is a thin wrapper over `@photon-ai/advanced-imessage-kit`. Depends on two env vars
(`IMESSAGE_SERVER_URL`, `IMESSAGE_API_KEY`), the SDK, and a logger — no DB, no LLM. That isolation is
why it lifts clean.

- **Receive.** `connect()` opens the SDK; on `new-message`, normalize to `IncomingMessage`
  `{ senderAddress, chatId, text, attachments, raw }`, then forward to the turn loop's
  `enqueueIncomingMessage`. **Two load-bearing filters — keep both:**
  - **Drop `isFromMe`** — never reply to your own echoes.
  - **De-dup by GUID.** Photon is *at-least-once*; without a seen-GUID set you double-reply, which is
    the #1 bot tell. *(This is THE iMessage gotcha. Empathy note: a double-text reads as a glitchy bot
    and breaks the "one calm relationship" feeling instantly.)*
  - Handler errors are logged, **not re-thrown**, so one bad turn can't kill the listener.
- **Send.** `sendMessages(chatId, msgs[])` sends a reply split into 1–5 natural bubbles with typing
  pacing between them (`startTyping`/`stopTyping`). chatGuid = `iMessage;-;<phone>`.

> Reference implementations to crib almost verbatim:
> an iMessage plugin (the plugin + provider) and its SDK-wrapper gateway (see the incoming-SDK
> handler: `isFromMe`/system-message drop, GUID via `message.guid`, attachment extraction).
> The reference transport spells out the GUID-dedup set; a bubble-split helper turns one reply string into 1–5 bubbles.
>
> **Bubble pacing (empathy note):** a real person sends "hey" then "you up?" as two bubbles with a
> beat between, not one essay. Bubble-split + an inter-message delay make DOT feel like a person, not a
> form. Keep it simple: split on sentence/idea boundaries, cap at 5, ~300–800ms between.

### 3.3 The voice entry (Grok Voice as a plugin)

The voice entry is *also* a plugin. It exposes `startListening`: on init it opens a Grok Voice realtime
session, and as the transcript streams it forwards finalized utterances into the **same turn loop** as
`IncomingMessage`s — so voice and text write to one shared conversation store keyed by patient. Voice
is *ephemeral* (the audio isn't persisted); the durable record is the transcript text landing in
`messages`. Exact wiring in §7a.

### 3.4 The `Connector` chokepoint (the "reflect your whole life" seam)

Distinct from `MessagingProvider` (which is *conversation* in/out) is the **`Connector`** — the seam
for *objective data* that feeds the accumulated record. This is the one abstraction that turns "add a
data source" into a one-file change instead of a memory-layer rewrite.

```ts
// the data-ingest chokepoint (from the memory-DB design notes §4)
export interface Connector {
  name: string;                                   // becomes events.source
  pull(userId: string, window: Window): Promise<Event[]>;   // Event shape in §8
}
```

- **`SyntheticConnector` is the only one built for the demo.** It implements `pull()` by emitting the
  pre-seeded "50 texts / 21 panic attacks" rows (see §10 seeding).
- A real `iMessageConnector` / `CalendarConnector` implements the *same* interface later. The reflect
  step never learns where an event came from — **it only reads `events`.** New connector = new
  `source` value + new `kind`s, *no schema change*.

---

## 4. The conversational engine (the turn loop)

One inbound message → one reply, through a single observable pipeline. **DOT does ONE reasoning call
per turn** — no Thinker/Talker/Critic impersonation machinery (DOT isn't pretending to be anyone).

```
inbound (voice or text)
  → enqueueIncomingMessage   : sanitize, drop isFromMe, GUID-dedup, debounce rapid bubbles into one turn
  → runTurn(userId, text)    : the spine
       1. persist inbound to `messages`              (history = source of truth)
       2. assemble context (≤2 layers, in parallel)  → one ContextPacket
       3. ONE Grok call: reason + split fact/feeling  (reasoning high; §7b)
       4. persist outbound to `messages`
       5. return reply  → bubble-split → transport.sendMessages
```

**The ≤2 context layers (collapse everything else):**
1. **Conversation history** — last N `messages` for this user, re-read each turn. *The message log IS
   the memory* — there is no separate "write memory" step in the chat loop.
2. **What's-known-so-far** — the story being built / the relevant slice of the accumulated `events`
   record. For the 9-hour build this is a flat windowed read, not RRF (see §5, §10).

> Reference shapes to crib:
> the runTurn spine (persist→context→model→persist),
> a context assembler (parallel fan-out of layers into one typed `ContextPacket`),
> a single fail-loud LLM gateway (keep the shape, point it at Grok).
>
> **Collapse note:** the reference orchestrator runs a 3-agent regen loop to dodge AI-detection. DOT does NOT — keep the
> orchestrator skeleton, throw away the shape-picker / voice-critic / forbidden-phrase machinery. One
> call. The "split fact from feeling" is the single reasoning job, prompted directly (§7b).
>
> **Fail-loud (LOCKED, `CONSTRAINTS.md`):** no canned fallback strings. Errors log structurally;
> silence is a valid honest response. Don't add try/catch fallbacks that mask a dead path.

---

## 5. The memory / DB

The objective mirror only works if there's an *accumulated objective record* to reflect a new story
against. The store holds that record and makes the comparison cheap. **Five tables + one retrieval
function** — no decay engine, no RRF weight-tuning, no Postgres on day one.

```
users        { id PK, name, created_at }                          -- one row; demo is single-user
messages     { id, user_id, role('user'|'dot'), content, ts }     -- raw conversation/story input
stories      { id, user_id, transcript, subjective, objective,    -- one row per told story = a glass dot
               delta, created_at }                                --   subjective/objective/delta = TEXT/JSON
events       { id, user_id, kind, label, value, source, ts }      -- the accumulating OBJECTIVE record + synthetic
stat_sheet   = a SQL VIEW over events (GROUP BY kind)             -- derived aggregates; NOT a stored table
```

- **`messages`** — the conversation/story input. The chat loop re-reads the last N each turn. Index
  `(user_id, ts DESC)`.
- **`stories`** — DOT's contract. One row per told story holding `{ subjective, objective, delta }` —
  these ARE the glass dots the frontend renders. Field names match §8 exactly so no panel invents a
  shape.
- **`events`** — the load-bearing table. The accumulating objective record AND the synthetic behavioral
  data, unified: `kind` (`message_received`, `call`, `panic_attack_logged`, `calendar`, …),
  `label`/`value`, and `source` (`'story'` for facts DOT extracted, `'synthetic'` for seeded data).
  `kind` is an **open vocabulary**, not a SQL enum — a new connector adds kinds without a migration.
- **`stat_sheet`** — a VIEW. `"panic attacks logged: 21 in 21 days"` is `GROUP BY kind` over `events`.
- **`provider_summary`** — NOT a table. A function `buildProviderSummary(userId)` that reads the
  stat-sheet view + recent `stories` and renders text/JSON.

**Reflect-against-history (the only retrieval that matters):**
```
1. extractor returns { subjective, objective } from the new story.
2. reflect: pull counter-evidence from the record —
     SELECT count(*) FROM events WHERE kind IN (<relevant>) AND ts > now() - window
   (a flat windowed COUNT(*) is ENOUGH for the demo; RRF over prior stories is a stretch goal).
3. delta = LLM (or template) framing objective against subjective ("you feel X; the record shows Y").
4. persist the full { subjective, objective, delta } row → stories  (it becomes a glass dot)
   + append any newly-extracted facts → events with source='story'.
   PROVE THE ROUNDTRIP: write → re-read → render. A dot that "saved" but vanishes on reload is the LARP failure.
```

**Counter-evidence is just a query.** *"Your friends texted you 50× this week"* =
`SELECT count(*) FROM events WHERE kind='message_received' AND ts > now()-7d`.

**Store for 9 hours:** in-proc `Map` first (lets the turn loop run before the DB exists — a real,
documented fallback, not a silent stub), then **SQLite** (`better-sqlite3`, one file, zero infra). Same
SQL ports straight from the reference. **Skip Postgres/Neon, skip embeddings** (a ~30 MB MiniLM
download mid-demo earns nothing when reflecting against a handful of seeded events).

> Reference shapes to crib: a memory `schema.ts` + `connection.ts` (the `users`/`messages`
> spine + the `query/execute/withTransaction` gateway), a memory-layer retrieval function (to retarget),
> and a hash-dedup idea for `events` (so the same fact mentioned twice *strengthens* rather than
> duplicates). Full design + cut list lives in the memory-DB design notes.

---

## 6. The director / routing loop (Inngest)

The director is a **durable, multi-step workflow** with a human-on-risk branch. Each step maps to a
node from §1; the whole thing is the `dotRun` workflow, registered by the `director` plugin via
`createWorkflows`. Durable = it survives a restart and can *pause* on the human branch (Inngest's
`step.waitForEvent`) without losing state — the same earned-autonomy safeguard Legion runs.

```
dotRun(story transcript):
  step "extract"   → Grok text, reasoning high: { subjective, objective }          (§7b)
  step "classify"  → for each item: logged-event vs interpretation; detect risk/crisis
       ├─ risk?  →  step "human-handoff": emit handoff event, waitForEvent(human-cleared) ──┐
       │                                                                                     │
  step "reflect"   → query events for counter-evidence → compute delta  ← (resumes here) ────┘
       ↓
  step "refine"    → ONE optional loop: if delta is weak/empty, re-query a wider window (≤1 retry)
       ↓
  step "finalize"  → persist story{subjective,objective,delta} + append events(source='story')
                     → trigger render (§7c) → emit the THE-moment event to the live stream
```

Node ↔ step mapping (fill `ARCHITECTURE.md`'s per-node I/O table from this):

| node | step | input | output |
|---|---|---|---|
| extract  | `extract`   | `{ transcript }` | `{ subjective, objective }` |
| classify | `classify`  | `{ subjective, objective }` | `{ items: ClassifiedItem[], risk: boolean }` |
| (branch) | `human-handoff` | `{ risk }` | pauses; resumes on `human-cleared` event |
| reflect  | `reflect`   | `{ subjective, objective }` | `{ delta, counterEvidence }` |
| refine   | `refine`    | `{ delta }` | `{ delta }` (≤1 loop) |
| finalize | `finalize`  | `Story` | `{ storyId, dotImageUrl }` + emits THE-moment event |

**Build-simply:** keep it linear with exactly one optional loop (the refine step). One Zod-validated
boundary per node (§8). The human-handoff branch is the only fork. Don't add nodes to claim a badge.

---

## 7. The Grok wiring (EXACT)

Three distinct Grok jobs. For each: the call shape a builder can implement against, then a
**⚑ NEEDS FROM JOHNNY** block listing exactly what's required to wire it live.

### 7a. Grok Voice (entry) — realtime transcript stream

A realtime voice session is opened on init by the `voice` plugin. As the user talks, the model streams
back transcript deltas; on each finalized utterance, the plugin forwards it into the turn loop as an
`IncomingMessage` (so voice and text share one store).

```ts
// SHAPE (realtime, WebSocket-style — confirm transport in the NEEDS block):
const session = await openGrokVoiceSession({
  url:   GROK_VOICE_REALTIME_URL,        // ⚑ realtime endpoint (wss://…)
  token: process.env.GROK_API_KEY,        // ⚑ auth
  model: 'grok-voice-think-fast-1.1',     // ⚑ confirm exact slug + special-access availability
  reasoning: 'high',                      // ⚑ is this a session param on the special-access model?
});

session.on('transcript.delta',  (d) => bufferPartial(d.text));          // accumulate
session.on('transcript.final',  (u) => enqueueIncomingMessage({         // → turn loop (§4)
  senderAddress: userId, chatId: voiceChatId(userId),
  text: u.text, attachments: [], raw: u,
}));
session.on('error', (e) => logStructured('voice.error', e));            // fail loud, don't swallow silently
// (Audio is ephemeral — we persist u.text into `messages`, never the audio.)
```

> **⚑ NEEDS FROM JOHNNY — Grok Voice (the special-access model). This is the highest-ROI unknown.**
> - **Exact model id confirmation.** Is it `grok-voice-think-fast-1.1` (this task) or
>   `grok-voice-think-fast-1.0` (research digest §2)? Which slug actually responds on your account?
> - **Special-access details.** This is a special-access model — what account/key has access, and is
>   there an allowlist or beta flag to toggle?
> - **Endpoint URL + transport.** The realtime endpoint (`wss://…`?) and protocol (WebSocket realtime
>   vs HTTP streaming). Is it OpenAI-realtime-compatible or a custom shape?
> - **Auth.** Token/API-key var name and where it comes from (xAI key? a separate voice key?).
> - **Is `reasoning: 'high'` a session-level param** on the voice model, or fixed by the model itself?
> - **The event schema.** Exact event/message names for transcript deltas vs finals (the `session.on(...)`
>   names above are placeholders), and whether the model also returns audio we must ignore.
> - **SDK/docs.** Any xAI voice SDK or docs link, plus a free-credit / rate limit to know.

### 7b. Grok text reasoning (the fact/feeling split) — reasoning high

The single reasoning call. Given the story transcript (and recent conversation context), return the
SUBJECTIVE feeling and the OBJECTIVE fact, split cleanly. Used by the turn loop (§4 step 3) and by the
director's `extract` step (§6).

```ts
// SHAPE (chat-completions style):
const res = await grok.chat({
  model: resolveModel('extractor', 'DOT_EXTRACTOR_MODEL', 'grok-4.3'),   // ⚑ confirm slug
  reasoning_effort: 'high',                                              // ⚑ confirm param name/values
  messages: [
    { role: 'system', content: EXTRACT_PROMPT },  // "separate what they FELT from what objectively HAPPENED;
                                                  //  validate first; never invalidate; do not diagnose"
    { role: 'user',   content: transcript },
  ],
  response_format: zodToJsonSchema(ExtractSchema), // { subjective, objective } — §8
});
// Multimodal: a patient photo can be attached as an image content part (grok-4.3 has image understanding).
```

> **⚑ NEEDS FROM JOHNNY — Grok text reasoning.**
> - **Exact model slug** for the reasoning/multimodal text model: `grok-4.3` (research digest) vs
>   `grok-4.20-beta` (seen in a reference config) vs other. Confirm which is live on your key.
> - **The reasoning param.** Is it `reasoning_effort: 'high'`, `reasoning: { effort: 'high' }`, or
>   something else? Confirm the exact param name + allowed values.
> - **API base + auth.** Base URL (`https://api.x.ai/v1`?) and key var. Or do we go through OpenRouter
>   (`openrouter/x-ai/grok-…`) like the reference gateway? Pick one.
> - **Structured-output support.** Does it accept `response_format` JSON-schema, or do we parse JSON
>   from text? (Determines whether §8 schemas are enforced or validated post-hoc.)

### 7c. Grok image-gen (the glass-dot render)

After `finalize`, render the story as a glass dot. This is an **output plugin** (`dot-render`) whose
tool takes the story and returns a local image path + URL, exactly like the reference image-gen tool —
create task / poll or single-shot / download to temp / return path for the frontend.

```ts
// SHAPE (text-to-image):
const img = await grokImage.generate({
  model:  GROK_IMAGE_MODEL,               // ⚑ confirm slug (Grok Imagine)
  prompt: buildDotPrompt(story),          // the clean-blue glass-dot visual language (design/ tokens)
  size:   '1024x1024',
});
const localPath = await downloadToTemp(img.url);   // frontend renders from URL; path optional
return { dotImageUrl: img.url, dotImagePath: localPath };
```

> Reference implementation (the tool shape, task/poll/download/return, and
> `experimental_toToolResultContent` so the model can SEE the result):
> an image-gen plugin's tool + its image-gen client. DOT swaps the image service for Grok
> image-gen and the danbooru tags for the glass-dot prompt.

> **⚑ NEEDS FROM JOHNNY — Grok image-gen.**
> - **Exact model id** for Grok image-gen / Grok Imagine, and the **endpoint** (same xAI base? a
>   separate images route like `/v1/images/generations`?).
> - **Auth** (same `GROK_API_KEY` or separate?).
> - **API shape:** synchronous single-shot, or async create-task-then-poll (changes the tool's control
>   flow — reference supports both)?
> - **Output:** does it return a URL, base64, or both? Any size/aspect options. Free-credit / rate limit.

---

## 8. The typed contracts (build to these EXACTLY)

Every shape that crosses a node boundary, the store, or the live stream. The frontend imports these;
no panel renders a shape that isn't here. These fill the `⏳ TODO` blocks in `docs/CONTRACTS.md`.

```ts
// ── The story (the {subjective, objective, delta} spine — one row in `stories`, one glass dot) ──
export interface Story {
  id: string;
  userId: string;
  transcript: string;          // the raw told story
  subjective: string;          // what they FELT / claimed   ("my friends hate me")
  objective: string;           // what verifiably HAPPENED    (extracted facts)
  delta: string;               // the gap, framed neutrally   ("they texted you 50× this week")
  dotImageUrl?: string;        // the glass-dot render (§7c)
  createdAt: string;           // ISO
}
export const StorySchema = z.object({ /* mirror the above; the validated node boundary */ });

// ── The objective record + synthetic data (rows in `events`; what every Connector emits) ──
export interface Event {
  id: string;
  userId: string;
  kind: string;                // OPEN vocab: 'message_received' | 'call' | 'panic_attack_logged' | 'calendar' | …
  label: string;               // human-readable ("text from Sam")
  value?: number | string;     // optional magnitude
  source: string;              // 'story' (DOT-extracted) | 'synthetic' | 'imessage' | 'gcal' | …
  ts: string;                  // ISO
}

// ── The extractor output (the fact/feeling split — §7b) ──
export const ExtractSchema = z.object({
  subjective: z.string(),
  objective:  z.string(),
});

// ── The run / accumulating context (flows through the director; returned by the engine) ──
export interface DotRun {
  id: string;
  userId: string;
  transcript: string;                              // input
  extract?:  { subjective: string; objective: string };
  classify?: { items: ClassifiedItem[]; risk: boolean };
  reflect?:  { delta: string; counterEvidence: Event[] };
  story?:    Story;                                // output
  status: 'running' | 'awaiting-human' | 'done' | 'failed';
}
export interface ClassifiedItem { text: string; type: 'event' | 'interpretation'; }

// ── The live event stream (frontend routes each into the conversation surface) ──
export type DotEvent =
  | { type: 'node:start';   node: string; runId: string }
  | { type: 'node:done';    node: string; runId: string; data: unknown }
  | { type: 'reflect:delta'; runId: string; story: Story }   // ← THE demo-moment event
  | { type: 'run:awaiting-human'; runId: string }            // human-on-risk branch (renders a handoff state)
  | { type: 'run:failed';   runId: string; node: string; error: string }; // fail LOUD → FAILED badge

// ── The provider stat sheet (the self-advocacy artifact; NOT persisted — a function) ──
export interface ProviderSummary {
  userId: string;
  metrics: Array<{ metric: string; count: number; window: string }>;  // from the stat_sheet VIEW
  recentStories: Story[];
}
```

---

## 9. The primitives list

Every primitive, its one-line purpose, whether it's a true primitive or composed, and where its
reference implementation lives.

| Primitive | Purpose (one line) | Kind | Reference implementation |
|---|---|---|---|
| **Runtime builder** `createDot()` | Assemble the runtime from config + plugins + character. | primitive | a runtime assembler |
| **`Plugin` interface** | The modular connector/output contract every channel implements. | primitive | a plugin types module |
| **`defineConfig` / model-config** | Declarative app config; env>config>default model resolution. | primitive | a config + model-config module |
| **Character** | The one mirror persona (system prompt = the doctrine) + crisis world-info. | primitive | a create-character module |
| **`MessagingProvider`** | Transport contract (send/receive/typing). | primitive | a plugin types module |
| **iMessage connector** | Photon transport: receive (isFromMe drop + GUID-dedup), send bubbles. | composed | an iMessage plugin + its gateway; reference transport |
| **Voice connector** | Grok Voice realtime session → transcript → turn loop. | composed | (new; shape in §7a) |
| **`Connector` (data ingest)** | The chokepoint for objective data into `events`; SyntheticConnector now. | primitive | memory-DB design notes §4 |
| **Inbound batcher** | Debounce rapid bubbles into one turn (pure timing, no LLM). | primitive | reference input-batcher |
| **Bubble splitter** | One reply string → 1–5 human bubbles (pure functions). | primitive | reference bubble-split |
| **Turn orchestrator** `runTurn` | persist inbound → assemble context → ONE Grok call → persist outbound. | composed | reference orchestrator |
| **Context assembler** | Fan out ≤2 layers in parallel into one `ContextPacket`. | primitive | reference context assembler |
| **LLM gateway** | One fail-loud Grok call wrapper (text + cost/latency, logs every call). | primitive | reference LLM gateway |
| **DB substrate** | `users`/`messages`/`stories`/`events` + stat-sheet VIEW; Map→SQLite. | primitive | a reference memory `schema.ts` + `connection.ts` |
| **Reflect/retrieval fn** | New subjective ⟷ windowed `COUNT(*)` over `events` → counter-evidence. | primitive | reference memory layer (retargeted) |
| **Extractor (fact/feeling)** | Grok read → `{subjective, objective}` (reasoning high). | composed | reference life-synthesis extractor (pattern) |
| **Director workflow** `dotRun` | Durable extract→classify→reflect→refine→finalize + human branch. | composed | (new; Inngest; shape in §6) |
| **dot-render plugin** | Grok image-gen → glass dot → local path/URL. | composed | a reference image-gen tool + image-gen client |
| **Provider summary fn** | Read stat-sheet VIEW + recent stories → the syncable artifact. | composed | memory-DB design notes §3 |
| **Synthetic seeder** `seed.ts` | Pre-load a believable 7–21 day `events` history before the demo. | primitive | (new; §10) |

---

## 10. Build-simply guardrails (the satisfice rules)

From the build-constraints notes. Why each constraint exists matters as much as the rule.

- **One events table, open `kind` vocabulary.** No per-source tables, no SQL enum. *Why:* the whole
  "add a connector later" story is one chokepoint; a CHECK constraint would force a migration per source.
- **Skip embeddings / RRF / decay for the demo.** A flat windowed `COUNT(*)` over a handful of seeded
  events is faster, more legible, and beats a ~30 MB MiniLM cold-start mid-demo. *Why:* the demo
  reflects against tens of rows, not thousands — RRF earns nothing here. Keep `embeddings.ts` on the
  shelf for the stretch goal only.
- **In-proc `Map` → SQLite. No Postgres.** *Why:* the engine is synchronous, single-user, a few hundred
  rows. SQLite is one file, zero infra, and the SQL ports straight from the reference. (Map first so the
  turn loop runs *before* the DB exists — a real, documented fallback, never a silent stub.)
- **ONE reasoning call per turn.** Collapse the multi-agent regen loop. *Why:* DOT isn't impersonating
  anyone; the fact/feeling split is a single prompted job. Every extra agent is latency + a place to fail.
- **Synthetic seed is the actual product risk — invest there.** Build `data/seed.ts` inserting a
  believable, idempotent, versioned 7–21 day `events` history (`message_received` / `call` /
  `panic_attack_logged`) **before** the demo. *Why:* the "50 texts" delta is only as good as the
  counter-evidence behind it; this is where the demo-path polish goes, not the schema.
- **Prove the roundtrip.** Write → re-read → render a glass dot that survives a reload before calling
  persistence done. *Why:* a `stories` row that "saved" but vanishes on refresh is the LARP failure —
  hours feeding a black hole.
- **Fail loud, render the mode.** No canned fallbacks; a failure logs structurally + renders a visible
  FAILED badge; real/cached/mocked status shows on screen (env-gated `MOCK_*=1`). *Why:* "mocked" must
  never quietly masquerade as "real."
- **Honesty doctrine is a hard constraint, not a vibe.** Validate first, never invalidate; surface the
  delta as a neutral observation (don't announce "your anxiety is lying"); not a therapist; crisis →
  human handoff. *Why:* invalidation escalates anxiety and ruptures trust — the honesty IS the product.
- **Subtraction pass each stage.** Name one thing to cut (a node, a panel, a dep) and cut it or ticket
  it. *Why:* constraint is the development mechanism; the cut list keeps the system legible under the clock.
- **Say "synthetic" out loud.** All data is synthetic (PHI rule). The "50 texts" stream is faked for
  the demo — show the value-return loop, not a real ingestion pipeline (which is unbuilt).

---

## 11. Grok-CLI note

The build can be driven by **Grok agents** as well as Claude. Grok reads `CLAUDE.md`, `.claude/skills/`,
and `AGENTS.md` with zero extra config, so the existing `dot/` harness already works for them — point a
Grok-CLI agent at the repo root and it picks up the same map and operating contract. No separate agent
scaffolding to build; the docs ARE the shared interface. (When wiring the Grok models above, a Grok
agent is also the fastest path to confirming the unknown slugs/endpoints in the ⚑ blocks — it can call
its own provider to verify.)

---

## Appendix — the consolidated ⚑ NEEDS FROM JOHNNY list

Wire-blocking unknowns, grouped. **Voice is the highest-ROI item** (its own $5k prize + the entry surface).

**Grok Voice (special-access — top priority):**
1. Exact model id: `grok-voice-think-fast-1.1` vs `-1.0`? Which responds on your account?
2. Special-access: which key/account has it; any allowlist/beta flag to enable.
3. Realtime endpoint URL + transport (`wss://…`? OpenAI-realtime-compatible or custom?).
4. Auth: token/key var name + source.
5. Is `reasoning: 'high'` a session param on the voice model, or model-fixed?
6. Event schema: exact names for transcript delta vs final; is audio returned (to ignore)?
7. SDK / docs link + rate/credit limits.

**Grok text reasoning (fact/feeling split):**
8. Exact slug: `grok-4.3` vs `grok-4.20-beta` vs other — which is live on your key.
9. Reasoning param: exact name + allowed values (`reasoning_effort: 'high'`?).
10. API base + auth (direct `api.x.ai/v1` vs via OpenRouter) — pick one.
11. Structured-output: `response_format` JSON-schema supported, or parse JSON from text?

**Grok image-gen (glass dot):**
12. Exact model id (Grok Imagine) + images endpoint route.
13. Auth (same `GROK_API_KEY` or separate?).
14. Shape: synchronous single-shot or async create-task-then-poll?
15. Output: URL / base64 / both; size options; rate/credit limits.

**Infra / keys (so the skeleton runs end-to-end):**
16. iMessage transport creds: `IMESSAGE_SERVER_URL` + `IMESSAGE_API_KEY` (Photon bridge) — or are we on
    a cloud spectrum-style provider (`SPECTRUM_PROJECT_ID`/`SECRET`) instead?
17. Inngest: signing key / event key + whether we run the dev server locally or Inngest Cloud.
18. Reuse: if working Grok/iMessage keys already live in another repo's `.env`, name the source so we
    copy, not regenerate, under the clock. (KEYS.md currently has all `⏳ TODO`.)
