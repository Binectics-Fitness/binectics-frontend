"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { NAV_ENTRIES, type DropdownEntry } from "@/lib/constants/navigation";
import { NavDropdown } from "./NavDropdown";
import { NavAvatarMenu } from "./NavAvatarMenu";
import { UnifiedMobileNav } from "./UnifiedMobileNav";

function isActiveLink(pathname: string, href: string) {
  if (href.startsWith("/#") || href.startsWith("#")) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function isDropdownActive(pathname: string, entry: DropdownEntry) {
  return entry.groups.some((g) =>
    g.items.some((item) => isActiveLink(pathname, item.href)),
  );
}

export default function UnifiedNavbar() {
  const { user } = useAuth();
  const pathname = usePathname() ?? "/";

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "oklch(0.985 0.005 85 / 0.92)",
        backdropFilter: "blur(12px) saturate(140%)",
        WebkitBackdropFilter: "blur(12px) saturate(140%)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-360 items-center justify-between px-5 sm:px-10">
        {/* Logo */}
        <Link href="/" className="shrink-0 focus:outline-none">
          <BinecticsLockup />
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden lg:flex items-center gap-0.5"
          aria-label="Main navigation"
        >
          {NAV_ENTRIES.map((entry) => {
            if (entry.kind === "link") {
              const active = isActiveLink(pathname, entry.href);
              return (
                <Link
                  key={entry.label}
                  href={entry.href}
                  className="px-3 py-2 rounded-(--r-2) text-[14px] transition-colors"
                  style={{
                    color: active ? "var(--ink)" : "var(--fg-2)",
                    fontWeight: active ? 600 : 500,
                    letterSpacing: "-0.005em",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.color = "var(--ink)";
                      e.currentTarget.style.background = "var(--bg-2)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.color = "var(--fg-2)";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {entry.label}
                </Link>
              );
            }

            const active = isDropdownActive(pathname, entry);
            return (
              <NavDropdown
                key={entry.label}
                label={entry.label}
                active={active}
                align={entry.align}
              >
                <div
                  className="p-2"
                  style={{
                    width: entry.width,
                    display: "grid",
                    gridTemplateColumns: `repeat(${entry.columns}, 1fr)`,
                  }}
                >
                  {entry.groups.map((group) => (
                    <div
                      key={group.title || "default"}
                      className={entry.columns > 1 ? "p-1" : ""}
                    >
                      {group.title && (
                        <div
                          className="px-3 py-2 font-mono text-[10.5px] uppercase"
                          style={{
                            letterSpacing: "0.06em",
                            color: "var(--fg-3)",
                          }}
                        >
                          {group.title}
                        </div>
                      )}
                      {group.items.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="flex items-start gap-3 rounded-(--r-2) px-3 py-2.5 transition-colors"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--bg-2)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <item.icon
                            className="h-[18px] w-[18px] shrink-0 mt-0.5"
                            style={{ color: "var(--fg-3)" }}
                            aria-hidden="true"
                          />
                          <div>
                            <div
                              className="text-[14px] font-medium"
                              style={{ color: "var(--ink)" }}
                            >
                              {item.label}
                            </div>
                            <div
                              className="text-[13px]"
                              style={{ color: "var(--fg-3)" }}
                            >
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </NavDropdown>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden lg:block">
              <NavAvatarMenu />
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden lg:inline-flex h-9 items-center px-3 rounded-(--r-2) text-[14px] font-medium transition-colors"
                style={{
                  color: "var(--fg-2)",
                  letterSpacing: "-0.005em",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--ink)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--fg-2)";
                }}
              >
                Log in
              </Link>
              <Link
                href="/login?mode=signup"
                prefetch={false}
                className="hidden lg:inline-flex h-9 items-center px-4 rounded-(--r-2) text-[14px] font-medium transition-colors"
                style={{
                  background: "var(--ink)",
                  color: "var(--bg)",
                  letterSpacing: "-0.005em",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "oklch(0.08 0.008 80)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "var(--ink)")
                }
              >
                Start free
              </Link>
            </>
          )}
          <UnifiedMobileNav />
        </div>
      </div>
    </header>
  );
}
