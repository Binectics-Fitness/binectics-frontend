"use client";

import { createElement, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AddLocationModal } from "@/components/ds/modals/AddLocationModal";
import { StatusPill } from "@/components/ds";
import FacilityItemFormModal, {
  type FacilityFormValues,
  type RemoveImageResult,
} from "@/components/FacilityItemFormModal";
import { toast } from "@/components/Toast";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { useOrganization } from "@/contexts/OrganizationContext";
import { marketplaceService } from "@/lib/api/marketplace";
import {
  FACILITY_CATEGORY_LABELS,
  FACILITY_STATUS_LABELS,
  getFacilityIcon,
} from "@/lib/constants/facility-catalogue";
import {
  useAddFacilityItem,
  useDeleteFacilityItem,
  useFacilityItems,
  useUpdateFacilityItem,
} from "@/lib/queries/marketplace";
import { queryKeys } from "@/lib/queries/keys";
import { FacilityStatus, type FacilityItem } from "@/lib/types";

export function AddLocationButton() {
  const [open, setOpen] = useState(false);
  const { currentOrg } = useOrganization();
  return (
    <>
      <button className="btn-primary-v2 sm" onClick={() => setOpen(true)}>+ Add location</button>
      <AddLocationModal open={open} onClose={() => setOpen(false)} organizationId={currentOrg?._id ?? null} />
    </>
  );
}

/**
 * One listing's facilities: the list, add, edit (photo removal included) and
 * remove. Collapsed until opened, so the locations page stays a summary.
 */
export function FacilityItemsPanel({
  listingId,
  listingName,
  onCountChange,
}: {
  listingId: string;
  listingName: string;
  onCountChange?: (count: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FacilityItem | null>(null);
  const queryClient = useQueryClient();
  const { data: items = [], isLoading, isError, refetch } = useFacilityItems(expanded ? listingId : undefined);
  const addItem = useAddFacilityItem(listingId);
  const updateItem = useUpdateFacilityItem(listingId);
  const deleteItem = useDeleteFacilityItem(listingId);
  const { requestConfirmation, confirmationModal } = useConfirmationModal();
  const panelId = `facilities-${listingId}`;

  const loaded = expanded && !isLoading && !isError;
  useEffect(() => {
    if (loaded) onCountChange?.(items.length);
  }, [loaded, items.length, onCountChange]);

  function openForm(item: FacilityItem | null) {
    setEditing(item);
    setFormOpen(true);
  }

  async function handleSubmit(values: FacilityFormValues) {
    const payload = {
      name: values.name.trim(),
      category: values.category,
      status: values.status,
      condition: values.condition,
      description: values.description,
      icon_key: values.icon_key,
      gradient: values.gradient,
      is_featured: values.is_featured,
      image: values.image,
    };
    const res = editing
      ? await updateItem.mutateAsync({ itemId: editing._id, payload })
      : await addItem.mutateAsync(payload);
    if (res.success) {
      toast.success(editing ? "Facility saved" : "Facility added");
      setFormOpen(false);
    } else {
      toast.error(res.message || "Couldn't save the facility. Try again.");
    }
  }

  async function handleRemoveImage(): Promise<RemoveImageResult> {
    if (!editing) return {};
    const res = await marketplaceService.removeFacilityItemImage(listingId, editing._id);
    if (!res.success) return { error: res.message || "Couldn't remove the photo. Try again." };
    toast.success("Photo removed");
    void queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.facilityItems(listingId) });
    return {};
  }

  function handleDelete(item: FacilityItem) {
    requestConfirmation({
      title: `Remove ${item.name}?`,
      description: "It comes off this listing.",
      confirmLabel: "Remove facility",
      confirmVariant: "danger",
      onConfirm: async () => {
        const res = await deleteItem.mutateAsync(item._id);
        if (res.success) toast.success(`${item.name} removed`);
        else toast.error(res.message || "Couldn't remove the facility. Try again.");
      },
    });
  }

  return (
    <div style={{ borderTop: "1px solid var(--border)" }}>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((v) => !v)}
        className="w-full min-h-11 flex items-center justify-between px-4.5 text-[13px] font-medium cursor-pointer hover:bg-bg-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
        style={{ color: "var(--ink)" }}
      >
        Facilities
        <span aria-hidden style={{ color: "var(--fg-3)" }}>{expanded ? "−" : "+"}</span>
      </button>
      {expanded && (
        <div id={panelId} className="px-4.5 pt-1 pb-4 flex flex-col gap-2">
          {isLoading ? (
            <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>Loading facilities…</p>
          ) : isError ? (
            <div role="alert" className="flex items-center justify-between gap-2 text-[13px]" style={{ color: "var(--danger-ink)" }}>
              Couldn&apos;t load the facilities.
              <button type="button" className="btn-ghost-v2 sm min-h-11" onClick={() => void refetch()}>
                Try again
              </button>
            </div>
          ) : (
            <>
              {items.length === 0 ? (
                <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>No facilities yet.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {items.map((item) => (
                    <li
                      key={item._id}
                      className="flex items-center gap-3 rounded-(--r-2) p-2"
                      style={{ border: "1px solid var(--border)" }}
                    >
                      <FacilityThumb item={item} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-medium truncate" style={{ color: "var(--ink)" }}>{item.name}</div>
                        <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>
                          {FACILITY_CATEGORY_LABELS[item.category] ?? item.category}
                        </div>
                      </div>
                      <span className="hidden sm:block">
                        <StatusPill
                          label={FACILITY_STATUS_LABELS[item.status] ?? item.status}
                          tone={item.status === FacilityStatus.MAINTENANCE ? "warn" : "neutral"}
                        />
                      </span>
                      <button
                        type="button"
                        className="btn-ghost-v2 sm min-h-11"
                        aria-label={`Edit ${item.name}`}
                        onClick={() => openForm(item)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-ghost-v2 sm min-h-11"
                        aria-label={`Remove ${item.name}`}
                        style={{ color: "var(--danger-ink)" }}
                        onClick={() => handleDelete(item)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                className="btn-ghost-v2 sm min-h-11 self-start"
                aria-label={`Add a facility to ${listingName}`}
                onClick={() => openForm(null)}
              >
                + Add facility
              </button>
            </>
          )}
        </div>
      )}
      <FacilityItemFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        saving={addItem.isPending || updateItem.isPending}
        onRemoveImage={editing ? handleRemoveImage : undefined}
      />
      {confirmationModal}
    </div>
  );
}

function FacilityThumb({ item }: { item: FacilityItem }) {
  if (item.image_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.image_url} alt="" className="h-10 w-10 shrink-0 rounded-(--r-1) object-cover" />;
  }
  // A module-level lucide icon looked up by key, not a component made here.
  // A neutral tile: the catalogue's gradients name pre-v2 colours that no
  // longer exist, so they would draw nothing.
  const icon = createElement(getFacilityIcon(item.icon_key), { className: "h-5 w-5", "aria-hidden": true });
  return (
    <span
      className="h-10 w-10 shrink-0 rounded-(--r-1) flex items-center justify-center"
      style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}
    >
      {icon}
    </span>
  );
}
