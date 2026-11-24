"use client";

import { createElement, useEffect, useRef, useState } from "react";
import Modal from "@/components/Modal";
import SearchableSelect from "@/components/SearchableSelect";
import {
  FacilityCategory,
  FacilityCondition,
  FacilityStatus,
  type FacilityItem,
} from "@/lib/types";
import {
  FACILITY_CATEGORY_LABELS,
  FACILITY_CONDITION_LABELS,
  FACILITY_ICON_OPTIONS,
  FACILITY_STATUS_LABELS,
  GRADIENT_OPTIONS,
  getFacilityGradient,
  getFacilityIcon,
} from "@/lib/constants/facility-catalogue";
import { Loader2, Trash2, Upload, X } from "lucide-react";

export interface FacilityFormValues {
  name: string;
  category: FacilityCategory;
  status: FacilityStatus;
  condition: FacilityCondition;
  description: string;
  icon_key?: string;
  gradient?: string;
  is_featured: boolean;
  image?: File;
}

/** What removing the saved photo came to: nothing on success, else why not. */
export interface RemoveImageResult {
  error?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: FacilityFormValues) => Promise<void>;
  initial?: FacilityItem | null;
  saving?: boolean;
  /**
   * Takes the saved photo off the item being edited, straight away and on
   * its own (the API refuses it in the same save as a new photo). Offered
   * only while editing an item that has a photo and no new one is picked.
   */
  onRemoveImage?: () => Promise<RemoveImageResult>;
}

const empty: FacilityFormValues = {
  name: "",
  category: FacilityCategory.EQUIPMENT,
  status: FacilityStatus.AVAILABLE,
  condition: FacilityCondition.EXCELLENT,
  description: "",
  icon_key: FACILITY_ICON_OPTIONS[0].key,
  gradient: GRADIENT_OPTIONS[0].key,
  is_featured: false,
};

