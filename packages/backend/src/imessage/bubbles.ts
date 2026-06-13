// bubbles.ts — split one reply into 1-5 natural iMessage bubbles. Pure functions.
// A real person sends "hey" then "you up?" as two bubbles, not one essay. The
// transport (sendBubbles) paces them with a typing indicator between.

const MAX_BUBBLES = 5;
const SOFT_CHAR_CAP = 160; // regroup sentences up to ~this length per bubble

/** Reshape a reply string into 1-5 human-feeling bubbles. */
export function splitIntoBubbles(text: string, max = MAX_BUBBLES): string[] {
  const clean = text.trim();
  if (!clean) return [];

  // 1) honor explicit line breaks the model may have used to bubble itself.
  let parts = clean
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // 2) if it's one block, split on sentence boundaries and regroup to the cap.
  if (parts.length === 1) {
    const sentences = clean.match(/[^.!?]+[.!?]*\s*/g) ?? [clean];
    parts = [];
    let buf = '';
    for (const s of sentences) {
      if ((buf + s).length > SOFT_CHAR_CAP && buf) {
        parts.push(buf.trim());
        buf = s;
      } else {
        buf += s;
      }
    }
    if (buf.trim()) parts.push(buf.trim());
  }

  // 3) cap at `max` — merge the overflow into the last bubble.
  if (parts.length > max) {
    const head = parts.slice(0, max - 1);
    head.push(parts.slice(max - 1).join(' '));
    parts = head;
  }
  return parts;
}
