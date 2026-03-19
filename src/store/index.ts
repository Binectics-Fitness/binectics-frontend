/**
 * Store Layer
 * Canonical barrel export for application state management.
 * The actual implementations live in src/contexts/.
 */

export { AuthProvider, useAuth } from "@/contexts/AuthContext";
export { OrganizationProvider, useOrganization } from "@/contexts/OrganizationContext";
