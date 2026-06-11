"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { authService } from "@/lib/api/auth";

export default function MemberPublicProfilePage() {
  const current = authService.getCurrentUser();

  const [form, setForm] = useState({
    first_name: current?.first_name ?? "",
    last_name: current?.last_name ?? "",
    other_name: current?.other_name ?? "",
    phone_number: current?.phone_number ?? "",
    country_code: current?.country_code ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fullName = useMemo(() => {
    const base = `${form.first_name} ${form.last_name}`.trim();
    return base || "Unnamed member";
  }, [form.first_name, form.last_name]);

  const onSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    const res = await authService.updateProfile({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      other_name: form.other_name.trim() || undefined,
      phone_number: form.phone_number.trim() || undefined,
      country_code: form.country_code.trim() || undefined,
    });

    if (res.success && res.data) {
      authService.updateUser(res.data);
      setMessage("Profile updated successfully.");
    } else {
      setError(res.message ?? "Failed to update profile.");
    }

    setSaving(false);
  };

  return (
    <MemberDashboardShell activeLabel="Home">
      <div
        style={{
          background: "oklch(0.96 0.06 75)",
          border: "1px solid oklch(0.88 0.07 75)",
          borderRadius: 10,
          padding: "12px 16px",
          marginBottom: 18,
          fontSize: 13,
          color: "oklch(0.32 0.16 75)",
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        Keep profile details up to date so providers can contact you.
        <Link
          href="/dashboard/settings"
          style={{
            marginLeft: 6,
            color: "var(--ink)",
            textDecoration: "underline",
          }}
        >
          Open settings
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-8">
        <div
          style={{
            width: 160,
            height: 160,
            borderRadius: 16,
            background:
              "linear-gradient(135deg, oklch(0.85 0.04 120), oklch(0.72 0.06 100))",
          }}
        />

        <div>
          <h1
            style={{
              fontSize: 30,
              letterSpacing: "-0.024em",
              fontWeight: 500,
              color: "var(--ink)",
            }}
          >
            {fullName}
          </h1>
          <p style={{ color: "var(--fg-3)", marginTop: 6 }}>
            {current?.email ?? "No email on file"}
          </p>
        </div>
      </div>

      <div
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 22,
          marginTop: 14,
        }}
      >
        <h3
          style={{
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 14,
            color: "var(--ink)",
          }}
        >
          Profile details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: "first_name", label: "First name" },
            { key: "last_name", label: "Last name" },
            { key: "other_name", label: "Other name" },
            { key: "phone_number", label: "Phone number" },
            { key: "country_code", label: "Country" },
          ].map((field) => (
            <label key={field.key} className="flex flex-col gap-1">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
                {field.label}
              </span>
              <input
                value={form[field.key as keyof typeof form]}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
                className="h-10 rounded-(--r-2) px-3 text-[13px]"
                style={{
                  background: "var(--bg-2)",
                  border: "1px solid var(--border)",
                  color: "var(--ink)",
                }}
              />
            </label>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-4">
          <button
            className="btn-primary-v2 sm"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
          {message && (
            <span className="text-[12px]" style={{ color: "var(--signal-ink)" }}>
              {message}
            </span>
          )}
          {error && (
            <span className="text-[12px]" style={{ color: "var(--danger)" }}>
              {error}
            </span>
          )}
        </div>
      </div>
    </MemberDashboardShell>
  );
}
