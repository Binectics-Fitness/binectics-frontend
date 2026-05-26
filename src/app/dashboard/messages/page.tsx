"use client";

import { useState, useEffect, useRef } from "react";
import { BinecticsLockup } from "@/components/BinecticsLogo";

/* ================================================================
   Design tokens (CSS custom-property references)
   All values come from globals.css — used via inline style objects.
   ================================================================ */

/* ── Types ─────────────────────────────────────────────────────── */

type TagVariant = "client" | "lead" | "urgent" | "gym" | "default";

interface ConvTag {
  label: string;
  variant: TagVariant;
}

interface Conversation {
  id: string;
  initials: string;
  name: string;
  timestamp: string;
  preview: string;
  unread: boolean;
  tags: ConvTag[];
  /** custom avatar bg / fg override (for gym etc.) */
  avatarBg?: string;
  avatarColor?: string;
}

interface Message {
  id: string;
  from: "in" | "out";
  initials: string;
  name: string;
  time: string;
  body?: string;
  /** image attachment placeholder */
  imageAtt?: boolean;
  /** file attachment */
  fileAtt?: { name: string; type: string; size: string };
}

interface SharedFile {
  name: string;
  meta: string;
  icon: "doc" | "video" | "image";
}

/* ── Hardcoded data ────────────────────────────────────────────── */

const CONVERSATIONS: Conversation[] = [
  {
    id: "aisha",
    initials: "AA",
    name: "Aisha Adams",
    timestamp: "28m",
    preview:
      "Quick Q on today’s programming — should I do the front squats at the same RPE…",
    unread: true,
    tags: [
      { label: "Client", variant: "client" },
      { label: "Programming", variant: "default" },
    ],
  },
  {
    id: "nthabi",
    initials: "NK",
    name: "Nthabiseng Khumalo",
    timestamp: "3m",
    preview:
      "Hi Sarah — would Tuesday at 7 work for a first consult? Heard great things from Linda.",
    unread: true,
    tags: [
      { label: "Lead", variant: "lead" },
      { label: "Reply within 1h", variant: "urgent" },
    ],
  },
  {
    id: "rashid",
    initials: "RJ",
    name: "Rashid Jansen",
    timestamp: "1h",
    preview: "Booked 8 sessions — looking forward. PAR-Q form attached.",
    unread: true,
    tags: [
      { label: "Client", variant: "client" },
      { label: "Onboarding", variant: "default" },
    ],
  },
  {
    id: "wei",
    initials: "WC",
    name: "Wei Chen",
    timestamp: "3h",
    preview:
      "Snatch felt off today, attached the slo-mo. Bar drifting forward in the third pull.",
    unread: true,
    tags: [
      { label: "Client", variant: "client" },
      { label: "Technique", variant: "default" },
    ],
  },
  {
    id: "linda",
    initials: "LM",
    name: "Linda Mokoena",
    timestamp: "Yesterday",
    preview: "PR’d squat at 92.5! Thank you 🙌 Will send vid tonight",
    unread: false,
    tags: [{ label: "Client", variant: "client" }],
  },
  {
    id: "ironlab",
    initials: "IL",
    name: "Iron Lab Sea Point",
    timestamp: "Mon",
    preview:
      "Coach roster for the long weekend — please confirm by Friday 5pm.",
    unread: false,
    tags: [
      { label: "Gym", variant: "gym" },
      { label: "Scheduling", variant: "default" },
    ],
    avatarBg: "var(--gym)",
    avatarColor: "oklch(0.95 0 0)",
  },
  {
    id: "thandi",
    initials: "TN",
    name: "Thandi Nkosi",
    timestamp: "Mon",
    preview:
      "Rescheduling Friday’s session to next Tuesday — childcare conflict 🙏",
    unread: false,
    tags: [
      { label: "Client", variant: "client" },
      { label: "Scheduling", variant: "default" },
    ],
  },
  {
    id: "mike",
    initials: "MK",
    name: "Mike Khumalo",
    timestamp: "2d",
    preview:
      "Last 2 sessions in the conditioning pack — what’s the next block?",
    unread: false,
    tags: [
      { label: "Client", variant: "client" },
      { label: "Renewal", variant: "default" },
    ],
  },
  {
    id: "jamal",
    initials: "JS",
    name: "Jamal Sutherland",
    timestamp: "3d",
    preview:
      "Excited for our first session — anything I should bring beyond water and shoes?",
    unread: false,
    tags: [
      { label: "Lead", variant: "lead" },
      { label: "Onboarding", variant: "default" },
    ],
  },
];

