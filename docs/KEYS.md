# KEYS — env vars + credentials. What the build needs to run.

> Real secrets live in `.env` at repo root (**gitignored** — verified). This doc names variables + their source.
> Nothing here is a real secret. **Rotate `XAI_API_KEY` on the xAI console after the event** (it was shared in plaintext).

## How secrets are handled (LOCKED)
- Real keys live in `.env` (gitignored: `.env` + `.env.*`, with `!.env.example`).
- A committed `.env.example` lists every variable name with an empty value (⏳ create from the table below).
- Nothing in `docs/` or source ever contains a real secret — reference the variable name only.

## Required variables

| Variable | Used by | Source | Status |
|---|---|---|---|
| `XAI_API_KEY` | all Grok calls (text / image / TTS / realtime voice) | `dot/.env` | ✅ **present + verified live** |
| `INNGEST_EVENT_KEY` | director loop (Cloud) | Inngest dashboard | ⏳ needed (dev server works keyless) |
| `INNGEST_SIGNING_KEY` | Inngest serve handler (Cloud) | Inngest dashboard | ⏳ needed (Cloud only) |
| `IMESSAGE_SERVER_URL` / `IMESSAGE_API_KEY` | iMessage connector (Photon) | copied from `~/code/doubles/.env` (+ `USER_PHONE`/`AGENT_PHONE`) | ✅ **present in `dot/.env`** |
| `DATABASE_URL` | store (only if SQLite→Postgres) | local SQLite needs none | optional |
| `MOCK_*` | dev-only mocks (env-gated) | local only | convention locked |

## Grok wiring — VERIFIED LIVE against this account (2026-06-13)
Base URL `https://api.x.ai/v1` · Auth `Bearer $XAI_API_KEY`.

| Capability | Endpoint / model | Status | Notes |
|---|---|---|---|
| **Text reasoning** (the fact/feeling/delta split) | `grok-4.20-0309-reasoning` (also `grok-4.3` available) | ✅ in model list | call via Vercel AI SDK `@ai-sdk/xai` → `generateObject({ schema })` |
| **Multi-agent** (optional director brain) | `grok-4.20-multi-agent-0309` | ✅ in model list | an option for the routing loop; Inngest can drive it instead |
| **Image-gen** (the glass-dot render) | `grok-imagine-image` (· `grok-imagine-image-quality`) | ✅ in model list | also `grok-imagine-video*` exist (not needed) |
| **TTS** (DOT speaks back) | `POST /v1/tts` `{ text, voice_id:"eve", language:"en" }` → mp3 | ✅ **tested: 200, audio/mpeg 24kHz** | voices incl. `eve` |
| **Realtime voice** (the voice ENTRY) | `wss://api.x.ai/v1/realtime?model=grok-voice-think-fast-1.1` | ✅ **handshake VERIFIED live** (2026-06-13) | Bearer `$XAI_API_KEY` over WS → `session.created` returns. Model id `grok-voice-think-fast-1.1` accepted (server resolves it to `grok-voice-latest`; default voice `ara`, modalities `["audio"]`). At L5: `session.update` to set voice=`eve` + enable `input_audio_transcription` for the live transcript. OpenAI-Realtime-compatible. |

> Note: there is **no** standalone STT endpoint (`/v1/audio/transcriptions` → 404). Speech→text happens *inside*
> the realtime session. So voice entry = the realtime WS (gives both the spoken exchange AND the live transcript).

## Reuse (don't regenerate under the clock)
- `XAI_API_KEY` — already in `dot/.env`. ✅
- **iMessage + Inngest keys:** if they already exist in another repo's `.env` (Doubles, or HANA `apps/hana/.env`),
  name that file and I'll copy the values into `dot/.env` rather than re-provisioning. ⏳
