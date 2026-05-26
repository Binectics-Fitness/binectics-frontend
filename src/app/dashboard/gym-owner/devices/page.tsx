import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Devices",
  description: "Manage QR scanners and check-in devices at your gym locations.",
};

const DEVICES: {
  name: string; meta: string; type: "kiosk" | "scanner" | "printer";
  stats: { k: string; v: string }[];
  battery?: number; batteryWarn?: boolean; batteryLow?: boolean; batteryLabel?: string;
  status: string; statusKind: "online" | "warn" | "offline" | "idle";
  ping: string;
}[] = [
  { name: "Sea Point · entry kiosk", meta: "iPad Air · iOS 18.4 · v 2.3.1", type: "kiosk", stats: [{ k: "Check‑ins · today", v: "142" }, { k: "Scans · today", v: "146" }, { k: "Fails · 7d", v: "1" }], battery: 84, status: "Online", statusKind: "online", ping: "14s ago" },
  { name: "Foreshore · entry kiosk", meta: "iPad Air · iOS 18.4 · v 2.3.1", type: "kiosk", stats: [{ k: "Check‑ins · today", v: "108" }, { k: "Scans · today", v: "110" }, { k: "Fails · 7d", v: "0" }], battery: 72, status: "Online", statusKind: "online", ping: "22s ago" },
  { name: "Camps Bay · entry kiosk", meta: "iPad Pro · iOS 18.4 · v 2.3.1", type: "kiosk", stats: [{ k: "Check‑ins · today", v: "62" }, { k: "Scans · today", v: "64" }, { k: "Fails · 7d", v: "0" }], battery: 18, batteryWarn: true, status: "Battery low", statusKind: "warn", ping: "1m ago" },
  { name: "Woodstock · entry kiosk", meta: "iPad Air · iOS 18.4 · v 2.3.1", type: "kiosk", stats: [{ k: "Check‑ins · today", v: "100" }, { k: "Scans · today", v: "104" }, { k: "Fails · 7d", v: "2" }], battery: 64, status: "Online", statusKind: "online", ping: "8s ago" },
  { name: "Sea Point · floor scanner", meta: "Honeywell CT60 · firmware 4.2", type: "scanner", stats: [{ k: "Class scans", v: "86" }, { k: "Range", v: "8m" }, { k: "Fails · 7d", v: "1" }], battery: 88, status: "Online", statusKind: "online", ping: "3s ago" },
  { name: "Foreshore · floor scanner", meta: "Honeywell CT60 · firmware 4.2", type: "scanner", stats: [{ k: "Class scans", v: "0" }, { k: "Range", v: "—" }, { k: "Fails · 7d", v: "—" }], battery: 0, batteryLow: true, batteryLabel: "Empty", status: "Offline · 4h 12m", statusKind: "offline", ping: "4h 12m ago" },
  { name: "Sea Point · class kiosk", meta: "iPad mini · iOS 18.4 · v 2.3.1", type: "kiosk", stats: [{ k: "Class check‑ins", v: "68" }, { k: "Scans · today", v: "70" }, { k: "Fails · 7d", v: "0" }], battery: 92, status: "Online", statusKind: "online", ping: "10s ago" },
  { name: "Sea Point · receipt printer", meta: "Star TSP143IIIBI · v 6.4", type: "printer", stats: [{ k: "Receipts · today", v: "12" }, { k: "Paper", v: "62%" }, { k: "Jams · 30d", v: "0" }], status: "Idle", statusKind: "idle", ping: "3m ago" },
  { name: "Camps Bay · class kiosk", meta: "iPad mini · iOS 18.4 · v 2.3.1", type: "kiosk", stats: [{ k: "Class check‑ins", v: "28" }, { k: "Scans · today", v: "28" }, { k: "Fails · 7d", v: "0" }], battery: 78, status: "Online", statusKind: "online", ping: "18s ago" },
];

function KioskIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M10 18h4"/></svg>;
}
function ScannerIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/></svg>;
}
function PrinterIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>;
}

const ICON_BG: Record<string, string> = { kiosk: "var(--ink)", scanner: "var(--gym)", printer: "var(--fg-3)" };
const ICON_COLOR: Record<string, string> = { kiosk: "var(--bg)", scanner: "oklch(0.98 0 0)", printer: "var(--bg)" };

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  online: { color: "var(--signal-ink)", bg: "var(--signal-soft)" },
  warn: { color: "oklch(0.45 0.16 75)", bg: "oklch(0.96 0.06 75)" },
  offline: { color: "var(--danger)", bg: "var(--danger-soft)" },
  idle: { color: "var(--fg-3)", bg: "var(--bg-2)" },
};