const THREAD_MESSAGES: Message[] = [
  {
    id: "m1",
    from: "in",
    initials: "AA",
    name: "Aisha",
    time: "09:42 GMT+4",
    body: "Hey Sarah! Did the Friday session. Front squat felt heavy at 50 — bar was sitting weird on my shoulders. Pulled the working sets back to 45.",
  },
  {
    id: "m2",
    from: "in",
    initials: "AA",
    name: "Aisha",
    time: "",
    imageAtt: true,
  },
  {
    id: "m3",
    from: "out",
    initials: "SO",
    name: "You",
    time: "14:18 SAST",
    body: "Good call on backing off. From the video the bar is rolling onto your throat instead of sitting on the shelf — shoulders need to push up into the bar, not down. Try this: take your stance and elbows up before you unrack.\n\nStick with 45 this week. Want to see one more clean session before we add weight.",
  },
  {
    id: "m4",
    from: "out",
    initials: "SO",
    name: "You",
    time: "",
    body: "Also — sent you the updated week 7 plan. Has a back squat day to give the front squat a break.",
    fileAtt: {
      name: "aisha-week-07-strength.pdf",
      type: "PDF",
      size: "248 KB",
    },
  },
  {
    id: "m5",
    from: "in",
    initials: "AA",
    name: "Aisha",
    time: "11:02 GMT+4",
    body: "Quick Q on today’s programming — should I do the front squats at the same RPE I had on the back squat last week, or build up by feel? Want to make sure I’m not just chasing the same weight.",
  },
];

const QUICK_REPLIES = [
  "RPE 7 today · save the gas for Friday",
  "Build by feel, stop at the first ugly rep",
  "Send a video of the working set",
  "Let’s talk it through on the call",
];

const SHARED_FILES: SharedFile[] = [
  { name: "aisha-week-07-strength.pdf", meta: "17 May · 248 KB", icon: "doc" },
  {
    name: "front-squat-fri.mov",
    meta: "17 May · 4.2 MB · 0:34",
    icon: "video",
  },
  { name: "aisha-week-06-strength.pdf", meta: "10 May · 252 KB", icon: "doc" },
  {
    name: "jan-2026-progress.jpg",
    meta: "12 May · 880 KB",
    icon: "image",
  },
];

const FILTERS = [
  { label: "All", count: "38", active: true },
  { label: "Unread", count: "7", active: false },
  { label: "Clients", count: "29", active: false },
  { label: "Leads", count: "6", active: false },
  { label: "Gym", count: "3", active: false },
];

/* ── Sidebar nav items ─────────────────────────────────────────── */

const SIDE_NAV_WORK = [
  {
    label: "Today",
    href: "/dashboard/trainer",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    label: "Calendar",
    href: "/dashboard/trainer/sessions",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18M8 2v4M16 2v4" />
      </svg>
    ),
  },
  {
    label: "Clients",
    href: "/dashboard/trainer/clients",
    badge: "42",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),
  },
  {
    label: "Inbox",
    href: "/dashboard/messages",
    badge: "7",
    active: true,
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M21 11.5a8.4 8.4 0 0 1-1 4 8.5 8.5 0 0 1-7.5 4.5 8.5 8.5 0 0 1-4-1L3 21l2-5.5a8.5 8.5 0 1 1 16-4z" />
      </svg>
    ),
  },
];

const SIDE_NAV_PRACTICE = [
  {
    label: "Earnings",
    href: "/dashboard/trainer/earnings",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    label: "Packages",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: "My profile",
    href: "/dashboard/trainer/settings",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 9h6v6H9z" />
      </svg>
    ),
  },
];

/* ── Tag color helper ──────────────────────────────────────────── */

