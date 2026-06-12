import { redirect } from "next/navigation";

export default function TrainerOnboardingRedirect() {
  redirect("/onboarding?role=trainer");
}
