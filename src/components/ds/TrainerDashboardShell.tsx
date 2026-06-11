import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { ProviderDashboardShell } from "./ProviderDashboardShell";

function I({ children, d }: { children?: React.ReactNode; d?: string }) {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d ? <path d={d} /> : children}</svg>;
}

const SIDEBAR = [
  { label: "Work", items: [
    { name: "Today", href: "/dashboard/trainer", icon: <I><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></I> },
    { name: "Calendar", href: "/dashboard/trainer/sessions", icon: <I><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></I> },
    { name: "Clients", badge: "42", href: "/dashboard/trainer/clients", icon: <I><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></I> },
    { name: "Inbox", badge: "7", href: "/dashboard/trainer/messages", icon: <I d="M21 11.5a8.4 8.4 0 0 1-1 4 8.5 8.5 0 0 1-7.5 4.5 8.5 8.5 0 0 1-4-1L3 21l2-5.5a8.5 8.5 0 1 1 16-4z" /> },
  ]},
  { label: "Practice", items: [
    { name: "Earnings", href: "/dashboard/trainer/earnings", icon: <I><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></I> },
    { name: "Packages", href: "/dashboard/trainer/plans", icon: <I d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /> },
    { name: "My profile", href: "/dashboard/trainer/profile", icon: <I><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/></I> },
    { name: "Settings", href: "/dashboard/trainer/settings", icon: <I><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8M4.6 9a1.7 1.7 0 0 0-.3-1.8"/></I> },
  ]},
];

export interface TrainerDashboardShellProps {
  activeItem: string;
  crumb: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

function TrainerSidebarContent({ activeItem }: { activeItem: string }) {
  return (
    <div className="flex flex-col gap-6 px-3.5 pb-6">
      <Link href="/" className="flex items-center gap-2.5 px-1.5 py-1"><BinecticsLockup /></Link>
      <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-(--r-2)" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
        <span className="w-5.5 h-5.5 rounded-full flex items-center justify-center text-[11px] font-semibold" style={{ background: "var(--trainer-soft)", color: "var(--trainer)" }}>SO</span>
        <span className="text-[13px] font-medium flex-1" style={{ color: "var(--ink)" }}>Sarah Okafor</span>
      </div>
      {SIDEBAR.map((s) => (
        <nav key={s.label} className="flex flex-col gap-0.5" aria-label={s.label}>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] px-2 py-1 mb-1" style={{ color: "var(--fg-4)" }}>{s.label}</div>
          {s.items.map((item) => {
            const isActive = item.name === activeItem;
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-2.5 py-1.75 px-2 rounded-(--r-2) text-[13.5px] ${isActive ? "bg-bg-3 font-medium" : "hover:bg-bg-2"}`} style={{ color: isActive ? "var(--ink)" : "var(--fg-2)" }}>
                {item.icon}<span className="flex-1">{item.name}</span>
                {item.badge && <span className="ml-auto font-mono text-[11px] px-1.5 py-px rounded-full bg-bg-2" style={{ color: "var(--fg-3)" }}>{item.badge}</span>}
              </Link>
            );
          })}
        </nav>
      ))}
      <div className="mt-auto flex items-center gap-2.5 pt-3.5" style={{ borderTop: "1px solid var(--border)" }}>
        <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold" style={{ background: "var(--trainer-soft)", color: "var(--trainer)" }}>SO</span>
        <div className="flex-1">
          <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>Sarah O.</div>
          <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>TRAINER</div>
        </div>
      </div>
    </div>
  );
}

export function TrainerDashboardShell({ activeItem, crumb, actions, children }: TrainerDashboardShellProps) {
  return (
    <ProviderDashboardShell
      sidebarSlot={<TrainerSidebarContent activeItem={activeItem} />}
      crumb={crumb}
      breadcrumbRoot={{ label: "Sarah Okafor", href: "/dashboard/trainer" }}
      actions={actions}
    >
      {children}
    </ProviderDashboardShell>
  );
}
