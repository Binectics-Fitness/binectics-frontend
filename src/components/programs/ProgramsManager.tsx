"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AsyncSpinner, EmptySlate, StatusPill } from "@/components/ds";
import { instanceStatusTone, templateStatusTone } from "@/lib/ui/statusTones";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import SearchableSelect from "@/components/SearchableSelect";
import { progressService, type ClientProfile } from "@/lib/api/progress";
import { toast } from "@/components/Toast";
import { PlanGate } from "@/components/ds/PlanGate";
import { parseBillingError, type BillingError } from "@/lib/utils/billingErrors";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { ContentPricingModal } from "@/components/content/ContentPricingModal";
import { usePaidContentSeller } from "@/hooks/usePaidContentSeller";
import { accessToRaw, normalizeAccess } from "@/lib/api/paidContent";
import { accessSummary, isPaid } from "@/lib/paidContent/helpers";
import { nutritionService } from "@/lib/api/nutrition";
import { libraryErrorMessage } from "@/lib/exercises/library";
import { leftoverProtocolsText } from "./protocol-retirement";
import type { ProgramsRoleConfig } from "./config";
import { NewProgramDialog } from "./builder/NewProgramDialog";
import { programsService, type ProgramTemplate, type ProgramInstance } from "@/lib/api/programs";

function instanceClientName(i: ProgramInstance): string {
  if (i.client_name?.trim()) return i.client_name.trim();
  if (typeof i.client_id === "object" && i.client_id !== null) {
    return `${i.client_id.first_name} ${i.client_id.last_name}`.trim();
  }
  return "Client";
}

const fieldStyle: React.CSSProperties = {
  background: "var(--bg-2)",
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
      {children}
    </label>
  );
}

function clientName(c: ClientProfile): string {
  if (typeof c.client_id === "object" && c.client_id !== null) {
    return `${c.client_id.first_name} ${c.client_id.last_name}`.trim();
  }
  return "Client";
}

// ─── Assign-to-client modal ──────────────────────────────────────────────────

