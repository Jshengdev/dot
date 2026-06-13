// realtime.ts — the Grok realtime VOICE client. One job: open an authenticated
// websocket to xAI's OpenAI-Realtime-compatible endpoint, negotiate DOT's voice
// session (eve voice, live transcription, server VAD), and route the typed event
// stream out through callbacks. One purpose per file: this is the transport.
//
// SCOPE NOTE: the full mic-capture → audio-playback loop is BROWSER-SIDE
// (packages/flow-proto): the browser captures PCM, streams it in via sendAudio,
// and plays the base64 audio deltas back. This backend client proves the realtime
// session works end-to-end — it opens the socket, applies the session config, and
// proves a text→speech response comes back through the Grok realtime channel
// (see test-voice.ts, the gate). It does not capture or play audio itself.
//
// Fail loud (CONSTRAINTS): a missing key throws before the socket opens; server
// 'error' events log loud and surface via onError; no canned fallback strings.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import WebSocket from 'ws';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Minimal .env loader — no dotenv dep. Reads repo-root .env into process.env
// without overwriting an already-set var. src/voice is 4 dirs up from the root:
// voice -> src -> backend -> packages -> dot (repo root). Mirrors grok.ts.
function loadEnv(): void {
  const envPath = resolve(__dirname, '..', '..', '..', '..', '.env');
  let raw: string;
  try {
    raw = readFileSync(envPath, 'utf8');
  } catch {
    return; // no .env file: rely on whatever is already in process.env
  }
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

loadEnv();

const XAI_API_KEY = process.env.XAI_API_KEY;
const VOICE_MODEL = process.env.DOT_VOICE_MODEL ?? 'grok-voice-think-fast-1.1';
const REALTIME_URL = `wss://api.x.ai/v1/realtime?model=${VOICE_MODEL}`;

// DOT's voice. eve = the calm, friendly default we negotiate on session.update.
const DOT_VOICE = 'eve';

export interface VoiceSessionCallbacks {
  // Final user transcript (from input_audio_transcription.completed).
  onTranscript?: (text: string) => void;
  // DOT's words as they stream (audio_transcript.delta / text.delta).
  onSpokenDelta?: (text: string) => void;
  // DOT's voice as base64 PCM audio chunks (response.audio.delta).
  onAudioDelta?: (b64: string) => void;
  // Any server 'error' event, or a transport-level error.
  onError?: (e: unknown) => void;
}

export interface VoiceSession {
  // Stream a base64-encoded PCM audio chunk to the model (browser feeds this).
  sendAudio: (b64pcm: string) => void;
  // Commit the buffered audio + ask the model to respond.
  commitAudio: () => void;
  // Send a text turn (creates a user message, then requests a response).
  sendText: (text: string) => void;
  // Close the socket.
  close: () => void;
}

// A loosely-typed realtime server event. We only read .type and the few fields
// each branch needs — the rest of the (large, evolving) schema is intentionally
// left open rather than mirrored.
interface RealtimeServerEvent {
  type?: string;
  session?: unknown;
  transcript?: string;
  delta?: string;
  error?: unknown;
  [k: string]: unknown;
}

export function openVoiceSession(opts: VoiceSessionCallbacks): VoiceSession {
  if (!XAI_API_KEY) {
    // Fail loud — never open an unauthenticated socket and pretend it works.
    throw new Error(
      'XAI_API_KEY is not set. Add it to dot/.env (gitignored). ' +
        'See docs/KEYS.md. The Grok realtime voice client cannot connect without it.',
    );
  }

  const ws = new WebSocket(REALTIME_URL, {
    headers: { Authorization: `Bearer ${XAI_API_KEY}` },
  });

  // Send a JSON event to the server. Guards against a not-yet-open socket so a
  // caller mis-timing a send gets a loud log instead of a silent drop.
  function send(event: Record<string, unknown>): void {
    if (ws.readyState !== WebSocket.OPEN) {
      console.error(
        `[voice] dropped ${String(event['type'])}: socket not open (state=${ws.readyState})`,
      );
      return;
    }
    ws.send(JSON.stringify(event));
  }

  ws.on('open', () => {
    console.log(`[voice] socket open → ${VOICE_MODEL}`);
    // Negotiate DOT's session: eve voice, audio+text, live user transcription,
    // server-side voice-activity detection for natural turn-taking.
    send({
      type: 'session.update',
      session: {
        voice: DOT_VOICE,
        modalities: ['audio', 'text'],
        input_audio_transcription: { model: 'whisper-1' },
        turn_detection: { type: 'server_vad' },
      },
    });
  });

  ws.on('message', (raw: WebSocket.RawData) => {
    let evt: RealtimeServerEvent;
    try {
      evt = JSON.parse(raw.toString()) as RealtimeServerEvent;
    } catch (e) {
      console.error('[voice] non-JSON message from server:', raw.toString());
      opts.onError?.(e);
      return;
    }

    switch (evt.type) {
      case 'session.created':
      case 'session.updated':
        // Log the negotiated session config so the gate can prove what we got.
        console.log(`[voice] ${evt.type}:`, JSON.stringify(evt.session, null, 2));
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // The final user transcript for a spoken turn.
        if (typeof evt.transcript === 'string') opts.onTranscript?.(evt.transcript);
        break;

      // DOT's words, streaming. Grok emits the `output_audio_transcript` names;
      // we also accept the plain OpenAI-Realtime spec names for portability.
      case 'response.audio_transcript.delta':
      case 'response.output_audio_transcript.delta':
      case 'response.text.delta':
      case 'response.output_text.delta':
        if (typeof evt.delta === 'string') opts.onSpokenDelta?.(evt.delta);
        break;

      // DOT's voice, base64 PCM. The browser plays these back.
      case 'response.audio.delta':
      case 'response.output_audio.delta':
        if (typeof evt.delta === 'string') opts.onAudioDelta?.(evt.delta);
        break;

      case 'error':
        // Fail loud — surface the raw server error.
        console.error('[voice] server error event:', JSON.stringify(evt.error ?? evt, null, 2));
        opts.onError?.(evt.error ?? evt);
        break;

      default:
        // Unhandled event types are fine to ignore (deltas done, rate info, etc.),
        // but trace them quietly so nothing is truly silent.
        if (evt.type) console.log(`[voice] · ${evt.type}`);
        break;
    }
  });

  ws.on('error', (err) => {
    console.error('[voice] socket error:', err);
    opts.onError?.(err);
  });

  ws.on('close', (code, reason) => {
    console.log(`[voice] socket closed (code=${code})${reason?.length ? `: ${reason.toString()}` : ''}`);
  });

  return {
    sendAudio(b64pcm: string): void {
      send({ type: 'input_audio_buffer.append', audio: b64pcm });
    },
    commitAudio(): void {
      send({ type: 'input_audio_buffer.commit' });
      send({ type: 'response.create' });
    },
    sendText(text: string): void {
      send({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text }],
        },
      });
      send({ type: 'response.create' });
    },
    close(): void {
      ws.close();
    },
  };
}
