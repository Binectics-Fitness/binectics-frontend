import { redirect } from "next/navigation";

// The settings index is just an entry point — the layout's tabs hold the
// real pages, and Profile is the first of them.
export default function SettingsIndex() {
  redirect("/dashboard/settings/profile");
}
