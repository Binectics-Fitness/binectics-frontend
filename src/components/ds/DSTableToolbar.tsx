interface DSTableToolbarProps {
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  bulkActions?: React.ReactNode;
  selectedCount?: number;
}

export function DSTableToolbar({
  searchPlaceholder = "Search...",
  onSearch,
  filters,
  actions,
  bulkActions,
  selectedCount = 0,
}: DSTableToolbarProps) {
  if (selectedCount > 0 && bulkActions) {
    return (
      <div
        className="flex items-center justify-between rounded-t-(--r-3) bg-ink px-4 py-2.5"
      >
        <span className="font-mono text-[12.5px] font-medium text-bg" style={{ fontVariantNumeric: "tabular-nums" }}>
          {selectedCount} selected
        </span>
        <div className="flex items-center gap-2">{bulkActions}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      {onSearch && (
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <circle cx={11} cy={11} r={8} />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch(e.target.value)}
            className="h-8 rounded-(--r-2) border border-border bg-bg pl-8 pr-3 text-[13px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none"
            style={{ width: 220, transitionDuration: "var(--motion-fast)" }}
          />
        </div>
      )}
      {filters && <div className="flex items-center gap-2">{filters}</div>}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}
