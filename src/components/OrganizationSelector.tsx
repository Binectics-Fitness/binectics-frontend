"use client";

import React from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Building2, ChevronDown, Loader2 } from "lucide-react";

export default function OrganizationSelector() {
  const { organizations, currentOrg, setCurrentOrg, isLoading } = useOrganization();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-200">
        <Loader2 className="h-4 w-4 text-foreground-tertiary animate-spin" />
        <span className="text-sm text-foreground-secondary">Loading organizations...</span>
      </div>
    );
  }

  if (organizations.length === 0) {
    return null;
  }

  return (
    <div className="relative group">
      <select
        value={currentOrg?._id || ""}
        onChange={(e) => {
          const org = organizations.find((o) => o._id === e.target.value);
          setCurrentOrg(org || null);
        }}
        className="w-full pl-10 pr-9 py-3 bg-white border-2 border-neutral-200 rounded-lg text-sm font-semibold text-foreground hover:border-accent-blue-500 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-accent-blue-500 focus:ring-offset-1 focus:border-accent-blue-500 appearance-none cursor-pointer transition-all duration-200 shadow-sm"
      >
        <option value="" className="font-medium">Personal Account</option>
        {organizations.map((org) => (
          <option key={org._id} value={org._id} className="font-medium">
            {org.name}
          </option>
        ))}
      </select>
      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent-blue-500 pointer-events-none transition-colors" />
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary pointer-events-none group-hover:text-accent-blue-500 transition-colors" />
    </div>
  );
}
