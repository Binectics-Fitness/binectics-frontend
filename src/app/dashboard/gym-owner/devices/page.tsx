import { redirect } from "next/navigation";

// The old Devices page was a fabricated hardware-telemetry mockup (fake
// iPads, battery levels, firmware). The real front-door surface is the
// check-in kiosk; this redirect catches bookmarks.
export default function DevicesRedirect() {
  redirect("/dashboard/gym-owner/kiosk");
}
