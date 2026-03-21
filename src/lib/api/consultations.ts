import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

export type ConsultationProviderRole =
  | "DIETICIAN"
  | "PERSONAL_TRAINER"
  | "OTHER";

export type ConsultationBookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export interface ConsultationType {
  id: string;
  name: string;
  description?: string;
  providerRole: ConsultationProviderRole;
  defaultDurationMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  type: "UNAVAILABLE" | "CUSTOM_HOURS";
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
  providerId: string;
  consultationTypeId: string;
  startsAt: string;
  endsAt: string;
  providerTimezone: string;
  clientTimezone: string;
  status: ConsultationBookingStatus;
  notes?: string;
  completionNote?: string;
  cancelledBy?: "CLIENT" | "PROVIDER" | "ADMIN";
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  providerId: string;
  consultationTypeId: string;
  startsAt: string;
  clientTimezone: string;
  notes?: string;
}

export interface RescheduleBookingRequest {
  startsAt: string;
  reason?: string;
}

export interface CancelBookingRequest {
  reason?: string;
}

export interface CompleteBookingRequest {
  note?: string;
}

export const consultationsService = {
  getTypes(): Promise<ApiResponse<ConsultationType[]>> {
    return apiClient.get<ConsultationType[]>("/consultations/types");
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
