interface DSPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function DSPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: DSPaginationProps) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const pages = buildPageNumbers(page, totalPages);

  return (
    <div
      className="flex items-center justify-between px-4 py-3 font-mono text-[12.5px]"
      style={{
        borderTop: "1px solid var(--border)",
        fontVariantNumeric: "tabular-nums",
        color: "var(--fg-3)",
      }}
    >
      <span>
        {start}&ndash;{end} of {totalItems.toLocaleString()}
      </span>
      <div className="flex items-center gap-1">
        <PageButton
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          &lsaquo;
        </PageButton>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-fg-4">
              &hellip;
            </span>
          ) : (
            <PageButton
              key={p}
              active={p === page}
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </PageButton>
          ),
        )}
        <PageButton
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          &rsaquo;
        </PageButton>
      </div>
    </div>
  );
}

function PageButton({
  children,
  active,
  disabled,
  onClick,
  ...rest
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-7 min-w-7 items-center justify-center rounded-(--r-2) px-1.5 text-[12.5px] font-medium transition-colors ${
        active
          ? "bg-ink text-bg"
          : disabled
            ? "cursor-not-allowed text-fg-4"
            : "text-fg-2 hover:bg-bg-2 hover:text-ink"
      }`}
      style={{ transitionDuration: "var(--motion-fast)" }}
      {...rest}
    >
      {children}
    </button>
  );
}

function buildPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];

  if (current > 3) pages.push("…");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("…");

  pages.push(total);
  return pages;
}
