/**
 * TitleWithEmphasis — a screen's main title with ONE serif-italic word.
 *
 * Rule (owner, Oct 2026): one serif-italic word per screen, in the main title
 * only — never in buttons, labels or body copy. The props make a second
 * emphasis impossible: there is one `emphasis` slot and it takes a string,
 * not markup. A multi-word emphasis is reported in development.
 *
 *   <TitleWithEmphasis before="Hey, " emphasis="Tunde" after="." />
 *   → Hey, <em class="serif">Tunde</em>.
 */
import type { CSSProperties } from "react";

export interface TitleParts {
  /** Plain text before the emphasised word. Include the trailing space. */
  before?: string;
  /** The single word set in Instrument Serif italic. */
  emphasis: string;
  /** Plain text after the emphasised word. Include the leading space. */
  after?: string;
}

interface TitleWithEmphasisProps extends TitleParts {
  as?: "h1" | "h2";
  id?: string;
  className?: string;
  style?: CSSProperties;
}

export function TitleWithEmphasis({
  before,
  emphasis,
  after,
  as: Tag = "h1",
  id,
  className = "",
  style,
}: TitleWithEmphasisProps) {
  const word = emphasis.trim();
  if (process.env.NODE_ENV !== "production" && /\s/.test(word)) {
    console.error(
      `TitleWithEmphasis: emphasis must be one word, got "${emphasis}". ` +
        "Only one serif-italic word is allowed per screen.",
    );
  }
  return (
    <Tag
      id={id}
      className={`text-[30px] font-medium leading-[1.1] ${className}`}
      style={{ color: "var(--ink)", letterSpacing: "-0.024em", ...style }}
    >
      {before}
      <em data-emphasis className="serif italic">
        {word}
      </em>
      {after}
    </Tag>
  );
}
