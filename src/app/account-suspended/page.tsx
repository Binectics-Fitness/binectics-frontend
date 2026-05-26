import Link from "next/link";
import { BinecticsMark } from "@/components/BinecticsLogo";

export default function AccountSuspendedPage() {
  return (
    <div
      className="min-h-screen grid place-items-center p-8"
      style={{ background: "var(--bg-2)", fontFamily: "var(--font-sans)" }}
    >
      <div
        className="w-full"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-3)",
          maxWidth: 480,
          padding: "48px 40px",
        }}
      >
        {/* Brand mark */}
        <div className="flex justify-center" style={{ marginBottom: 24 }}>
          <BinecticsMark size={28} className="text-(--ink)" />
        </div>

        {/* Danger icon */}
        <div
          className="flex items-center justify-center mx-auto"
          style={{
            width: 56,
            height: 56,
            marginBottom: 18,
            borderRadius: "50%",
            background: "var(--danger-soft)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--danger)"
            strokeWidth={1.8}
            style={{ width: 22, height: 22 }}
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v6M12 17h.01" />
          </svg>
        </div>

        {/* Eyebrow */}
        <div
          className="flex items-center justify-center"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--danger)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 16,
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              background: "var(--danger)",
              borderRadius: "50%",
            }}
          />
          Suspended &middot; ToS violation
        </div>

        {/* Heading */}
        <h1
          className="text-center"
          style={{
            fontSize: 30,
            letterSpacing: "-0.024em",
            fontWeight: 500,
            color: "var(--ink)",
            lineHeight: 1.15,
            marginBottom: 14,
          }}
        >
          Your account is{" "}
          <em
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontWeight: 400,
            }}
          >
            suspended
          </em>
          .
        </h1>

        {/* Description */}
        <p
          className="text-center mx-auto"
          style={{
            fontSize: 15,
            color: "var(--fg-2)",
            lineHeight: 1.55,
            marginBottom: 0,
            maxWidth: "38ch",
          }}
        >
          A human on our trust team reviewed your account on May 24 and found
          multiple chargeback disputes from the same payment method. You can
          appeal — most appeals resolve within 5 business days.
        </p>

        {/* Detail rows */}
        <div
          className="flex flex-col"
          style={{
            marginTop: 0,
            gap: 4,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--fg-3)",
          }}
        >
          <div
            className="flex flex-col"
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid var(--border)",
              gap: 4,
            }}
          >
            <div
              className="flex justify-between"
              style={{ padding: "4px 0" }}
            >
              <span>Reason</span>
              <strong
                style={{
                  color: "var(--ink)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 12.5,
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                }}
              >
                Payment dispute pattern (4+ chargebacks)
              </strong>
            </div>
            <div
              className="flex justify-between"
              style={{ padding: "4px 0" }}
            >
              <span>Suspended</span>
              <strong
                style={{
                  color: "var(--ink)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 12.5,
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                }}
              >
                24 May 2026 &middot; 14:32
              </strong>
            </div>
            <div
              className="flex justify-between"
              style={{ padding: "4px 0" }}
            >
              <span>Reviewer</span>
              <strong
                style={{
                  color: "var(--ink)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 12.5,
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                }}
              >
                Trust team (Andile K.)
              </strong>
            </div>
            <div
              className="flex justify-between"
              style={{ padding: "4px 0" }}
            >
              <span>Appeal window</span>
              <strong
                style={{
                  color: "var(--ink)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 12.5,
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                }}
              >
                30 days remaining
              </strong>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex flex-col"
          style={{ marginTop: 24, gap: 10 }}
        >
          <button
            className="btn-primary-v2"
            style={{
              width: "100%",
              height: 42,
              justifyContent: "center",
              background: "var(--danger)",
            }}
          >
            Submit an appeal
          </button>
          <Link
            href="/help"
            className="btn-ghost-v2"
            style={{
              width: "100%",
              height: 42,
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            Read the policy
          </Link>
        </div>
      </div>
    </div>
  );
}
