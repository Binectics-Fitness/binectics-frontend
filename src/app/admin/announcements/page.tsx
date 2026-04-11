"use client";

import { useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole } from "@/lib/types";
import { apiClient } from "@/lib/api/client";

export default function AdminAnnouncementsPage() {
  const { isLoading, isAuthorized } = useRoleGuard(UserRole.ADMIN);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (isLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSending(true);
    setResult(null);

    try {
      const res = await apiClient.post<{ recipientCount: number }>(
        "/admin/announcements/broadcast",
        { title: title.trim(), message: message.trim() }
      );
      const count = res.data?.recipientCount ?? 0;
      setResult({
        type: "success",
        text: `Announcement sent to ${count} user${count === 1 ? "" : "s"}.`,
      });
      setTitle("");
      setMessage("");
    } catch {
      setResult({
        type: "error",
        text: "Failed to send announcement. Please try again.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="md:ml-64 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            System Announcements
          </h1>
          <p className="text-sm text-foreground/60 mb-8">
            Broadcast a notification to all platform users.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Title
              </label>
              <input
                id="title"
                type="text"
                maxLength={200}
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scheduled Maintenance"
                className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
              />
              <p className="mt-1 text-xs text-foreground/40">
                {title.length}/200
              </p>
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Message
              </label>
              <textarea
                id="message"
                maxLength={2000}
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your announcement message..."
                className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500 resize-y"
              />
              <p className="mt-1 text-xs text-foreground/40">
                {message.length}/2000
              </p>
            </div>

            {result && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  result.type === "success"
                    ? "bg-primary-50 text-primary-700 border border-primary-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {result.text}
              </div>
            )}

            <button
              type="submit"
              disabled={sending || !title.trim() || !message.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-accent-blue-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Sending…
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                    />
                  </svg>
                  Broadcast Announcement
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
