/**
 * Decodes HTML entities that were incorrectly stored in the database
 * by the legacy input sanitizer (which ran entity-encoding at the API layer).
 * React renders JSX text as plain text, so encoded entities like &#x27; must
 * be decoded before display.
 *
 * Runs two passes to handle double-encoded values (e.g. &amp;#x27; → &#x27; → ')
 * that were stored by the sanitizer when input already contained an ampersand.
 */
export function decodeHtmlEntities(str: string | undefined | null): string {
  if (!str) return str ?? "";

  const decode = (s: string) =>
    s
      .replace(/&#x2F;/gi, "/")
      .replace(/&#x27;/gi, "'")
      .replace(/&#039;/gi, "'")
      .replace(/&quot;/gi, '"')
      .replace(/&gt;/gi, ">")
      .replace(/&lt;/gi, "<")
      .replace(/&amp;/gi, "&"); // must come last in each pass

  // Two passes: first pass decodes &amp; → &, second pass decodes the now-exposed entity
  return decode(decode(str));
}

/**
 * Recursively decodes HTML entities in all string values of an object.
 * Useful for decoding entire API response objects.
 */
export function decodeObjectEntities<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return decodeHtmlEntities(obj) as unknown as T;
  if (Array.isArray(obj)) return obj.map(decodeObjectEntities) as unknown as T;
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = decodeObjectEntities((obj as Record<string, unknown>)[key]);
      }
    }
    return result as T;
  }
  return obj;
}
