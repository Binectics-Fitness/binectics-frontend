import NotificationsInboxClient from "./NotificationsInboxClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications",
  description: "View and manage your notifications.",
};

export default function NotificationsPage() {
  return <NotificationsInboxClient />;
}
