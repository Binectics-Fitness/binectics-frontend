"use client";

import { useState } from "react";
import { DSCard, Eyebrow } from "@/components/ds";
import { useOnline, OFFLINE_WRITE_MESSAGE } from "@/hooks/useOnline";
import {
  useAddSystemLine,
  useChecklistItems,
  useChecklistToday,
  useCreateItem,
  useRemoveItem,
  useRemoveSystemLine,
  useTickItem,
  useUpdateItem,
  useWaterSettings,
} from "@/lib/queries/solo";
import {
  CHECKLIST_LABEL_MAX,
  CHECKLIST_LIMIT_REACHED,
  CHECKLIST_MAX_ACTIVE,
  ChecklistItemKind,
  ChecklistSystemKey,
  type ChecklistItem,
} from "@/lib/api/checklist";
import {
  TOOL_ORDER,
  TOOL_TITLES,
  WEEKDAYS,
  activeCount,
  atCap,
  daysLabel,
  toggleDay,
  toolMeta,
} from "@/lib/solo/checklistModel";
import { AutoTick, CardSkeleton, Row, Switch, TickButton, WriteError } from "./parts";
import styles from "./solo.module.css";


const LIMIT_MESSAGE = `You have ${CHECKLIST_MAX_ACTIVE} lines, which is the most. Remove or pause one to add another.`;

/**
 * The daily list, managed: tool-line switches, the member's own lines (add,
 * rename, weekday chips, pause, remove) and today's ticks. At most 12 active
 * lines, 60 characters each. Nothing here counts days in a row.
 */
