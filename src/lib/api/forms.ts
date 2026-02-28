/**
 * Forms API Service
 * Handles all form-related API calls
 */

import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

// ==================== TYPES ====================

export enum QuestionType {
  TEXT = "TEXT",
  TEXTAREA = "TEXTAREA",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  CHECKBOX = "CHECKBOX",
  SELECT = "SELECT",
  DATE = "DATE",
  NUMBER = "NUMBER",
  EMAIL = "EMAIL",
  PHONE = "PHONE",
  RATING = "RATING",
}

export interface QuestionOption {
  value: string;
  label: string;
}

export interface Form {
  _id: string;
  created_by_id: string;
  title: string;
  description?: string;
  is_published: boolean;
  allow_multiple_submissions: boolean;
  require_authentication: boolean;
  is_active: boolean;
  published_at?: string;
  archived_at?: string;
  created_at: string;
  updated_at: string;
  custom_logo?: string;
  custom_header_color?: string;
  company_name?: string;
  company_description?: string;
}

export interface FormQuestion {
  _id: string;
  form_id: string;
  type: QuestionType;
  label: string;
  help_text?: string;
  is_required: boolean;
  options?: QuestionOption[];
  order_index: number;
  min_value?: number;
  max_value?: number;
  min_length?: number;
  max_length?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormResponse {
  _id: string;
  form_id: string;
  submitted_by_id: string | null;
  submitted_by: string; // User's name or "Anonymous"
  submitted_at: string;
  completion_time_seconds?: number;
  is_complete: boolean;
  ip_address?: string;
  user_agent?: string;
  answers?: FormAnswer[];
}

export interface FormAnswer {
  _id: string;
  response_id: string;
  question_id: string;
  value: string | number | boolean | string[] | null;
  value_text?: string;
  value_number?: number;
}

export interface FormAnalytics {
  total_responses: number;
  completion_rate: number;
  submission_trend: Array<{
    date: string;
    count: number;
  }>;
  questions: Array<{
    question_id: string;
    label: string;
    type: QuestionType;
    responses_count: number;
    response_rate: number;
    value_breakdown?: Array<{
      value: string;
      count: number;
      percentage: string;
    }>;
    average?: number;
    min?: number;
    max?: number;
    sample_text_responses?: string[];
  }>;
  average_completion_time: number;
}

// ==================== REQUEST TYPES ====================

export interface CreateFormRequest {
  title: string;
  description?: string;
  allow_multiple_submissions?: boolean;
  require_authentication?: boolean;
  custom_logo?: string;
  custom_header_color?: string;
  company_name?: string;
  company_description?: string;
}

export interface UpdateFormRequest {
  title?: string;
  description?: string;
  is_published?: boolean;
  is_active?: boolean;
  allow_multiple_submissions?: boolean;
  require_authentication?: boolean;
  custom_logo?: string;
  custom_header_color?: string;
  company_name?: string;
  company_description?: string;
}

export interface CreateQuestionRequest {
  type: QuestionType;
  label: string;
  help_text?: string;
  is_required?: boolean;
  options?: QuestionOption[];
  order_index?: number;
  min_value?: number;
  max_value?: number;
  min_length?: number;
  max_length?: number;
}

export type UpdateQuestionRequest = Partial<CreateQuestionRequest>;

export interface SubmitFormResponseRequest {
  answers: Array<{
    question_id: string;
    value: string | number | boolean | string[] | null;
  }>;
  completion_time_seconds?: number;
}

// ==================== SERVICE ====================

export const formsService = {
  // ==================== FORM CRUD ====================

  /**
   * Create a new form
   */
  async createForm(data: CreateFormRequest): Promise<ApiResponse<Form>> {
    return await apiClient.post<Form>("/forms", data);
  },

  /**
   * Get all forms created by the current user
   */
  async getMyForms(
    includeArchived: boolean = false,
  ): Promise<ApiResponse<Form[]>> {
    const query = includeArchived ? "?include_archived=true" : "";
    return await apiClient.get<Form[]>(`/forms/my-forms${query}`);
  },

  /**
   * Get a form by ID
   * Public endpoint - authentication optional
   */
  async getFormById(formId: string): Promise<ApiResponse<Form>> {
    return await apiClient.get<Form>(`/forms/${formId}`);
  },

  /**
   * Update a form
   */
  async updateForm(
    formId: string,
    data: UpdateFormRequest,
  ): Promise<ApiResponse<Form>> {
    return await apiClient.put<Form>(`/forms/${formId}`, data);
  },

  /**
   * Delete a form
   */
  async deleteForm(formId: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/forms/${formId}`);
  },

  /**
   * Publish a form
   */
  async publishForm(formId: string): Promise<ApiResponse<Form>> {
    return await this.updateForm(formId, { is_published: true });
  },

  /**
   * Unpublish a form
   */
  async unpublishForm(formId: string): Promise<ApiResponse<Form>> {
    return await this.updateForm(formId, { is_published: false });
  },

  /**
   * Archive a form
   */
  async archiveForm(formId: string): Promise<ApiResponse<Form>> {
    return await this.updateForm(formId, { is_active: false });
  },

  // ==================== QUESTIONS ====================

  /**
   * Add a question to a form
   */
  async addQuestion(
    formId: string,
    data: CreateQuestionRequest,
  ): Promise<ApiResponse<FormQuestion>> {
    return await apiClient.post<FormQuestion>(
      `/forms/${formId}/questions`,
      data,
    );
  },

  /**
   * Get all questions for a form
   * Public endpoint - authentication optional
   */
  async getFormQuestions(formId: string): Promise<ApiResponse<FormQuestion[]>> {
    return await apiClient.get<FormQuestion[]>(`/forms/${formId}/questions`);
  },

  /**
   * Update a question
   */
  async updateQuestion(
    questionId: string,
    data: UpdateQuestionRequest,
  ): Promise<ApiResponse<FormQuestion>> {
    return await apiClient.put<FormQuestion>(
      `/forms/questions/${questionId}`,
      data,
    );
  },

  /**
   * Delete a question
   */
  async deleteQuestion(questionId: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/forms/questions/${questionId}`);
  },

  /**
   * Update question order (batch)
   */
  async updateQuestionOrder(
    formId: string,
    updates: Array<{ question_id: string; order_index: number }>,
  ): Promise<ApiResponse<void>> {
    return await apiClient.put<void>(`/forms/${formId}/questions/reorder`, {
      questions: updates,
    });
  },

  // ==================== RESPONSES ====================

  /**
   * Submit a response to a form
   * Authentication optional - user ID captured if token present and valid
   */
  async submitFormResponse(
    formId: string,
    data: SubmitFormResponseRequest,
  ): Promise<ApiResponse<FormResponse>> {
    return await apiClient.post<FormResponse>(`/forms/${formId}/submit`, data);
  },

  /**
   * Alias for submitFormResponse
   */
  async submitForm(
    formId: string,
    data: SubmitFormResponseRequest,
  ): Promise<ApiResponse<FormResponse>> {
    return this.submitFormResponse(formId, data);
  },

  /**
   * Get all responses for a form (creator only)
   */
  async getFormResponses(formId: string): Promise<ApiResponse<FormResponse[]>> {
    return await apiClient.get<FormResponse[]>(`/forms/${formId}/responses`);
  },

  // ==================== ANALYTICS ====================

  /**
   * Get analytics for a form (creator only)
   */
  async getFormAnalytics(formId: string): Promise<ApiResponse<FormAnalytics>> {
    return await apiClient.get<FormAnalytics>(`/forms/${formId}/analytics`);
  },
};
