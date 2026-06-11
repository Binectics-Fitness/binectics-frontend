"use client";

import { useMemo, useRef, useState } from "react";
import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import { progressService } from "@/lib/api/progress";
import { toast } from "@/components/Toast";

type InviteRow = {
  rowId: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  ok: boolean;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseCsv(text: string): InviteRow[] {
  const rawLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (rawLines.length === 0) return [];

  const maybeHeader = rawLines[0].toLowerCase();
  const hasHeader =
    maybeHeader.includes("email") ||
    maybeHeader.includes("name") ||
    maybeHeader.includes("phone");

  const lines = hasHeader ? rawLines.slice(1) : rawLines;

  const seen = new Set<string>();

  return lines.map((line, index) => {
    const [nameRaw = "", emailRaw = "", phoneRaw = ""] = line
      .split(",")
      .map((part) => part.trim());

    const name = nameRaw || "Unknown";
    const email = emailRaw;
    const phone = phoneRaw || "-";

    let status = "Ready";
    let ok = true;

    if (!email) {
      status = "Missing email";
      ok = false;
    } else if (!EMAIL_REGEX.test(email)) {
      status = "Invalid email";
      ok = false;
    }

    const normalizedEmail = email.toLowerCase();
    if (ok && seen.has(normalizedEmail)) {
      status = "Duplicate email";
      ok = false;
    }

    if (ok) {
      seen.add(normalizedEmail);
    }

    return {
      rowId: `${index}-${email || name}`,
      name,
      email,
      phone,
      status,
      ok,
    };
  });
}

export default function BulkInviteClient() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [rows, setRows] = useState<InviteRow[]>([]);
  const [sending, setSending] = useState(false);

  const readyCount = useMemo(() => rows.filter((r) => r.ok).length, [rows]);
  const errorCount = useMemo(() => rows.filter((r) => !r.ok).length, [rows]);

  const onPickFile = () => {
    inputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a CSV file.");
      return;
    }

    const content = await file.text();
    const parsed = parseCsv(content).slice(0, 5000);

    setFileName(file.name);
    setRows(parsed);

    if (parsed.length === 0) {
      toast.error("No rows found in CSV.");
      return;
    }

    toast.success(
      `Parsed ${parsed.length} row${parsed.length === 1 ? "" : "s"}. ${parsed.filter((r) => r.ok).length} ready to invite.`,
    );
  };

  const onSendInvites = async () => {
    const readyRows = rows.filter((r) => r.ok);
    if (readyRows.length === 0) {
      toast.error("No valid rows to invite.");
      return;
    }

    setSending(true);

    let sent = 0;
    const updatedRows = [...rows];

    for (const row of readyRows) {
      const res = await progressService.inviteClient({
        email: row.email,
        first_name: row.name.split(" ")[0] || undefined,
      });

      const idx = updatedRows.findIndex((r) => r.rowId === row.rowId);
      if (idx === -1) continue;

      if (res.success) {
        updatedRows[idx] = { ...updatedRows[idx], status: "Sent", ok: false };
        sent += 1;
      } else {
        updatedRows[idx] = {
          ...updatedRows[idx],
          status: res.message || "Failed to send",
          ok: false,
        };
      }
    }

    setRows(updatedRows);
    setSending(false);

    if (sent > 0) {
      toast.success(`Sent ${sent} invitation${sent === 1 ? "" : "s"}.`);
    }
    if (sent < readyRows.length) {
      toast.error(`${readyRows.length - sent} invite${readyRows.length - sent === 1 ? "" : "s"} failed.`);
    }
  };

  return (
    <TrainerDashboardShell activeItem="Clients" crumb="Bulk invite">
      <div className="max-w-[860px]">
        <h1
          className="text-[30px] font-medium tracking-[-0.024em] mb-2"
          style={{ color: "var(--ink)" }}
        >
          Bulk invite · CSV
        </h1>
        <p className="text-[13.5px] mb-5.5" style={{ color: "var(--fg-3)" }}>
          Upload a CSV with columns name, email, phone and we will send
          invitation links to valid rows.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={onFileChange}
        />

        <div
          className="rounded-(--r-3) p-5.5"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          <button
            type="button"
            onClick={onPickFile}
            className="w-full rounded-(--r-3) p-8 text-center mb-4.5 cursor-pointer"
            style={{ border: "2px dashed var(--border-2)", background: "transparent" }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--fg-3)"
              strokeWidth="1.3"
              className="mx-auto mb-3"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <div className="text-[14px] font-medium mb-1" style={{ color: "var(--ink)" }}>
              {fileName ? `Loaded ${fileName}` : "Choose CSV file"}
            </div>
            <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
              Max 5,000 rows
            </div>
          </button>

          <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>
            Preview {fileName ? `· ${fileName}` : ""} · {readyCount} ready · {errorCount} issues
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13.5px] min-w-[620px]">
              <thead>
                <tr>
                  {["Name", "Email", "Phone", "Status"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-3.5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.04em]"
                      style={{
                        color: "var(--fg-3)",
                        borderBottom: "1px solid var(--border)",
                        background: "var(--bg-2)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-4 text-[12.5px]"
                      style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)" }}
                    >
                      Upload a CSV file to preview rows.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.rowId} className="hover:bg-[var(--bg-2)]">
                      <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                        {row.name}
                      </td>
                      <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                        {row.email || "-"}
                      </td>
                      <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                        {row.phone}
                      </td>
                      <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                        <span
                          className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.04em]"
                          style={
                            row.status === "Sent"
                              ? { background: "var(--signal-soft)", color: "var(--signal-ink)" }
                              : row.ok
                                ? { background: "var(--bg-2)", color: "var(--ink)", border: "1px solid var(--border)" }
                                : { background: "var(--danger-soft)", color: "var(--danger)" }
                          }
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-3.5 px-5 py-4 rounded-(--r-3)"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          <div className="text-[13px]" style={{ color: "var(--fg-2)" }}>
            <strong className="font-medium" style={{ color: "var(--ink)" }}>
              {readyCount} invite{readyCount === 1 ? "" : "s"} ready.
            </strong>{" "}
            {errorCount > 0 ? `${errorCount} row${errorCount === 1 ? "" : "s"} need fixes.` : "No validation issues."}
          </div>
          <button
            type="button"
            onClick={onSendInvites}
            disabled={sending || readyCount === 0}
            className="px-3.5 py-2 rounded-(--r-2) text-[13px] font-medium cursor-pointer flex-shrink-0 disabled:opacity-50"
            style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}
          >
            {sending ? "Sending invites..." : `Send ${readyCount} invite${readyCount === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </TrainerDashboardShell>
  );
}
