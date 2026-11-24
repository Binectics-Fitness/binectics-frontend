import { redirect } from "next/navigation";

/** The old placeholder address; Team & roles lives at /admin/roles. */
export default function AdminTeamRolesPage() {
  redirect("/admin/roles");
}
