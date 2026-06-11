import Link from "next/link";
import { DashboardMobileNav } from "./MobileNav";

/**
 * Shared layout chrome for provider dashboards (Gym, Trainer, Dietitian).
 *
 * Renders:
 *  - Desktop: 232px sticky sidebar + main area with breadcrumb header
 *  - Mobile: DashboardMobileNav drawer + crumb subheader
 *
 * Role-specific content (sidebar nav config, org/user chip) is passed via
 * `sidebarSlot` so each role shell remains fully in control of its own nav.
 */

export interface ProviderDashboardShellProps {
  /** Full sidebar content — logo, identity chip, nav groups, user footer. */
  sidebarSlot: React.ReactNode;
  /** Breadcrumb leaf — the current page name shown after the separator. */
  crumb: string;
  /** Optional breadcrumb root shown before the separator (e.g. org name). */
  breadcrumbRoot?: { label: string; href: string };
  /** Action buttons rendered to the right of the header. */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function ProviderDashboardShell({
  sidebarSlot,
  crumb,
  breadcrumbRoot,
  actions,
  children,
}: ProviderDashboardShellProps) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-2)" }}>
      {/* Mobile nav drawer */}
      <DashboardMobileNav>{sidebarSlot}</DashboardMobileNav>

      {/* Desktop layout */}
      <div className="hidden lg:grid" style={{ gridTemplateColumns: "232px 1fr", minHeight: "100vh" }}>
        {/* Sidebar */}
        <aside
          className="flex flex-col gap-6 sticky top-0 h-screen overflow-y-auto"
          style={{ background: "var(--bg)", borderRight: "1px solid var(--border)", padding: "18px 14px" }}
          aria-label="Sidebar navigation"
        >
          {sidebarSlot}
        </aside>

        {/* Main */}
        <div className="flex flex-col min-w-0">
          <header
            className="flex items-center justify-between h-14 px-7 sticky top-0 z-10"
            style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}
          >
            <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>
              {breadcrumbRoot ? (
                <>
                  <Link
                    href={breadcrumbRoot.href}
                    className="hover:underline"
                    style={{ color: "var(--fg-3)", textDecoration: "none" }}
                  >
                    {breadcrumbRoot.label}
                  </Link>
                  <span className="mx-1.5" style={{ color: "var(--fg-4)" }}>/</span>
                </>
              ) : null}
              <span className="font-medium" style={{ color: "var(--ink)" }}>{crumb}</span>
            </div>
            {actions && <div className="flex gap-2">{actions}</div>}
          </header>
          <main className="flex flex-col gap-5 p-4 sm:p-7 flex-1">{children}</main>
        </div>
      </div>

      {/* Mobile content (no sidebar grid) */}
      <div className="lg:hidden">
        <header
          className="flex items-center justify-between h-12 px-5 sticky top-14 z-10"
          style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}
        >
          <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>
            {breadcrumbRoot ? (
              <>
                <span className="font-medium" style={{ color: "var(--ink)" }}>
                  {breadcrumbRoot.label}
                </span>
                <span className="mx-1.5" style={{ color: "var(--fg-4)" }}>/</span>
              </>
            ) : null}
            <span>{crumb}</span>
          </div>
          {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
        </header>
        <main className="flex flex-col gap-5 p-4 flex-1">{children}</main>
      </div>
    </div>
  );
}
