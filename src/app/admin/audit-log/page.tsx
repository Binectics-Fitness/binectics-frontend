"use client";

import { useEffect, useState } from "react";
import SearchableSelect from "@/components/SearchableSelect";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import type { Tone } from "@/lib/ui/tones";
import {
  AsyncSpinner,
  EmptySlate,
  FilterPill,
  StatusPill,
  DSTable,
  DSTableHead,
  DSTableTh,
  DSTableRow,
  DSTableTd,
  PageHeader,
  DSCard,
} from "@/components/ds";
import {
  adminService,
  type AdminAuditEvent,
  type AdminPaginated,
} from "@/lib/api/admin";

const PAGE_SIZE = 50;

const LEVEL_FILTERS = [
  { value: "", label: "All levels" },
  { value: "log", label: "Info" },
  { value: "warn", label: "Warning" },
  { value: "error", label: "Error" },
];

/** Info is neutral, a warning is warn, an error is something that failed. */
const LEVEL_TONE: Record<string, Tone> = {
  log: "neutral",
  warn: "warn",
  error: "danger",
};

const LEVEL_LABEL: Record<string, string> = {
  log: "info",
  warn: "warning",
  error: "error",
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${date}, ${time}`;
}

function formatMetadata(metadata?: Record<string, unknown>): string {
  if (!metadata) return "-";
  const entries = Object.entries(metadata);
  if (entries.length === 0) return "-";
  return entries.map(([k, v]) => `${k}: ${String(v)}`).join(" · ");
}

export default function AdminAuditLogPage() {
  const [data, setData] = useState<AdminPaginated<AdminAuditEvent> | null>(
    null,
  );
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [level, setLevel] = useState("");
  const [event, setEvent] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      const res = await adminService.listAuditEventNames();
      if (active && res.success && res.data) setEventNames(res.data);
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const res = await adminService.listAuditEvents({
          page,
          limit: PAGE_SIZE,
          level: level || undefined,
          event: event || undefined,
        });
        if (!active) return;
        if (res.success && res.data) {
          setData(res.data);
          setError(null);
        } else {
          setError(res.message || "We couldn't load the audit log.");
        }
      } catch {
        if (active)
          setError("We couldn't load the audit log. Try again shortly.");
      } finally {
        if (active) setLoading(false);
      }
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, [page, level, event]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <AdminDashboardShell activeItem="Audit log" crumb="Audit log">
      <PageHeader
        className="mb-0!"
        title="Audit log"
        subtitle={<span className="block max-w-[64ch]">Security-relevant events recorded by the API, invites, password resets, account deletions and more. Personal data is stored hashed; events are kept for 90 days.</span>}
      />

      <div className="flex items-center gap-2 mt-4 flex-wrap">
        {LEVEL_FILTERS.map((f) => (
          <FilterPill
            key={f.value}
            label={f.label}
            active={level === f.value}
            onClick={() => {
              setLevel(f.value);
              setPage(1);
            }}
          />
        ))}
        <div className="ml-auto">
          <SearchableSelect
            value={event}
            onChange={(v) => {
              setEvent(v);
              setPage(1);
            }}
            options={eventNames.map((name) => ({ label: name, value: name }))}
            placeholder="All events"
          />
        </div>
      </div>

      {error ? (
        <div
          className="rounded-(--r-3) p-4 mt-4 text-[13px]"
          style={{
            background: "var(--danger-soft)",
            border: "1px solid oklch(0.92 0.05 25)",
            color: "var(--danger)",
          }}
        >
          <div className="font-medium">Couldn&apos;t load the audit log</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>
            {error}
          </div>
        </div>
      ) : null}

      {loading ? (
        <AsyncSpinner />
      ) : !error && data && data.items.length === 0 ? (
        <EmptySlate
          message="No audit events yet"
          hint={
            level || event
              ? "No events match this filter."
              : "Security events appear here as they happen, the store keeps the last 90 days."
          }
        />
      ) : !error && data ? (
        <>
          <DSCard className="mt-4">
            <DSTable minWidth={760}>
              <DSTableHead>
                <DSTableTh>Time</DSTableTh>
                <DSTableTh>Event</DSTableTh>
                <DSTableTh>Level</DSTableTh>
                <DSTableTh>Details</DSTableTh>
              </DSTableHead>
              <tbody>
                {data.items.map((e, i) => (
                  <DSTableRow key={e._id} last={i === data.items.length - 1}>
                    <DSTableTd className="whitespace-nowrap">
                      {formatWhen(e.created_at)}
                    </DSTableTd>
                    <DSTableTd mono className="text-[12px]">
                      {e.event}
                    </DSTableTd>
                    <DSTableTd>
                      <StatusPill
                        tone={LEVEL_TONE[e.level] ?? "neutral"}
                        label={LEVEL_LABEL[e.level] ?? e.level}
                      />
                    </DSTableTd>
                    <DSTableTd className="text-[12.5px]">
                      <span style={{ color: "var(--fg-3)" }}>
                        {formatMetadata(e.metadata)}
                      </span>
                    </DSTableTd>
                  </DSTableRow>
                ))}
              </tbody>
            </DSTable>
          </DSCard>

          <div className="flex items-center justify-between mt-3 text-[13px]">
            <div style={{ color: "var(--fg-3)" }}>
              {data.total} event{data.total === 1 ? "" : "s"}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-ghost-v2 sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span style={{ color: "var(--fg-3)" }}>
                Page {data.page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn-ghost-v2 sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : null}
    </AdminDashboardShell>
  );
}
