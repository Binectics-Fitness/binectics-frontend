"use client";

import { useState } from "react";

interface JsonViewProps {
  data: object;
  collapsed?: boolean;
}

export function JsonView({ data, collapsed = false }: JsonViewProps) {
  const [expanded, setExpanded] = useState(!collapsed);
  const json = JSON.stringify(data, null, 2);
  const lines = json.split("\n");

  return (
    <div className="overflow-hidden rounded-(--r-2) border border-border">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-[10.5px] uppercase tracking-wide text-fg-3 hover:bg-bg-2"
        style={{ borderBottom: expanded ? "1px solid var(--border)" : undefined }}
      >
        <span style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform var(--motion-fast)" }}>
          &#9654;
        </span>
        JSON &middot; {Object.keys(data).length} keys
      </button>
      {expanded && (
        <div className="overflow-x-auto bg-bg-2 p-3">
          <pre className="font-mono text-[12px] leading-relaxed">
            {lines.map((line, i) => (
              <div key={i} className="flex">
                <span className="mr-4 inline-block w-6 select-none text-right text-fg-4" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {i + 1}
                </span>
                <span className="text-fg-2">{line}</span>
              </div>
            ))}
          </pre>
        </div>
      )}
    </div>
  );
}