export function ChecklistManager() {
  const items = useChecklistItems(true);
  const today = useChecklistToday(true);
  const water = useWaterSettings(true);
  const create = useCreateItem();
  const update = useUpdateItem();
  const remove = useRemoveItem();
  const addSystem = useAddSystemLine();
  const removeSystem = useRemoveSystemLine();
  const tick = useTickItem();
  const online = useOnline();

  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  if (items.isLoading) return <CardSkeleton height={360} />;
  if (items.isError && !items.data) {
    return (
      <DSCard className="p-6">
        <p className="text-[14px]" style={{ color: "var(--fg-2)" }}>
          We could not load your list. Check your connection and try again.
        </p>
        <button type="button" className="btn-ghost-v2 mt-3" style={{ height: 44 }} onClick={() => void items.refetch()}>
          Try again
        </button>
      </DSCard>
    );
  }

  const all = items.data?.items ?? [];
  const full = atCap(all);
  const doneToday = new Map((today.data?.items ?? []).map((i) => [i.id, i.done]));
  const shownToday = new Set((today.data?.items ?? []).map((i) => i.id));
  const tools = all.filter((i) => i.kind === ChecklistItemKind.SYSTEM);
  const mine = all.filter((i) => i.kind === ChecklistItemKind.CUSTOM);
  const toolByKey = new Map(tools.map((t) => [t.system_key as string, t]));

  const guard = (): boolean => {
    if (!online) {
      setError(OFFLINE_WRITE_MESSAGE);
      return false;
    }
    setError(null);
    return true;
  };
  const fail = (e: { message?: string; code?: string }) =>
    setError(e.code === CHECKLIST_LIMIT_REACHED ? LIMIT_MESSAGE : e.message || "We could not save that. Try again.");

  const onAdd = () => {
    const label = text.trim();
    if (!label || !guard()) return;
    if (full) return setError(LIMIT_MESSAGE);
    create.mutate({ label }, { onSuccess: () => setText(""), onError: fail });
  };

  const setTool = (key: ChecklistSystemKey, on: boolean) => {
    if (!guard()) return;
    if (on && full && !toolByKey.get(key)?.active) return setError(LIMIT_MESSAGE);
    (on ? addSystem : removeSystem).mutate(key, { onError: fail });
  };

  const patch = (item: ChecklistItem, input: { label?: string; days?: number[]; active?: boolean }, after?: () => void) => {
    if (!guard()) return;
    update.mutate({ id: item.id, input }, { onSuccess: after, onError: fail });
  };

  return (
    <DSCard className="gap-1 p-6">
      <Eyebrow>Today&rsquo;s list</Eyebrow>
      <p aria-live="polite" className="mt-1" style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink)" }}>
        {activeCount(all)} of {CHECKLIST_MAX_ACTIVE} lines
      </p>
      <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
        Lines for tools tick themselves when you log. Your own lines you tick by hand.
      </p>

      <ul className="mt-2">
        {TOOL_ORDER.map((key) => {
          const line = toolByKey.get(key);
          const on = !!line?.active;
          const done = line ? (doneToday.get(line.id) ?? false) : false;
          const title = TOOL_TITLES[key];
          return (
            <li key={key} style={{ listStyle: "none" }}>
              <Row>
                <AutoTick done={on && done} label={title} />
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-medium" style={{ color: "var(--ink)" }}>
                    {title}
                  </div>
                  <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                    {toolMeta(key, on, water.data?.target_glasses ?? null)}
                  </div>
                </div>
                <Switch on={on} label={`Show ${title} in my list`} onChange={(next) => setTool(key, next)} disabled={addSystem.isPending || removeSystem.isPending} />
              </Row>
            </li>
          );
        })}
        {mine.map((item) => {
          const isEditing = editing === item.id;
          const scheduledToday = shownToday.has(item.id);
          return (
            <li key={item.id} style={{ listStyle: "none" }}>
              <div className={styles.row} style={{ alignItems: "flex-start", flexWrap: "wrap", paddingTop: 6 }}>
                {item.active && scheduledToday ? (
                  <TickButton
                    done={doneToday.get(item.id) ?? false}
                    label={item.label}
                    onToggle={() => {
                      if (!guard()) return;
                      tick.mutate({ id: item.id, done: !(doneToday.get(item.id) ?? false) }, { onError: fail });
                    }}
                  />
                ) : (
                  <span aria-hidden="true" style={{ width: 44, height: 44, flex: "none" }} />
                )}
                <div className="min-w-0 flex-1" style={{ minWidth: 160 }}>
                  {isEditing ? (
                    <form
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const label = draft.trim();
                        if (!label) return;
                        patch(item, { label }, () => setEditing(null));
                      }}
                    >
                      <label className="sr-only" htmlFor={`edit-${item.id}`}>
                        Rename {item.label}
                      </label>
                      <input id={`edit-${item.id}`} className={styles.input} value={draft} maxLength={CHECKLIST_LABEL_MAX} onChange={(e) => setDraft(e.target.value)} autoFocus />
                      <button type="submit" className="btn-primary-v2" style={{ height: 44 }}>
                        Save
                      </button>
                      <button type="button" className={styles.link} onClick={() => setEditing(null)}>
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="text-[14.5px] font-medium" style={{ color: item.active ? "var(--ink)" : "var(--fg-3)", overflowWrap: "anywhere" }}>
                        {item.label}
                      </div>
                      <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                        Yours · {item.active ? daysLabel(item.days) : "Paused"}
                      </div>
                    </>
                  )}
                </div>
                {!isEditing && (
                  <div className="flex flex-wrap items-center">
                    <button type="button" className={styles.link} onClick={() => { setEditing(item.id); setDraft(item.label); }} aria-label={`Rename ${item.label}`}>
                      Rename
                    </button>
                    <button type="button" className={styles.link} disabled={update.isPending} onClick={() => patch(item, { active: !item.active })} aria-label={`${item.active ? "Pause" : "Resume"} ${item.label}`}>
                      {item.active ? "Pause" : "Resume"}
                    </button>
                    <button
                      type="button"
                      className={styles.link}
                      aria-label={`Remove ${item.label}`}
                      onClick={() => {
                        if (guard()) remove.mutate(item.id, { onError: fail });
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <div role="group" aria-label={`Days for ${item.label}`} className="flex flex-wrap gap-1.5 pb-3" style={{ paddingLeft: 58 }}>
                {WEEKDAYS.map((w) => {
                  const on = item.days.includes(w.day);
                  return (
                    <button
                      key={w.day}
                      type="button"
                      aria-pressed={on}
                      aria-label={w.long}
                      className={`${styles.chip} ${on ? styles.chipOn : ""}`}
                      // One change at a time: a second click would start from days the
                      // first change has not saved yet.
                      disabled={update.isPending}
                      onClick={() => patch(item, { days: toggleDay(item.days, w.day) })}
                    >
                      {w.short}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onAdd();
        }}
      >
        <label className="sr-only" htmlFor="new-line">
          New line
        </label>
        <input
          id="new-line"
          className={styles.input}
          placeholder="Add a line, for example: stretch for 10 minutes"
          maxLength={CHECKLIST_LABEL_MAX}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn-primary-v2" style={{ height: 44, padding: "0 18px", fontSize: 14 }} disabled={!text.trim() || create.isPending}>
          Add
        </button>
      </form>
      {full && (
        <p role="status" className="mt-2 text-[13px]" style={{ color: "var(--fg-2)" }}>
          {LIMIT_MESSAGE}
        </p>
      )}
      {error && (
        <div className="mt-2">
          <WriteError message={error} onDismiss={() => setError(null)} />
        </div>
      )}
      <p className="mt-2 text-[13px]" style={{ color: "var(--fg-3)" }}>
        At most {CHECKLIST_MAX_ACTIVE} lines, {CHECKLIST_LABEL_MAX} characters each. Nothing here counts days in a row or marks a missed one.
      </p>
    </DSCard>
  );
}
