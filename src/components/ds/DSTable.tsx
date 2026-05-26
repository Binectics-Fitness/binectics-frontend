/**
 * DSTable — data table wrapper following design system
 * Mono 10.5-11px uppercase headers, bg-2 header row, hover bg-2 rows
 * Tabular nums on all number columns. Wrapped in overflow-x-auto.
 */
interface DSTableProps {
  children: React.ReactNode;
  minWidth?: number;
  className?: string;
}

export function DSTable({ children, minWidth = 600, className = "" }: DSTableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        className={`w-full border-collapse text-[13.5px] ${className}`}
        style={{ minWidth, fontVariantNumeric: "tabular-nums" }}
      >
        {children}
      </table>
    </div>
  );
}

interface DSTableHeadProps {
  children: React.ReactNode;
}

export function DSTableHead({ children }: DSTableHeadProps) {
  return (
    <thead>
      <tr
        className="font-mono text-[10.5px] uppercase tracking-[0.05em]"
        style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)" }}
      >
        {children}
      </tr>
    </thead>
  );
}

interface DSTableThProps {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

export function DSTableTh({ children, align = "left", className = "" }: DSTableThProps) {
  return (
    <th
      className={`px-4.5 py-2.5 font-medium ${className}`}
      style={{ textAlign: align }}
    >
      {children}
    </th>
  );
}

interface DSTableRowProps {
  children: React.ReactNode;
  last?: boolean;
  onClick?: () => void;
  className?: string;
}

export function DSTableRow({ children, last, onClick, className = "" }: DSTableRowProps) {
  return (
    <tr
      className={`hover:bg-bg-2 ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{
        borderBottom: last ? "none" : "1px solid var(--border)",
        transition: "background var(--motion-fast) var(--ease)",
      }}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

interface DSTableTdProps {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  mono?: boolean;
  className?: string;
}

export function DSTableTd({ children, align = "left", mono, className = "" }: DSTableTdProps) {
  return (
    <td
      className={`px-4.5 py-3 ${mono ? "font-mono" : ""} ${className}`}
      style={{ textAlign: align, color: "var(--ink)" }}
    >
      {children}
    </td>
  );
}
