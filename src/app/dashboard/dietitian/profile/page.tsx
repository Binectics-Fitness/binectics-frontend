import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";

export default function ProfilePage() {
  return (
    <DietitianDashboardShell activeItem="My profile" crumb="Profile">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-3" style={{ color: "var(--fg-3)" }}>Coming soon</div>
          <h1 className="text-[24px] font-medium mb-2" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Profile</h1>
          <p className="text-[14px] mb-6" style={{ color: "var(--fg-3)" }}>This page is being built. Check back soon.</p>
        </div>
      </div>
    </DietitianDashboardShell>
  );
}
