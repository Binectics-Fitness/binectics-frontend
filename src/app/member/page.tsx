import { redirect } from "next/navigation";

// Pre-wiring static prototype, superseded by the real /dashboard/member
// (real check-ins, bookings, loyalty, and progress data). DASHBOARD_ROUTES
// and middleware route USER-role logins straight to /dashboard/member now;
// this redirect only catches stale links/bookmarks/cached redirects.
export default function MemberHomeRedirect() {
  redirect("/dashboard/member");
}
