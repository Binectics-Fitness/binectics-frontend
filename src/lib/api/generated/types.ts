/**
 * Typed adapters over the generated OpenAPI schema.
 *
 * `schema.ts` is auto-generated from the API's OpenAPI document
 * (`npm run api:sync`) and is the source of truth for request/response shapes.
 * Reaching into `components["schemas"]["X"]` everywhere is noisy, so this module
 * re-exports the contract types we consume under friendly names.
 *
 * The normalization goal: hand-written request/response interfaces in the
 * service layer should gradually be replaced by (or aliased to) these, so the
 * frontend tracks the real API contract automatically instead of drifting.
 *
 * Example (see src/lib/api/consultations.ts):
 *   import type { CreateBookingDto } from "./generated/types";
 *   export type CreateBookingRequest = CreateBookingDto;
 */

import type { components } from "./schema";

type Schemas = components["schemas"];

/* ── Auth ──────────────────────────────────────────────────────────────── */
export type LoginDto = Schemas["LoginDto"];
export type RegisterDto = Schemas["RegisterDto"];
export type RefreshTokenDto = Schemas["RefreshTokenDto"];
export type VerifyOtpDto = Schemas["VerifyOtpDto"];
export type ResendOtpDto = Schemas["ResendOtpDto"];

/* ── Consultations ─────────────────────────────────────────────────────── */
export type CreateBookingDto = Schemas["CreateBookingDto"];
export type RescheduleBookingDto = Schemas["RescheduleBookingDto"];
export type CancelBookingDto = Schemas["CancelBookingDto"];
export type CompleteBookingDto = Schemas["CompleteBookingDto"];

/* ── Check-ins ─────────────────────────────────────────────────────────── */
export type ScanCheckInDto = Schemas["ScanCheckInDto"];
export type OrgRevenueStatsDto = Schemas["OrgRevenueStatsDto"];
export type RevenueTimeseriesItemDto = Schemas["RevenueTimeseriesItemDto"];

/* ── Reviews ───────────────────────────────────────────────────────────── */
export type CreateReviewDto = Schemas["CreateReviewDto"];
export type CreateReviewReplyDto = Schemas["CreateReviewReplyDto"];
export type CreateReviewReportDto = Schemas["CreateReviewReportDto"];
export type CreateProviderResponseDto = Schemas["CreateProviderResponseDto"];

/* ── Reference data ────────────────────────────────────────────────────── */
export type CountryDto = Schemas["CountryDto"];
export type CityDto = Schemas["CityDto"];
export type CurrencyItemDto = Schemas["CurrencyItemDto"];

/* ── Error envelope ────────────────────────────────────────────────────── */
export type ErrorResponseDto = Schemas["ErrorResponseDto"];
