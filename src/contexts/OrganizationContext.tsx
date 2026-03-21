"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { teamsService, type Organization } from "@/lib/api/teams";
import { useAuth } from "@/contexts/AuthContext";

interface OrganizationContextType {
  organizations: Organization[];
  currentOrg: Organization | null;
  setCurrentOrg: (org: Organization | null) => void;
  isLoading: boolean;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<
  OrganizationContextType | undefined
>(undefined);

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
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
        const nextOrg = storedOrgId
          ? response.data.find((org) => org._id === storedOrgId) ?? null
          : null;

        setCurrentOrgState(nextOrg || response.data[0] || null);
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

  const setCurrentOrg = (org: Organization | null) => {
    setCurrentOrgState(org);
    if (org) {
      localStorage.setItem("currentOrgId", org._id);
    } else {
      localStorage.removeItem("currentOrgId");
    }
  };

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
