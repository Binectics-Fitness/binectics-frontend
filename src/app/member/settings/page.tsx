import { redirect } from "next/navigation";

// Same static-prototype fate as /member — superseded by /dashboard/settings.
export default function MemberSettingsRedirect() {
  redirect("/dashboard/settings");
}