function tagStyle(variant: TagVariant): React.CSSProperties {
  const base: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "9.5px",
    padding: "2px 5px",
    borderRadius: "var(--r-1)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    border: "1px solid var(--border)",
    color: "var(--fg-2)",
    background: "var(--bg)",
    lineHeight: 1.4,
  };
  switch (variant) {
    case "urgent":
      return {
        ...base,
        color: "var(--danger)",
        borderColor: "oklch(0.88 0.05 25)",
        background: "var(--danger-soft)",
      };
    case "client":
      return {
        ...base,
        color: "var(--trainer)",
        borderColor: "oklch(0.88 0.05 75)",
        background: "var(--trainer-soft)",
      };
    case "lead":
      return {
        ...base,
        color: "var(--signal-ink)",
        borderColor: "oklch(0.88 0.05 148)",
        background: "var(--signal-soft)",
      };
    case "gym":
      return {
        ...base,
        color: "var(--gym)",
        borderColor: "oklch(0.88 0.04 248)",
        background: "var(--gym-soft)",
      };
    default:
      return base;
  }
}

/* ── Shared SVG icons ──────────────────────────────────────────── */

function IconSearch() {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{ width: 13, height: 13, stroke: "var(--fg-3)", fill: "none", strokeWidth: 1.5 }}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconDoc() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function IconVideo() {
  return (
    <svg viewBox="0 0 24 24">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  );
}

function IconImage() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

function sharedFileIcon(icon: SharedFile["icon"]) {
  switch (icon) {
    case "doc":
      return <IconDoc />;
    case "video":
      return <IconVideo />;
    case "image":
      return <IconImage />;
  }
}

/* ── Inline style objects ──────────────────────────────────────── */

const S = {
  /* Shared mono-label */
  monoLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "10.5px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "var(--fg-3)",
  },
  monoLabelSmall: {
    fontFamily: "var(--font-mono)",
    fontSize: "10.5px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    color: "var(--fg-3)",
  },
  sideLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "10.5px",
    textTransform: "uppercase" as const,
    color: "var(--fg-4)",
    letterSpacing: "0.06em",
    padding: "4px 8px",
    marginBottom: "4px",
  },
  iconBtnSvg: {
    width: 14,
    height: 14,
    strokeWidth: 1.5,
    fill: "none",
    stroke: "currentColor",
  } as React.CSSProperties,
  navSvg: {
    width: 15,
    height: 15,
    strokeWidth: 1.5,
    fill: "none",
    stroke: "currentColor",
    flexShrink: 0,
  } as React.CSSProperties,
};

/* ================================================================
   COMPONENT
   ================================================================ */

