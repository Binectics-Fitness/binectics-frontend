import { DSCard } from "@/components/ds";

/**
 * Reminders live on the phone: web has no browser notifications and no
 * queued writes. Text only: the repo holds no store link or QR to show, and a
 * made-up one would be worse than none.
 */
export function RemindersCard() {
  return (
    <DSCard flat className="p-5">
      <h2 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
        Reminders are set in the mobile app
      </h2>
      <p className="mt-1 text-[13px]" style={{ color: "var(--fg-3)" }}>
        Open the Binectics app on your phone to choose when to be reminded. This page does not send reminders.
      </p>
    </DSCard>
  );
}
