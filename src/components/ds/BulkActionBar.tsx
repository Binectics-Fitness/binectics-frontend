interface BulkAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface BulkActionBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClearSelection?: () => void;
}

export function BulkActionBar({ selectedCount, actions, onClearSelection }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className="flex items-center justify-between rounded-(--r-3) bg-ink px-4 py-2.5"
    >
      <div className="flex items-center gap-3">
        <span
          className="font-mono text-[12.5px] font-medium text-bg"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {selectedCount} selected
        </span>
        {onClearSelection && (
          <button
            type="button"
            onClick={onClearSelection}
            className="text-[12.5px] font-medium text-bg/60 underline underline-offset-2 hover:text-bg"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className={`rounded-(--r-2) px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
              action.variant === "danger"
                ? "bg-danger text-white hover:bg-danger/90"
                : "bg-bg text-ink hover:bg-bg-2"
            }`}
            style={{ transitionDuration: "var(--motion-fast)" }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
