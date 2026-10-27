import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";
import type { CredentialsView, UpdateCredentialsRequest } from "@/lib/credentials/dietitian";

/**
 * A dietitian's credentials: pronouns, specializations, populations and
 * licences. Licence numbers and documents are private to the dietitian
 * (and Binectics admins); the listing shows the rest.
 */
export const credentialsService = {
  async getMine(): Promise<ApiResponse<CredentialsView>> {
    return await apiClient.get<CredentialsView>("/credentials/me");
  },

  async updateMine(body: UpdateCredentialsRequest): Promise<ApiResponse<CredentialsView>> {
    return await apiClient.patch<CredentialsView>("/credentials/me", body);
  },
};
