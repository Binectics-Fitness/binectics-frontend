interface TimelineItem {
  when: string;
  title: string;
  description?: string;
  done?: boolean;
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative pl-6">
      <div
        className="absolute left-[7px] top-2 bottom-2 w-px"
        style={{ background: "var(--border)" }}
      />
      {items.map((item, i) => (
        <div key={i} className="relative pb-6 last:pb-0">
          <div
            className={`absolute left-[-17px] top-1.5 h-3.5 w-3.5 rounded-full border-2 ${
              item.done
                ? "border-signal bg-signal"
                : "border-border-2 bg-bg"
            }`}
          />
          <div className="font-mono text-[10.5px] uppercase tracking-wide text-fg-4">
            {item.when}
          </div>
          <div className="mt-0.5 text-[13.5px] font-medium text-ink">
            {item.title}
          </div>
          {item.description && (
            <div className="mt-0.5 text-[12.5px] leading-relaxed text-fg-3">
              {item.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
