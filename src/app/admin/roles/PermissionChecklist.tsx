"use client";

import { useId, useState } from "react";
import { DSCheckbox, StatusPill } from "@/components/ds";
import type { AdminPermission } from "@/lib/admin/permissions";
import type { AdminPermissionGroup } from "@/lib/api/adminRoles";
import { filterCatalogue, groupState, toggleGroup } from "@/lib/admin/roleHelpers";

export const NOT_GRANTABLE_HINT = "You can't grant a permission you don't have";

/**
 * The roles editor's permission list: one block per area from
 * GET /admin/permissions, a search over label and description, and a
 * "Select all" per group.
 *
 * - A permission the actor doesn't hold is greyed out (not hidden) with
 *   NOT_GRANTABLE_HINT: the API refuses to grant it anyway.
 * - `readOnly` (the Super admin role, or no admins:manage) disables every box.
 */
export function PermissionChecklist({
  catalogue,
  selected,
  onChange,
  canGrant,
  readOnly,
}: {
  catalogue: AdminPermissionGroup[];
  selected: ReadonlySet<AdminPermission>;
  onChange: (next: Set<AdminPermission>) => void;
  canGrant: (p: AdminPermission) => boolean;
  readOnly?: boolean;
}) {
  const [query, setQuery] = useState("");
  const searchId = useId();
  const groups = filterCatalogue(catalogue, query);
  const total = catalogue.reduce((n, g) => n + g.items.length, 0);

  const flip = (key: AdminPermission, on: boolean) => {
    const next = new Set(selected);
    if (on) next.add(key);
    else next.delete(key);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <label htmlFor={searchId} className="sr-only">
          Search permissions
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search permissions"
          className="min-h-11 w-full sm:max-w-[300px] rounded-(--r-2) px-3 text-[14px]"
          style={{ background: "var(--bg)", border: "1px solid var(--border-2)", color: "var(--ink)" }}
        />
        <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }} aria-live="polite">
          {selected.size} of {total} selected
        </span>
      </div>

      {groups.length === 0 ? (
        <p className="text-[13px] py-3" style={{ color: "var(--fg-3)" }}>
          No permission matches “{query.trim()}”.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {groups.map((g) => {
            const keys = g.items.map((i) => i.key);
            const grantable = readOnly ? [] : keys.filter(canGrant);
            const state = groupState(keys, selected);
            return (
              <fieldset
                key={g.group}
                className="rounded-(--r-2)"
                style={{ border: "1px solid var(--border)" }}
              >
                <legend className="sr-only">{g.group}</legend>
                <div
                  className="flex items-center justify-between gap-3 px-3 py-1.5"
                  style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}
                >
                  <span className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
                    {g.group}
                  </span>
                  {!readOnly && (
                    <label
                      className={`min-h-11 flex items-center gap-2 text-[12.5px] ${grantable.length ? "cursor-pointer" : "opacity-50"}`}
                      style={{ color: "var(--fg-2)" }}
                    >
                      <DSCheckbox
                        checked={state === "all"}
                        indeterminate={state === "some"}
                        disabled={grantable.length === 0}
                        aria-label={`Select all in ${g.group}`}
                        onChange={() => onChange(toggleGroup(selected, grantable))}
                      />
                      Select all
                    </label>
                  )}
                </div>
                <ul>
                  {g.items.map((item, idx) => {
                    const grantableItem = !readOnly && canGrant(item.key);
                    const on = selected.has(item.key);
                    return (
                      <li
                        key={item.key}
                        style={idx > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
                      >
                        <label
                          className={`min-h-11 flex items-start gap-3 px-3 py-2.5 ${grantableItem ? "cursor-pointer" : ""}`}
                          title={!readOnly && !grantableItem ? NOT_GRANTABLE_HINT : undefined}
                        >
                          <DSCheckbox
                            className="mt-[3px] shrink-0"
                            checked={on}
                            disabled={!grantableItem}
                            aria-label={item.label}
                            onChange={(v) => flip(item.key, v)}
                          />
                          <span className={`flex flex-col gap-0.5 min-w-0 ${!readOnly && !grantableItem ? "opacity-60" : ""}`}>
                            <span className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                                {item.label}
                              </span>
                              <span className="font-mono text-[10.5px] uppercase" style={{ color: "var(--fg-3)" }}>
                                {item.kind}
                              </span>
                              {item.pii && <StatusPill tone="warn" label="PII" dot={false} title="Returns personal data" />}
                            </span>
                            <span className="text-[12.5px] leading-snug" style={{ color: "var(--fg-2)" }}>
                              {item.description}
                            </span>
                            {!readOnly && !grantableItem && (
                              <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>
                                {NOT_GRANTABLE_HINT}
                              </span>
                            )}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            );
          })}
        </div>
      )}
    </div>
  );
}