export default function MessagesPage() {
  const [activeConv, setActiveConv] = useState("aisha");
  const [activeFilter, setActiveFilter] = useState("All");
  const [readSet, setReadSet] = useState<Set<string>>(new Set());
  const [composerText, setComposerText] = useState("RPE 7 today — ");
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const threadBodyRef = useRef<HTMLDivElement>(null);

  // Scroll thread to bottom on mount + when active conv changes
  useEffect(() => {
    const el = threadBodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeConv]);

  // Set body bg for messages (override dashboard bg-2)
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = "var(--bg)";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.background = prev;
      document.body.style.overflow = "";
    };
  }, []);

  function selectConv(id: string) {
    setActiveConv(id);
    setReadSet((s) => new Set(s).add(id));
    setMobileView("thread");
  }

  function isUnread(c: Conversation) {
    return c.unread && !readSet.has(c.id);
  }

  /* ── Render: Sidebar ───────────────────────────────────────── */

  function renderSidebar() {
    return (
      <aside
        className="hidden lg:flex flex-col"
        style={{
          background: "var(--bg)",
          borderRight: "1px solid var(--border)",
          padding: "18px 14px",
          gap: 24,
          height: "100vh",
          overflowY: "auto",
          width: 232,
          flexShrink: 0,
        }}
      >
        {/* Brand */}
        <div style={{ padding: "4px 6px" }}>
          <BinecticsLockup markSize={22} />
        </div>

        {/* Org switcher */}
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--r-2)",
            padding: "8px 10px",
            background: "var(--bg)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "var(--trainer)",
              color: "oklch(0.2 0.05 75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: 11,
            }}
          >
            SO
          </span>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--ink)",
              }}
            >
              Sarah Okafor
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--fg-3)",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Trainer &middot; Cape Town
            </div>
          </div>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ color: "var(--fg-3)" }}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        {/* Nav: Work */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={S.sideLabel}>Work</div>
          {SIDE_NAV_WORK.map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "7px 8px",
                borderRadius: "var(--r-2)",
                color: item.active ? "var(--ink)" : "var(--fg-2)",
                fontSize: 13.5,
                textDecoration: "none",
                fontWeight: item.active ? 500 : 400,
                background: item.active ? "var(--bg-3)" : "transparent",
              }}
            >
              <span style={S.navSvg}>{item.icon}</span>
              {item.label}
              {item.badge && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: item.active ? "var(--bg)" : "var(--fg-3)",
                    background: item.active ? "var(--ink)" : "var(--bg-2)",
                    padding: "1px 6px",
                    borderRadius: 999,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* Nav: Practice */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={S.sideLabel}>Practice</div>
          {SIDE_NAV_PRACTICE.map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "7px 8px",
                borderRadius: "var(--r-2)",
                color: "var(--fg-2)",
                fontSize: 13.5,
                textDecoration: "none",
              }}
            >
              <span style={S.navSvg}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
    );
  }

  /* ── Render: Inbox list ────────────────────────────────────── */

  function renderInbox() {
    return (
      <aside
        className={`flex flex-col ${mobileView === "list" ? "flex" : "hidden"} md:flex`}
        style={{
          background: "var(--bg-2)",
          borderRight: "1px solid var(--border)",
          height: "100vh",
          width: "100%",
          maxWidth: "100%",
          flexShrink: 0,
        }}
      >
        {/* Head */}
        <div
          style={{
            padding: "18px 18px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                fontSize: 16,
                letterSpacing: "-0.01em",
                fontWeight: 500,
                margin: 0,
                color: "var(--ink)",
              }}
            >
              Inbox
            </h2>
            <button
              style={{
                width: 32,
                height: 32,
                border: "1px solid var(--border)",
                borderRadius: "var(--r-2)",
                background: "var(--bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--fg-2)",
                cursor: "pointer",
              }}
              title="New message"
            >
              <span style={S.iconBtnSvg}>
                <IconPlus />
              </span>
            </button>
          </div>

          {/* Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0 10px",
              height: 30,
              border: "1px solid var(--border)",
              borderRadius: "var(--r-2)",
              background: "var(--bg)",
            }}
          >
            <IconSearch />
            <input
              placeholder="Search messages, names, files…"
              style={{
                flex: 1,
                border: 0,
                background: "transparent",
                fontFamily: "inherit",
                fontSize: 12.5,
                color: "var(--ink)",
                outline: "none",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                padding: "1px 5px",
                border: "1px solid var(--border)",
                borderRadius: 3,
                color: "var(--fg-3)",
              }}
            >
              ⌘ K
            </span>
          </div>
        </div>

        {/* Filter pills */}
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: "12px 18px",
            flexWrap: "wrap",
          }}
        >
          {FILTERS.map((f) => {
            const on = activeFilter === f.label;
            return (
              <button
                key={f.label}
                onClick={() => setActiveFilter(f.label)}
                style={{
                  padding: "4px 9px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  color: on ? "var(--bg)" : "var(--fg-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  border: `1px solid ${on ? "var(--ink)" : "var(--border)"}`,
                  background: on ? "var(--ink)" : "var(--bg)",
                  borderRadius: 999,
                  cursor: "pointer",
                }}
              >
                {f.label}{" "}
                <span
                  style={{
                    color: on ? "oklch(0.75 0.005 85)" : "var(--fg-4)",
                    marginLeft: 4,
                  }}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {CONVERSATIONS.map((c) => {
            const selected = activeConv === c.id;
            const unread = isUnread(c);
            return (
              <div
                key={c.id}
                onClick={() => selectConv(c.id)}
                style={{
                  padding: "12px 18px",
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                  display: "flex",
                  gap: 10,
                  background: selected ? "var(--bg)" : "transparent",
                  position: "relative",
                  transition: `background var(--motion-fast) var(--ease)`,
                }}
              >
                {/* Active indicator */}
                {selected && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 8,
                      bottom: 8,
                      width: 2,
                      background: "var(--ink)",
                      borderRadius: 2,
                    }}
                  />
                )}

                {/* Avatar */}
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: c.avatarBg || "var(--bg-3)",
                    color: c.avatarColor || "var(--fg-2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {c.initials}
                </div>

                {/* Body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      alignItems: "baseline",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 500,
                        color: "var(--ink)",
                        letterSpacing: "-0.005em",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {c.name}
                      {unread && (
                        <span
                          style={{
                            display: "inline-block",
                            width: 6,
                            height: 6,
                            background: "var(--signal)",
                            borderRadius: "50%",
                          }}
                        />
                      )}
                    </div>
                    <div style={S.monoLabelSmall}>{c.timestamp}</div>
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: unread ? "var(--ink)" : "var(--fg-2)",
                      fontWeight: unread ? 500 : 400,
                      marginTop: 3,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      lineHeight: 1.4,
                    }}
                  >
                    {c.preview}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      marginTop: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    {c.tags.map((t, i) => (
                      <span key={i} style={tagStyle(t.variant)}>
                        {t.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    );
  }

  /* ── Render: Thread ────────────────────────────────────────── */

  function renderThread() {
    return (
      <main
        className={`flex-col min-w-0 ${mobileView === "thread" ? "flex" : "hidden"} md:flex`}
        style={{
          height: "100vh",
          background: "var(--bg)",
        }}
      >
        {/* Thread head */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 24px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
            background: "var(--bg)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Mobile back button */}
            <button
              className="md:hidden"
              onClick={() => setMobileView("list")}
              style={{
                width: 32,
                height: 32,
                border: "1px solid var(--border)",
                borderRadius: "var(--r-2)",
                background: "var(--bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--fg-2)",
                cursor: "pointer",
                marginRight: 4,
              }}
              title="Back to inbox"
            >
              <svg
                viewBox="0 0 24 24"
                style={{ width: 14, height: 14, strokeWidth: 1.5, fill: "none", stroke: "currentColor" }}
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>

            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--bg-3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--fg-2)",
                flexShrink: 0,
              }}
            >
              AA
            </div>
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                  color: "var(--ink)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                Aisha Adams
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    padding: "2px 7px",
                    borderRadius: 999,
                    background: "var(--signal-soft)",
                    color: "var(--signal-ink)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    fontWeight: 400,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      background: "var(--signal)",
                      borderRadius: "50%",
                    }}
                  />
                  Active client &middot; online monthly
                </span>
              </div>
              <div
                className="hidden sm:block"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--fg-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginTop: 2,
                }}
              >
                Last active 4m ago &middot; Dubai (GMT+4) &middot; session today 11:30
              </div>
            </div>
          </div>

          {/* Thread action buttons */}
          <div className="hidden sm:flex" style={{ gap: 6, alignItems: "center" }}>
            {[
              {
                title: "Open client",
                icon: (
                  <>
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21a8 8 0 0 1 16 0" />
                  </>
                ),
              },
              {
                title: "Book session",
                icon: (
                  <>
                    <rect x="3" y="4" width="18" height="17" rx="2" />
                    <path d="M3 9h18M8 2v4M16 2v4" />
                  </>
                ),
              },
              {
                title: "Mute",
                icon: (
                  <>
                    <path d="M11 5L6 9H2v6h4l5 4z" />
                    <path d="M23 9l-6 6M17 9l6 6" />
                  </>
                ),
              },
              {
                title: "More",
                icon: (
                  <>
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                    <circle cx="5" cy="12" r="2" />
                  </>
                ),
              },
            ].map((btn) => (
              <button
                key={btn.title}
                title={btn.title}
                style={{
                  width: 32,
                  height: 32,
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-2)",
                  background: "var(--bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--fg-2)",
                  cursor: "pointer",
                }}
              >
                <svg viewBox="0 0 24 24" style={S.iconBtnSvg}>
                  {btn.icon}
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Thread body — messages */}
        <div
          ref={threadBodyRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Date divider: Sunday */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "10px 0 4px",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={S.monoLabel}>Sunday &middot; 17 May</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* Messages — first group (Sunday) */}
          {THREAD_MESSAGES.slice(0, 4).map((msg) => renderMessage(msg))}

          {/* Date divider: Today */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "10px 0 4px",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={S.monoLabel}>Today &middot; Mon 18 May</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* Messages — today */}
          {THREAD_MESSAGES.slice(4).map((msg) => renderMessage(msg))}
        </div>

        {/* Quick replies */}
        <div
          style={{
            padding: "8px 24px",
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            borderTop: "1px solid var(--border)",
            background: "var(--bg-2)",
          }}
        >
          {QUICK_REPLIES.map((qr, i) => (
            <button
              key={i}
              onClick={() => setComposerText(qr)}
              style={{
                padding: "6px 12px",
                fontSize: 12.5,
                color: "var(--fg-2)",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 999,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: `border-color var(--motion-fast) var(--ease)`,
              }}
            >
              {qr}
            </button>
          ))}
        </div>

        {/* Composer */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "14px 24px 16px",
            flexShrink: 0,
            background: "var(--bg)",
          }}
        >
          <div
            style={{
              border: "1px solid var(--border-2)",
              borderRadius: "var(--r-3)",
              background: "var(--bg)",
              padding: "10px 12px 8px",
            }}
          >
            <textarea
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              placeholder="Reply to Aisha…"
              style={{
                width: "100%",
                border: 0,
                outline: "none",
                fontFamily: "inherit",
                fontSize: 14,
                color: "var(--ink)",
                background: "transparent",
                resize: "none",
                lineHeight: 1.5,
                minHeight: 44,
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 6,
              }}
            >
              <div style={{ display: "flex", gap: 4 }}>
                {[
                  {
                    title: "Attach file",
                    path: "M21.4 11l-9.2 9.2a6 6 0 0 1-8.4-8.4l9.2-9.2a4 4 0 0 1 5.6 5.6l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5",
                  },
                  {
                    title: "Insert plan template",
                    paths: [
                      "M3,3 h18 a2,2 0 0,1 2,2 v14 a2,2 0 0,1 -2,2 h-18 a2,2 0 0,1 -2,-2 v-14 a2,2 0 0,1 2,-2 z",
                      "M9 9h6v6H9z",
                    ],
                  },
                  {
                    title: "Book session",
                    paths: [
                      "M3,4 h18 a2,2 0 0,1 2,2 v15 a2,2 0 0,1 -2,2 h-18 a2,2 0 0,1 -2,-2 v-15 a2,2 0 0,1 2,-2 z",
                      "M3 9h18",
                      "M8 2v4",
                      "M16 2v4",
                    ],
                  },
                  {
                    title: "Saved replies",
                    path: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
                  },
                  {
                    title: "Emoji",
                    paths: [
                      "M12,2 a10,10 0 1,0 0,20 a10,10 0 1,0 0,-20",
                      "M8 14s1.5 2 4 2 4-2 4-2",
                      "M9 9h.01",
                      "M15 9h.01",
                    ],
                  },
                ].map((ico) => (
                  <span
                    key={ico.title}
                    title={ico.title}
                    style={{
                      width: 24,
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "var(--r-1)",
                      cursor: "pointer",
                      color: "var(--fg-3)",
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      style={{
                        width: 14,
                        height: 14,
                        strokeWidth: 1.5,
                        fill: "none",
                        stroke: "currentColor",
                      }}
                    >
                      {"path" in ico && ico.path ? (
                        <path d={ico.path} />
                      ) : (
                        (ico as { paths: string[] }).paths?.map((p, pi) => (
                          <path key={pi} d={p} />
                        ))
                      )}
                    </svg>
                  </span>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                <span
                  className="hidden sm:inline"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    color: "var(--fg-4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  ⌘ + Enter to send
                </span>
                <button
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    height: 28,
                    padding: "0 10px",
                    borderRadius: "var(--r-2)",
                    fontSize: 12.5,
                    fontWeight: 500,
                    letterSpacing: "-0.005em",
                    border: "1px solid transparent",
                    background: "var(--ink)",
                    color: "var(--bg)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Send &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ── Render: Single message bubble ─────────────────────────── */

  function renderMessage(msg: Message) {
    const out = msg.from === "out";
    return (
      <div
        key={msg.id}
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          maxWidth: "80%",
          ...(out
            ? { alignSelf: "flex-end", flexDirection: "row-reverse" }
            : {}),
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: out ? "var(--trainer)" : "var(--bg-3)",
            color: out ? "oklch(0.2 0.05 75)" : "var(--fg-2)",
            fontSize: 10,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {msg.initials}
        </div>

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            minWidth: 0,
          }}
        >
          {/* Header row */}
          {(msg.name || msg.time) && (msg.time !== "") && (
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                color: "var(--fg-3)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                ...(out ? { justifyContent: "flex-end" } : {}),
              }}
            >
              <strong
                style={{
                  color: "var(--ink)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 12.5,
                  textTransform: "none",
                  letterSpacing: "-0.005em",
                  fontWeight: 500,
                }}
              >
                {msg.name}
              </strong>
              <span>{msg.time}</span>
            </div>
          )}

          {/* Image attachment */}
          {msg.imageAtt && (
            <div
              style={{
                padding: "10px 14px",
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-3)",
              }}
            >
              <div
                style={{
                  width: 200,
                  height: 160,
                  background:
                    "linear-gradient(135deg, oklch(0.86 0.04 80), oklch(0.78 0.06 60))",
                  borderRadius: "var(--r-3)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    bottom: 8,
                    left: 10,
                    fontFamily: "var(--font-mono)",
                    fontSize: 9.5,
                    color: "var(--ink)",
                    opacity: 0.6,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  IMG &middot; video frame
                </span>
              </div>
            </div>
          )}

          {/* Text bubble */}
          {msg.body && (
            <div
              style={{
                padding: "10px 14px",
                background: out ? "var(--ink)" : "var(--bg-2)",
                border: `1px solid ${out ? "var(--ink)" : "var(--border)"}`,
                borderRadius: "var(--r-3)",
                fontSize: 13.5,
                color: out ? "var(--bg)" : "var(--ink)",
                lineHeight: 1.5,
                whiteSpace: "pre-line",
              }}
            >
              {msg.body}

              {/* File attachment inside bubble */}
              {msg.fileAtt && (
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    padding: "10px 12px",
                    background: out
                      ? "oklch(0.22 0.008 80)"
                      : "var(--bg)",
                    border: `1px solid ${out ? "oklch(0.3 0.008 80)" : "var(--border)"}`,
                    borderRadius: "var(--r-2)",
                    marginTop: 6,
                    maxWidth: 320,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      background: out
                        ? "oklch(0.3 0.008 80)"
                        : "var(--bg-2)",
                      borderRadius: "var(--r-1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      style={{
                        width: 14,
                        height: 14,
                        stroke: out ? "var(--bg)" : "var(--fg-2)",
                        fill: "none",
                        strokeWidth: 1.5,
                      }}
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 500,
                        color: out ? "var(--bg)" : "var(--ink)",
                      }}
                    >
                      {msg.fileAtt.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10.5,
                        color: out
                          ? "oklch(0.7 0.005 85)"
                          : "var(--fg-3)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        marginTop: 1,
                      }}
                    >
                      {msg.fileAtt.type} &middot; {msg.fileAtt.size}
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: out
                        ? "oklch(0.8 0.005 85)"
                        : "var(--fg-2)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      cursor: "pointer",
                    }}
                  >
                    &darr; Download
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Render: Context rail ──────────────────────────────────── */

  function renderContextRail() {
    return (
      <aside
        className="hidden xl:flex flex-col"
        style={{
          background: "var(--bg-2)",
          borderLeft: "1px solid var(--border)",
          padding: 20,
          height: "100vh",
          overflowY: "auto",
          gap: 18,
          width: 320,
          flexShrink: 0,
        }}
      >
        {/* About Aisha */}
        <div>
          <div style={{ ...S.monoLabel, marginBottom: 10 }}>About Aisha</div>
          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-3)",
              overflow: "hidden",
            }}
          >
            {/* Client header */}
            <div
              style={{
                padding: 16,
                display: "flex",
                gap: 12,
                alignItems: "center",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "var(--bg-3)",
                  color: "var(--fg-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                AA
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 14.5,
                    fontWeight: 500,
                    color: "var(--ink)",
                    letterSpacing: "-0.005em",
                  }}
                >
                  Aisha Adams
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--fg-3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginTop: 2,
                  }}
                >
                  Online &middot; monthly &middot; joined Jan 2026
                </div>
              </div>
            </div>

            {/* Stats rows */}
            {[
              { k: "Time zone", v: "GMT+4 · Dubai", mono: true },
              { k: "Streak", v: "45 days", mono: true },
              { k: "Adherence · 30d", v: "88%", mono: true },
              { k: "Total spent", v: "$ 1,920.00", mono: true },
              {
                k: "Goals",
                v: "Build strength · maintain bodyweight",
                mono: false,
                align: "right" as const,
                maxW: "60%",
              },
            ].map((row, i, arr) => (
              <div
                key={i}
                style={{
                  padding: "10px 16px",
                  borderBottom:
                    i < arr.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  fontSize: 12.5,
                }}
              >
                <span style={{ color: "var(--fg-3)" }}>{row.k}</span>
                <span
                  style={{
                    color: "var(--ink)",
                    fontFamily: row.mono
                      ? "var(--font-mono)"
                      : "var(--font-sans)",
                    fontVariantNumeric: "tabular-nums",
                    ...(row.align ? { textAlign: row.align } : {}),
                    ...(row.maxW ? { maxWidth: row.maxW } : {}),
                  }}
                >
                  {row.v}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Next session */}
        <div>
          <div style={{ ...S.monoLabel, marginBottom: 10 }}>Next session</div>
          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-3)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  paddingRight: 12,
                  borderRight: "1px solid var(--border)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9.5,
                    color: "var(--fg-3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    display: "block",
                  }}
                >
                  MAY
                </span>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 500,
                    letterSpacing: "-0.022em",
                    color: "var(--ink)",
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1,
                  }}
                >
                  18
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--ink)",
                  }}
                >
                  Programming review
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    color: "var(--fg-3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginTop: 2,
                  }}
                >
                  Today &middot; 11:30 SAST &middot; 30 min &middot; Zoom
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shared files */}
        <div>
          <div style={{ ...S.monoLabel, marginBottom: 10 }}>
            Shared in this thread
          </div>
          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-3)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "4px 0" }}>
              {SHARED_FILES.map((file, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 16px",
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    borderBottom:
                      i < SHARED_FILES.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      background: "var(--bg-2)",
                      borderRadius: "var(--r-1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        width: 13,
                        height: 13,
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        style={{
                          width: 13,
                          height: 13,
                          stroke: "var(--fg-2)",
                          fill: "none",
                          strokeWidth: 1.5,
                        }}
                      >
                        {file.icon === "doc" && (
                          <>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6" />
                          </>
                        )}
                        {file.icon === "video" && (
                          <>
                            <polygon points="23 7 16 12 23 17 23 7" />
                            <rect
                              x="1"
                              y="5"
                              width="15"
                              height="14"
                              rx="2"
                            />
                          </>
                        )}
                        {file.icon === "image" && (
                          <>
                            <rect
                              x="3"
                              y="3"
                              width="18"
                              height="18"
                              rx="2"
                            />
                            <circle cx="9" cy="9" r="2" />
                            <path d="M21 15l-5-5L5 21" />
                          </>
                        )}
                      </svg>
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "var(--ink)",
                        fontWeight: 500,
                      }}
                    >
                      {file.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10.5,
                        color: "var(--fg-3)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        marginTop: 1,
                      }}
                    >
                      {file.meta}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    );
  }

  /* ── Main render ───────────────────────────────────────────── */

  return (
    <div
      className="grid h-screen overflow-hidden grid-cols-[1fr] md:grid-cols-[320px_1fr] lg:grid-cols-[232px_320px_1fr] xl:grid-cols-[232px_320px_1fr_320px]"
    >
      {renderSidebar()}
      {renderInbox()}
      {renderThread()}
      {renderContextRail()}
    </div>
  );
}
