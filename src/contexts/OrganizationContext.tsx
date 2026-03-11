"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { teamsService, type Organization } from "@/lib/api/teams";

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
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrganizations = async () => {
    setIsLoading(true);
    try {
      const response = await teamsService.getMyOrganizations();
      if (response.success && response.data) {
        setOrganizations(response.data);
        
        // Auto-select first organization if none selected
        if (!currentOrg && response.data.length > 0) {
          const storedOrgId = localStorage.getItem("currentOrgId");
          const stored = response.data.find((o) => o._id === storedOrgId);
          setCurrentOrgState(stored || response.data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load organizations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentOrg = (org: Organization | null) => {
    setCurrentOrgState(org);
    if (org) {
      localStorage.setItem("currentOrgId", org._id);
    } else {
      localStorage.removeItem("currentOrgId");
    }
  };

  useEffect(() => {
    loadOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
