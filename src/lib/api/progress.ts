/**
 * Progress Tracking API Service
 * Handles client profiles, weight logs, meal feedback, activity reports,
 * progress summaries, client invitations, workout plans, and diet plans.
 */

import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";
import { DifficultyLevel, PlanStatus, DietPlanDeliveryType, MealSlot, RecommendationCategory, RecommendationPlanType } from "@/lib/types";

// ==================== ENUMS ====================

export enum MealType {
  BREAKFAST = "breakfast",
  LUNCH = "lunch",
  DINNER = "dinner",
  SNACK = "snack",
}

export enum MealRating {
  GREAT = "great",
  GOOD = "good",
  OKAY = "okay",
  POOR = "poor",
}

export enum ActivityType {
  CARDIO = "cardio",
  STRENGTH = "strength",
  FLEXIBILITY = "flexibility",
  HIIT = "hiit",
  YOGA = "yoga",
  SWIMMING = "swimming",
  CYCLING = "cycling",
  RUNNING = "running",
  WALKING = "walking",
  OTHER = "other",
}

export enum ClientJournalMood {
  EXCELLENT = "excellent",
  GOOD = "good",
  OKAY = "okay",
  LOW = "low",
  STRESSED = "stressed",
}

// ==================== TYPES ====================

export interface ClientProfile {
  _id: string;
  client_id:
    | string
    | {
        _id: string;
        first_name: string;
        last_name: string;
        email: string;
        profile_picture?: string;
      };
  organization_id: string | null;
  professional_id:
    | string
    | {
        _id: string;
        first_name: string;
        last_name: string;
        email: string;
        profile_picture?: string;
        user_role?: {
          role?: {
            name?: string;
          };
        };
      };
  notes?: string;
  starting_weight_kg?: number;
  target_weight_kg?: number;
  height_cm?: number;
  goals: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeightLog {
  _id: string;
  client_profile_id: string;
  client_id: string;
  weight_kg: number;
  recorded_at: string;
  logged_by: string | { _id: string; first_name: string; last_name: string };
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface MealFeedback {
  _id: string;
  client_profile_id: string;
  client_id: string;
  meal_date: string;
  meal_type: MealType;
  description: string;
  rating?: MealRating;
  calories?: number;
  feedback?: string;
  logged_by: string | { _id: string; first_name: string; last_name: string };
  created_at: string;
  updated_at: string;
}

export interface ActivityReport {
  _id: string;
  client_profile_id: string;
  client_id: string;
  activity_type: ActivityType;
  title: string;
  duration_minutes: number;
  calories_burned?: number;
  intensity?: number;
  performed_at: string;
  notes?: string;
  logged_by: string | { _id: string; first_name: string; last_name: string };
  created_at: string;
  updated_at: string;
}

export interface ClientJournalEntry {
  _id: string;
  client_profile_id: string;
  client_id: string;
  professional_id: string;
  organization_id?: string;
  notes: string;
  weight_kg?: number;
  mood?: ClientJournalMood;
  adherence_score?: number;
  entry_date: string;
  logged_by: string | { _id: string; first_name: string; last_name: string };
  created_at: string;
  updated_at: string;
}

export interface MyJournalEntry extends Omit<
  ClientJournalEntry,
  "professional_id"
> {
  professional_id:
    | string
    | {
        _id: string;
        first_name: string;
        last_name: string;
        email: string;
      };
}

export interface JournalPage {
  entries: MyJournalEntry[];
  next_cursor: string | null;
}

export interface ProgressSummary {
  profile: ClientProfile;
  period_days: number;
  weight: {
    logs: WeightLog[];
    latest_kg: number | null;
    starting_kg: number | null;
    change_kg: number | null;
    target_kg: number | null;
  };
  meals: {
    feedbacks: MealFeedback[];
    total_count: number;
  };
  activities: {
    reports: ActivityReport[];
    total_count: number;
    total_duration_minutes: number;
    total_calories_burned: number;
  };
}

export interface ClientInvitation {
  _id: string;
  id: string;
  email: string;
  status: string;
  expires_at: string;
}

// ==================== WORKOUT PLAN TYPES ====================

export interface WorkoutExercise {
  name: string;
  description?: string;
  sets?: number;
  reps?: number;
  duration_minutes?: number;
  rest_seconds?: number;
  order: number;
  notes?: string;
}

export interface WorkoutPlan {
  _id: string;
  professional_id:
    | string
    | {
        _id: string;
        first_name: string;
        last_name: string;
        email: string;
      };
  organization_id?: string;
  created_by:
    | string
    | {
        _id: string;
        first_name: string;
        last_name: string;
      };
  client_profile_id: string;
  client_id:
    | string
    | {
        _id: string;
        first_name: string;
        last_name: string;
        email: string;
      };
  title: string;
  description?: string;
  exercises: WorkoutExercise[];
  trainer_notes?: string;
  frequency?: string;
  difficulty_level?: DifficultyLevel;
  status: PlanStatus;
  version: number;
  assigned_at: string;
  created_at: string;
  updated_at: string;
}

// ==================== REQUEST TYPES ====================

export interface AddClientRequest {
  email: string;
  first_name?: string;
  message?: string;
  notes?: string;
  starting_weight_kg?: number;
  target_weight_kg?: number;
  height_cm?: number;
  goals?: string[];
}

export interface AddClientResponse {
  action: "request_sent" | "invitation_sent";
  message: string;
}

export interface ClientRequestItem {
  _id: string;
  professional_id:
    | string
    | {
        _id: string;
        first_name: string;
        last_name: string;
        email: string;
        profile_picture?: string;
      };
  client_id:
    | string
    | {
        _id: string;
        first_name: string;
        last_name: string;
        email: string;
        profile_picture?: string;
      };
  organization_id: string | null;
  professional_type: string;
  status: string;
  message?: string;
  notes?: string;
  starting_weight_kg?: number;
  target_weight_kg?: number;
  height_cm?: number;
  goals: string[];
  created_at: string;
  updated_at: string;
}

export interface UpdateClientProfileRequest {
  notes?: string;
  target_weight_kg?: number;
  height_cm?: number;
  goals?: string[];
  is_active?: boolean;
}

export interface CreateWeightLogRequest {
  weight_kg: number;
  recorded_at: string;
  note?: string;
}

export interface CreateMealFeedbackRequest {
  meal_date: string;
  meal_type: MealType;
  description: string;
  rating?: MealRating;
  calories?: number;
  feedback?: string;
}

export interface CreateActivityReportRequest {
  activity_type: ActivityType;
  title: string;
  duration_minutes: number;
  calories_burned?: number;
  intensity?: number;
  performed_at: string;
  notes?: string;
}

export interface CreateClientJournalEntryRequest {
  notes: string;
  weight_kg?: number;
  mood?: ClientJournalMood;
  adherence_score?: number;
  entry_date?: string;
}

export interface InviteClientRequest {
  email: string;
  first_name?: string;
  organization_id?: string;
}

export interface AcceptClientInviteRequest {
  token: string;
}

export interface LatestWeight {
  weight_kg: number;
  recorded_at: string;
}

export interface DashboardStats {
  active_clients: number;
  total_clients: number;
  pending_requests: number;
  pending_invitations: number;
}

// ==================== WORKOUT PLAN REQUEST TYPES ====================

export interface CreateWorkoutExerciseRequest {
  name: string;
  description?: string;
  sets?: number;
  reps?: number;
  duration_minutes?: number;
  rest_seconds?: number;
  order: number;
  notes?: string;
}

export interface CreateWorkoutPlanRequest {
  title: string;
  description?: string;
  exercises?: CreateWorkoutExerciseRequest[];
  trainer_notes?: string;
  frequency?: string;
  difficulty_level?: DifficultyLevel;
}

export interface UpdateWorkoutPlanRequest {
  title?: string;
  description?: string;
  exercises?: CreateWorkoutExerciseRequest[];
  trainer_notes?: string;
  frequency?: string;
  difficulty_level?: DifficultyLevel;
  status?: PlanStatus;
}

// ==================== DIET PLAN TYPES ====================

export interface DietMeal {
  meal_type: MealSlot;
  title: string;
  description?: string;
  foods: string[];
  calories?: number;
  notes?: string;
  order: number;
}

export interface DietPlan {
  _id: string;
  professional_id:
    | string
    | {
        _id: string;
        first_name: string;
        last_name: string;
        email: string;
      };
  organization_id?: string;
  created_by:
    | string
    | {
        _id: string;
        first_name: string;
        last_name: string;
      };
  client_profile_id: string;
  client_id:
    | string
    | {
        _id: string;
        first_name: string;
        last_name: string;
        email: string;
      };
  title: string;
  description?: string;
  delivery_type: DietPlanDeliveryType;
  meals: DietMeal[];
  dietitian_notes?: string;
  document_file_name?: string;
  document_mime_type?: string;
  document_file_size?: number;
  status: PlanStatus;
  version: number;
  assigned_at: string;
  created_at: string;
  updated_at: string;
}

export interface DietPlanDocumentAccess {
  download_url: string;
  format: string;
  expires_in_seconds: number;
}

// ==================== RECOMMENDATION TYPES ====================

export interface Recommendation {
  _id: string;
  professional_id:
    | string
    | {
        _id: string;
        first_name: string;
        last_name: string;
        email: string;
      };
  organization_id?: string;
  client_profile_id: string;
  client_id:
    | string
    | {
        _id: string;
        first_name: string;
        last_name: string;
        email: string;
      };
  title: string;
  content: string;
  category: RecommendationCategory;
  plan_id?: string;
  plan_type?: RecommendationPlanType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRecommendationRequest {
  title: string;
  content: string;
  category?: RecommendationCategory;
  plan_id?: string;
  plan_type?: RecommendationPlanType;
}

export interface UpdateRecommendationRequest {
  title?: string;
  content?: string;
  category?: RecommendationCategory;
  is_active?: boolean;
}

// ==================== DIET PLAN REQUEST TYPES ====================

export interface CreateDietMealRequest {
  meal_type: MealSlot;
  title: string;
  description?: string;
  foods?: string[];
  calories?: number;
  notes?: string;
  order: number;
}

export interface CreateDietPlanRequest {
  title: string;
  description?: string;
  delivery_type: DietPlanDeliveryType;
  meals?: CreateDietMealRequest[];
  dietitian_notes?: string;
}

export interface UpdateDietPlanRequest {
  title?: string;
  description?: string;
  meals?: CreateDietMealRequest[];
  dietitian_notes?: string;
  status?: PlanStatus;
}

// ==================== SERVICE ====================

export const progressService = {
  // ==================== ADD CLIENT (unified — by email) ====================

  async addClient(
    data: AddClientRequest,
  ): Promise<ApiResponse<AddClientResponse>> {
    return await apiClient.post<AddClientResponse>(
      "/progress/add-client",
      data,
    );
  },

  async addClientInOrg(
    organizationId: string,
    data: AddClientRequest,
  ): Promise<ApiResponse<AddClientResponse>> {
    return await apiClient.post<AddClientResponse>(
      `/progress/organizations/${organizationId}/add-client`,
      data,
    );
  },

  // ==================== CLIENT REQUESTS (authorization flow) ====================

  async getMyPendingClientRequests(): Promise<
    ApiResponse<ClientRequestItem[]>
  > {
    return await apiClient.get<ClientRequestItem[]>("/progress/my-requests");
  },

  async respondToClientRequest(
    requestId: string,
    approved: boolean,
  ): Promise<ApiResponse<ClientProfile | null>> {
    return await apiClient.post<ClientProfile | null>(
      `/progress/requests/${requestId}/respond`,
      { approved },
    );
  },

  async getSentClientRequests(
    organizationId?: string,
  ): Promise<ApiResponse<ClientRequestItem[]>> {
    const query = organizationId ? `?organization_id=${organizationId}` : "";
    return await apiClient.get<ClientRequestItem[]>(
      `/progress/requests/sent${query}`,
    );
  },

  async getOrgSentClientRequests(
    organizationId: string,
  ): Promise<ApiResponse<ClientRequestItem[]>> {
    return await apiClient.get<ClientRequestItem[]>(
      `/progress/organizations/${organizationId}/requests/sent`,
    );
  },

  async cancelClientRequest(requestId: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/progress/requests/${requestId}`);
  },

  // ==================== CLIENT PROFILES (ORG) ====================

  async getOrgClientProfiles(
    organizationId: string,
  ): Promise<ApiResponse<ClientProfile[]>> {
    return await apiClient.get<ClientProfile[]>(
      `/progress/organizations/${organizationId}/clients`,
    );
  },

  // ==================== CLIENT PROFILES (SOLO) ====================

  async getMyClientProfiles(): Promise<ApiResponse<ClientProfile[]>> {
    return await apiClient.get<ClientProfile[]>("/progress/clients");
  },

  // ==================== CLIENT PROFILES (SHARED) ====================

  async getMyOwnProfiles(): Promise<ApiResponse<ClientProfile[]>> {
    return await apiClient.get<ClientProfile[]>("/progress/my-profiles");
  },

  async getMyJournalEntries(
    limit = 20,
    cursor?: string,
  ): Promise<ApiResponse<JournalPage>> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);
    const res = await apiClient.get<{
      data: MyJournalEntry[];
      next_cursor: string | null;
    }>(`/progress/my-journals?${params.toString()}`);
    // Normalise: the API returns { success, data: MyJournalEntry[], next_cursor }
    // We expose it as ApiResponse<JournalPage> for consistent consumption
    if (res.success) {
      const raw = res as unknown as {
        success: boolean;
        data?: MyJournalEntry[];
        next_cursor?: string | null;
        message?: string;
      };
      return {
        success: true,
        data: {
          entries: raw.data ?? [],
          next_cursor: raw.next_cursor ?? null,
        },
      };
    }
    return res as unknown as ApiResponse<JournalPage>;
  },

  async getClientProfile(
    profileId: string,
  ): Promise<ApiResponse<ClientProfile>> {
    return await apiClient.get<ClientProfile>(`/progress/clients/${profileId}`);
  },

  async updateClientProfile(
    profileId: string,
    data: UpdateClientProfileRequest,
  ): Promise<ApiResponse<ClientProfile>> {
    return await apiClient.patch<ClientProfile>(
      `/progress/clients/${profileId}`,
      data,
    );
  },

  // ==================== WEIGHT LOGS ====================

  async createWeightLog(
    profileId: string,
    data: CreateWeightLogRequest,
  ): Promise<ApiResponse<WeightLog>> {
    return await apiClient.post<WeightLog>(
      `/progress/clients/${profileId}/weight`,
      data,
    );
  },

  async getWeightLogs(
    profileId: string,
    limit?: number,
  ): Promise<ApiResponse<WeightLog[]>> {
    const query = limit ? `?limit=${limit}` : "";
    return await apiClient.get<WeightLog[]>(
      `/progress/clients/${profileId}/weight${query}`,
    );
  },

  async deleteWeightLog(logId: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/progress/weight/${logId}`);
  },

  // ==================== MEAL FEEDBACKS ====================

  async createMealFeedback(
    profileId: string,
    data: CreateMealFeedbackRequest,
  ): Promise<ApiResponse<MealFeedback>> {
    return await apiClient.post<MealFeedback>(
      `/progress/clients/${profileId}/meals`,
      data,
    );
  },

  async getMealFeedbacks(
    profileId: string,
    limit?: number,
  ): Promise<ApiResponse<MealFeedback[]>> {
    const query = limit ? `?limit=${limit}` : "";
    return await apiClient.get<MealFeedback[]>(
      `/progress/clients/${profileId}/meals${query}`,
    );
  },

  async deleteMealFeedback(feedbackId: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/progress/meals/${feedbackId}`);
  },

  // ==================== ACTIVITY REPORTS ====================

  async createActivityReport(
    profileId: string,
    data: CreateActivityReportRequest,
  ): Promise<ApiResponse<ActivityReport>> {
    return await apiClient.post<ActivityReport>(
      `/progress/clients/${profileId}/activities`,
      data,
    );
  },

  async getActivityReports(
    profileId: string,
    limit?: number,
  ): Promise<ApiResponse<ActivityReport[]>> {
    const query = limit ? `?limit=${limit}` : "";
    return await apiClient.get<ActivityReport[]>(
      `/progress/clients/${profileId}/activities${query}`,
    );
  },

  async deleteActivityReport(reportId: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/progress/activities/${reportId}`);
  },

  // ==================== CLIENT JOURNALS ====================

  async createClientJournalEntry(
    profileId: string,
    data: CreateClientJournalEntryRequest,
  ): Promise<ApiResponse<ClientJournalEntry>> {
    return await apiClient.post<ClientJournalEntry>(
      `/progress/clients/${profileId}/journals`,
      data,
    );
  },

  async getClientJournalEntries(
    profileId: string,
    limit?: number,
  ): Promise<ApiResponse<ClientJournalEntry[]>> {
    const query = limit ? `?limit=${limit}` : "";
    return await apiClient.get<ClientJournalEntry[]>(
      `/progress/clients/${profileId}/journals${query}`,
    );
  },

  async deleteClientJournalEntry(entryId: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/progress/journals/${entryId}`);
  },

  // ==================== PROGRESS SUMMARY ====================

  async getProgressSummary(
    profileId: string,
    days?: number,
  ): Promise<ApiResponse<ProgressSummary>> {
    const query = days ? `?days=${days}` : "";
    return await apiClient.get<ProgressSummary>(
      `/progress/clients/${profileId}/summary${query}`,
    );
  },

  // ==================== CLIENT INVITATIONS ====================

  async inviteClient(
    data: InviteClientRequest,
  ): Promise<ApiResponse<ClientInvitation>> {
    return await apiClient.post<ClientInvitation>("/progress/invite", data);
  },

  async inviteClientInOrg(
    organizationId: string,
    data: InviteClientRequest,
  ): Promise<ApiResponse<ClientInvitation>> {
    return await apiClient.post<ClientInvitation>(
      `/progress/organizations/${organizationId}/invite-client`,
      data,
    );
  },

  async acceptClientInvitation(
    data: AcceptClientInviteRequest,
  ): Promise<ApiResponse<ClientProfile>> {
    return await apiClient.post<ClientProfile>("/progress/invite/accept", data);
  },

  async getMyClientInvitations(
    organizationId?: string,
  ): Promise<ApiResponse<ClientInvitation[]>> {
    const query = organizationId ? `?organization_id=${organizationId}` : "";
    return await apiClient.get<ClientInvitation[]>(
      `/progress/invitations${query}`,
    );
  },

  async getOrgClientInvitations(
    organizationId: string,
  ): Promise<ApiResponse<ClientInvitation[]>> {
    return await apiClient.get<ClientInvitation[]>(
      `/progress/organizations/${organizationId}/invitations`,
    );
  },

  async cancelClientInvitation(
    invitationId: string,
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/progress/invitations/${invitationId}`,
    );
  },

