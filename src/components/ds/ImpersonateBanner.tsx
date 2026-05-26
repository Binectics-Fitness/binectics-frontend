"use client";

interface ImpersonateBannerProps {
  userName: string;
  adminName: string;
  startedAt: string;
  timeRemaining: string;
  onEndSession?: () => void;
}

export function ImpersonateBanner({
  userName,
  adminName,
  startedAt,
  timeRemaining,
  onEndSession,
}: ImpersonateBannerProps) {
  return (
    <div
      style={{
        background: "oklch(0.96 0.06 75)",
        border: "1px solid oklch(0.88 0.07 75)",
        borderRadius: 12,
        padding: "14px 18px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="oklch(0.45 0.16 75)"
          strokeWidth="1.6"
        >
          <path d="M12 8v4M12 16h.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
        <div>
          <strong
            style={{ fontSize: 13.5, color: "oklch(0.32 0.16 75)" }}
          >
            Impersonating {userName} &middot; read-only
          </strong>
          <div
            className="font-mono"
            style={{
              fontSize: 11,
              color: "oklch(0.42 0.16 75)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginTop: 3,
            }}
          >
            Started {startedAt} by {adminName} &middot; audit logged &middot;
            session {timeRemaining} remaining
          </div>
        </div>
      </div>
      <button
        onClick={onEndSession}
        style={{
          background: "var(--danger)",
          color: "oklch(0.98 0 0)",
          padding: "8px 14px",
          borderRadius: 6,
          border: 0,
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        End session
      </button>
    </div>
  );
}
