"use client";

import { useState, useCallback } from "react";
import { progressService } from "@/lib/api/progress";
import type {
  ClientProfile,
  ProgressSummary,
  ClientInvitation,
  ClientRequestItem,
  AddClientRequest,
  CreateWeightLogRequest,
  CreateMealFeedbackRequest,
  CreateActivityReportRequest,
} from "@/lib/api/progress";
import { pMap } from "@/utils/async";

/** Maximum concurrent getProgressSummary requests to avoid API fan-out. */
const SUMMARY_CONCURRENCY = 5;

// ==================== useClientManagement ====================

export function useClientManagement(organizationId?: string) {
  const [profiles, setProfiles] = useState<ClientProfile[]>([]);
  const [summaries, setSummaries] = useState<Record<string, ProgressSummary>>(
    {}
  );
  const [invitations, setInvitations] = useState<ClientInvitation[]>([]);
  const [sentRequests, setSentRequests] = useState<ClientRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profilesRes = organizationId
        ? await progressService.getOrgClientProfiles(organizationId)
        : await progressService.getMyClientProfiles();

      if (!profilesRes.success || !profilesRes.data) {
        setError(profilesRes.message || "Failed to load client profiles");
        return;
      }

      const loadedProfiles = profilesRes.data;
      setProfiles(loadedProfiles);

      // Load 30-day progress summaries with concurrency limit
      const summaryResults = await pMap(
        loadedProfiles,
        (p) => progressService.getProgressSummary(p._id, 30),
        SUMMARY_CONCURRENCY,
      );
      const summaryMap: Record<string, ProgressSummary> = {};
      loadedProfiles.forEach((p, i) => {
        if (summaryResults[i].success && summaryResults[i].data) {
          summaryMap[p._id] = summaryResults[i].data!;
        }
      });
      setSummaries(summaryMap);

      // Load invitations
      const invRes = await progressService.getMyClientInvitations(
        organizationId
      );
      if (invRes.success && invRes.data) {
        setInvitations(invRes.data);
      }

      // Load sent requests
      const reqRes = organizationId
        ? await progressService.getOrgSentClientRequests(organizationId)
        : await progressService.getSentClientRequests();
      if (reqRes.success && reqRes.data) {
        setSentRequests(reqRes.data);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  const addClient = useCallback(
    async (data: AddClientRequest) => {
      const res = organizationId
        ? await progressService.addClientInOrg(organizationId, data)
        : await progressService.addClient(data);
      return res;
    },
    [organizationId]
  );

  const cancelRequest = useCallback(async (requestId: string) => {
    const res = await progressService.cancelClientRequest(requestId);
    return res;
  }, []);

  return {
    profiles,
    summaries,
    invitations,
    sentRequests,
    isLoading,
    error,
    loadProfiles,
    addClient,
    cancelRequest,
  };
}

// ==================== useProgressTracking ====================

export function useProgressTracking() {
  const [pendingRequests, setPendingRequests] = useState<ClientRequestItem[]>(
    []
  );
  const [profiles, setProfiles] = useState<ClientProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null
  );
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPendingRequests = useCallback(async () => {
    const res = await progressService.getMyPendingClientRequests();
    if (res.success && res.data) {
      setPendingRequests(res.data);
    }
  }, []);

  const loadProfiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await progressService.getMyOwnProfiles();
      if (res.success && res.data) {
        setProfiles(res.data);
        if (res.data.length > 0 && !selectedProfileId) {
          setSelectedProfileId(res.data[0]._id);
        }
      }
    } catch {
      setError("Failed to load profiles");
    } finally {
      setIsLoading(false);
    }
  }, [selectedProfileId]);

  const loadSummary = useCallback(
    async (profileId: string, days: number = 30) => {
      const res = await progressService.getProgressSummary(profileId, days);
      if (res.success && res.data) {
        setSummary(res.data);
      }
    },
    []
  );

  const createWeightLog = useCallback(
    async (profileId: string, data: CreateWeightLogRequest) => {
      const res = await progressService.createWeightLog(profileId, data);
      return res;
    },
    []
  );

  const createMealFeedback = useCallback(
    async (profileId: string, data: CreateMealFeedbackRequest) => {
      const res = await progressService.createMealFeedback(profileId, data);
      return res;
    },
    []
  );

  const createActivityReport = useCallback(
    async (profileId: string, data: CreateActivityReportRequest) => {
      const res = await progressService.createActivityReport(profileId, data);
      return res;
    },
    []
  );

  const respondToRequest = useCallback(
    async (requestId: string, approved: boolean) => {
      const res = await progressService.respondToClientRequest(
        requestId,
        approved
      );
      if (res.success) {
        await loadPendingRequests();
        if (approved) {
          const profilesRes = await progressService.getMyOwnProfiles();
          if (profilesRes.success && profilesRes.data) {
            setProfiles(profilesRes.data);
            if (!selectedProfileId && profilesRes.data.length > 0) {
              setSelectedProfileId(profilesRes.data[0]._id);
            }
          }
        }
      }
      return res;
    },
    [loadPendingRequests, selectedProfileId]
  );

  return {
    pendingRequests,
    profiles,
    selectedProfileId,
    setSelectedProfileId,
    summary,
    isLoading,
    error,
    setError,
    loadPendingRequests,
    loadProfiles,
    loadSummary,
    createWeightLog,
    createMealFeedback,
    createActivityReport,
    respondToRequest,
  };
}

// ==================== useClientInviteAccept ====================

export function useClientInviteAccept() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const acceptInvite = useCallback(async (token: string) => {
    setStatus("loading");
    setError(null);
    try {
      const response = await progressService.acceptClientInvitation({ token });
      if (response.success) {
        setStatus("success");
        return true;
      }
      setError(response.message || "Failed to accept invitation");
      setStatus("error");
      return false;
    } catch {
      setError("An unexpected error occurred");
      setStatus("error");
      return false;
    }
  }, []);

  return { status, error, acceptInvite };
}