  // ==================== LATEST WEIGHTS (batch) ====================

  async getLatestWeights(): Promise<
    ApiResponse<Record<string, LatestWeight | null>>
  > {
    return await apiClient.get<Record<string, LatestWeight | null>>(
      "/progress/clients/latest-weights",
    );
  },

  async getOrgLatestWeights(
    organizationId: string,
  ): Promise<ApiResponse<Record<string, LatestWeight | null>>> {
    return await apiClient.get<Record<string, LatestWeight | null>>(
      `/progress/organizations/${organizationId}/clients/latest-weights`,
    );
  },

  // ==================== DASHBOARD STATS ====================

  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return await apiClient.get<DashboardStats>("/progress/dashboard-stats");
  },

  // ==================== WORKOUT PLANS — Professional ====================

  async createWorkoutPlan(
    profileId: string,
    data: CreateWorkoutPlanRequest,
  ): Promise<ApiResponse<WorkoutPlan>> {
    return await apiClient.post<WorkoutPlan>(
      `/progress/clients/${profileId}/workout-plans`,
      data,
    );
  },

  async getWorkoutPlans(
    profileId: string,
    limit?: number,
  ): Promise<ApiResponse<WorkoutPlan[]>> {
    const params = limit ? `?limit=${limit}` : "";
    return await apiClient.get<WorkoutPlan[]>(
      `/progress/clients/${profileId}/workout-plans${params}`,
    );
  },

  async getWorkoutPlanById(
    profileId: string,
    planId: string,
  ): Promise<ApiResponse<WorkoutPlan>> {
    return await apiClient.get<WorkoutPlan>(
      `/progress/clients/${profileId}/workout-plans/${planId}`,
    );
  },

  async updateWorkoutPlan(
    profileId: string,
    planId: string,
    data: UpdateWorkoutPlanRequest,
  ): Promise<ApiResponse<WorkoutPlan>> {
    return await apiClient.patch<WorkoutPlan>(
      `/progress/clients/${profileId}/workout-plans/${planId}`,
      data,
    );
  },

  async archiveWorkoutPlan(
    profileId: string,
    planId: string,
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/progress/clients/${profileId}/workout-plans/${planId}`,
    );
  },

  // ==================== WORKOUT PLANS — Organization ====================

  async createWorkoutPlanInOrg(
    organizationId: string,
    profileId: string,
    data: CreateWorkoutPlanRequest,
  ): Promise<ApiResponse<WorkoutPlan>> {
    return await apiClient.post<WorkoutPlan>(
      `/progress/organizations/${organizationId}/clients/${profileId}/workout-plans`,
      data,
    );
  },

  async getWorkoutPlansInOrg(
    organizationId: string,
    profileId: string,
    limit?: number,
  ): Promise<ApiResponse<WorkoutPlan[]>> {
    const params = limit ? `?limit=${limit}` : "";
    return await apiClient.get<WorkoutPlan[]>(
      `/progress/organizations/${organizationId}/clients/${profileId}/workout-plans${params}`,
    );
  },

  async updateWorkoutPlanInOrg(
    organizationId: string,
    profileId: string,
    planId: string,
    data: UpdateWorkoutPlanRequest,
  ): Promise<ApiResponse<WorkoutPlan>> {
    return await apiClient.patch<WorkoutPlan>(
      `/progress/organizations/${organizationId}/clients/${profileId}/workout-plans/${planId}`,
      data,
    );
  },

  async archiveWorkoutPlanInOrg(
    organizationId: string,
    profileId: string,
    planId: string,
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/progress/organizations/${organizationId}/clients/${profileId}/workout-plans/${planId}`,
    );
  },

  // ==================== WORKOUT PLANS — User-facing (my plans) ====================

  async getMyWorkoutPlans(
    limit?: number,
  ): Promise<ApiResponse<WorkoutPlan[]>> {
    const params = limit ? `?limit=${limit}` : "";
    return await apiClient.get<WorkoutPlan[]>(
      `/progress/my-workout-plans${params}`,
    );
  },

  async getMyWorkoutPlanById(
    planId: string,
  ): Promise<ApiResponse<WorkoutPlan>> {
    return await apiClient.get<WorkoutPlan>(
      `/progress/my-workout-plans/${planId}`,
    );
  },

  // ==================== DIET PLANS — Professional ====================

  async createDietPlan(
    profileId: string,
    data: CreateDietPlanRequest,
  ): Promise<ApiResponse<DietPlan>> {
    return await apiClient.post<DietPlan>(
      `/progress/clients/${profileId}/diet-plans`,
      data,
    );
  },

  async createDietPlanWithDocument(
    profileId: string,
    formData: FormData,
  ): Promise<ApiResponse<DietPlan>> {
    return await apiClient.postFormData<DietPlan>(
      `/progress/clients/${profileId}/diet-plans`,
      formData,
    );
  },

  async getDietPlans(
    profileId: string,
    limit?: number,
  ): Promise<ApiResponse<DietPlan[]>> {
    const params = limit ? `?limit=${limit}` : "";
    return await apiClient.get<DietPlan[]>(
      `/progress/clients/${profileId}/diet-plans${params}`,
    );
  },

  async getDietPlanById(
    profileId: string,
    planId: string,
  ): Promise<ApiResponse<DietPlan>> {
    return await apiClient.get<DietPlan>(
      `/progress/clients/${profileId}/diet-plans/${planId}`,
    );
  },

  async updateDietPlan(
    profileId: string,
    planId: string,
    data: UpdateDietPlanRequest,
  ): Promise<ApiResponse<DietPlan>> {
    return await apiClient.patch<DietPlan>(
      `/progress/clients/${profileId}/diet-plans/${planId}`,
      data,
    );
  },

  async replaceDietPlanDocument(
    profileId: string,
    planId: string,
    formData: FormData,
  ): Promise<ApiResponse<DietPlan>> {
    return await apiClient.patchFormData<DietPlan>(
      `/progress/clients/${profileId}/diet-plans/${planId}/document`,
      formData,
    );
  },

  async archiveDietPlan(
    profileId: string,
    planId: string,
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/progress/clients/${profileId}/diet-plans/${planId}`,
    );
  },

  async getDietPlanDocumentAccess(
    profileId: string,
    planId: string,
  ): Promise<ApiResponse<DietPlanDocumentAccess>> {
    return await apiClient.get<DietPlanDocumentAccess>(
      `/progress/clients/${profileId}/diet-plans/${planId}/document-access`,
    );
  },

  // ==================== DIET PLANS — Organization ====================

  async createDietPlanInOrg(
    organizationId: string,
    profileId: string,
    data: CreateDietPlanRequest,
  ): Promise<ApiResponse<DietPlan>> {
    return await apiClient.post<DietPlan>(
      `/progress/organizations/${organizationId}/clients/${profileId}/diet-plans`,
      data,
    );
  },

  async createDietPlanWithDocumentInOrg(
    organizationId: string,
    profileId: string,
    formData: FormData,
  ): Promise<ApiResponse<DietPlan>> {
    return await apiClient.postFormData<DietPlan>(
      `/progress/organizations/${organizationId}/clients/${profileId}/diet-plans`,
      formData,
    );
  },

  async getDietPlansInOrg(
    organizationId: string,
    profileId: string,
    limit?: number,
  ): Promise<ApiResponse<DietPlan[]>> {
    const params = limit ? `?limit=${limit}` : "";
    return await apiClient.get<DietPlan[]>(
      `/progress/organizations/${organizationId}/clients/${profileId}/diet-plans${params}`,
    );
  },

  async updateDietPlanInOrg(
    organizationId: string,
    profileId: string,
    planId: string,
    data: UpdateDietPlanRequest,
  ): Promise<ApiResponse<DietPlan>> {
    return await apiClient.patch<DietPlan>(
      `/progress/organizations/${organizationId}/clients/${profileId}/diet-plans/${planId}`,
      data,
    );
  },

  async replaceDietPlanDocumentInOrg(
    organizationId: string,
    profileId: string,
    planId: string,
    formData: FormData,
  ): Promise<ApiResponse<DietPlan>> {
    return await apiClient.patchFormData<DietPlan>(
      `/progress/organizations/${organizationId}/clients/${profileId}/diet-plans/${planId}/document`,
      formData,
    );
  },

  async archiveDietPlanInOrg(
    organizationId: string,
    profileId: string,
    planId: string,
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/progress/organizations/${organizationId}/clients/${profileId}/diet-plans/${planId}`,
    );
  },

  async getDietPlanDocumentAccessInOrg(
    organizationId: string,
    profileId: string,
    planId: string,
  ): Promise<ApiResponse<DietPlanDocumentAccess>> {
    return await apiClient.get<DietPlanDocumentAccess>(
      `/progress/organizations/${organizationId}/clients/${profileId}/diet-plans/${planId}/document-access`,
    );
  },

  // ==================== DIET PLANS — User-facing (my plans) ====================

  async getMyDietPlans(
    limit?: number,
  ): Promise<ApiResponse<DietPlan[]>> {
    const params = limit ? `?limit=${limit}` : "";
    return await apiClient.get<DietPlan[]>(
      `/progress/my-diet-plans${params}`,
    );
  },

  async getMyDietPlanById(
    planId: string,
  ): Promise<ApiResponse<DietPlan>> {
    return await apiClient.get<DietPlan>(
      `/progress/my-diet-plans/${planId}`,
    );
  },

  async getMyDietPlanDocumentAccess(
    planId: string,
  ): Promise<ApiResponse<DietPlanDocumentAccess>> {
    return await apiClient.get<DietPlanDocumentAccess>(
      `/progress/my-diet-plans/${planId}/document-access`,
    );
  },

  // ==================== RECOMMENDATIONS — Professional ====================

  async createRecommendation(
    profileId: string,
    data: CreateRecommendationRequest,
  ): Promise<ApiResponse<Recommendation>> {
    return await apiClient.post<Recommendation>(
      `/progress/clients/${profileId}/recommendations`,
      data,
    );
  },

  async getRecommendations(
    profileId: string,
  ): Promise<ApiResponse<Recommendation[]>> {
    return await apiClient.get<Recommendation[]>(
      `/progress/clients/${profileId}/recommendations`,
    );
  },

  async getRecommendationById(
    profileId: string,
    recommendationId: string,
  ): Promise<ApiResponse<Recommendation>> {
    return await apiClient.get<Recommendation>(
      `/progress/clients/${profileId}/recommendations/${recommendationId}`,
    );
  },

  async updateRecommendation(
    profileId: string,
    recommendationId: string,
    data: UpdateRecommendationRequest,
  ): Promise<ApiResponse<Recommendation>> {
    return await apiClient.patch<Recommendation>(
      `/progress/clients/${profileId}/recommendations/${recommendationId}`,
      data,
    );
  },

  async deleteRecommendation(
    profileId: string,
    recommendationId: string,
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/progress/clients/${profileId}/recommendations/${recommendationId}`,
    );
  },

  // ==================== RECOMMENDATIONS — Organization ====================

  async createRecommendationInOrg(
    organizationId: string,
    profileId: string,
    data: CreateRecommendationRequest,
  ): Promise<ApiResponse<Recommendation>> {
    return await apiClient.post<Recommendation>(
      `/progress/organizations/${organizationId}/clients/${profileId}/recommendations`,
      data,
    );
  },

  async getRecommendationsInOrg(
    organizationId: string,
    profileId: string,
  ): Promise<ApiResponse<Recommendation[]>> {
    return await apiClient.get<Recommendation[]>(
      `/progress/organizations/${organizationId}/clients/${profileId}/recommendations`,
    );
  },

  async updateRecommendationInOrg(
    organizationId: string,
    profileId: string,
    recommendationId: string,
    data: UpdateRecommendationRequest,
  ): Promise<ApiResponse<Recommendation>> {
    return await apiClient.patch<Recommendation>(
      `/progress/organizations/${organizationId}/clients/${profileId}/recommendations/${recommendationId}`,
      data,
    );
  },

  async deleteRecommendationInOrg(
    organizationId: string,
    profileId: string,
    recommendationId: string,
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/progress/organizations/${organizationId}/clients/${profileId}/recommendations/${recommendationId}`,
    );
  },

  // ==================== RECOMMENDATIONS — User-facing (my recommendations) ====================

  async getMyRecommendations(
    limit?: number,
  ): Promise<ApiResponse<Recommendation[]>> {
    const params = limit ? `?limit=${limit}` : "";
    return await apiClient.get<Recommendation[]>(
      `/progress/my-recommendations${params}`,
    );
  },

  async getMyRecommendationById(
    recommendationId: string,
  ): Promise<ApiResponse<Recommendation>> {
    return await apiClient.get<Recommendation>(
      `/progress/my-recommendations/${recommendationId}`,
    );
  },
};
