import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { InviteClientModal } from "@/components/ds/modals/InviteClientModal";

vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ currentOrg: { _id: "o1", name: "Iron Temple" } }),
}));
vi.mock("@/lib/queries/marketplace", () => ({
  useOrgMembershipPlans: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
}));

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

// The Connected list's "Offer a plan" opens the Add member flow for someone
// the gym already knows: their email and name come filled in.
describe("InviteClientModal prefill", () => {
  it("fills the email and name it is given", async () => {
    wrap(
      <InviteClientModal
        open
        onClose={vi.fn()}
        prefill={{ email: "ada@example.com", first_name: "Ada", last_name: "Obi" }}
      />,
    );
    expect(await screen.findByDisplayValue("ada@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ada")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Obi")).toBeInTheDocument();
  });

  it("starts empty without one, as Add member does", async () => {
    wrap(<InviteClientModal open onClose={vi.fn()} />);
    await screen.findByRole("dialog");
    expect(screen.queryByDisplayValue("ada@example.com")).toBeNull();
  });
});
