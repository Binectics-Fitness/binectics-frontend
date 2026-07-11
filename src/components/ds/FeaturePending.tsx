import Link from "next/link";

/**
 * Honest pending state for features that don't have a backend yet —
 * replaces fabricated demo data (fake fraud cases, invented payments…)
 * with the truth. Policy: wire what has a backend; never fabricate.
 */
export function FeaturePending({
  title,
  subtitle,
  pendingTitle,
  pendingBody,
  cta,
}: {
  /** Page H1. */
  title: string;
  /** One-liner under the H1. */
  subtitle: string;
  /** Heading inside the pending card. */
  pendingTitle: string;
  /** Honest description: what will appear here, and what it's waiting on. */
  pendingBody: string;
  /** Optional escape hatch to something that exists today. */
  cta?: { href: string; label: string };
}) {
  return (
    <>
      <div>
        <h1
          className="text-[30px] font-medium"
          style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}
        >
          {title}
        </h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          {subtitle}
        </div>
      </div>
      <div
        className="rounded-(--r-3) flex flex-col items-center text-center px-6 py-14 mt-4"
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{ background: "var(--bg-2)", color: "var(--fg-3)" }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>
        <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>
          {pendingTitle}
        </h2>
        <p
          className="text-[13.5px] mt-2 max-w-[460px] leading-relaxed"
          style={{ color: "var(--fg-3)" }}
        >
          {pendingBody}
        </p>
        {cta && (
          <Link
            href={cta.href}
            className="btn-ghost-v2 sm mt-5"
            style={{ textDecoration: "none" }}
          >
            {cta.label}
          </Link>
        )}
      </div>
    </>
  );
}
