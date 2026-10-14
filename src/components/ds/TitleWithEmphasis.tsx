/**
 * TitleWithEmphasis — a screen's main title, written as parts.
 *
 * Rule (owner, Oct 14 2026): no serif italic on product screens. This
 * reverses the Oct 6 ruling that set one word of each main title in
 * Instrument Serif italic; the owner found "Hey, *Adesegun*." odd. The key
 * word now renders in the title's own font, as one plain string:
 *
 *   <TitleWithEmphasis before="Hey, " emphasis="Tunde" after="." />
 *   → <h1>Hey, Tunde.</h1>
 *
 * The `TitleParts` API stays, and every product title still goes through
 * here (or PageHeader / SuccessTakeover), so a future restyle of the key
 * word is a change to this one file. Marketing pages keep their own serif
 * moments; they do not use this component.
 *
 * Spacing trap: globals.css has an unlayered `h1, h2, … { margin: 0 }`,
 * which beats Tailwind margin utilities (they live in a cascade layer), so
 * `className="mt-4"` on the heading does nothing. Put the gap on the
 * neighbouring element, or pass it through `style`.
 */
import type { CSSProperties } from "react";

export interface TitleParts {
  /** Plain text before the key word. Include the trailing space. */
  before?: string;
  /**
   * The title's key word ("Tunde" in "Hey, Tunde."). Rendered in the title's
   * own font; the slot is kept so a restyle stays a one-file change.
   */
  emphasis: string;
  /** Plain text after the key word. Include the leading space. */
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
  const title = `${before ?? ""}${emphasis.trim()}${after ?? ""}`;
  return (
    <Tag
      id={id}
      className={`text-[30px] font-medium leading-[1.1] ${className}`}
      style={{ color: "var(--ink)", letterSpacing: "-0.024em", ...style }}
    >
      {title}
    </Tag>
  );
}
