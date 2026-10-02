import Link from "next/link";
import type { Metadata } from "next";
import AccountStatePanel, { Accent } from "@/components/AccountStatePanel";

export const metadata: Metadata = {
  title: "Account Deleted",
  description: "Your Binectics account has been deleted.",
};

/**
 * Where settings sends someone after POST /auth/account/delete succeeds.
 * Every line below is what that endpoint does (AuthService.deleteAccount):
 * nothing about retention periods or audit ids it doesn't produce.
 */
export default function AccountDeletedPage() {
  return (
    <AccountStatePanel
      tone="neutral"
      eyebrow="Account deleted"
      title={
        <>
          Your account is <Accent>deleted</Accent>.
        </>
      }
      description="We've removed your personal details from your account and signed you out everywhere. A confirmation is on its way to the email address you used."
      rows={[
        {
          label: "Removed",
          value: "Name, email, phone, photo, date of birth and fitness preferences",
        },
        { label: "Teams", value: "You've left every team you were on" },
        { label: "Memberships", value: "Gym memberships won't renew" },
      ]}
      actions={
        <>
          <Link href="/" className="btn-primary-v2" style={{ height: 38, padding: "0 16px" }}>
            Back to home
          </Link>
          <Link href="/contact" className="btn-ghost-v2" style={{ height: 38, padding: "0 16px" }}>
            Contact us
          </Link>
        </>
      }
    />
  );
}
