"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ShellAccountMenu } from "@/components/ds/ShellAccountMenu";
import { ShellNotificationBell } from "@/components/ds/ShellNotificationBell";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { openCommandBar } from "@/hooks/useCommandBar";
import { useNavDrawer } from "@/lib/ui/useNavDrawer";
import { useMessagingUnread } from "@/components/messaging/queries";
import { useWorkspaceSwitch } from "@/hooks/useWorkspaceSwitch";

/* ── Lucide-style icon wrapper ── */
function I({ children, d }: { children?: React.ReactNode; d?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {d ? <path d={d} /> : children}
    </svg>
  );
}

/* ── Nav items ──
 * Billing is here so a member can find auto-renew, cards and Renew without
 * going through Settings (discoverability F8). */
export const MEMBER_NAV_LINKS = [
  { label: "Home",        href: "/dashboard/member" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Saved",       href: "/dashboard/saved-providers" },
  { label: "Bookings",    href: "/dashboard/bookings" },
  { label: "Messages",    href: "/dashboard/messages" },
  { label: "Meal plans",  href: "/dashboard/member/meal-plans" },
  { label: "Activity",    href: "/dashboard/member/streaks" },
  { label: "Reports",     href: "/dashboard/member/reports" },
  { label: "Requests",    href: "/dashboard/member/requests" },
  { label: "Billing",     href: "/dashboard/member/billing" },
];

/**
 * Whether a nav link is the current page: the page names its label, and a
 * page that names none (activeLabel "") is matched by its address.
 */
export function isMemberNavActive(
  link: { label: string; href: string },
  activeLabel: string,
  pathname: string | null,
): boolean {
  if (activeLabel) return link.label === activeLabel;
  return !!pathname && pathname.replace(/\/$/, "") === link.href;
}

/* ── Unread count on the Messages link ── */
function NavCount({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="ml-1.5 inline-block rounded-full px-1.5 font-mono text-[11px] tabular-nums"
      style={{ background: "var(--ink)", color: "var(--bg)" }}
    >
      {count > 99 ? "99+" : count}
      <span className="sr-only"> unread</span>
    </span>
  );
}

/* ── Props ── */
interface MemberDashboardShellProps {
  activeLabel: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

/* ── Component ── */
export function MemberDashboardShell({ activeLabel, children, actions }: MemberDashboardShellProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const unreadMessages = useMessagingUnread();
  // A gym's staff reach the gym's dashboard from here (F1).
  const workspaceLink = useWorkspaceSwitch(false);
  const memberInitials =
    `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() || "··";
  // Phone menu: a modal dialog (focus trap, Escape, inert page, scroll lock),
  // closed on navigation and once the lg top nav takes over. Eight links
  // don't fit a tablet row (768px overflowed by ~80px), so tablets get the
  // phone bar and its menu too.
  const {
    open: mobileOpen,
    show: openMobileMenu,
    close: closeMobileMenu,
    triggerRef: mobileTriggerRef,
    overlayRef: mobileOverlayRef,
    panelRef: mobilePanelRef,
  } = useNavDrawer("(min-width: 64rem)");
  const setMobileOpen = (next: boolean) => (next ? openMobileMenu() : closeMobileMenu());

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-2)" }}>
      {/* ── Desktop top nav (lg and up) ── */}
      <header
        className="sticky top-0 z-50 hidden lg:block"
        style={{
          background: "oklch(0.985 0.005 85 / 0.85)",
          backdropFilter: "blur(8px) saturate(140%)",
          WebkitBackdropFilter: "blur(8px) saturate(140%)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          className="flex items-center justify-between mx-auto"
          style={{ height: 56, maxWidth: 1440, padding: "0 32px" }}
        >
          {/* Left — brand */}
          <Link href="/" className="shrink-0">
            <BinecticsLockup />
          </Link>

          {/* Center — nav links */}
          <nav className="flex items-center" style={{ gap: 4 }} aria-label="Main navigation">
            {MEMBER_NAV_LINKS.map((link) => {
              const isActive = isMemberNavActive(link, activeLabel, pathname);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  // Ten links share the row from 1024px: no wrapping, and a
                  // little less padding until xl.
                  className={`whitespace-nowrap rounded-(--r-2) px-2 py-1.5 text-[13.5px] xl:px-2.5 ${isActive ? "font-medium" : ""}`}
                  style={{
                    color: isActive ? "var(--ink)" : "var(--fg-2)",
                    background: isActive ? "var(--bg-3)" : undefined,
                    letterSpacing: "-0.005em",
                    transition: `background var(--motion-fast), color var(--motion-fast)`,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "var(--bg-2)";
                      e.currentTarget.style.color = "var(--ink)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--fg-2)";
                    }
                  }}
                >
                  {link.label}
                  {link.href === "/dashboard/messages" && <NavCount count={unreadMessages} />}
                </Link>
              );
            })}
          </nav>

          {/* Right — actions */}
          <div className="flex items-center" style={{ gap: 8 }}>
            {/* Search — opens the global command bar (also ⌘K / Ctrl-K) */}
            <button
              type="button"
              onClick={() => openCommandBar()}
              className="flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                border: "1px solid var(--border)",
                borderRadius: "var(--r-2)",
                background: "var(--bg)",
                color: "var(--fg-2)",
                cursor: "pointer",
              }}
              aria-label="Search"
              title="Search (⌘K)"
            >
              <I>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </I>
            </button>

            {/* Notifications — links to the inbox with a live unread count */}
            <ShellNotificationBell />

            {/* Avatar — opens the account menu (profile / settings / log out) */}
            <ShellAccountMenu
              direction="down"
              workspaceLink={workspaceLink}
              trigger={
                <span
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "var(--bg-3)",
                    color: "var(--fg-2)",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {memberInitials}
                </span>
              }
            />
          </div>
        </div>
      </header>

      {/* ── Phone + tablet top bar ── */}
      <header
        className="lg:hidden sticky top-0 z-50 flex items-center justify-between"
        style={{
          height: 56,
          padding: "0 16px",
          background: "oklch(0.985 0.005 85 / 0.85)",
          backdropFilter: "blur(8px) saturate(140%)",
          WebkitBackdropFilter: "blur(8px) saturate(140%)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Left — brand */}
        <Link href="/" className="shrink-0">
          <BinecticsLockup markSize={20} />
        </Link>

        {/* Right — bell + avatar + hamburger */}
        <div className="flex items-center" style={{ gap: 8 }}>
          <ShellNotificationBell />
          <Link
            href="/dashboard/settings"
            className="flex items-center justify-center shrink-0"
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "var(--bg-3)",
              color: "var(--fg-2)",
              fontSize: 11,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {memberInitials}
          </Link>
          <button
            ref={mobileTriggerRef}
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--r-2)",
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--ink)",
              cursor: "pointer",
            }}
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={mobileOpen}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Mobile dropdown overlay ── */}
      {mobileOpen && (
        <div ref={mobileOverlayRef} className="fixed inset-0 z-50 lg:hidden" style={{ animation: "fade-in var(--motion-base, 220ms) var(--ease, ease-out)" }}>
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "oklch(0.14 0.008 80 / 0.3)" }}
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel — full-screen slide */}
          <div
            ref={mobilePanelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-0 flex flex-col"
            style={{ background: "var(--bg)" }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between" style={{ height: 56, padding: "0 16px", borderBottom: "1px solid var(--border)" }}>
              <Link href="/" onClick={() => setMobileOpen(false)} className="shrink-0">
                <BinecticsLockup markSize={20} />
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--r-2)",
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--fg-2)",
                  cursor: "pointer",
                }}
                aria-label="Close menu"
                data-autofocus
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col px-5 pt-6" style={{ gap: 4 }} aria-label="Mobile navigation">
              {MEMBER_NAV_LINKS.map((link) => {
                const isActive = isMemberNavActive(link, activeLabel, pathname);
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center rounded-(--r-2) text-[16px] ${isActive ? "font-medium" : ""}`}
                    style={{
                      height: 48,
                      padding: "0 12px",
                      color: isActive ? "var(--ink)" : "var(--fg-2)",
                      background: isActive ? "var(--bg-3)" : undefined,
                    }}
                  >
                    {link.label}
                    {link.href === "/dashboard/messages" && <NavCount count={unreadMessages} />}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom utility links */}
            <div className="mt-auto px-5 pb-8 flex flex-col" style={{ gap: 4, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              {workspaceLink && (
                <Link
                  href={workspaceLink.href}
                  onClick={() => {
                    workspaceLink.onSelect?.();
                    setMobileOpen(false);
                  }}
                  className="flex items-center rounded-(--r-2) text-[16px]"
                  style={{ height: 48, padding: "0 12px", color: "var(--fg-2)" }}
                >
                  {workspaceLink.label}
                </Link>
              )}
              <Link
                href="/dashboard/notifications"
                onClick={() => setMobileOpen(false)}
                className="flex items-center rounded-(--r-2) text-[16px]"
                style={{ height: 48, padding: "0 12px", color: "var(--fg-2)" }}
              >
                Notifications
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center rounded-(--r-2) text-[16px]"
                style={{ height: 48, padding: "0 12px", color: "var(--fg-2)" }}
              >
                Settings
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  void logout();
                }}
                className="flex items-center rounded-(--r-2) text-[16px]"
                style={{ height: 48, padding: "0 12px", color: "var(--danger)", background: "none", border: "none", textAlign: "left" }}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content area ── */}
      <main
        className="mx-auto flex flex-col flex-1"
        style={{ maxWidth: 1100, padding: 28 }}
      >
        {actions && (
          <div className="flex justify-end mb-4" style={{ gap: 8 }}>
            {actions}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
