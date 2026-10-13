import type { Metadata } from "next";
import CardRenewalsClient from "./CardRenewalsClient";

export const metadata: Metadata = {
  title: "Card renewals",
  description: "Membership renewals on members' saved cards that are due, retrying or failed.",
};

export default function GymCardRenewalsPage() {
  return <CardRenewalsClient />;
}
