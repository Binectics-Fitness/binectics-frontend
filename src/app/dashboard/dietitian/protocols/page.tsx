"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import { nutritionService, type Protocol } from "@/lib/api/nutrition";
import { toast } from "@/components/Toast";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { DIETITIAN_PROGRAMS_CONFIG } from "@/components/programs/config";
import { conversionMessage } from "@/components/programs/protocol-retirement";

/**
 * Protocols are retired: a protocol is a Program with no schedule, and
 * "applying" one only ever produced a Recommendation, which clients no
 * longer see. This page lists the protocols still to move over and turns
 * each into a draft Program ("Open as program"), which the API archives the
 * protocol behind. New protocols can't be created or edited.
 */
export default function DietitianProtocolsPage() {
  const router = useRouter();
  const { fmtDate } = useOrgFormat();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void nutritionService.listProtocols({ limit: 200 }).then((res) => {
      if (!mounted) return;
      if (res.success && res.data) {
        setProtocols(res.data.items);
        setTotal(res.data.total);
        setError(null);
      } else {
        setProtocols([]);
        setTotal(0);
        setError(res.message ?? "Failed to load protocols.");
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [refreshTick]);

  const refetch = () => {
    setLoading(true);
    setError(null);
    setRefreshTick((t) => t + 1);
  };

  const openAsProgram = async (protocol: Protocol) => {
    setBusyId(protocol._id);
    const res = await nutritionService.convertProtocol(protocol._id);
    setBusyId(null);
    if (res.success && res.data) {
      toast.success(conversionMessage(protocol.name, res.data));
      router.push(`${DIETITIAN_PROGRAMS_CONFIG.basePath}?edit=${res.data.template._id}`);
    } else {
      toast.error(res.message ?? "Couldn't convert this protocol.");
    }
  };

  const archive = async (protocol: Protocol) => {
    if (
      !confirm(
        `Archive "${protocol.name}" without converting it? It won't be listed here again, and its steps won't carry over to Programs.`,
      )
    )
      return;
    const res = await nutritionService.archiveProtocol(protocol._id);
    if (res.success) {
      toast.success(`Archived "${protocol.name}".`);
      refetch();
    } else {
      toast.error(res.message ?? "Failed to archive protocol.");
    }
  };

  return (
    <DietitianDashboardShell activeItem="Programs" crumb="Protocols">
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Protocols</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          {loading ? "Loading protocols..." : error ? "Couldn't load protocols" : `${total} to move over`}
        </div>
      </div>

      <div className="rounded-(--r-3) px-4.5 py-4 flex flex-col gap-1.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Protocols are now Programs</div>
        <div className="text-[13px]" style={{ color: "var(--fg-2)", lineHeight: 1.55, maxWidth: "70ch" }}>
          A program does everything a protocol did, and clients see its steps as tasks on their Today. Open each
          protocol as a program: its steps become tasks in a draft you can schedule and publish. The protocol is
          archived once it&apos;s converted.
        </div>
        <Link href={DIETITIAN_PROGRAMS_CONFIG.basePath} className="text-[13px] font-medium underline self-start" style={{ color: "var(--ink)" }}>
          Go to Programs
        </Link>
      </div>

      {error && (
        <div className="rounded-(--r-2) px-4 py-3 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
          {error}{" "}
          <button type="button" onClick={refetch} className="underline cursor-pointer" style={{ color: "inherit" }}>Retry</button>
        </div>
      )}

      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px] min-w-[760px]" style={{ fontVariantNumeric: "tabular-nums" }}>
            <thead>
              <tr style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}>
                {["Protocol", "Duration", "Steps", "Updated", ""].map((h, hi) => (
                  <th key={`${h}-${hi}`} className={`px-4.5 py-2.5 font-medium font-mono text-[10.5px] uppercase tracking-[0.04em] ${hi === 1 || hi === 2 ? "text-right" : "text-left"}`} style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {protocols.map((p, i) => (
                <tr key={p._id} style={{ borderBottom: i < protocols.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <td className="px-4.5 py-3">
                    <div className="font-medium" style={{ color: "var(--ink)" }}>{p.name}</div>
                    {p.description && (
                      <div className="text-[12.5px] mt-0.5 line-clamp-1" style={{ color: "var(--fg-3)" }}>{p.description}</div>
                    )}
                  </td>
                  <td className="px-4.5 py-3 text-right font-mono" style={{ color: "var(--ink)" }}>
                    {p.duration_weeks != null ? `${p.duration_weeks} wk` : "-"}
                  </td>
                  <td className="px-4.5 py-3 text-right font-mono" style={{ color: "var(--ink)" }}>{p.steps.length}</td>
                  <td className="px-4.5 py-3" style={{ color: "var(--fg-2)" }}>{fmtDate(p.updated_at)}</td>
                  <td className="px-4.5 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => void openAsProgram(p)}
                        disabled={busyId === p._id}
                        aria-busy={busyId === p._id}
                        aria-label={`Open as program: ${p.name}`}
                        className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1) cursor-pointer disabled:opacity-50"
                        style={{ border: "1px solid var(--border)", color: "var(--dietitian)", background: "transparent" }}
                      >
                        {busyId === p._id ? "Converting…" : "Open as program"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void archive(p)}
                        disabled={busyId === p._id}
                        aria-label={`Archive: ${p.name}`}
                        className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1) cursor-pointer disabled:opacity-50"
                        style={{ border: "1px solid var(--border)", color: "var(--fg-3)", background: "transparent" }}
                      >
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4.5 py-4"><AsyncSpinner label="Loading protocols" /></td>
                </tr>
              )}
              {!loading && !error && protocols.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4.5 py-6">
                    <EmptySlate message="Nothing left to move over." hint="Build new plans of care under Programs." mt="mt-0" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DietitianDashboardShell>
  );
}
