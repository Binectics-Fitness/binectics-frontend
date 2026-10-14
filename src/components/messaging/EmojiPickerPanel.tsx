"use client";

import EmojiPicker, { EmojiStyle, SuggestionMode, Theme } from "emoji-picker-react";
import type { CSSProperties } from "react";

/**
 * The emoji picker itself. Loaded on demand by the composer (a separate
 * chunk), so the chat bundle doesn't carry the emoji data until someone
 * opens it.
 *
 * Emojis render natively (the same glyphs the message will show, and no
 * image CDN). The library's colours are mapped onto the v2 tokens, so it
 * follows globals.css rather than its own palette; it is pinned to its
 * light theme because the app has one theme (a dark OS must not turn the
 * picker dark inside a light page).
 */
const TOKENS = {
  "--epr-bg-color": "var(--bg)",
  "--epr-category-label-bg-color": "var(--bg)",
  "--epr-category-label-text-color": "var(--fg-3)",
  "--epr-text-color": "var(--ink)",
  "--epr-picker-border-color": "var(--border)",
  "--epr-picker-border-radius": "var(--r-3)",
  "--epr-hover-bg-color": "var(--bg-3)",
  "--epr-hover-bg-color-reduced-opacity": "var(--bg-2)",
  "--epr-focus-bg-color": "var(--bg-3)",
  "--epr-highlight-color": "var(--ink)",
  "--epr-category-icon-active-color": "var(--ink)",
  "--epr-search-input-bg-color": "var(--bg-2)",
  "--epr-search-input-bg-color-active": "var(--bg)",
  "--epr-search-input-text-color": "var(--ink)",
  "--epr-search-input-placeholder-color": "var(--fg-3)",
  "--epr-search-input-border-radius": "var(--r-2)",
  "--epr-search-border-color": "var(--border-2)",
  "--epr-search-border-color-active": "var(--ink)",
  "--epr-skin-tone-picker-menu-color": "var(--bg)",
  "--epr-emoji-variation-picker-bg-color": "var(--bg)",
  "--epr-emoji-size": "26px",
  "--epr-emoji-padding": "5px",
} as CSSProperties;

export default function EmojiPickerPanel({ height, onPick }: { height: number; onPick: (emoji: string) => void }) {
  return (
    <EmojiPicker
      onEmojiClick={(data) => onPick(data.emoji)}
      emojiStyle={EmojiStyle.NATIVE}
      theme={Theme.LIGHT}
      suggestedEmojisMode={SuggestionMode.RECENT}
      autoFocusSearch
      lazyLoadEmojis
      searchPlaceholder="Search emoji"
      previewConfig={{ showPreview: false }}
      width="100%"
      height={height}
      style={TOKENS}
    />
  );
}
