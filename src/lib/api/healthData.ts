import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

/**
 * /health-data (binectics-api src/health-data). Health Connect is connected
 * and synced from the Android app; the web only reads where things stand.
 * Every route acts on the signed-in member's own data.
 */

/** GET /health-data/config: whether health import is offered to me at all. */
export interface HealthImportConfig {
  enabled: boolean;
  types: string[];
}

export interface HealthDevice {
  device_key: string;
  model: string | null;
  manufacturer: string | null;
  connected_at: string | null;
  last_sync_at: string | null;
}

/** Snake keys, as GET /health-data/connection returns them. */
export interface HealthSharing {
  steps: boolean;
  workouts: boolean;
  sleep: boolean;
  heart_rate: boolean;
  weight: boolean;
}

/** GET /health-data/connection. */
export interface HealthConnectionState {
  connection: {
    source: "health_connect";
    status: "active" | "revoked" | "disconnected";
    granted_types: string[];
    use_for_tasks: boolean;
    connected_at: string | null;
    disconnected_at: string | null;
    devices: HealthDevice[];
  } | null;
  /** Each type the member shares with their providers (every type starts off). */
  health_sharing: HealthSharing;
  /** The account-wide "Share my progress with my providers" switch. */
  share_progress_with_providers: boolean;
}

export const healthDataService = {
  getConfig(): Promise<ApiResponse<HealthImportConfig>> {
    return apiClient.get<HealthImportConfig>("/health-data/config");
  },
  getConnection(): Promise<ApiResponse<HealthConnectionState>> {
    return apiClient.get<HealthConnectionState>("/health-data/connection");
  },
};
