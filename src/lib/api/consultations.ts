import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";
import type {
  CreateBookingDto,
  RescheduleBookingDto,
  CancelBookingDto,
  CompleteBookingDto,
} from "./generated/types";

export enum ConsultationProviderRole {
  DIETITIAN = "DIETITIAN",
  PERSONAL_TRAINER = "PERSONAL_TRAINER",
  OTHER = "OTHER",
}

export enum ConsultationBookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
  NO_SHOW = "NO_SHOW",
}

export enum ConsultationCancelledBy {
  CLIENT = "CLIENT",
  PROVIDER = "PROVIDER",
  ADMIN = "ADMIN",
}

export enum AvailabilityExceptionType {
  UNAVAILABLE = "UNAVAILABLE",
  CUSTOM_HOURS = "CUSTOM_HOURS",
}

export interface ConsultationType {
  id: string;
  /**
   * The provider who sells this session type. `null` for a platform default,
   * which a provider's clients book until the provider sets up their own.
   */
  providerId?: string | null;
  name: string;
  description?: string;
  providerRole: ConsultationProviderRole;
  defaultDurationMinutes: number;
  bufferMinutes: number;
  minAdvanceNoticeMinutes: number;
  isActive: boolean;
  /** Optional session price in the currency's minor unit (kobo/cents). */
  priceMinor?: number | null;
  currency?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsultationTypeRequest {
  name: string;
  description?: string;
  providerRole: ConsultationProviderRole;
  defaultDurationMinutes: number;
  bufferMinutes?: number;
  minAdvanceNoticeMinutes?: number;
  isActive?: boolean;
  /**
   * Session price in the currency's minor unit (kobo/cents). The backend
   * requires `currency` whenever this is set; it feeds the earnings
   * page's estimated figures.
   */
  priceMinor?: number;
  currency?: string;
}

/**
 * A session type the signed-in provider sells
 * (POST /consultations/provider/types). The role comes from the account, so
 * there is no `providerRole`. Reusing the name of one of your archived types
 * brings it back; an active one with the same name is a 409.
 */
export interface CreateOwnConsultationTypeRequest {
  name: string;
  description?: string;
  defaultDurationMinutes: number;
  bufferMinutes?: number;
  minAdvanceNoticeMinutes?: number;
  isActive?: boolean;
  /** Minor units (kobo/cents). `currency` is required whenever this is set. */
  priceMinor?: number;
  currency?: string;
}

/**
 * PATCH /consultations/provider/types/:id. Every field is optional; an
 * omitted field is left as it is. `null` clears the price.
 */
export interface UpdateOwnConsultationTypeRequest {
  name?: string;
  description?: string;
  defaultDurationMinutes?: number;
  bufferMinutes?: number;
  minAdvanceNoticeMinutes?: number;
  isActive?: boolean;
  priceMinor?: number | null;
  currency?: string | null;
}

export interface AvailabilityRule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AvailabilityException {
  id: string;
  date: string;
  type: AvailabilityExceptionType;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConsultationSlot {
  startsAt: string;
  endsAt: string;
  providerTimezone: string;
  isAvailable: boolean;
}

export interface ConsultationBooking {
  id: string;
  clientUserId: string;
  clientFirstName?: string;
  clientLastName?: string;
  providerId: string;
  consultationTypeId: string;
  /**
   * The session type's name, resolved by the API. Missing from older API
   * builds; `null` if the type is gone. Prefer it over a client-side lookup.
   */
  consultationTypeName?: string | null;
  startsAt: string;
  endsAt: string;
  providerTimezone: string;
  clientTimezone: string;
  status: ConsultationBookingStatus;
  notes?: string;
  completionNote?: string;
  cancelledBy?: ConsultationCancelledBy;
  cancelReason?: string;
  /**
   * Present only while a priced booking is an unpaid hold: the slot is
   * kept until `expiresAt` and released by the API if payment never lands.
   */
  payment?: {
    reference: string;
    amountMinor?: number | null;
    currency?: string | null;
    expiresAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// All four request types sourced from the generated OpenAPI contract so the
// frontend tracks the API automatically. See src/lib/api/generated/types.ts.
export type CreateBookingRequest = CreateBookingDto;
export type RescheduleBookingRequest = RescheduleBookingDto;
export type CancelBookingRequest = CancelBookingDto;
export type CompleteBookingRequest = CompleteBookingDto;

/**
 * Display name for a booking's session type: the name the API sent with the
 * booking, else the id -> name map (for API builds that do not send it).
 * Undefined when neither knows it; callers pick their own fallback label.
 */
export function bookingTypeName(
  booking: Pick<ConsultationBooking, "consultationTypeId" | "consultationTypeName">,
  typesById: Record<string, string>,
): string | undefined {
  return booking.consultationTypeName || typesById[booking.consultationTypeId];
}

export const consultationsService = {
  /**
   * With `providerId`: what a client can book with that provider (their own
   * active types, else their role's platform defaults). Without it: the
   * platform defaults only, never another provider's own types.
   */
  getTypes(params?: {
    includeInactive?: boolean;
    providerId?: string;
  }): Promise<ApiResponse<ConsultationType[]>> {
    const search = new URLSearchParams();
    if (params?.includeInactive) search.set("includeInactive", "true");
    if (params?.providerId) search.set("providerId", params.providerId);
    const query = search.toString();
    return apiClient.get<ConsultationType[]>(
      `/consultations/types${query ? `?${query}` : ""}`,
    );
  },

  /** The signed-in provider's own session types, archived ones included. */
  getOwnTypes(): Promise<ApiResponse<ConsultationType[]>> {
    return apiClient.get<ConsultationType[]>("/consultations/provider/types");
  },

  createOwnType(
    payload: CreateOwnConsultationTypeRequest,
  ): Promise<ApiResponse<ConsultationType>> {
    return apiClient.post<ConsultationType>(
      "/consultations/provider/types",
      payload,
    );
  },

  updateOwnType(
    id: string,
    payload: UpdateOwnConsultationTypeRequest,
  ): Promise<ApiResponse<ConsultationType>> {
    return apiClient.patch<ConsultationType>(
      `/consultations/provider/types/${id}`,
      payload,
    );
  },

  archiveOwnType(id: string): Promise<ApiResponse<ConsultationType>> {
    return apiClient.delete<ConsultationType>(
      `/consultations/provider/types/${id}`,
    );
  },

  /**
   * Id -> name for labelling a provider's own bookings: their own types
   * (archived included) plus every platform default (archived included),
   * since older bookings may point at either. The platform list alone no
   * longer carries a provider's own types.
   */
  async getProviderTypeNames(): Promise<
    ApiResponse<Record<string, string>>
  > {
    const [own, platform] = await Promise.all([
      consultationsService.getOwnTypes(),
      consultationsService.getTypes({ includeInactive: true }),
    ]);
    if (!own.success && !platform.success) {
      return { success: false, message: own.message ?? platform.message };
    }
    const names: Record<string, string> = {};
    for (const t of platform.data ?? []) names[t.id] = t.name;
    for (const t of own.data ?? []) names[t.id] = t.name;
    return { success: true, data: names };
  },

  /**
   * Platform-default endpoints: admin only. A provider editing their own
   * sessions uses createOwnType / updateOwnType instead; archiving a
   * platform default as a provider is a 403.
   */
  createType(
    payload: CreateConsultationTypeRequest,
  ): Promise<ApiResponse<ConsultationType>> {
    return apiClient.post<ConsultationType>("/consultations/types", payload);
  },

  deleteType(id: string): Promise<ApiResponse<ConsultationType>> {
    return apiClient.delete<ConsultationType>(`/consultations/types/${id}`);
  },

  getCatalog(params?: {
    providerRole?: ConsultationProviderRole;
    country?: string;
    city?: string;
  }): Promise<
    ApiResponse<{
      filters: unknown;
      types: ConsultationType[];
      providers: unknown[];
      providersPartial?: boolean;
      message?: string;
    }>
  > {
    const search = new URLSearchParams();
    if (params?.providerRole) search.set("providerRole", params.providerRole);
    if (params?.country) search.set("country", params.country);
    if (params?.city) search.set("city", params.city);
    const query = search.toString();
    return apiClient.get(`/consultations/catalog${query ? `?${query}` : ""}`);
  },

  getProviderSlots(
    providerId: string,
    params?: {
      consultationTypeId?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ): Promise<ApiResponse<ConsultationSlot[]>> {
    const search = new URLSearchParams();
    if (params?.consultationTypeId) {
      search.set("consultationTypeId", params.consultationTypeId);
    }
    if (params?.dateFrom) search.set("dateFrom", params.dateFrom);
    if (params?.dateTo) search.set("dateTo", params.dateTo);

    const query = search.toString();
    return apiClient.get<ConsultationSlot[]>(
      `/consultations/providers/${providerId}/slots${query ? `?${query}` : ""}`,
    );
  },

  getMyAvailability(): Promise<ApiResponse<AvailabilityRule[]>> {
    return apiClient.get<AvailabilityRule[]>(
      "/consultations/provider/availability",
    );
  },

  setMyAvailability(
    rules: Omit<AvailabilityRule, "id" | "createdAt" | "updatedAt">[],
  ): Promise<ApiResponse<AvailabilityRule[]>> {
    return apiClient.put<AvailabilityRule[]>(
      "/consultations/provider/availability",
      {
        rules,
      },
    );
  },

  getMyExceptions(): Promise<ApiResponse<AvailabilityException[]>> {
    return apiClient.get<AvailabilityException[]>(
      "/consultations/provider/exceptions",
    );
  },

  createException(payload: {
    date: string;
    type: "UNAVAILABLE" | "CUSTOM_HOURS";
    startTime?: string;
    endTime?: string;
    timezone?: string;
    reason?: string;
  }): Promise<ApiResponse<AvailabilityException>> {
    return apiClient.post<AvailabilityException>(
      "/consultations/provider/exceptions",
      payload,
    );
  },

  deleteException(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/consultations/provider/exceptions/${id}`);
  },

  createBooking(
    data: CreateBookingRequest,
  ): Promise<ApiResponse<ConsultationBooking>> {
    return apiClient.post<ConsultationBooking>("/consultations/bookings", data);
  },

  getMyBookings(
    status?: "upcoming" | "past",
  ): Promise<ApiResponse<ConsultationBooking[]>> {
    const query = status ? `?status=${status}` : "";
    return apiClient.get<ConsultationBooking[]>(
      `/consultations/my-bookings${query}`,
    );
  },

  getProviderBookings(params?: {
    status?: ConsultationBookingStatus;
    from?: string;
    to?: string;
  }): Promise<ApiResponse<ConsultationBooking[]>> {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    if (params?.from) search.set("from", params.from);
    if (params?.to) search.set("to", params.to);
    const query = search.toString();
    return apiClient.get<ConsultationBooking[]>(
      `/consultations/provider/bookings${query ? `?${query}` : ""}`,
    );
  },

  cancelBooking(
    id: string,
    payload?: CancelBookingRequest,
  ): Promise<ApiResponse<ConsultationBooking>> {
    return apiClient.patch<ConsultationBooking>(
      `/consultations/bookings/${id}/cancel`,
      payload ?? {},
    );
  },

  markNoShow(id: string): Promise<ApiResponse<ConsultationBooking>> {
    return apiClient.patch<ConsultationBooking>(
      `/consultations/bookings/${id}/no-show`,
      {},
    );
  },

  rescheduleBooking(
    id: string,
    payload: RescheduleBookingRequest,
  ): Promise<ApiResponse<ConsultationBooking>> {
    return apiClient.patch<ConsultationBooking>(
      `/consultations/bookings/${id}/reschedule`,
      payload,
    );
  },

  completeBooking(
    id: string,
    payload?: CompleteBookingRequest,
  ): Promise<ApiResponse<ConsultationBooking>> {
    return apiClient.patch<ConsultationBooking>(
      `/consultations/bookings/${id}/complete`,
      payload ?? {},
    );
  },
};
