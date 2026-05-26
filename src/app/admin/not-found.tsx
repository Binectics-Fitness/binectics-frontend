import Link from "next/link";
import { BinecticsMark } from "@/components/BinecticsLogo";

export default function AdminNotFound() {
  return (
    <div
      className="min-h-screen grid place-items-center p-8"
      style={{ background: "var(--bg)", fontFamily: "var(--font-sans)" }}
    >
      <div
        className="w-full text-center"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-3)",
          maxWidth: 480,
          padding: "clamp(32px, 6vw, 48px) clamp(20px, 5vw, 40px)",
        }}
      >
        {/* Brand mark */}
        <div className="flex justify-center" style={{ marginBottom: 24 }}>
          <BinecticsMark size={28} className="text-(--ink)" />
        </div>

        {/* Eyebrow */}
        <div className="eyebrow" style={{ marginBottom: 16 }}>
          404
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: 28,
            letterSpacing: "-0.025em",
            fontWeight: 500,
            color: "var(--ink)",
            lineHeight: 1.15,
            marginBottom: 12,
          }}
        >
          Page not found.
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: 15,
            color: "var(--fg-2)",
            lineHeight: 1.55,
            marginBottom: 28,
            maxWidth: "36ch",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          This admin page doesn&apos;t exist or may have been moved.
        </p>

        {/* Action */}
        <Link
          href="/admin/dashboard"
          className="btn-primary-v2"
          style={{ height: 36, padding: "0 16px" }}
        >
          Back to admin
        </Link>
      </div>
    </div>
  );
}
