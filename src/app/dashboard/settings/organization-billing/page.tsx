import { redirect } from "next/navigation";

// The Sprint-4 organization-billing page was superseded by the DS-styled
// provider billing page; old links land here, so keep the route alive.
export default function OrganizationBillingRedirect() {
  redirect("/dashboard/billing");
}
