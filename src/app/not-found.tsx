import Link from "next/link";
import { BinecticsMark } from "@/components/BinecticsLogo";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";

export default function NotFound() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      <section
        className="mx-auto max-w-360 px-5 sm:px-10 flex flex-col items-center justify-center text-center"
        style={{ minHeight: "calc(100vh - 64px - 200px)", paddingTop: 80, paddingBottom: 80 }}
      >
        {/* Brand mark */}
        <div className="flex justify-center" style={{ marginBottom: 28 }}>
          <BinecticsMark size={32} className="text-(--ink)" />
        </div>

        {/* Eyebrow */}
        <div
          className="eyebrow"
          style={{ marginBottom: 16 }}
        >
          404
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: 44,
            letterSpacing: "-0.035em",
            fontWeight: 500,
            color: "var(--ink)",
            lineHeight: 1.05,
            marginBottom: 14,
          }}
        >
          Page not found.
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: 16,
            color: "var(--fg-2)",
            lineHeight: 1.55,
            marginBottom: 32,
            maxWidth: "40ch",
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist, or it may have
          been moved.
        </p>

        {/* Actions */}
        <Link
          href="/"
          className="btn-primary-v2"
          style={{ height: 38, padding: "0 20px" }}
        >
          Back to home
        </Link>
      </section>

      <MarketingFooter />
    </div>
  );
}
