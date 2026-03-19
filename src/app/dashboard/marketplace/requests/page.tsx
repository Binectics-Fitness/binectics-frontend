"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLoading from "@/components/DashboardLoading";
import { marketplaceService } from "@/lib/api/marketplace";
import type { MarketplaceRequest, MarketplaceRequestStatus } from "@/lib/types";

const STATUS_COLORS: Record<MarketplaceRequestStatus, string> = {
  pending: "bg-accent-yellow-100 text-accent-yellow-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-neutral-100 text-neutral-600",
};

const STATUS_LABELS: Record<MarketplaceRequestStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export default function MarketplaceRequestsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [requests, setRequests] = useState<MarketplaceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseNote, setResponseNote] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    async function load() {
      const res = await marketplaceService.getMyListingRequests();
      if (res.success && res.data) {
        setRequests(res.data);
      }
      setIsLoading(false);
    }
    load();
  }, [authLoading, user, router]);

  const handleAccept = async (requestId: string) => {
    setActionError("");
    const res = await marketplaceService.acceptRequest(
      requestId,
      responseNote || undefined,
    );
    if (res.success && res.data) {
      setRequests((prev) =>
        prev.map((r) => (r._id === requestId ? res.data! : r)),
      );
      setRespondingId(null);
      setResponseNote("");
    } else {
      setActionError(res.message || "Failed to accept request");
    }
  };

  const handleReject = async (requestId: string) => {
    setActionError("");
    const res = await marketplaceService.rejectRequest(
      requestId,
      responseNote || undefined,
    );
    if (res.success) {
      setRequests((prev) =>
        prev.map((r) =>
          r._id === requestId ? { ...r, status: "rejected" as const } : r,
        ),
      );
      setRespondingId(null);
      setResponseNote("");
    } else {
      setActionError(res.message || "Failed to reject request");
    }
  };

  if (authLoading || isLoading) return <DashboardLoading />;

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const otherRequests = requests.filter((r) => r.status !== "pending");

  return (
    <div className="flex-1 overflow-y-auto bg-background-secondary">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-foreground">
              Client Requests
            </h1>
            <p className="text-sm text-foreground-secondary mt-1">
              Manage incoming marketplace connection requests
            </p>
          </div>
          <Link
            href="/dashboard/marketplace"
            className="rounded-xl border-2 border-neutral-300 px-4 py-2 text-sm font-medium text-foreground hover:border-foreground-secondary transition-colors"
          >
            ← Listing
          </Link>
        </div>

        {actionError && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-6">
            <p className="text-sm text-red-800">{actionError}</p>
          </div>
        )}

        {requests.length === 0 && (
          <div className="rounded-2xl bg-white p-12 shadow-card text-center">
            <svg
              className="mx-auto h-16 w-16 text-neutral-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="text-xl font-bold text-foreground mb-2">
              No requests yet
            </h3>
            <p className="text-foreground-secondary">
              When clients send you a connection request through the marketplace,
              it will appear here.
            </p>
          </div>
        )}

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-4">
              Pending ({pendingRequests.length})
            </h2>
            <div className="space-y-4">
              {pendingRequests.map((req) => (
                <RequestCard
                  key={req._id}
                  request={req}
                  isExpanded={respondingId === req._id}
                  onToggleExpand={() =>
                    setRespondingId(
                      respondingId === req._id ? null : req._id,
                    )
                  }
                  responseNote={responseNote}
                  setResponseNote={setResponseNote}
                  onAccept={() => handleAccept(req._id)}
                  onReject={() => handleReject(req._id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Other Requests */}
        {otherRequests.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">
              History ({otherRequests.length})
            </h2>
            <div className="space-y-3">
              {otherRequests.map((req) => (
                <RequestCard key={req._id} request={req} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({
  request,
  isExpanded,
  onToggleExpand,
  responseNote,
  setResponseNote,
  onAccept,
  onReject,
}: {
  request: MarketplaceRequest;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  responseNote?: string;
  setResponseNote?: (v: string) => void;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  const client =
    typeof request.client_id === "object" ? request.client_id : null;
  const date = new Date(request.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const isPending = request.status === "pending";

  return (
    <div className="rounded-xl bg-white p-5 shadow-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden">
            {client?.profile_picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={client.profile_picture}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-foreground/40">
                {client ? client.first_name[0] : "?"}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {client
                ? `${client.first_name} ${client.last_name}`
                : "Client"}
            </p>
            <p className="text-xs text-foreground-secondary">
              {request.type === "connection" ? "Connection Request" : "Inquiry"}{" "}
              · {date}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[request.status]}`}
        >
          {STATUS_LABELS[request.status]}
        </span>
      </div>

      {request.message && (
        <p className="text-sm text-foreground-secondary mb-3 bg-background-secondary rounded-lg p-3">
          &ldquo;{request.message}&rdquo;
        </p>
      )}

      {request.goals.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {request.goals.map((g) => (
            <span
              key={g}
              className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700"
            >
              {g}
            </span>
          ))}
        </div>
      )}

      {isPending && onToggleExpand && (
        <>
          {!isExpanded ? (
            <div className="flex gap-2 pt-2">
              <button
                onClick={onToggleExpand}
                className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
              >
                Respond
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-neutral-100 mt-3">
              <div className="mb-3">
                <label className="text-xs font-medium text-foreground mb-1 block">
                  Response Note (optional)
                </label>
                <textarea
                  value={responseNote}
                  onChange={(e) => setResponseNote?.(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border-2 border-neutral-300 bg-white px-3 py-2 text-sm text-foreground focus:border-primary-500 focus:outline-none resize-none"
                  placeholder="Add a note..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onAccept}
                  className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={onReject}
                  className="rounded-lg border-2 border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={onToggleExpand}
                  className="rounded-lg border-2 border-neutral-300 px-4 py-2 text-sm font-medium text-foreground hover:border-foreground-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {request.response_note && (
        <div className="mt-3 pt-3 border-t border-neutral-100">
          <p className="text-xs font-medium text-foreground-secondary mb-1">
            Response
          </p>
          <p className="text-sm text-foreground-secondary">
            {request.response_note}
          </p>
        </div>
      )}
    </div>
  );
}
