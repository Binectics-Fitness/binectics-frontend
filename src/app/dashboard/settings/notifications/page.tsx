import type { Metadata } from "next";
import NotificationPreferencesPanel from "../NotificationPreferencesPanel";

export const metadata: Metadata = {
  title: "Notification Settings",
  description: "Choose which notifications you receive and where.",
};

export default function NotificationsSettingsPage() {
  return <NotificationPreferencesPanel />;
}
