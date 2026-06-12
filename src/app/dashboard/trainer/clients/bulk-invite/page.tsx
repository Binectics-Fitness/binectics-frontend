import BulkInviteClient from "./BulkInviteClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bulk Invite",
  description: "Invite multiple clients to join your training program.",
};

export default function TrainerBulkInvitePage() {
  return <BulkInviteClient />;
}
