import { describe, expect, it } from "vitest";
import { isScrollLocked, lockScroll } from "./scrollLock";

describe("lockScroll", () => {
  it("holds the lock until every holder releases, and never touches body.style", () => {
    document.body.style.overflow = "auto";
    const a = lockScroll();
    const b = lockScroll();
    expect(isScrollLocked()).toBe(true);
    a();
    a(); // idempotent: a second release doesn't drop b's hold
    expect(isScrollLocked()).toBe(true);
    b();
    expect(isScrollLocked()).toBe(false);
    expect(document.body.style.overflow).toBe("auto");
    document.body.style.overflow = "";
  });
});
