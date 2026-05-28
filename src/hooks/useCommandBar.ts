"use client";

import { useEffect, useState } from "react";

type CommandBarListener = (open: boolean) => void;
const _listeners: Set<CommandBarListener> = new Set();
let _open = false;

function notify() {
  _listeners.forEach((fn) => fn(_open));
}

export function openCommandBar() {
  _open = true;
  notify();
}

export function closeCommandBar() {
  _open = false;
  notify();
}

export function toggleCommandBar() {
  _open = !_open;
  notify();
}

export function useCommandBar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const listener: CommandBarListener = (o) => setOpen(o);
    _listeners.add(listener);
    return () => {
      _listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleCommandBar();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return { open, close: closeCommandBar };
}
