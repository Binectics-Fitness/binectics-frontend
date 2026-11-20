"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { programsService, type ProgramTemplateDetail } from "@/lib/api/programs";
import { parseBillingError, type BillingError } from "@/lib/utils/billingErrors";
import { toPayload, type BuilderProgram } from "./model";

/** Debounce before a change is sent (04 §6: about 800 ms). */
export const AUTOSAVE_MS = 800;

export type SaveState = "saved" | "saving" | "error";

/**
 * Autosave (P2-3): every change PATCHes the program after a short pause. One
 * request at a time; changes made meanwhile go in the next one. PATCH edits
 * the draft in place, or forks a new draft when the latest version is
 * published (API), so running clients never change underneath them.
 *
 * A program with no name is not sent (the API refuses it); the header shows
 * it as not saved until the coach names it.
 */
export function useAutosave(
  id: string,
  onSaved: (detail: ProgramTemplateDetail) => void,
) {
  const [state, setState] = useState<SaveState>("saved");
  const [gate, setGate] = useState<BillingError | null>(null);
  const latest = useRef<BuilderProgram | null>(null);
  const dirty = useRef(false);
  const running = useRef<Promise<boolean> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedCb = useRef(onSaved);
  useEffect(() => {
    savedCb.current = onSaved;
  });

  /** Send what is pending now. Resolves true once everything is saved. */
  const send = useCallback(async (): Promise<boolean> => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    // One request at a time; a flush waits for the running one, then sends the rest.
    while (running.current) await running.current;
    const run = (async () => {
      while (dirty.current && latest.current) {
        const program = latest.current;
        if (!program.name.trim()) {
          setState("error");
          return false;
        }
        dirty.current = false;
        setState("saving");
        const res = await programsService.updateTemplate(id, toPayload(program));
        if (!res.success || !res.data) {
          dirty.current = true;
          setGate(parseBillingError(res));
          setState("error");
          return false;
        }
        setGate(null);
        savedCb.current(res.data);
      }
      setState("saved");
      return true;
    })();
    running.current = run;
    try {
      return await run;
    } finally {
      running.current = null;
    }
  }, [id]);

  /** Record a change; it is sent after the pause. */
  const schedule = useCallback(
    (program: BuilderProgram) => {
      latest.current = program;
      dirty.current = true;
      setState("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void send(), AUTOSAVE_MS);
    },
    [send],
  );

  // Leaving the page sends what is pending (nothing is lost, 03 §4.9).
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        void send();
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      if (dirty.current) void send();
    };
  }, [send]);

  return { state, gate, schedule, flush: send };
}
