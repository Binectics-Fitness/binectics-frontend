import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";

/**
 * Messages — 3-pane inbox from messages.html prototype.
 * Left: conversation list. Center: active thread. Right: context rail.
 */

const CONVERSATIONS = [
  { init: "LM", name: "Linda Mokoena", preview: "Thanks Sarah! See you Wednesday 08:30.", time: "2m", unread: true, active: true },
  { init: "JS", name: "Jamal Sutherland", preview: "Can we move Thursday to 10am?", time: "18m", unread: true },
  { init: "WC", name: "Wei Chen", preview: "Great session today. The squat cue helped.", time: "1h" },
  { init: "PB", name: "Pier Botha", preview: "I'd like to cancel my remaining sessions.", time: "3h", warn: true },
  { init: "TN", name: "Thandi Nkosi", preview: "See you at Foreshore tomorrow!", time: "6h" },
  { init: "AA", name: "Aisha Adams", preview: "My shoulder feels much better after the mobility work.", time: "1d" },
];

const THREAD = [
  { from: "client", text: "Hey Sarah, just confirming — we're still on for Wednesday 08:30 at Sea Point?", time: "10:42" },
  { from: "me", text: "Absolutely! I've got you down. We'll start with the squat test — wear flat shoes if you have them. Also, I updated your program for block 3 — it's in the app now.", time: "10:44" },
  { from: "client", text: "Perfect, I saw the update. The rack pulls look good. Quick question — should I eat before or is fasted fine?", time: "10:46" },
  { from: "me", text: "Light meal 60–90 min before is ideal. Something with carbs and a bit of protein — banana + peanut butter, oats, that sort of thing. Don't train fully fasted for strength work.", time: "10:48" },
  { from: "client", text: "Thanks Sarah! See you Wednesday 08:30.", time: "10:49" },
];

export default function MessagesPage() {
  return (
    <TrainerDashboardShell activeItem="Inbox" crumb="Messages">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] -mx-4 lg:-mx-7 -mt-5 min-h-[calc(100vh-56px)]">
        {/* Conversation list */}
        <div className="flex flex-col overflow-y-auto" style={{ borderRight: "1px solid var(--border)", background: "var(--bg)" }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Inbox</span>
            <span className="font-mono text-[11px] px-1.5 py-px rounded-full" style={{ color: "var(--bg)", background: "var(--ink)" }}>2</span>
          </div>
          <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 h-8 px-2.5 rounded-(--r-2)" style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--fg-3)" }}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
              <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>Search messages…</span>
            </div>
          </div>
          {CONVERSATIONS.map((c) => (
            <div key={c.name} className="flex items-start gap-3 px-4 py-3 cursor-pointer" style={{ background: c.active ? "var(--bg-2)" : "transparent", borderBottom: "1px solid var(--border)", borderLeft: c.active ? "2px solid var(--ink)" : "2px solid transparent" }}>
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5" style={{ background: c.warn ? "oklch(0.95 0.03 25)" : "var(--bg-3)", color: c.warn ? "var(--danger)" : "var(--fg-2)" }}>{c.init}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className={`text-[13px] truncate ${c.unread ? "font-medium" : ""}`} style={{ color: "var(--ink)" }}>{c.name}</span>
                  <span className="font-mono text-[10.5px] shrink-0" style={{ color: "var(--fg-4)" }}>{c.time}</span>
                </div>
                <div className={`text-[12px] truncate mt-0.5 ${c.unread ? "font-medium" : ""}`} style={{ color: c.unread ? "var(--ink)" : "var(--fg-3)" }}>{c.preview}</div>
              </div>
              {c.unread && <span className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: "var(--ink)" }} />}
            </div>
          ))}
        </div>

        {/* Thread */}
        <div className="hidden lg:flex flex-col" style={{ background: "var(--bg)" }}>
          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>LM</span>
              <div>
                <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Linda Mokoena</span>
                <span className="font-mono text-[11px] ml-2" style={{ color: "var(--signal-ink)" }}>Online</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
            {THREAD.map((m, i) => (
              <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-3 rounded-(--r-3) text-[14px] leading-relaxed ${m.from === "me" ? "" : ""}`} style={{ background: m.from === "me" ? "var(--ink)" : "var(--bg-2)", color: m.from === "me" ? "var(--bg)" : "var(--ink)", border: m.from === "me" ? "none" : "1px solid var(--border)" }}>
                  <p>{m.text}</p>
                  <div className={`font-mono text-[10px] mt-1.5 text-right`} style={{ color: m.from === "me" ? "oklch(0.7 0.005 85)" : "var(--fg-4)" }}>{m.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Compose */}
          <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-end gap-3">
              <textarea className="flex-1 rounded-(--r-2) px-3.5 py-2.5 text-[14px] resize-none" style={{ border: "1px solid var(--border-2)", background: "var(--bg)", fontFamily: "inherit", color: "var(--ink)", minHeight: "40px", maxHeight: "120px" }} placeholder="Message Linda…" rows={1} />
              <button className="btn-primary-v2 sm shrink-0">Send</button>
            </div>
          </div>
        </div>

        {/* Context rail */}
        <div className="hidden lg:flex flex-col gap-5 p-4 overflow-y-auto" style={{ borderLeft: "1px solid var(--border)", background: "var(--bg-2)" }}>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Client context</div>

          {/* Client card */}
          <div className="rounded-(--r-3) p-3.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-semibold" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>LM</span>
              <div>
                <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Linda Mokoena</div>
                <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>Studio · 24‑pack · 14 done</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[{ k: "Streak", v: "32 days" }, { k: "Next", v: "Wed 08:30" }, { k: "Weight", v: "76.2 kg" }, { k: "1RM squat", v: "92.5 kg" }].map((s) => (
                <div key={s.k}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{s.k}</div>
                  <div className="text-[13px] font-medium" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming */}
          <div className="rounded-(--r-3) p-3.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.04em] mb-2" style={{ color: "var(--fg-3)" }}>Upcoming booking</div>
            <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>Wed · 20 May · 08:30</div>
            <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>In‑person · Iron Lab Sea Point · 60 min</div>
          </div>

          {/* Last note */}
          <div className="rounded-(--r-3) p-3.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.04em] mb-2" style={{ color: "var(--fg-3)" }}>Last session note</div>
            <div className="text-[13px] leading-relaxed" style={{ color: "var(--fg-2)" }}>Squatted 90kg × 3 × 4 — smooth. Hip shift almost gone. Next: test 92.5kg for a double.</div>
            <div className="font-mono text-[10.5px] mt-2" style={{ color: "var(--fg-4)" }}>Mon · 18 May</div>
          </div>

          <button className="btn-ghost-v2 sm w-full justify-center">View full profile →</button>
        </div>
      </div>
    </TrainerDashboardShell>
  );
}