function AssignProgramModal({
  template,
  onClose,
  onAssigned,
}: {
  template: ProgramTemplate;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [selected, setSelected] = useState("");
  const [startDate, setStartDate] = useState("");
  const [assigning, setAssigning] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await progressService.getMyClientProfiles();
      if (!active) return;
      if (res.success && res.data) {
        setClients(res.data.filter((c) => c.is_active));
        setClientsError(null);
      } else {
        setClientsError(res.message || "We couldn't load your clients.");
      }
      setLoadingClients(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleAssign = async () => {
    if (!selected) return;
    setAssigning(true);
    const res = await programsService.assign(template._id, {
      client_profile_id: selected,
      start_date: startDate || undefined,
    });
    setAssigning(false);
    if (res.success && res.data) {
      const target = clients.find((c) => c._id === selected);
      toast.success(`"${template.name}" assigned to ${target ? clientName(target) : "client"}.`);
      onAssigned();
      onClose();
    } else {
      toast.error(res.message ?? "Failed to assign program.");
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(3,20,30,0.55)" }}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-md rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(3,20,30,0.2)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-[17px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>Assign program</h2>
          <p className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>
            Gives the client their own copy of &ldquo;{template.name}&rdquo; with a schedule of tasks.
          </p>
        </div>
        <div className="p-6 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <FieldLabel>Client</FieldLabel>
            {clientsError ? (
              <div className="rounded-(--r-2) px-3 py-2.5 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger-ink)", border: "1px solid var(--danger)" }}>
                {clientsError}
              </div>
            ) : !loadingClients && clients.length === 0 ? (
              <EmptySlate message="No active clients yet." hint="Add a client first, then assign programs." mt="mt-0" />
            ) : (
              <SearchableSelect
                value={selected}
                onChange={setSelected}
                options={clients.map((c) => ({ label: clientName(c), value: c._id }))}
                placeholder={loadingClients ? "Loading clients…" : "Pick a client…"}
                loading={loadingClients}
              />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>Start date</FieldLabel>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
              style={fieldStyle}
            />
            <span className="text-[11.5px]" style={{ color: "var(--fg-4)" }}>Leave blank to start today.</span>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          <button type="button" onClick={onClose} className="h-9 px-4 rounded-(--r-2) text-[13px] font-medium" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--ink)" }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={!selected || assigning}
            className="h-9 px-5 rounded-(--r-2) text-[13px] font-medium disabled:opacity-50"
            style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}
          >
            {assigning ? "Assigning..." : "Assign program"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Assignments (clients) modal ─────────────────────────────────────────────

function AssignmentsModal({
  template,
  basePath,
  onClose,
  onAssign,
}: {
  template: ProgramTemplate;
  basePath: string;
  onClose: () => void;
  /** Set when the program can be assigned (published, not archived). */
  onAssign?: () => void;
}) {
  const [instances, setInstances] = useState<ProgramInstance[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await programsService.listAssignments(template._id);
      if (!active) return;
      if (res.success && res.data) setInstances(res.data);
      else setError(res.message || "We couldn't load assignments.");
    })();
    return () => {
      active = false;
    };
  }, [template._id]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(3,20,30,0.55)" }}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-lg rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(3,20,30,0.2)" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-[17px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>
            Clients on this program
          </h2>
          <button type="button" onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-(--r-2)" style={{ color: "var(--fg-3)", border: "1px solid var(--border)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {error ? (
            <div className="rounded-(--r-2) px-3 py-2.5 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger-ink)", border: "1px solid var(--danger)" }}>{error}</div>
          ) : instances === null ? (
            <AsyncSpinner size="page" label="Loading clients" />
          ) : instances.length === 0 ? (
            <EmptySlate
              message="No clients on this program."
              mt="mt-0"
              action={
                onAssign && (
                  <button
                    type="button"
                    onClick={onAssign}
                    className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1)"
                    style={{ border: "1px solid var(--border)", color: "var(--ink)", background: "transparent" }}
                  >
                    Assign
                  </button>
                )
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {instances.map((i) => (
                <Link
                  key={i._id}
                  href={`${basePath}/instances/${i._id}`}
                  className="flex items-center justify-between gap-3 rounded-(--r-2) px-3.5 py-3"
                  style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
                >
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium truncate" style={{ color: "var(--ink)" }}>{instanceClientName(i)}</div>
                    <div className="text-[12px] mt-0.5" style={{ color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>
                      {i.occurrences_done} / {i.occurrences_scheduled} tasks done
                    </div>
                  </div>
                  <StatusPill tone={instanceStatusTone(i.status)} label={i.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Template card ───────────────────────────────────────────────────────────

function ProgramCard({
  template,
  onEdit,
  onPublish,
  onAssign,
  onViewClients,
  onArchive,
  onRestore,
  onPricing,
  fmtDate,
}: {
  template: ProgramTemplate;
  onEdit: () => void;
  onPublish: () => void;
  onAssign: () => void;
  onViewClients: () => void;
  onArchive: () => void;
  onRestore: () => void;
  /** Present while paid content is on (or the program is already paid). */
  onPricing?: () => void;
  fmtDate: (d: string | Date) => string;
}) {
  const access = normalizeAccess(template.access);
  const STATUS_LABEL: Record<ProgramTemplate["status"], string> = {
    draft: "Draft",
    published: "Published",
    archived: "Archived",
  };
  const isPublished = template.latest_published_version_no >= 1;
  const draftAhead = template.status !== "archived" && template.latest_version_no > template.latest_published_version_no;

  return (
    <div className="rounded-(--r-3) flex flex-col overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      <div className="px-5.5 pt-5 pb-3.5 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Published is ready to assign (success), on every role: the role
              accent says whose program it is, which the page already does. */}
          <StatusPill tone={templateStatusTone(template.status)} label={STATUS_LABEL[template.status]} />
          {draftAhead && isPublished && (
            // Neutral fill (not an accent) so it stays distinct from the
            // "Published" pill on every role, incl. the amber trainer accent.
            <span className="font-mono text-[10px] uppercase tracking-[0.05em] px-1.75 py-0.5 rounded-full" style={{ background: "var(--bg-3)", color: "var(--fg-2)", border: "1px solid var(--border-2)" }}>
              Unpublished changes
            </span>
          )}
          {isPaid(access) && (
            <span className="font-mono text-[10px] uppercase tracking-[0.05em] px-1.75 py-0.5 rounded-full" style={{ background: "var(--bg-3)", color: "var(--ink)" }}>
              {accessSummary(access)}
            </span>
          )}
          {template.category && (
            <span className="font-mono text-[10px] uppercase tracking-[0.05em] px-1.75 py-0.5 rounded-full" style={{ background: "var(--bg-3)", color: "var(--fg-3)" }}>
              {template.category}
            </span>
          )}
        </div>
        <div className="text-[16px] font-medium mt-1.5 truncate" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>{template.name}</div>
        <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>
          v{template.latest_version_no}
          {isPublished ? ` · published v${template.latest_published_version_no}` : " · never published"}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-5.5 py-3 flex-wrap" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex gap-2 flex-wrap">
          {template.status !== "archived" && (
            <button type="button" onClick={onEdit} className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1)" style={{ border: "1px solid var(--border)", color: "var(--fg-2)", background: "transparent" }}>
              Edit
            </button>
          )}
          {template.status !== "archived" && (draftAhead || !isPublished) && (
            <button type="button" onClick={onPublish} className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1)" style={{ border: "1px solid var(--border)", color: "var(--signal-ink)", background: "transparent" }}>
              Publish
            </button>
          )}
          {isPublished && template.status !== "archived" && (
            <button type="button" onClick={onAssign} className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1)" style={{ border: "1px solid var(--border)", color: "var(--ink)", background: "transparent" }}>
              Assign
            </button>
          )}
          {onPricing && template.status !== "archived" && (
            <button type="button" onClick={onPricing} className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1)" style={{ border: "1px solid var(--border)", color: "var(--fg-2)", background: "transparent" }}>
              Pricing
            </button>
          )}
          <button type="button" onClick={onViewClients} className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1)" style={{ border: "1px solid var(--border)", color: "var(--fg-2)", background: "transparent" }}>
            Clients
          </button>
          {template.status !== "archived" && (
            <button type="button" onClick={onArchive} className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1)" style={{ border: "1px solid var(--border)", color: "var(--danger)", background: "transparent" }}>
              Archive
            </button>
          )}
          {template.status === "archived" && (
            <button type="button" onClick={onRestore} className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.25 rounded-(--r-1)" style={{ border: "1px solid var(--border)", color: "var(--ink)", background: "transparent" }}>
              Restore
            </button>
          )}
        </div>
        <span className="font-mono text-[10.5px]" style={{ color: "var(--fg-4)" }}>{fmtDate(template.updated_at)}</span>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

type Filter = "All" | "Draft" | "Published" | "Archived";

export default function ProgramsManager({
  config,
  initialCreateOpen = false,
  initialEditId,
}: {
  config: ProgramsRoleConfig;
  initialCreateOpen?: boolean;
  /** Open this program's page on arrival (?edit=<id>). */
  initialEditId?: string;
}) {
  const { Shell, basePath, navItem, protocolsPath } = config;
  // Retired protocols not yet converted (unconverted = unarchived).
  const [leftoverProtocols, setLeftoverProtocols] = useState(0);
  const { fmtDate } = useOrgFormat();
  const router = useRouter();
  const [templates, setTemplates] = useState<ProgramTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("All");

  const [creating, setCreating] = useState(initialCreateOpen);
  const [assignTemplate, setAssignTemplate] = useState<ProgramTemplate | null>(null);
  // A publish the plan refused (F4), shown above the list.
  const [gate, setGate] = useState<BillingError | null>(null);
  /** Takes a failed response: true when it was the plan, now on screen. */
  const planRefused = (res: Parameters<typeof parseBillingError>[0]): boolean => {
    const billing = parseBillingError(res);
    setGate(billing);
    return billing != null;
  };
  const [clientsTemplate, setClientsTemplate] = useState<ProgramTemplate | null>(null);
  const [pricingTemplate, setPricingTemplate] = useState<ProgramTemplate | null>(null);
  // Pricing shows by the one paid-content rule, and not to a gym's staff trainer (D10).
  const { on: sellingOn, canPrice } = usePaidContentSeller();
  const { requestConfirmation, confirmationModal } = useConfirmationModal();

  // ?edit=<id> (protocol conversion) opens that program's page; ?new=1 the
  // New program dialog. Either way the list URL is left clean.
  useEffect(() => {
    if (initialEditId) router.replace(`${basePath}/${initialEditId}`);
    else if (initialCreateOpen) router.replace(basePath, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      // Archived programs load too, behind their own filter, so they can be
      // restored. "All" stays the live programs.
      const res = await programsService.listTemplates(true);
      if (!active) return;
      if (res.success && res.data) {
        setTemplates(res.data);
        setError(null);
      } else {
        setError(res.message || "Couldn't load your programs. Try again.");
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!protocolsPath) return;
    let active = true;
    void nutritionService.listProtocols({ limit: 1 }).then((res) => {
      if (active && res.success && res.data) setLeftoverProtocols(res.data.total);
    });
    return () => {
      active = false;
    };
  }, [protocolsPath]);


  const counts = useMemo(
    () => ({
      All: templates.filter((t) => t.status !== "archived").length,
      Draft: templates.filter((t) => t.status === "draft").length,
      Published: templates.filter((t) => t.status === "published").length,
      Archived: templates.filter((t) => t.status === "archived").length,
    }),
    [templates],
  );

  // Restoring the last archived program hides that filter; don't leave the
  // list on an empty view whose chip is gone.
  const activeFilter: Filter = filter === "Archived" && counts.Archived === 0 ? "All" : filter;

  const filtered = useMemo(() => {
    if (activeFilter === "Draft") return templates.filter((t) => t.status === "draft");
    if (activeFilter === "Published") return templates.filter((t) => t.status === "published");
    if (activeFilter === "Archived") return templates.filter((t) => t.status === "archived");
    return templates.filter((t) => t.status !== "archived");
  }, [templates, activeFilter]);

  const openCreate = () => {
    setGate(null);
    setCreating(true);
  };

  const openProgram = (t: ProgramTemplate) => router.push(`${basePath}/${t._id}`);

  const handlePublish = (t: ProgramTemplate) => {
    setGate(null);
    requestConfirmation({
      title: `Publish "${t.name}"?`,
      description:
        "This freezes the current version so you can assign it. Later edits start a new draft. Clients already on this program stay on the version they started.",
      confirmLabel: "Publish program",
      confirmVariant: "primary",
      onConfirm: async () => {
        const res = await programsService.publishTemplate(t._id);
        if (res.success && res.data) {
          setTemplates((list) => list.map((x) => (x._id === t._id ? res.data!.template : x)));
          toast.success("Program published.");
        } else if (!planRefused(res)) {
          toast.error(libraryErrorMessage(res) ?? res.message ?? "Failed to publish program.");
        }
      },
    });
  };

  const handleArchive = (t: ProgramTemplate) => {
    setGate(null);
    requestConfirmation({
      title: `Archive "${t.name}"?`,
      description:
        "It moves to Archived, where you can restore it later. Clients already on it keep their programs.",
      confirmLabel: "Archive program",
      confirmVariant: "danger",
      onConfirm: async () => {
        const res = await programsService.archiveTemplate(t._id);
        if (res.success) {
          setTemplates((list) => list.map((x) => (x._id === t._id ? { ...x, status: "archived" } : x)));
          toast.success("Program archived.");
        } else {
          toast.error(res.message ?? "Failed to archive program.");
        }
      },
    });
  };

  const handleRestore = (t: ProgramTemplate) => {
    setGate(null);
    requestConfirmation({
      title: `Restore "${t.name}"?`,
      description:
        t.latest_version_no === t.latest_published_version_no
          ? "It returns as published."
          : "It returns as a draft.",
      confirmLabel: "Restore program",
      confirmVariant: "primary",
      onConfirm: async () => {
        const res = await programsService.restoreTemplate(t._id);
        if (res.success && res.data) {
          const restored = res.data.template;
          // Keep the card's summary (task counts) the list read gave it.
          setTemplates((list) => list.map((x) => (x._id === t._id ? { ...x, ...restored } : x)));
          toast.success("Program restored.");
        } else {
          toast.error(res.message ?? "Failed to restore program.");
        }
      },
    });
  };

  // Archived only appears once there is something in it.
  const FILTERS: Filter[] = counts.Archived > 0 ? ["All", "Draft", "Published", "Archived"] : ["All", "Draft", "Published"];
  return (
    <Shell activeItem={navItem} crumb={navItem}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
        <div>
          <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Programs</h1>
          <p className="text-[13.5px] mt-1" style={{ color: "var(--fg-3)" }}>
            {loading ? "Loading..." : `${counts.Published} published · ${counts.Draft} draft`}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-signal-v2 inline-flex items-center gap-2 self-start sm:self-auto"
          style={{ height: "36px", padding: "0 16px", fontSize: "13px" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          New program
        </button>
      </div>

      {protocolsPath && leftoverProtocols > 0 && (
        <div className="rounded-(--r-3) px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-[13px]" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg-2)" }}>
          <span>{leftoverProtocolsText(leftoverProtocols)}</span>
          <Link href={protocolsPath} className="font-medium underline" style={{ color: "var(--ink)" }}>
            Review protocols
          </Link>
        </div>
      )}

      {gate && <PlanGate gate={gate} />}

      {error && (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.92 0.05 25)", color: "var(--danger-ink)" }}>
          <div className="font-medium">Couldn&apos;t load programs</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>{error}</div>
        </div>
      )}

      {!loading && !error && templates.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-[5px] rounded-full cursor-pointer"
              style={{
                background: activeFilter === f ? "var(--ink)" : "var(--bg)",
                color: activeFilter === f ? "var(--bg)" : "var(--fg-3)",
                border: activeFilter === f ? "1px solid var(--ink)" : "1px solid var(--border)",
              }}
            >
              {f} <span style={{ color: activeFilter === f ? "oklch(0.75 0.005 85)" : "var(--fg-4)", marginLeft: 4 }}>{counts[f]}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <AsyncSpinner size="page" label="Loading programs" />
      ) : !error && templates.length === 0 ? (
        <div className="rounded-(--r-3) flex flex-col items-center justify-center gap-3 py-16 mt-2" style={{ border: "1.5px dashed var(--border-2)" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="1.3"><path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          <div className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>No programs yet</div>
          <button type="button" onClick={openCreate} className="mt-1 h-9 px-5 rounded-(--r-2) text-[13px] font-medium" style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}>
            New program
          </button>
        </div>
      ) : !error && filtered.length === 0 ? (
        <EmptySlate
          message={activeFilter === "All" ? "No live programs." : `No ${activeFilter.toLowerCase()} programs.`}
          mt="mt-2"
          action={
            activeFilter === "All" && (
              <button type="button" onClick={openCreate} className="h-8 px-3.5 rounded-(--r-2) text-[12.5px] font-medium cursor-pointer" style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}>
                New program
              </button>
            )
          }
        />
      ) : !error ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <ProgramCard
              key={t._id}
              template={t}
              fmtDate={fmtDate}
              onEdit={() => openProgram(t)}
              onPublish={() => handlePublish(t)}
              onAssign={() => setAssignTemplate(t)}
              onViewClients={() => setClientsTemplate(t)}
              onArchive={() => handleArchive(t)}
              onRestore={() => handleRestore(t)}
              onPricing={canPrice && (sellingOn || isPaid(normalizeAccess(t.access))) ? () => setPricingTemplate(t) : undefined}
            />
          ))}
        </div>
      ) : null}

      {creating && <NewProgramDialog programs={templates} basePath={basePath} onClose={() => setCreating(false)} />}

      {assignTemplate && (
        <AssignProgramModal
          template={assignTemplate}
          onClose={() => setAssignTemplate(null)}
          onAssigned={() => setClientsTemplate(assignTemplate)}
        />
      )}

      {pricingTemplate && (
        <ContentPricingModal
          open
          onClose={() => setPricingTemplate(null)}
          kind="program"
          itemId={pricingTemplate._id}
          title={pricingTemplate.name}
          rawAccess={pricingTemplate.access}
          needsPublish={pricingTemplate.latest_published_version_no < 1}
          onSaved={(access) => {
            const raw = accessToRaw(access);
            setTemplates((list) => list.map((x) => (x._id === pricingTemplate._id ? { ...x, access: raw } : x)));
            setPricingTemplate((cur) => (cur ? { ...cur, access: raw } : cur));
          }}
        />
      )}

      {clientsTemplate && (
        <AssignmentsModal
          template={clientsTemplate}
          basePath={basePath}
          onClose={() => setClientsTemplate(null)}
          onAssign={
            clientsTemplate.latest_published_version_no > 0 && clientsTemplate.status !== "archived"
              ? () => {
                  setAssignTemplate(clientsTemplate);
                  setClientsTemplate(null);
                }
              : undefined
          }
        />
      )}
      {confirmationModal}
    </Shell>
  );
}
