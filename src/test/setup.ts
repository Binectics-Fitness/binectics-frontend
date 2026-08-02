import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";

/**
 * The jsdom globals vitest exposes don't reliably carry Storage's
 * prototype methods (localStorage.clear was undefined), so install a
 * complete in-memory implementation. Reset between tests so no suite
 * depends on another's leftovers.
 */
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

const localStorageMock = new MemoryStorage();
const sessionStorageMock = new MemoryStorage();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, "sessionStorage", {
  value: sessionStorageMock,
  writable: true,
  configurable: true,
});

beforeEach(() => {
  localStorageMock.clear();
  sessionStorageMock.clear();
});

/**
 * jsdom ships no EventSource, and the shells open one for the live
 * notification count — so any test rendering a shell threw
 * "EventSource is not defined" before reaching its assertions.
 *
 * This stub connects to nothing and emits nothing. That is the right
 * behaviour for tests: the hook already falls back to polling when the
 * stream is unavailable, so this exercises the same path a browser with
 * a failed stream would take. Tests that care about stream events should
 * mock the hook instead.
 */
class MockEventSource {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;

  readonly url: string;
  readyState = MockEventSource.CONNECTING;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onopen: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  addEventListener(): void {}
  removeEventListener(): void {}
  close(): void {
    this.readyState = MockEventSource.CLOSED;
  }
}

Object.defineProperty(globalThis, "EventSource", {
  value: MockEventSource,
  writable: true,
  configurable: true,
});
