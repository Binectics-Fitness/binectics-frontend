"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLoading from "@/components/DashboardLoading";
import ConfirmationModal from "@/components/ConfirmationModal";
import TagInput from "@/components/TagInput";
import { marketplaceService } from "@/lib/api/marketplace";
import { utilityService, type PlatformConfig } from "@/lib/api/utility";
import type {
  MarketplaceListing,
  MarketplaceListingDocument,
} from "@/lib/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  orgMarketplaceListingSchema,
  type OrgMarketplaceListingFormData,
} from "@/lib/schemas/marketplace";
import type {
  UseFormRegister,
  FieldErrors,
  UseFormSetValue,
} from "react-hook-form";

const MAX_IMAGE_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_DOCUMENT_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_GALLERY_UPLOAD_FILES = 10;
const ALLOWED_IMAGE_UPLOAD_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
const ALLOWED_DOCUMENT_UPLOAD_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export default function OrgMarketplaceListingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const router = useRouter();

  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasListing, setHasListing] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isDeletingProfileImage, setIsDeletingProfileImage] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(
    null,
  );
  const [listingDocuments, setListingDocuments] = useState<
    MarketplaceListingDocument[]
  >([]);
  const [deletingGalleryImageUrl, setDeletingGalleryImageUrl] = useState<
    string | null
  >(null);
  const [pendingImageDeletion, setPendingImageDeletion] = useState<
    { type: "profile" } | { type: "gallery"; imageUrl: string } | null
  >(null);
  const [replacingImageUrl, setReplacingImageUrl] = useState<string | null>(
    null,
  );
  const [isReorderingGallery, setIsReorderingGallery] = useState(false);
  const [draggedGalleryIndex, setDraggedGalleryIndex] = useState<number | null>(
    null,
  );
  const [galleryReplacementPreviews, setGalleryReplacementPreviews] = useState<
    Record<string, string>
  >({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [imageError, setImageError] = useState("");
  const [loadError, setLoadError] = useState("");

  const {
    register,
    handleSubmit: rhfHandleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<OrgMarketplaceListingFormData>({
    resolver: zodResolver(orgMarketplaceListingSchema),
    defaultValues: {
      headline: "",
      bio: "",
      specialties: "",
      certifications: "",
      facilities: [],
      amenities: [],
      languages: [],
      city: "",
      countryCode: "",
      currency: "USD",
      priceFrom: "",
      priceLabel: "",
      acceptingClients: true,
    },
  });

  const formData = watch();

  const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(
    null,
  );

  const orgId = currentOrg?._id;
  const galleryPhotos =
    listing?.photos.filter((photo) => photo !== listing.profile_image) ?? [];
  const galleryReplacementPreviewsRef = useRef(galleryReplacementPreviews);

  useEffect(() => {
    galleryReplacementPreviewsRef.current = galleryReplacementPreviews;
  }, [galleryReplacementPreviews]);

  const revokeReplacementPreview = (imageUrl: string) => {
    const previewUrl = galleryReplacementPreviewsRef.current[imageUrl];
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  useEffect(() => {
    return () => {
      Object.values(galleryReplacementPreviewsRef.current).forEach(
        (previewUrl) => {
          URL.revokeObjectURL(previewUrl);
        },
      );
    };
  }, []);

  const populateForm = (l: MarketplaceListing) => {
    reset({
      headline: l.headline,
      bio: l.bio,
      specialties: l.specialties.join(", "),
      certifications: l.certifications.join(", "),
      facilities: l.facilities ?? [],
      amenities: l.amenities ?? [],
      languages: l.languages ?? [],
      city: l.city || "",
      countryCode: l.country_code || "",
      currency: l.currency || "USD",
      priceFrom: l.price_from != null ? String(l.price_from) : "",
      priceLabel: l.price_label || "",
      acceptingClients: l.accepting_clients,
    });
  };

  useEffect(() => {
    if (authLoading || orgLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (!orgId) {
      setIsLoading(false);
      return;
    }

    async function loadListing() {
      setLoadError("");
      try {
        const res = await marketplaceService.getOrgListing(orgId!);
        if (res.success && res.data) {
          setListing(res.data);
          setHasListing(true);
          populateForm(res.data);

          const docsRes = await marketplaceService.getOrgListingDocuments(
            orgId!,
          );
          if (docsRes.success && docsRes.data) {
            setListingDocuments(docsRes.data);
          } else {
            setListingDocuments([]);
          }
        } else {
          setHasListing(false);
          setListingDocuments([]);
          // Pre-populate from org data so users don't re-enter the same info
          if (currentOrg?.description) {
            setValue("bio", currentOrg.description);
          }
          if (currentOrg?.name) {
            setValue("headline", currentOrg.name);
          }
        }
      } catch {
        setLoadError(
          "Failed to load your listing. Please check your connection and try again.",
        );
      }
      setIsLoading(false);
    }
    loadListing();
  }, [authLoading, orgLoading, user, orgId, router]);

  useEffect(() => {
    utilityService.getPlatformConfig().then((res) => {
      if (res.success && res.data) {
        setPlatformConfig(res.data);
      }
    });
  }, []);

  const activeCurrencies =
    platformConfig?.currencies.filter((c) => c.is_active) ?? [];

  const splitComma = (s: string) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  const handleCreate = async (data: OrgMarketplaceListingFormData) => {
    if (!orgId) return;
    setFormError("");
    setIsSaving(true);

    const res = await marketplaceService.createOrgListing(orgId, {
      account_type: "gym_owner",
      headline: data.headline,
      bio: data.bio,
      specialties: splitComma(data.specialties),
      certifications: splitComma(data.certifications),
      facilities: data.facilities,
      amenities: data.amenities,
      languages: data.languages,
      city: data.city || undefined,
      country_code: data.countryCode || undefined,
      currency: data.currency,
      price_from: data.priceFrom ? Number(data.priceFrom) : undefined,
      price_label: data.priceLabel || undefined,
      accepting_clients: data.acceptingClients,
    });

    if (res.success && res.data) {
      setListing(res.data);
      setHasListing(true);
      setIsEditing(false);
      setSuccessMessage("Listing created! You can now publish it.");
    } else {
      setFormError(res.message || "Failed to create listing");
    }
    setIsSaving(false);
  };

  const handleUpdate = async (data: OrgMarketplaceListingFormData) => {
    if (!orgId) return;
    setFormError("");
    setIsSaving(true);

    const res = await marketplaceService.updateOrgListing(orgId, {
      headline: data.headline,
      bio: data.bio,
      specialties: splitComma(data.specialties),
      certifications: splitComma(data.certifications),
      facilities: data.facilities,
      amenities: data.amenities,
      languages: data.languages,
      city: data.city || undefined,
      country_code: data.countryCode || undefined,
      currency: data.currency,
      price_from: data.priceFrom ? Number(data.priceFrom) : undefined,
      price_label: data.priceLabel || undefined,
      accepting_clients: data.acceptingClients,
    });

    if (res.success && res.data) {
      setListing(res.data);
      setIsEditing(false);
      setSuccessMessage("Listing updated successfully.");
    } else {
      setFormError(res.message || "Failed to update listing");
    }
    setIsSaving(false);
  };

  const handleTogglePublish = async () => {
    if (!listing || !orgId) return;
    setIsPublishing(true);
    setFormError("");

    const res = listing.is_published
      ? await marketplaceService.unpublishOrgListing(orgId)
      : await marketplaceService.publishOrgListing(orgId);

    if (res.success && res.data) {
      setListing(res.data);
      setSuccessMessage(
        res.data.is_published
          ? "Listing published! It's now visible in the marketplace."
          : "Listing unpublished.",
      );
    } else {
      setFormError(res.message || "Failed to update listing");
    }
    setIsPublishing(false);
  };

  const handleProfileImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!orgId) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_UPLOAD_TYPES.has(file.type)) {
      setImageError(
        "Unsupported image format. Please upload PNG, JPEG, WEBP, or GIF.",
      );
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_UPLOAD_SIZE_BYTES) {
      setImageError("Image is too large. Maximum allowed size is 5MB.");
      e.target.value = "";
      return;
    }

    setImageError("");
    setIsUploadingProfileImage(true);

    const res = await marketplaceService.uploadOrgListingProfileImage(
      orgId,
      file,
    );

    if (res.success && res.data) {
      setListing(res.data);
      setSuccessMessage("Profile image updated successfully.");
    } else {
      setImageError(res.message || "Failed to upload profile image");
    }

    setIsUploadingProfileImage(false);
    e.target.value = "";
  };

  const handleGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!orgId) return;
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length > MAX_GALLERY_UPLOAD_FILES) {
      setImageError(
        `You can upload up to ${MAX_GALLERY_UPLOAD_FILES} images at a time.`,
      );
      e.target.value = "";
      return;
    }

    const invalidTypeFile = files.find(
      (file) => !ALLOWED_IMAGE_UPLOAD_TYPES.has(file.type),
    );
    if (invalidTypeFile) {
      setImageError(
        "Unsupported image format detected. Please upload PNG, JPEG, WEBP, or GIF only.",
      );
      e.target.value = "";
      return;
    }

    const oversizedFile = files.find(
      (file) => file.size > MAX_IMAGE_UPLOAD_SIZE_BYTES,
    );
    if (oversizedFile) {
      setImageError("One or more images exceed the 5MB size limit.");
      e.target.value = "";
      return;
    }

    setImageError("");
    setIsUploadingGallery(true);

    const res = await marketplaceService.uploadOrgListingGalleryImages(
      orgId,
      files,
    );

    if (res.success && res.data) {
      setListing(res.data);
      setSuccessMessage("Gallery images uploaded successfully.");
    } else {
      setImageError(res.message || "Failed to upload gallery images");
    }

    setIsUploadingGallery(false);
    e.target.value = "";
  };

  const handleGalleryDelete = async (imageUrl: string) => {
    if (!listing || !orgId) return;

    const previousListing = listing;
    const nextPhotos = listing.photos.filter((photo) => photo !== imageUrl);
    setImageError("");
    setDeletingGalleryImageUrl(imageUrl);
    setListing({ ...listing, photos: nextPhotos });

    const res = await marketplaceService.deleteOrgListingGalleryImage(
      orgId,
      imageUrl,
    );

    if (res.success && res.data) {
      setListing(res.data);
      setPendingImageDeletion(null);
      setSuccessMessage("Gallery image removed successfully.");
      setDeletingGalleryImageUrl(null);
      return;
    }

    setListing(previousListing);
    setImageError(res.message || "Failed to remove gallery image");
    setDeletingGalleryImageUrl(null);
  };

  const persistGalleryOrder = async (reorderedPhotos: string[]) => {
    if (!listing || !orgId) return;
    const previousListing = listing;
    const optimisticPhotos = listing.profile_image
      ? [listing.profile_image, ...reorderedPhotos]
      : reorderedPhotos;

    setImageError("");
    setIsReorderingGallery(true);
    setListing({ ...listing, photos: optimisticPhotos });

    const res = await marketplaceService.reorderOrgListingGalleryImages(
      orgId,
      reorderedPhotos,
    );

    if (res.success && res.data) {
      setListing(res.data);
      setSuccessMessage("Gallery order updated successfully.");
      setIsReorderingGallery(false);
      return;
    }

    setListing(previousListing);
    setImageError(res.message || "Failed to reorder gallery images");
    setIsReorderingGallery(false);
  };

  const handleProfileImageDelete = async () => {
    if (!listing || !orgId || !listing.profile_image) return;

    const previousListing = listing;
    setImageError("");
    setIsDeletingProfileImage(true);
    setListing({
      ...listing,
      profile_image: undefined,
      photos: [...galleryPhotos],
    });

    const res = await marketplaceService.deleteOrgListingProfileImage(orgId);

    if (res.success && res.data) {
      setListing(res.data);
      setPendingImageDeletion(null);
      setSuccessMessage("Profile image removed successfully.");
      setIsDeletingProfileImage(false);
      return;
    }

    setListing(previousListing);
    setImageError(res.message || "Failed to remove profile image");
    setIsDeletingProfileImage(false);
  };

  const handleGalleryReplace = async (
    imageUrl: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!listing || !orgId) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_UPLOAD_TYPES.has(file.type)) {
      setImageError(
        "Unsupported image format. Please upload PNG, JPEG, WEBP, or GIF.",
      );
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_UPLOAD_SIZE_BYTES) {
      setImageError("Image is too large. Maximum allowed size is 5MB.");
      e.target.value = "";
      return;
    }

    const previousListing = listing;
    setImageError("");
    setReplacingImageUrl(imageUrl);

    const previewUrl = URL.createObjectURL(file);
    revokeReplacementPreview(imageUrl);
    setGalleryReplacementPreviews((current) => ({
      ...current,
      [imageUrl]: previewUrl,
    }));

    const res = await marketplaceService.replaceOrgListingGalleryImage(
      orgId,
      imageUrl,
      file,
    );

    if (res.success && res.data) {
      setListing(res.data);
      setSuccessMessage("Gallery image replaced successfully.");
    } else {
      setListing(previousListing);
      setImageError(res.message || "Failed to replace gallery image");
    }

    revokeReplacementPreview(imageUrl);
    setGalleryReplacementPreviews((current) => {
      const next = { ...current };
      delete next[imageUrl];
      return next;
    });
    setReplacingImageUrl(null);
    e.target.value = "";
  };

  const handleGalleryDragStart = (index: number) => {
    if (isReorderingGallery || replacingImageUrl !== null) {
      return;
    }

    setDraggedGalleryIndex(index);
  };

  const handleGalleryDrop = async (dropIndex: number) => {
    if (
      isReorderingGallery ||
      draggedGalleryIndex === null ||
      draggedGalleryIndex === dropIndex
    ) {
      setDraggedGalleryIndex(null);
      return;
    }

    const reorderedPhotos = [...galleryPhotos];
    const [movedPhoto] = reorderedPhotos.splice(draggedGalleryIndex, 1);
    reorderedPhotos.splice(dropIndex, 0, movedPhoto);

    setDraggedGalleryIndex(null);
    await persistGalleryOrder(reorderedPhotos);
  };

  const handleConfirmImageDelete = async () => {
    if (!pendingImageDeletion) return;

    if (pendingImageDeletion.type === "profile") {
      await handleProfileImageDelete();
      return;
    }

    await handleGalleryDelete(pendingImageDeletion.imageUrl);
  };

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!orgId) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_DOCUMENT_UPLOAD_TYPES.has(file.type)) {
      setImageError(
        "Unsupported file format. Allowed: PDF, Word (.doc/.docx), PNG, JPEG, WEBP, GIF.",
      );
      e.target.value = "";
      return;
    }

    if (file.size > MAX_DOCUMENT_UPLOAD_SIZE_BYTES) {
      setImageError("Document is too large. Maximum allowed size is 10MB.");
      e.target.value = "";
      return;
    }

    setImageError("");
    setIsUploadingDocument(true);

    const res = await marketplaceService.uploadOrgListingDocument(orgId, file);
    if (res.success && res.data) {
      setListingDocuments((current) => [res.data!, ...current]);
      setSuccessMessage("Supporting document uploaded successfully.");
    } else {
      setImageError(res.message || "Failed to upload supporting document");
    }

    setIsUploadingDocument(false);
    e.target.value = "";
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!orgId) return;
    setDeletingDocumentId(documentId);
    setImageError("");

    const res = await marketplaceService.deleteOrgListingDocument(
      orgId,
      documentId,
    );

    if (res.success) {
      setListingDocuments((current) =>
        current.filter((doc) => doc._id !== documentId),
      );
      setSuccessMessage("Supporting document removed successfully.");
    } else {
      setImageError(res.message || "Failed to remove supporting document");
    }

    setDeletingDocumentId(null);
  };

  if (authLoading || orgLoading || isLoading) return <DashboardLoading />;

  if (!orgId) {
    return (
      <div className="flex-1 overflow-y-auto bg-background-secondary">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
          <div className="rounded-2xl bg-white p-12 shadow-[var(--shadow-card)] text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">
              No Organization Selected
            </h3>
            <p className="text-foreground-secondary">
              Select an organization from the sidebar to manage its marketplace
              listing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex-1 overflow-y-auto bg-background-secondary">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
          <div className="rounded-2xl bg-white p-12 shadow-[var(--shadow-card)] text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">
              Unable to Load Listing
            </h3>
            <p className="text-foreground-secondary mb-4">{loadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background-secondary">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-foreground">
              Marketplace Listing
            </h1>
            <p className="text-sm text-foreground-secondary mt-1">
              Manage {currentOrg?.name ?? "your gym"}&apos;s marketplace profile
            </p>
          </div>
          {hasListing && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-xl border-2 border-primary-500 px-4 py-2 text-sm font-semibold text-primary-500 hover:bg-primary-50 transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {/* Success */}
        {successMessage && (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-800">{successMessage}</p>
              <button
                onClick={() => setSuccessMessage("")}
                className="text-green-600 hover:text-green-800"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* No Listing */}
        {!hasListing && (
          <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-[var(--shadow-card)]">
            <h2 className="text-xl font-bold text-foreground mb-2">
              Create Your Gym&apos;s Marketplace Listing
            </h2>
            <p className="text-sm text-foreground-secondary mb-6">
              Set up your public profile so potential members can find and
              connect with your gym.
            </p>
            <form
              onSubmit={rhfHandleSubmit(handleCreate)}
              className="space-y-5"
            >
              {formError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-800">{formError}</p>
                </div>
              )}
              <FormFields
                register={register}
                errors={errors}
                formData={formData}
                setValue={setValue}
                platformConfig={platformConfig}
                activeCurrencies={activeCurrencies}
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-primary-500 px-8 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? "Saving..." : "Create Listing"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* View */}
        {hasListing && listing && !isEditing && (
          <div className="space-y-6">
            {/* Status */}
            <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex h-3 w-3 rounded-full ${listing.is_published ? "bg-green-500" : "bg-neutral-400"}`}
                />
                <span className="text-sm font-medium text-foreground">
                  {listing.is_published ? "Published" : "Draft"}
                </span>
                {listing.is_published && (
                  <Link
                    href={`/marketplace/${listing._id}`}
                    className="text-xs text-primary-500 hover:text-primary-600 font-medium"
                  >
                    View public page →
                  </Link>
                )}
              </div>
              <button
                onClick={handleTogglePublish}
                disabled={isPublishing}
                className={`rounded-xl px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                  listing.is_published
                    ? "border-2 border-neutral-300 text-foreground hover:border-red-300 hover:text-red-600"
                    : "bg-primary-500 text-white hover:bg-primary-600"
                }`}
              >
                {isPublishing
                  ? "..."
                  : listing.is_published
                    ? "Unpublish"
                    : "Publish"}
              </button>
            </div>

            {imageError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-800">{imageError}</p>
              </div>
            )}

            <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Images</h2>
                <div className="flex items-center gap-2">
                  <label className="rounded-xl border-2 border-neutral-300 px-4 py-2 text-sm font-medium text-foreground hover:border-primary-500 cursor-pointer transition-colors">
                    {isUploadingProfileImage
                      ? "Uploading profile..."
                      : "Upload Profile"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={handleProfileImageUpload}
                      disabled={isUploadingProfileImage || isUploadingGallery}
                    />
                  </label>
                  <label className="rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 cursor-pointer transition-colors">
                    {isUploadingGallery
                      ? "Uploading gallery..."
                      : "Upload Gallery"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      multiple
                      className="hidden"
                      onChange={handleGalleryUpload}
                      disabled={isUploadingProfileImage || isUploadingGallery}
                    />
                  </label>
                </div>
              </div>
              <p className="mb-4 text-xs text-foreground-secondary">
                Add a strong profile image and clear gallery photos of your gym
                floor, equipment, and amenities to improve marketplace
                conversion.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-medium text-foreground-secondary mb-2">
                    Profile Image
                  </p>
                  {listing.profile_image ? (
                    <div className="space-y-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={listing.profile_image}
                        alt="Gym profile"
                        className="h-40 w-full rounded-xl object-cover border border-neutral-200"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPendingImageDeletion({ type: "profile" })
                        }
                        disabled={isDeletingProfileImage}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {isDeletingProfileImage
                          ? "Removing..."
                          : "Remove profile image"}
                      </button>
                    </div>
                  ) : (
                    <div className="h-40 rounded-xl border border-dashed border-neutral-300 flex items-center justify-center text-sm text-foreground-secondary">
                      No profile image yet
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium text-foreground-secondary mb-2">
                    Gallery ({galleryPhotos.length})
                  </p>
                  {galleryPhotos.length > 0 ? (
                    <div className="space-y-3">
                      {galleryPhotos.map((photo, index) => (
                        <div
                          key={`${photo}-${index}`}
                          className={`flex items-center gap-3 rounded-xl border p-2 ${
                            draggedGalleryIndex === index
                              ? "border-primary-500 bg-primary-50"
                              : "border-neutral-200"
                          }`}
                          draggable={
                            !isReorderingGallery && replacingImageUrl === null
                          }
                          onDragStart={() => handleGalleryDragStart(index)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => void handleGalleryDrop(index)}
                          onDragEnd={() => setDraggedGalleryIndex(null)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={galleryReplacementPreviews[photo] ?? photo}
                            alt={`Gallery ${index + 1}`}
                            className="h-20 w-20 rounded-lg object-cover border border-neutral-200"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              Gallery image {index + 1}
                            </p>
                            <p className="truncate text-xs text-foreground-secondary">
                              {photo}
                            </p>
                            <p className="text-xs text-foreground-secondary mt-1">
                              {isReorderingGallery
                                ? "Saving new order..."
                                : replacingImageUrl === photo
                                  ? "Previewing replacement while upload finishes"
                                  : "Drag to reorder"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="rounded-lg border border-neutral-300 px-2 py-1 text-xs font-medium text-foreground hover:border-primary-500 cursor-pointer">
                              {replacingImageUrl === photo
                                ? "Replacing..."
                                : "Replace"}
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                className="hidden"
                                onChange={(event) =>
                                  void handleGalleryReplace(photo, event)
                                }
                                disabled={
                                  replacingImageUrl !== null ||
                                  deletingGalleryImageUrl !== null ||
                                  isReorderingGallery
                                }
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingImageDeletion({
                                  type: "gallery",
                                  imageUrl: photo,
                                })
                              }
                              disabled={
                                deletingGalleryImageUrl !== null ||
                                replacingImageUrl !== null ||
                                isReorderingGallery
                              }
                              className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              {deletingGalleryImageUrl === photo
                                ? "Removing..."
                                : "Remove"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-40 rounded-xl border border-dashed border-neutral-300 flex items-center justify-center text-sm text-foreground-secondary">
                      No gallery images yet
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Supporting Documents
                  </h2>
                  <p className="text-xs text-foreground-secondary mt-1">
                    Optional files to support admin badge review.
                  </p>
                </div>
                <label className="rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 cursor-pointer transition-colors">
                  {isUploadingDocument ? "Uploading..." : "Upload Document"}
                  <input
                    type="file"
                    accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handleDocumentUpload}
                    disabled={isUploadingDocument}
                  />
                </label>
              </div>

              {listingDocuments.length === 0 ? (
                <div className="h-28 rounded-xl border border-dashed border-neutral-300 flex items-center justify-center text-sm text-foreground-secondary">
                  No supporting documents uploaded yet
                </div>
              ) : (
                <div className="space-y-3">
                  {listingDocuments.map((document) => (
                    <div
                      key={document._id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {document.file_name}
                        </p>
                        <p className="text-xs text-foreground-secondary">
                          {(document.file_size / 1024 / 1024).toFixed(2)} MB •{" "}
                          {new Date(document.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={document.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary-500"
                        >
                          Open
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            void handleDeleteDocument(document._id)
                          }
                          disabled={deletingDocumentId === document._id}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingDocumentId === document._id
                            ? "Removing..."
                            : "Remove"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-[var(--shadow-card)]">
              <h2 className="text-2xl font-black text-foreground mb-1">
                {listing.headline}
              </h2>
              <p className="text-foreground-secondary mb-4 whitespace-pre-line">
                {listing.bio}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {(listing.facilities ?? []).length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-foreground-secondary mb-1">
                      Facilities
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {listing.facilities.map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(listing.amenities ?? []).length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-foreground-secondary mb-1">
                      Amenities
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {listing.amenities.map((c) => (
                        <span
                          key={c}
                          className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-foreground-secondary"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl bg-background-secondary p-4">
                <div>
                  <p className="text-xs text-foreground-secondary">Location</p>
                  <p className="text-sm font-medium text-foreground">
                    {listing.city || "—"}
                    {listing.country_code
                      ? `, ${listing.country_code.toUpperCase()}`
                      : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-foreground-secondary">
                    Starting Price
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {listing.price_from != null
                      ? `${listing.currency} ${listing.price_from}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-foreground-secondary">Rating</p>
                  <p className="text-sm font-medium text-foreground">
                    {listing.review_count > 0
                      ? `${listing.average_rating.toFixed(1)} (${listing.review_count})`
                      : "No reviews"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-foreground-secondary">Clients</p>
                  <p className="text-sm font-medium text-foreground">
                    {listing.active_client_count} active
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Editing */}
        {hasListing && isEditing && (
          <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-[var(--shadow-card)]">
            <h2 className="text-xl font-bold text-foreground mb-6">
              Edit Listing
            </h2>
            <form
              onSubmit={rhfHandleSubmit(handleUpdate)}
              className="space-y-5"
            >
              {formError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-800">{formError}</p>
                </div>
              )}
              <FormFields
                register={register}
                errors={errors}
                formData={formData}
                setValue={setValue}
                platformConfig={platformConfig}
                activeCurrencies={activeCurrencies}
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-primary-500 px-8 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    if (listing) populateForm(listing);
                  }}
                  className="rounded-xl border-2 border-neutral-300 px-6 py-2.5 text-sm font-medium text-foreground hover:border-foreground-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <ConfirmationModal
          isOpen={pendingImageDeletion !== null}
          title={
            pendingImageDeletion?.type === "profile"
              ? "Remove profile image?"
              : "Remove gallery image?"
          }
          description={
            pendingImageDeletion?.type === "profile"
              ? "This removes the main image for your marketplace listing until you upload a new one."
              : "This removes the selected gallery image from your marketplace listing."
          }
          confirmLabel={
            pendingImageDeletion?.type === "profile"
              ? "Remove Profile Image"
              : "Remove Gallery Image"
          }
          onConfirm={handleConfirmImageDelete}
          onCancel={() => setPendingImageDeletion(null)}
          isConfirming={
            isDeletingProfileImage || deletingGalleryImageUrl !== null
          }
        />
      </div>
    </div>
  );
}

// ─── Shared Form Fields ───

function FormFields({
  register,
  errors,
  formData,
  setValue,
  platformConfig,
  activeCurrencies,
}: {
  register: UseFormRegister<OrgMarketplaceListingFormData>;
  errors: FieldErrors<OrgMarketplaceListingFormData>;
  formData: OrgMarketplaceListingFormData;
  setValue: UseFormSetValue<OrgMarketplaceListingFormData>;
  platformConfig: PlatformConfig | null;
  activeCurrencies: {
    code: string;
    name: string;
    symbol: string;
    is_active: boolean;
  }[];
}) {
  return (
    <>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Headline *
        </label>
        <input
          type="text"
          {...register("headline")}
          maxLength={200}
          className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary-500 focus:outline-none"
          placeholder="e.g. Modern Fitness Center in Downtown London"
        />
        {errors.headline && (
          <p className="text-xs text-red-600 mt-1">{errors.headline.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Bio *
        </label>
        <textarea
          {...register("bio")}
          maxLength={3000}
          rows={4}
          className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-3 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary-500 focus:outline-none resize-none"
          placeholder="Describe your gym, what makes it unique, facilities offered..."
        />
        {errors.bio && (
          <p className="text-xs text-red-600 mt-1">{errors.bio.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Facilities
          </label>
          <TagInput
            value={formData.facilities}
            onChange={(v) => setValue("facilities", v)}
            suggestions={platformConfig?.facility_suggestions ?? []}
            placeholder="e.g. Free Weights, Cardio Zone"
            name="facilities"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Amenities
          </label>
          <TagInput
            value={formData.amenities}
            onChange={(v) => setValue("amenities", v)}
            suggestions={platformConfig?.amenity_suggestions ?? []}
            placeholder="e.g. WiFi, Showers, Parking"
            name="amenities"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Languages
        </label>
        <TagInput
          value={formData.languages}
          onChange={(v) => setValue("languages", v)}
          suggestions={platformConfig?.languages ?? []}
          placeholder="e.g. English, Spanish"
          name="languages"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            City
          </label>
          <input
            type="text"
            {...register("city")}
            className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary-500 focus:outline-none"
            placeholder="London"
          />
          <p className="text-xs text-foreground-secondary mt-1">
            Enter your primary city. If your gym operates in multiple cities,
            you can create separate listings for each location.
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Country Code
          </label>
          <input
            type="text"
            {...register("countryCode")}
            maxLength={10}
            className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary-500 focus:outline-none"
            placeholder="GB"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Currency
          </label>
          <select
            {...register("currency")}
            className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none"
          >
            {activeCurrencies.length > 0 ? (
              activeCurrencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} – {c.name} ({c.symbol})
                </option>
              ))
            ) : (
              <option value="USD">USD – US Dollar ($)</option>
            )}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Starting Price
          </label>
          <input
            type="number"
            {...register("priceFrom")}
            min={0}
            className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary-500 focus:outline-none"
            placeholder="50"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Price Label
          </label>
          <input
            type="text"
            {...register("priceLabel")}
            maxLength={50}
            className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary-500 focus:outline-none"
            placeholder="month"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={formData.acceptingClients}
            onChange={(e) => setValue("acceptingClients", e.target.checked)}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-neutral-300 peer-checked:bg-primary-500 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
        </label>
        <span className="text-sm font-medium text-foreground">
          Accepting new members
        </span>
      </div>
    </>
  );
}
