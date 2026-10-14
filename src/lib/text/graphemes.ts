/**
 * Cutting and counting user text without breaking characters.
 *
 * `String.prototype.slice` counts UTF-16 code units. An emoji outside the
 * Basic Multilingual Plane is two units (a surrogate pair), and what a
 * person sees as one emoji can be several code points: 👨‍👩‍👧 is three people
 * joined by zero-width joiners, 🇳🇬 is two regional indicators, 👍🏽 is a
 * base plus a skin tone. A cut inside a pair leaves "�"; a cut inside a
 * joined sequence turns a family into a lone man.
 *
 * Limits stay in UTF-16 units (so lengths are bounded exactly as before),
 * but every cut lands on a grapheme boundary. `Intl.Segmenter` does the
 * segmenting where the runtime has it; otherwise a small rule set covers
 * the emoji cases above (joiners, variation selectors, skin tones, flag
 * pairs, keycaps, tag sequences, combining marks).
 */

type Segment = { index: number; segment: string };
type SegmenterLike = { segment(input: string): Iterable<Segment> };

function nativeSegmenter(): SegmenterLike | null {
  const Ctor = (globalThis as { Intl?: { Segmenter?: new (l?: string, o?: { granularity: "grapheme" }) => SegmenterLike } }).Intl
    ?.Segmenter;
  if (typeof Ctor !== "function") return null;
  try {
    return new Ctor(undefined, { granularity: "grapheme" });
  } catch {
    return null;
  }
}

const native = nativeSegmenter();

const isRegionalIndicator = (cp: number) => cp >= 0x1f1e6 && cp <= 0x1f1ff;

/** Code points that never start a cluster: they attach to the one before. */
function isExtender(cp: number): boolean {
  return (
    (cp >= 0x0300 && cp <= 0x036f) || // combining diacritics
    (cp >= 0x1ab0 && cp <= 0x1aff) ||
    (cp >= 0x1dc0 && cp <= 0x1dff) ||
    (cp >= 0x20d0 && cp <= 0x20ff) || // incl. U+20E3 combining keycap
    (cp >= 0xfe00 && cp <= 0xfe0f) || // variation selectors
    (cp >= 0xfe20 && cp <= 0xfe2f) ||
    (cp >= 0x1f3fb && cp <= 0x1f3ff) || // skin tones
    (cp >= 0xe0020 && cp <= 0xe007f) || // tag sequence (subdivision flags)
    cp === 0x200d // zero-width joiner
  );
}

/**
 * Grapheme segments without `Intl.Segmenter` (Hermes has none). Not the
 * full UAX #29, but it never splits a surrogate pair and keeps every
 * common emoji sequence whole.
 */
export function* fallbackSegments(text: string): Generator<Segment> {
  let start = 0;
  let index = 0;
  let joinNext = false;
  let riCount = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    const attach =
      index > 0 && (joinNext || isExtender(cp) || (isRegionalIndicator(cp) && riCount % 2 === 1));
    if (!attach && index > 0) {
      yield { index: start, segment: text.slice(start, index) };
      start = index;
      riCount = 0;
    }
    if (isRegionalIndicator(cp)) riCount += 1;
    joinNext = cp === 0x200d;
    index += ch.length;
  }
  if (index > start) yield { index: start, segment: text.slice(start, index) };
}

function segments(text: string): Iterable<Segment> {
  return native ? native.segment(text) : fallbackSegments(text);
}

/** The grapheme clusters of `text`, in order. */
export function splitGraphemes(text: string): string[] {
  return Array.from(segments(text), (s) => s.segment);
}

/**
 * The longest prefix of `text` that is at most `maxUnits` UTF-16 units long
 * and ends on a grapheme boundary. A single cluster longer than the limit
 * (a pile of combining marks) falls back to whole code points, so the
 * result is never cut inside a surrogate pair.
 */
export function truncateGraphemes(text: string, maxUnits: number): string {
  if (!text || maxUnits <= 0) return "";
  if (text.length <= maxUnits) return text;
  let end = 0;
  for (const { index, segment } of segments(text)) {
    if (index + segment.length > maxUnits) break;
    end = index + segment.length;
  }
  if (end === 0) {
    for (const cp of text) {
      if (end + cp.length > maxUnits) break;
      end += cp.length;
    }
  }
  return text.slice(0, end);
}

/** `truncateGraphemes` plus "…" when anything was cut; the whole stays within `maxUnits`. */
export function ellipsize(text: string, maxUnits: number): string {
  if (text.length <= maxUnits) return text;
  return `${truncateGraphemes(text, maxUnits - 1)}…`;
}

/** The first grapheme (for an initial), or "" for empty text. */
export function firstGrapheme(text: string): string {
  for (const { segment } of segments(text)) return segment;
  return "";
}

/**
 * Message length the way the API's validator counts it (class-validator
 * `MaxLength`, i.e. validator.js `isLength`): code units, minus one per
 * surrogate pair and one per variation selector following a character.
 * The box's limit and counter use this, so an emoji counts once, as it
 * does on the server, and the client never refuses what the API accepts.
 */
export function messageLength(text: string): number {
  const pairs = text.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g)?.length ?? 0;
  const selectors = text.match(/[^️︎][️︎]/g)?.length ?? 0;
  return text.length - pairs - selectors;
}

/** True when `text` holds a surrogate without its partner (renders "�"). */
export function hasLoneSurrogate(text: string): boolean {
  return /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(text);
}