export default function GymDevicesPage() {
  return (
    <GymDashboardShell
      activeItem="Devices"
      crumb="Devices"
      actions={<><button className="btn-ghost-v2 sm">Setup guide</button><button className="btn-primary-v2 sm">+ Pair new device</button></>}
    >
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Devices</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>Kiosks, scanners, and printers across 4 locations · 12 total · 11 online · 1 needs attention</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total devices", value: "12", delta: "11 online · 1 offline" },
          { label: "Check‑ins today", value: "412", delta: "+ 18 vs avg" },
          { label: "Failed scans · 7d", value: "4", delta: "0.1% of all attempts" },
          { label: "Battery alerts", value: "2", warn: true, delta: "Below 20% threshold" },
        ].map((k) => (
          <div key={k.label} className="rounded-(--r-3) px-4.5 py-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className="text-[24px] font-medium mt-1.5" style={{ letterSpacing: "-0.02em", color: k.warn ? "oklch(0.45 0.16 75)" : "var(--ink)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{k.value}</div>
            <div className="font-mono text-[11.5px] mt-1" style={{ color: k.warn ? "oklch(0.45 0.16 75)" : "var(--signal-ink)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {DEVICES.map((d) => {
          const ss = STATUS_STYLES[d.statusKind];
          return (
            <div key={d.name} className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              {/* Header */}
              <div className="grid items-center gap-3.5 px-5 py-4.5" style={{ gridTemplateColumns: "56px 1fr auto" }}>
                <span className="w-14 h-14 rounded-(--r-2) flex items-center justify-center" style={{ background: ICON_BG[d.type], color: ICON_COLOR[d.type] }}>
                  {d.type === "kiosk" && <KioskIcon />}
                  {d.type === "scanner" && <ScannerIcon />}
                  {d.type === "printer" && <PrinterIcon />}
                </span>
                <div>
                  <div className="text-[15px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.005em" }}>{d.name}</div>
                  <div className="font-mono text-[11px] mt-0.75" style={{ color: "var(--fg-3)" }}>{d.meta}</div>
                </div>
                <span className="inline-flex items-center gap-1.25 font-mono text-[10px] uppercase tracking-[0.05em] px-2 py-0.75 rounded-full" style={{ color: ss.color, background: ss.bg, border: d.statusKind === "idle" ? "1px solid var(--border)" : "none" }}>
                  <span className="w-1.25 h-1.25 rounded-full bg-current" />{d.status}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3" style={{ borderTop: "1px solid var(--border)" }}>
                {d.stats.map((s, si) => (
                  <div key={s.k} className="px-5 py-4" style={{ borderRight: si < 2 ? "1px solid var(--border)" : "none" }}>
                    <div className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{s.k}</div>
                    <div className="text-[16px] font-medium mt-1" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em", lineHeight: 1 }}>{s.v}</div>
                  </div>
                ))}
              </div>

              {/* Battery (if applicable) */}
              {d.battery !== undefined && (
                <div className="flex items-center gap-3 px-5 py-3.5" style={{ borderTop: "1px solid var(--border)" }}>
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Battery</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-3)" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.max(d.battery, 2)}%`, background: d.batteryLow ? "var(--danger)" : d.batteryWarn ? "oklch(0.72 0.13 75)" : "var(--signal)" }} />
                  </div>
                  <span className="font-mono text-[11.5px]" style={{ color: d.batteryLow ? "var(--danger)" : d.batteryWarn ? "oklch(0.45 0.16 75)" : "var(--ink)", fontVariantNumeric: "tabular-nums", minWidth: "32px", textAlign: "right" }}>{d.batteryLabel ?? `${d.battery}%`}</span>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Last ping · <strong className="text-[12px] font-medium" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)", textTransform: "none" as const, letterSpacing: "-0.005em" }}>{d.ping}</strong></span>
                <div className="flex gap-1.5">
                  <span className="w-5.5 h-5.5 rounded-(--r-1) flex items-center justify-center cursor-pointer hover:bg-bg-3" style={{ color: d.statusKind === "offline" ? "var(--danger)" : "var(--fg-3)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
                  </span>
                  <span className="w-5.5 h-5.5 rounded-(--r-1) flex items-center justify-center cursor-pointer hover:bg-bg-3" style={{ color: "var(--fg-3)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/></svg>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GymDashboardShell>
  );
}
