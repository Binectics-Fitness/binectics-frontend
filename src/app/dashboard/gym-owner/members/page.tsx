import type { Metadata } from "next";
import MembersClient from "./MembersClient";

export const metadata: Metadata = {
  title: "Members",
  description: "View and manage your gym members and their subscriptions.",
};

export default function GymMembersPage() {
  return <MembersClient />;
}
