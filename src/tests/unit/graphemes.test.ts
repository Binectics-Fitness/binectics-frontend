import { describe, expect, it } from "vitest";
import {
  ellipsize,
  fallbackSegments,
  firstGrapheme,
  hasLoneSurrogate,
  messageLength,
  splitGraphemes,
  truncateGraphemes,
} from "@/lib/text/graphemes";

// Escapes, so the joiners and selectors are visible in review.
const FAMILY = "\u{1F468}‍\u{1F469}‍\u{1F467}"; // 8 units
const FLAG = "\u{1F1F3}\u{1F1EC}"; // 4 units
const THUMB = "\u{1F44D}\u{1F3FD}"; // 4 units
const HEART = "❤️"; // 2 units
const KEYCAP = "1️⃣";
const SCOTLAND = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}";
const CORPUS = [
  `hi ${FAMILY} ${FLAG}${FLAG} ${THUMB} ${HEART} ${KEYCAP} ${SCOTLAND} 😀 é done`,
  `${FLAG}${FLAG}${FLAG}`,
  "plain ascii",
  "",
];

describe("truncateGraphemes", () => {
  it("leaves short text alone and cuts plain text like slice", () => {
    expect(truncateGraphemes("hi 👋", 140)).toBe("hi 👋");
    expect(truncateGraphemes("abcdef", 3)).toBe("abc");
    expect(truncateGraphemes("", 3)).toBe("");
  });

  it("drops an emoji that would straddle the cut instead of halving it", () => {
    expect(hasLoneSurrogate("a😀".slice(0, 2))).toBe(true);
    expect(truncateGraphemes("a😀", 2)).toBe("a");
    for (let max = 3; max < 3 + FAMILY.length; max++) expect(truncateGraphemes(`hi ${FAMILY}`, max)).toBe("hi ");
    expect(truncateGraphemes(`x${FLAG}`, 3)).toBe("x");
    expect(truncateGraphemes(`x${THUMB}`, 4)).toBe("x");
  });

  it("never ends in a lone surrogate at any cut point", () => {
    const text = CORPUS[0];
    for (let max = 0; max <= text.length; max++) {
      const out = truncateGraphemes(text, max);
      expect(out.length).toBeLessThanOrEqual(max);
      expect(hasLoneSurrogate(out)).toBe(false);
      expect(text.startsWith(out)).toBe(true);
    }
  });

  it("falls back to code points for one oversized cluster", () => {
    expect(truncateGraphemes(`e${"́".repeat(10)}`, 4)).toBe(`e${"́".repeat(3)}`);
  });
});

describe("ellipsize", () => {
  it("adds an ellipsis only when it cut, within the limit", () => {
    expect(ellipsize("short", 140)).toBe("short");
    const out = ellipsize(`${"x".repeat(137)}${FAMILY}`, 140);
    expect(out).toBe(`${"x".repeat(137)}…`);
    expect(out.length).toBeLessThanOrEqual(140);
  });
});

describe("firstGrapheme", () => {
  it("takes a whole emoji, not half of it", () => {
    expect(firstGrapheme(`${FAMILY} Ade`)).toBe(FAMILY);
    expect(firstGrapheme("Ada")).toBe("A");
    expect(firstGrapheme("")).toBe("");
  });
});

describe("messageLength", () => {
  it("counts like the API validator: an emoji once, a heart with its selector once", () => {
    expect(messageLength("abc")).toBe(3);
    expect(messageLength("😀")).toBe(1);
    expect(messageLength(HEART)).toBe(1);
    expect(messageLength("😀".repeat(4000))).toBe(4000);
    expect(messageLength("😀".repeat(4000)) <= 4000).toBe(true);
  });
});

describe("fallbackSegments (runtimes without Intl.Segmenter, e.g. Hermes)", () => {
  it("agrees with Intl.Segmenter on emoji sequences", () => {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    for (const text of CORPUS) {
      const native = Array.from(seg.segment(text), (s) => s.segment);
      const fallback = Array.from(fallbackSegments(text), (s) => s.segment);
      expect(fallback).toEqual(native);
    }
  });

  it("splitGraphemes keeps every sequence whole", () => {
    expect(splitGraphemes(`${FAMILY}${FLAG}${KEYCAP}`)).toEqual([FAMILY, FLAG, KEYCAP]);
  });
});

describe("messaging initials", () => {
  it("takes a whole emoji from a name that starts with one", async () => {
    const { initials } = await import("@/components/messaging/format");
    expect(initials(`${FLAG} Ade Bayo`)).toBe(`${FLAG}A`);
    expect(hasLoneSurrogate(initials("😀 Ada"))).toBe(false);
    expect(initials("ada lovelace")).toBe("AL");
  });
});
