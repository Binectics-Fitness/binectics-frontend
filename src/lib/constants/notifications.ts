export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: "booking" | "payment" | "mention" | "system";
  timestamp: string;
  read: boolean;
  avatar?: string;
}

export const DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "New booking confirmed",
    body: "Your session with Coach Marcus is confirmed for tomorrow at 10:00.",
    category: "booking",
    timestamp: "2m ago",
    read: false,
  },
  {
    id: "2",
    title: "Payment received",
    body: "R 450.00 received for Gold membership — March 2026.",
    category: "payment",
    timestamp: "1h ago",
    read: false,
  },
  {
    id: "3",
    title: "Coach Marcus mentioned you",
    body: "\"Great progress on the deadlift today, keep it up.\"",
    category: "mention",
    timestamp: "3h ago",
    read: false,
  },
  {
    id: "4",
    title: "Session reminder",
    body: "Your session with FitZone Gym starts in 30 minutes.",
    category: "booking",
    timestamp: "5h ago",
    read: true,
  },
  {
    id: "5",
    title: "Payout processed",
    body: "R 3,200.00 has been deposited to your FNB account ending in 4521.",
    category: "payment",
    timestamp: "1d ago",
    read: true,
  },
  {
    id: "6",
    title: "Plan update",
    body: "Your dietitian Nadia updated your meal plan for this week.",
    category: "system",
    timestamp: "2d ago",
    read: true,
  },
  {
    id: "7",
    title: "New review",
    body: "A client left a 5-star review on your profile.",
    category: "mention",
    timestamp: "3d ago",
    read: true,
  },
];
