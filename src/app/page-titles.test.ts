import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

// The root layout's title template appends ", Binectics" to every page
// title, so a page that names the brand itself showed it twice
// ("Contact | Binectics, Binectics").
function metadataFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return metadataFiles(path);
    return /^(page|layout)\.tsx$/.test(name) ? [path] : [];
  });
}

const APP_DIR = join(__dirname);
const ROOT_LAYOUT = join(APP_DIR, "layout.tsx");
// The template applies to child segments only, not to the page beside the
// layout that defines it, so the home page names the brand itself.
const HOME_PAGE = join(APP_DIR, "page.tsx");

describe("page titles", () => {
  const files = metadataFiles(APP_DIR).filter((f) => f !== ROOT_LAYOUT && f !== HOME_PAGE);

  it.each(files.map((f) => [f.slice(APP_DIR.length + 1), f]))(
    "%s leaves the brand to the title template",
    (_name, file) => {
      const src = readFileSync(file, "utf8");
      const block = src.match(/export const metadata[^=]*=\s*\{([\s\S]*?)\n\};/)?.[1];
      const title = block?.match(/^ {2}title:\s*["`]([^"`]*)["`]/m)?.[1];
      if (title === undefined) return;
      expect(title).not.toMatch(/Binectics/);
    },
  );
});
