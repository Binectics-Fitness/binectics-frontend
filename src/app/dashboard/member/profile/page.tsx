import { redirect } from "next/navigation";

// This was a second, thinner profile editor duplicating
// /dashboard/settings/profile (the full, wired one) — two different
// "Profile" pages for the same data confused live testing. Nothing links
// here since the avatar menu moved to the settings hub; the redirect
// catches bookmarks.
export default function MemberProfileRedirect() {
  redirect("/dashboard/settings/profile");
}
