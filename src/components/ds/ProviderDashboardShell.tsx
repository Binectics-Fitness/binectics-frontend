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
  // ONE content slot. The page (children) and the header actions render
  // once; only CSS switches between the phone and desktop chrome. An earlier
  // version mounted the page twice (a desktop and a mobile copy, one hidden
  // by CSS), which doubled every fetch, h1 and dialog and remounted the page
  // when the viewport crossed lg.
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-2)" }}>
      {/* Phone top bar + nav drawer (lg:hidden inside) */}
      <DashboardMobileNav>{sidebarSlot}</DashboardMobileNav>

      <div className="lg:grid lg:min-h-screen lg:grid-cols-[232px_1fr]">
        {/* Desktop sidebar */}
        <aside
          className="hidden lg:flex flex-col gap-6 sticky top-0 h-screen overflow-y-auto"
          style={{ background: "var(--bg)", borderRight: "1px solid var(--border)", padding: "18px 14px" }}
          aria-label="Sidebar navigation"
        >
          {sidebarSlot}
        </aside>

        <div className="flex flex-col min-w-0">
          {/* One header for both: under the phone top bar (top-14, h-12) and
              at the top on desktop (h-14). One line at any width: a long
              account name used to wrap the breadcrumb and push the actions
              over the page, so on phones the root is dropped and the crumb
              truncates. */}
          <header
            className="flex items-center justify-between gap-3 h-12 px-5 sticky top-14 z-10 lg:h-14 lg:px-7 lg:top-0"
            style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}
          >
            <div className="min-w-0 flex-1 truncate whitespace-nowrap text-[13px]" style={{ color: "var(--fg-3)" }}>
              {breadcrumbRoot ? (
                <span className="hidden sm:inline">
                  <Link
                    href={breadcrumbRoot.href}
                    className="hover:underline"
                    style={{ color: "var(--fg-3)", textDecoration: "none" }}
                  >
                    {breadcrumbRoot.label}
                  </Link>
                  <span className="mx-1.5" style={{ color: "var(--fg-4)" }}>/</span>
                </span>
              ) : null}
              <span className="font-medium" style={{ color: "var(--ink)" }}>{crumb}</span>
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
          </header>
          <main className="flex flex-col gap-5 p-4 lg:p-7 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
