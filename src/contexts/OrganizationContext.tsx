"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { teamsService, type Organization } from "@/lib/api/teams";
import { useAuth } from "@/contexts/AuthContext";
import {
  dashboardKindForPath,
  pickOrgForDashboard,
  type DashboardKind,
} from "@/lib/workspaces";

interface OrganizationContextType {
  organizations: Organization[];
  currentOrg: Organization | null;
  setCurrentOrg: (org: Organization | null) => void;
  isLoading: boolean;
  refreshOrganizations: () => Promise<void>;
  /**
   * Point currentOrg at the workspace a dashboard works in (a gym owner who
   * also coaches has a gym and a trainer workspace). Returns the workspace
   * chosen, or null when there is nothing better than the current one.
   */
  selectOrgForDashboard: (kind: DashboardKind) => Organization | null;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined,
);

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  // Read inside loadOrganizations without making it (and the fetch effect)
  // depend on the user object, which changes on every profile refresh.
  const userIdRef = useRef<string | undefined>(user?.id);
  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const resetOrganizations = useCallback(() => {
    setOrganizations([]);
    setCurrentOrgState(null);
    localStorage.removeItem("currentOrgId");
    setIsLoading(false);
  }, []);

  const loadOrganizations = useCallback(async () => {
    if (!isAuthenticated) {
      resetOrganizations();
      return;
    }

    setIsLoading(true);
    try {
      const response = await teamsService.getMyOrganizations();

      if (response.success && response.data) {
        setOrganizations(response.data);

        const storedOrgId = localStorage.getItem("currentOrgId");
        // On a dashboard, start in that dashboard's workspace: the stored
        // or first workspace may be the owner's other one.
        const kind =
          typeof window !== "undefined"
            ? dashboardKindForPath(window.location.pathname)
            : null;
        const forDashboard = kind
          ? pickOrgForDashboard(response.data, kind, {
              userId: userIdRef.current,
              currentId: storedOrgId,
            })
          : null;
        const nextOrg = storedOrgId
          ? (response.data.find((org) => org._id === storedOrgId) ?? null)
          : null;

        setCurrentOrgState(forDashboard || nextOrg || response.data[0] || null);
        return;
      }

      resetOrganizations();
    } catch (error) {
      console.error("Failed to load organizations:", error);
      resetOrganizations();
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, resetOrganizations]);

  const setCurrentOrg = useCallback((org: Organization | null) => {
    setCurrentOrgState(org);
    if (org) {
      localStorage.setItem("currentOrgId", org._id);
    } else {
      localStorage.removeItem("currentOrgId");
    }
  }, []);

  const selectOrgForDashboard = useCallback(
    (kind: DashboardKind): Organization | null => {
      const target = pickOrgForDashboard(organizations, kind, {
        userId: user?.id,
        currentId: currentOrg?._id,
      });
      if (target && target._id !== currentOrg?._id) setCurrentOrg(target);
      return target;
    },
    [organizations, user?.id, currentOrg?._id, setCurrentOrg],
  );

  useEffect(() => {
    if (isAuthLoading) return;

    void loadOrganizations();
  }, [isAuthLoading, loadOrganizations]);

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrg,
        setCurrentOrg,
        isLoading,
        refreshOrganizations: loadOrganizations,
        selectOrgForDashboard,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider",
    );
  }
  return context;
}

/**
 * Non-throwing variant for design-system components that may render outside
 * the provider (previews, isolated tests). Returns null when unavailable.
 */
export function useOptionalOrganization() {
  return useContext(OrganizationContext) ?? null;
}
