interface DiffViewProps {
  before: string;
  after: string;
  label?: string;
}

export function DiffView({ before, after, label }: DiffViewProps) {
  return (
    <div className="overflow-hidden rounded-(--r-2) border border-border">
      {label && (
        <div
          className="px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-wide text-fg-3"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}
        >
          {label}
        </div>
      )}
      <div className="grid grid-cols-2">
        <div
          className="border-r border-border p-3"
          style={{ background: "oklch(0.95 0.03 25 / 0.3)" }}
        >
          <div className="mb-1 font-mono text-[10px] uppercase tracking-wide text-danger">
            Before
          </div>
          <pre className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-fg-2">
            {before}
          </pre>
        </div>
        <div
          className="p-3"
          style={{ background: "oklch(0.94 0.04 148 / 0.3)" }}
        >
          <div className="mb-1 font-mono text-[10px] uppercase tracking-wide text-signal-ink">
            After
          </div>
          <pre className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-fg-2">
            {after}
          </pre>
        </div>
      </div>
    </div>
  );
}
