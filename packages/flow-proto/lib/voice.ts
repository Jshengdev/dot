'use client';
import { useCallback, useRef, useState } from 'react';

// Speak via the /api/tts route (real Grok TTS, voice "eve"). Blobs are cached by
// text so a repeated line is instant. Autoplay blocks (first sound before a gesture)
// fail quiet — the text still shows; the next user gesture will talk.
const cache = new Map<string, Promise<string>>();

function audioUrl(text: string): Promise<string> {
  if (!cache.has(text)) {
    cache.set(
      text,
      (async () => {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error('tts ' + res.status);
        const blob = await res.blob();
        return URL.createObjectURL(blob);
      })(),
    );
  }
  return cache.get(text)!;
}

// warm the cache without playing (so the first gesture-triggered line is instant)
export function prewarm(text: string) {
  audioUrl(text).catch(() => cache.delete(text));
}

export function useDotVoice() {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string) => {
    try {
      const url = await audioUrl(text);
      audioRef.current?.pause();
      const a = new Audio(url);
      audioRef.current = a;
      a.onplay = () => setSpeaking(true);
      await a.play();
      await new Promise<void>((resolve) => {
        a.onended = () => resolve();
        a.onerror = () => resolve();
      });
    } catch {
      // autoplay blocked or tts error — stay quiet
    } finally {
      setSpeaking(false);
    }
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking };
}
