import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

/*
 * Daily list client. Contract: binectics-api #341 (src/checklist). No streaks, no "missed" state.
 *   GET    /checklist/today?tz
 *   GET    /checklist/items
 *   POST   /checklist/items                   { label, days? }
 *   PATCH  /checklist/items/:id               { label?, days?, active?, order? }
 *   DELETE /checklist/items/:id
 *   POST   /checklist/items/:id/complete      { tz, local_day? }   (custom lines only)
 *   DELETE /checklist/items/:id/complete?tz   (undo a tick)
 *   POST   /checklist/system/:key             (idempotent: show a tool line)
 *   DELETE /checklist/system/:key
 */

export const CHECKLIST_MAX_ACTIVE = 12;
export const CHECKLIST_LABEL_MAX = 60;

export enum ChecklistItemKind {
  CUSTOM = "custom",
  SYSTEM = "system",
}

/** The tools a system line can mirror. Each ticks itself from real data. */
export enum ChecklistSystemKey {
  FASTING = "fasting",
  WATER = "water",
  STARTER_SESSION = "starter_session",
  WEIGHT = "weight",
}

export const CHECKLIST_LIMIT_REACHED = "CHECKLIST_LIMIT_REACHED";

export interface ChecklistTodayItem {
  id: string;
  label: string;
  kind: ChecklistItemKind;
  system_key: ChecklistSystemKey | null;
  done: boolean;
}

export interface ChecklistToday {
  local_day: string;
  items: ChecklistTodayItem[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  kind: ChecklistItemKind;
  system_key: ChecklistSystemKey | null;
  /** 0 = Sunday to 6 = Saturday. */
  days: number[];
  active: boolean;
  order: number;
}

export interface ChecklistItems {
  items: ChecklistItem[];
}

export interface CreateChecklistItemInput {
  label: string;
  days?: number[];
}

export interface UpdateChecklistItemInput {
  label?: string;
  days?: number[];
  active?: boolean;
  order?: number;
}

export interface ChecklistTick {
  id: string;
  local_day: string;
  done: boolean;
}

const enc = encodeURIComponent;

export const checklistService = {
  today: (tz: string): Promise<ApiResponse<ChecklistToday>> =>
    apiClient.get<ChecklistToday>(`/checklist/today?tz=${enc(tz)}`),

  list: (): Promise<ApiResponse<ChecklistItems>> =>
    apiClient.get<ChecklistItems>("/checklist/items"),

  create: (input: CreateChecklistItemInput): Promise<ApiResponse<ChecklistItem>> =>
    apiClient.post<ChecklistItem>("/checklist/items", input),

  update: (id: string, input: UpdateChecklistItemInput): Promise<ApiResponse<ChecklistItem>> =>
    apiClient.patch<ChecklistItem>(`/checklist/items/${enc(id)}`, input),

  remove: (id: string): Promise<ApiResponse<{ removed: boolean }>> =>
    apiClient.delete<{ removed: boolean }>(`/checklist/items/${enc(id)}`),

  complete: (id: string, tz: string): Promise<ApiResponse<ChecklistTick>> =>
    apiClient.post<ChecklistTick>(`/checklist/items/${enc(id)}/complete`, { tz }),

  uncomplete: (id: string, tz: string): Promise<ApiResponse<ChecklistTick>> =>
    apiClient.delete<ChecklistTick>(`/checklist/items/${enc(id)}/complete?tz=${enc(tz)}`),

  addSystem: (key: ChecklistSystemKey): Promise<ApiResponse<ChecklistItem>> =>
    apiClient.post<ChecklistItem>(`/checklist/system/${enc(key)}`),

  removeSystem: (key: ChecklistSystemKey): Promise<ApiResponse<{ removed: boolean }>> =>
    apiClient.delete<{ removed: boolean }>(`/checklist/system/${enc(key)}`),
};
