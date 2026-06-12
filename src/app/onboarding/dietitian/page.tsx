import { redirect } from "next/navigation";

export default function DietitianOnboardingRedirect() {
  redirect("/onboarding?role=dietitian");
}
