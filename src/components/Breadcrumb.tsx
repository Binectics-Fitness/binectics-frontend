"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from path if not provided
  const breadcrumbs =
    items ||
    (() => {
      const segments = pathname.split("/").filter(Boolean);
      const crumbs: BreadcrumbItem[] = [
        { label: "Dashboard", href: "/dashboard" },
      ];

      let currentPath = "";
      segments.forEach((segment) => {
        currentPath += `/${segment}`;

        // Skip IDs (UUIDs or MongoDB ObjectIds)
        if (
          segment.match(/^[a-f0-9]{24}$/i) ||
          segment.match(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
          )
        ) {
          return;
        }

        // Capitalize and format segment
        const label = segment
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        crumbs.push({
          label,
          href: currentPath,
        });
      });

      return crumbs;
    })();

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={crumb.href} className="flex items-center gap-2">
              {index > 0 && (
                <svg
                  className="h-4 w-4 text-foreground-tertiary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
              {isLast ? (
                <span className="font-medium text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-foreground-secondary hover:text-accent-blue-500 transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
