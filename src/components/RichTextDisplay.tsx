"use client";

import DOMPurify from "dompurify";
import { useMemo } from "react";

interface RichTextDisplayProps {
  html: string;
  className?: string;
}

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "h2",
    "h3",
    "ul",
    "ol",
    "li",
    "a",
    "blockquote",
  ],
  ALLOWED_ATTR: ["href", "target", "rel"],
};

/**
 * Renders sanitised HTML produced by the RichTextEditor.
 * Falls back to plain text (wrapped in a <p>) when the content
 * contains no HTML tags — this keeps old plain-text bios working.
 */
export default function RichTextDisplay({
  html,
  className = "",
}: RichTextDisplayProps) {
  const sanitised = useMemo(() => {
    if (!html) return "";
    // If the value has no HTML tags it's a legacy plain-text bio.
    // Wrap lines in <p> so whitespace renders correctly.
    const hasHtml = /<[a-z][\s\S]*>/i.test(html);
    const input = hasHtml
      ? html
      : html
          .split("\n")
          .map((line) => `<p>${line}</p>`)
          .join("");
    return DOMPurify.sanitize(input, PURIFY_CONFIG);
  }, [html]);

  if (!sanitised) return null;

  return (
    <div
      className={`prose prose-sm max-w-none prose-headings:text-ink prose-p:text-fg-2 prose-a:text-signal ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitised }}
    />
  );
}