export default function FacilityItemFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  saving = false,
  onRemoveImage,
}: Props) {
  const [values, setValues] = useState<FacilityFormValues>(empty);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // The photo the item has on the API; gone once it is removed here.
  const [savedImage, setSavedImage] = useState<string | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [removingImage, setRemovingImage] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    // Opening the modal resets the form to the item being edited (or blank);
    // `open` and `initial` come from the parent, not from this form's state.
    if (initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues({
        name: initial.name,
        category: initial.category,
        status: initial.status,
        condition: initial.condition,
        description: initial.description ?? "",
        icon_key: initial.icon_key ?? FACILITY_ICON_OPTIONS[0].key,
        gradient: initial.gradient ?? GRADIENT_OPTIONS[0].key,
        is_featured: initial.is_featured,
      });
      setImagePreview(initial.image_url ?? null);
      setSavedImage(initial.image_url ?? null);
    } else {
      setValues(empty);
      setImagePreview(null);
      setSavedImage(null);
    }
    setConfirmingRemove(false);
    setRemoveError(null);
  }, [open, initial]);

  function update<K extends keyof FacilityFormValues>(
    key: K,
    val: FacilityFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function handleImage(file?: File) {
    // Let the same file be picked again after it is put back.
    if (fileInput.current) fileInput.current.value = "";
    if (!file) {
      update("image", undefined);
      setImagePreview(savedImage);
      return;
    }
    setConfirmingRemove(false);
    update("image", file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview((e.target?.result as string) ?? null);
    reader.readAsDataURL(file);
  }

  async function handleRemoveImage() {
    if (!onRemoveImage || removingImage) return;
    setRemovingImage(true);
    setRemoveError(null);
    try {
      const result = await onRemoveImage();
      if (result.error) {
        setRemoveError(result.error);
        return;
      }
      setSavedImage(null);
      setImagePreview(null);
      setConfirmingRemove(false);
    } catch {
      setRemoveError("Couldn't remove the photo. Try again.");
    } finally {
      setRemovingImage(false);
    }
  }

  const busy = saving || removingImage;
  const canRemoveSaved = !!initial && !!onRemoveImage && !!savedImage && !values.image;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) return;
    await onSubmit(values);
  }

  // A module-level lucide icon looked up by key, not a component made here.
  const icon = createElement(getFacilityIcon(values.icon_key), { className: "h-14 w-14 text-bg/90" });
  const gradientClass = getFacilityGradient(values.gradient);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit facility" : "Add facility"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Live preview */}
        <div
          className={`relative rounded-(--r-3) overflow-hidden h-32 bg-gradient-to-br ${gradientClass} flex items-center justify-center`}
        >
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePreview}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            icon
          )}
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-fg-3 mb-1.5">
            Facility name
          </label>
          <input
            type="text"
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            required
            maxLength={120}
            placeholder="e.g. Free Weights"
            className="w-full rounded-(--r-2) border border-border px-3 py-2.5 text-sm focus:border-signal focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/20"
          />
        </div>

        {/* Category + Status + Condition */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-fg-3 mb-1.5">
              Category
            </label>
            <SearchableSelect
              value={values.category}
              onChange={(v) => update("category", v as FacilityCategory)}
              options={Object.values(FacilityCategory).map((c) => ({
                value: c,
                label: FACILITY_CATEGORY_LABELS[c],
              }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-fg-3 mb-1.5">
              Status
            </label>
            <SearchableSelect
              value={values.status}
              onChange={(v) => update("status", v as FacilityStatus)}
              options={Object.values(FacilityStatus).map((s) => ({
                value: s,
                label: FACILITY_STATUS_LABELS[s],
              }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-fg-3 mb-1.5">
              Condition
            </label>
            <SearchableSelect
              value={values.condition}
              onChange={(v) => update("condition", v as FacilityCondition)}
              options={Object.values(FacilityCondition).map((c) => ({
                value: c,
                label: FACILITY_CONDITION_LABELS[c],
              }))}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-fg-3 mb-1.5">
            Description
          </label>
          <textarea
            value={values.description}
            onChange={(e) => update("description", e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Shown on your listing"
            className="w-full rounded-(--r-2) border border-border px-3 py-2.5 text-sm focus:border-signal focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/20 resize-none"
          />
          <p className="mt-1 text-xs text-fg-4">
            {values.description.length}/500
          </p>
        </div>

        {/* Image */}
        <div>
          <span className="block text-xs font-semibold text-fg-3 mb-1.5">
            Image (optional)
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <label
              className={`inline-flex items-center gap-2 min-h-11 px-3 rounded-(--r-2) border border-border text-sm font-semibold text-fg-2 focus-within:ring-2 focus-within:ring-signal/30 ${
                busy ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-bg-2"
              }`}
            >
              <Upload className="h-4 w-4" aria-hidden />
              {imagePreview ? "Change image" : "Choose image"}
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={busy}
                onChange={(e) => handleImage(e.target.files?.[0])}
              />
            </label>
            {values.image ? (
              // A new photo goes up with the save; until then it can be put back.
              <button
                type="button"
                onClick={() => handleImage(undefined)}
                disabled={busy}
                className="inline-flex items-center gap-1 min-h-11 px-3 rounded-(--r-2) text-sm font-medium hover:bg-bg-2 disabled:opacity-50"
                style={{ color: "var(--fg-2)" }}
              >
                <X className="h-4 w-4" aria-hidden />
                {savedImage ? "Keep the current image" : "Don't use this image"}
              </button>
            ) : canRemoveSaved && !confirmingRemove ? (
              <button
                type="button"
                onClick={() => {
                  setRemoveError(null);
                  setConfirmingRemove(true);
                }}
                disabled={busy}
                className="inline-flex items-center gap-1 min-h-11 px-3 rounded-(--r-2) text-sm font-medium hover:bg-danger-soft disabled:opacity-50"
                style={{ color: "var(--danger-ink)" }}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Remove photo
              </button>
            ) : null}
          </div>
          {canRemoveSaved && confirmingRemove && (
            <div
              role="group"
              aria-label="Remove this photo?"
              className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-(--r-2) p-3"
              style={{ background: "var(--danger-soft)", border: "1px solid var(--border)" }}
            >
              <span className="text-sm" style={{ color: "var(--danger-ink)" }}>
                Remove this photo? It comes off the facility on your listing.
              </span>
              <span className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingRemove(false)}
                  disabled={removingImage}
                  className="min-h-11 px-3 rounded-(--r-2) text-sm font-semibold bg-bg border border-border hover:bg-bg-2 disabled:opacity-50"
                  style={{ color: "var(--fg-2)" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleRemoveImage()}
                  disabled={removingImage}
                  className="inline-flex items-center gap-2 min-h-11 px-3 rounded-(--r-2) text-sm font-semibold text-bg disabled:opacity-50"
                  style={{ background: "var(--danger)" }}
                >
                  {removingImage && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                  Remove photo
                </button>
              </span>
            </div>
          )}
          {removeError && (
            <p role="alert" className="mt-1.5 text-sm" style={{ color: "var(--danger-ink)" }}>
              {removeError}
            </p>
          )}
          {!imagePreview && (
            <p className="mt-1 text-xs text-fg-4">
              If no image is uploaded, the icon + gradient below are used.
            </p>
          )}
        </div>

        {/* Icon + gradient pickers (fallback when no image) */}
        {!imagePreview && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-fg-3 mb-1.5">
                Icon
              </label>
              <div className="grid grid-cols-5 gap-2">
                {FACILITY_ICON_OPTIONS.map((opt) => {
                  const I = opt.icon;
                  const active = values.icon_key === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => update("icon_key", opt.key)}
                      title={opt.label}
                      className={`h-10 w-full rounded-(--r-2) border-2 flex items-center justify-center transition ${
                        active
                          ? "border-signal bg-signal-soft text-signal-ink"
                          : "border-border text-fg-2 hover:border-border-2"
                      }`}
                    >
                      <I className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-fg-3 mb-1.5">
                Gradient
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {GRADIENT_OPTIONS.map((g) => {
                  const active = values.gradient === g.key;
                  return (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => update("gradient", g.key)}
                      title={g.label}
                      className={`h-10 rounded-(--r-2) bg-gradient-to-br ${g.className} ${
                        active
                          ? "ring-2 ring-offset-2 ring-fg"
                          : "opacity-80 hover:opacity-100"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Featured toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={values.is_featured}
            onChange={(e) => update("is_featured", e.target.checked)}
            className="h-4 w-4 rounded border-border-2 text-signal focus-visible:ring-signal"
          />
          <span className="text-sm font-medium text-fg">
            Show in Featured Facilities carousel
          </span>
        </label>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-(--r-2) text-sm font-semibold text-fg-3 hover:bg-bg-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !values.name.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-(--r-2) text-sm font-semibold bg-signal text-bg hover:bg-signal/90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {initial ? "Save changes" : "Add facility"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
