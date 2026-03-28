import { z } from "zod";

// ─── Marketplace Listing (Trainer/Dietitian) ────────────────────

export const marketplaceListingSchema = z.object({
  accountType: z.string().optional(),
  headline: z.string().min(1, "Headline is required").trim(),
  bio: z.string().min(1, "Bio is required").trim(),
  specialties: z.string(),
  certifications: z.string(),
  languages: z.string(),
  city: z.string().optional(),
  countryCode: z.string().optional(),
  currency: z.string().min(1, "Currency is required"),
  priceFrom: z.string().optional(),
  priceLabel: z.string().optional(),
  acceptingClients: z.boolean(),
});

export type MarketplaceListingFormData = z.infer<
  typeof marketplaceListingSchema
>;

// ─── Org Marketplace Listing (Gym Owner) ────────────────────────

export const orgMarketplaceListingSchema = z.object({
  headline: z.string().min(1, "Headline is required").trim(),
  bio: z.string().min(1, "Bio is required").trim(),
  specialties: z.string(),
  certifications: z.string(),
  facilities: z.array(z.string()),
  amenities: z.array(z.string()),
  languages: z.array(z.string()),
  city: z.string().optional(),
  countryCode: z.string().optional(),
  currency: z.string().min(1, "Currency is required"),
  priceFrom: z.string().optional(),
  priceLabel: z.string().optional(),
  acceptingClients: z.boolean(),
});

export type OrgMarketplaceListingFormData = z.infer<
  typeof orgMarketplaceListingSchema
>;

// ─── Marketplace Request ────────────────────────────────────────

export const marketplaceRequestSchema = z.object({
  requestType: z.enum(["connection", "inquiry"]),
  requestMessage: z.string().optional(),
  requestGoals: z.string().optional(),
});

export type MarketplaceRequestFormData = z.infer<
  typeof marketplaceRequestSchema
>;

// ─── Marketplace Review ─────────────────────────────────────────

export const marketplaceReviewSchema = z.object({
  reviewRating: z.number().min(1).max(5),
  reviewComment: z.string().optional(),
});

export type MarketplaceReviewFormData = z.infer<
  typeof marketplaceReviewSchema
>;
