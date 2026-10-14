"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";

/**
 * The navigation of the dashboard shell on screen, for the command bar.
 *
 * Each role shell registers the sidebar it actually renders (after role and
 * staff filtering, with its badges), so the command bar offers exactly the
 * places the person can see and reach, and can never drift from the nav.
 * Pages without a shell (marketing, account settings) register nothing and
 * the command bar falls back to a few role-wide destinations.
 */

export interface ShellNavEntry {
  name: string;
  href: string;
  icon?: ReactNode;
  badge?: string;
}

interface ShellNavSectionLike {
  items: ShellNavEntry[];
}

let current: { token: symbol; entries: ShellNavEntry[] } | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function snapshot(): ShellNavEntry[] | null {
  return current?.entries ?? null;
}

/** For tests: forget whatever a previous render registered. */
export function resetShellNav() {
  current = null;
  emit();
}

/** Registers the shell's sidebar while the shell is mounted. */
export function useRegisterShellNav(sections: ShellNavSectionLike[]) {
  const entries = sections.flatMap((s) =>
    s.items.map((i) => ({ name: i.name, href: i.href, icon: i.icon, badge: i.badge })),
  );
  // Re-register only when what the bar would show changes, not on every
  // render (the shells rebuild their sections each render).
  const key = entries.map((e) => `${e.name}\u0000${e.href}\u0000${e.badge ?? ""}`).join("\u0001");
  useEffect(() => {
    const token = Symbol("shell-nav");
    current = { token, entries };
    emit();
    return () => {
      if (current?.token === token) {
        current = null;
        emit();
      }
    };
    // `entries` is rebuilt every render; `key` is its identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/** The registered shell's navigation, or null when no shell is on screen. */
export function useShellNav(): ShellNavEntry[] | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}
