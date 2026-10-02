import type { ReactNode } from "react";
import { BinecticsMark } from "@/components/BinecticsLogo";

type Tone = "danger" | "warn" | "neutral";

// Dot colour per tone. The eyebrow text uses it too, except for warn: the
// amber token is too light for 11px text on white, so that text stays fg-2.
const TONE_DOT: Record<Tone, string> = {
  danger: "var(--danger)",
  warn: "var(--warn)",
  neutral: "var(--fg-3)",
};
const TONE_TEXT: Record<Tone, string> = {
  danger: "var(--danger)",
  warn: "var(--fg-2)",
  neutral: "var(--fg-3)",
};

export interface AccountStateRow {
  label: string;
  value: ReactNode;
}

interface AccountStatePanelProps {
  tone: Tone;
  eyebrow: string;
  /** The heading; pass an <em> for the one serif-italic word. */
  title: ReactNode;
  description: ReactNode;
  /** Facts the API actually gave us. Omitted rows are simply not shown. */
  rows?: AccountStateRow[];
  /** Countdowns and the like, between the description and the actions. */
  children?: ReactNode;
  actions: ReactNode;
}

/**
 * The centred card shared by the account-state pages (suspended, locked,
 * deleted, session expired, rate limited). Plain text only: every value is
 * rendered as a React text node, never as HTML.
 */
export default function AccountStatePanel({
  tone,
  eyebrow,
  title,
  description,
  rows = [],
  children,
  actions,
}: AccountStatePanelProps) {
  const dot = TONE_DOT[tone];
  const text = TONE_TEXT[tone];
  return (
    <div
      className="min-h-screen grid place-items-center"
      style={{
        background: "var(--bg-2)",
        fontFamily: "var(--font-sans)",
        padding: "32px 16px",
      }}
    >
      <main
        className="w-full text-center"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-3)",
          maxWidth: 540,
          padding: "clamp(32px, 6vw, 56px) clamp(20px, 5vw, 48px)",
        }}
      >
        <div className="flex justify-center" style={{ marginBottom: 28 }}>
          <BinecticsMark size={32} className="text-(--ink)" />
        </div>

        <div
          className="inline-flex items-center justify-center"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: text,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 14,
            gap: 6,
          }}
        >
          <span
            aria-hidden="true"
            style={{ width: 6, height: 6, background: dot, borderRadius: "50%" }}
          />
          {eyebrow}
        </div>

        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 36px)",
            letterSpacing: "-0.028em",
            fontWeight: 500,
            color: "var(--ink)",
            lineHeight: 1.1,
            marginBottom: 14,
          }}
        >
          {title}
        </h1>

        <p
          style={{
            fontSize: 16,
            color: "var(--fg-2)",
            lineHeight: 1.55,
            margin: "0 auto 28px",
            maxWidth: "40ch",
          }}
        >
          {description}
        </p>

        {children}

        <div className="flex gap-2 justify-center flex-wrap">{actions}</div>

        {rows.length > 0 && (
          <dl
            style={{
              marginTop: 28,
              paddingTop: 22,
              borderTop: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              textAlign: "left",
            }}
          >
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex justify-between"
                style={{
                  gap: 16,
                  fontFamily: "var(--font-mono)",
                  fontSize: 11.5,
                  color: "var(--fg-3)",
                  padding: "4px 0",
                }}
              >
                <dt style={{ flexShrink: 0 }}>{row.label}</dt>
                <dd
                  style={{
                    margin: 0,
                    color: "var(--ink)",
                    fontFamily: "var(--font-sans)",
                    fontSize: 13,
                    fontWeight: 500,
                    letterSpacing: "-0.005em",
                    textAlign: "right",
                    overflowWrap: "anywhere",
                    whiteSpace: "pre-line",
                  }}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </main>
    </div>
  );
}

/** The serif-italic accent word used in each page's heading. */
export function Accent({ children }: { children: ReactNode }) {
  return (
    <em style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400 }}>
      {children}
    </em>
  );
}

/** Mono countdown shown under the description. */
export function Countdown({ label, value }: { label: string; value: string }) {
  return (
    <div
      role="timer"
      aria-label={label}
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 32,
        color: "var(--ink)",
        margin: "-10px 0 28px",
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "0.04em",
      }}
    >
      {value}
    </div>
  );
}
