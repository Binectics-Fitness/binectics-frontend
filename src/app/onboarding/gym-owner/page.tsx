import { redirect } from "next/navigation";

export default function GymOnboardingRedirect() {
  redirect("/onboarding?role=gym");
}
