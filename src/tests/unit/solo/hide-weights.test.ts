import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SOLO_STORAGE_PREFIX, clearSoloStorage, readHideDailyWeights, writeHideDailyWeights } from "@/lib/solo/hideWeights";
import { clearAuthStorage } from "@/lib/utils/storage";

const keysOf = (): string[] => Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i) as string);

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("hide daily weights for good", () => {
  it("is off until chosen, and remembered per account", () => {
    expect(readHideDailyWeights("u1")).toBe(false);
    writeHideDailyWeights("u1", true);
    expect(readHideDailyWeights("u1")).toBe(true);
    expect(readHideDailyWeights("u2")).toBe(false);
    writeHideDailyWeights("u1", false);
    expect(readHideDailyWeights("u1")).toBe(false);
  });

  it("is kept under a solo-prefixed key and stores only the word '1'", () => {
    writeHideDailyWeights("u1", true);
    const keys = keysOf();
    expect(keys).toEqual([`${SOLO_STORAGE_PREFIX}hide-daily-weights:u1`]);
    expect(localStorage.getItem(keys[0])).toBe("1");
  });

  it("does nothing without an account", () => {
    writeHideDailyWeights(null, true);
    expect(localStorage.length).toBe(0);
    expect(readHideDailyWeights(undefined)).toBe(false);
  });

  it("is wiped at sign-out with every other solo key and nothing else", () => {
    writeHideDailyWeights("u1", true);
    localStorage.setItem("solo:other", "x");
    localStorage.setItem("binectics-cookies", "{}");
    clearAuthStorage();
    expect(keysOf()).toEqual(["binectics-cookies"]);
    expect(readHideDailyWeights("u1")).toBe(false);
  });

  it("never throws when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readHideDailyWeights("u1")).toBe(false);
    expect(() => writeHideDailyWeights("u1", true)).not.toThrow();
    expect(() => clearSoloStorage()).not.toThrow();
  });
});
