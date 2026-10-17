import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HEALTH_PRIVACY_HREF, HealthAppsCard, sharedWithProviders } from "@/app/dashboard/settings/privacy/HealthAppsCard";
import { healthDataService, type HealthConnectionState } from "@/lib/api/healthData";

/**
 * Settings → Privacy, connected health apps: where the member's Health
 * Connect data stands, for anyone it is offered to or who has connected.
 */

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "m1", role: "USER" } }) }));

const ok = <T,>(data: T) => Promise.resolve({ success: true, data });
const noSharing = { steps: false, workouts: false, sleep: false, heart_rate: false, weight: false };
const state = (over: Partial<HealthConnectionState> = {}): HealthConnectionState => ({
  connection: null,
  health_sharing: noSharing,
  share_progress_with_providers: true,
  ...over,
});
const connected: HealthConnectionState["connection"] = {
  source: "health_connect",
  status: "active",
  granted_types: ["steps", "exercise"],
  use_for_tasks: true,
  connected_at: "2026-10-01T08:00:00.000Z",
  disconnected_at: null,
  devices: [
    { device_key: "d1", manufacturer: "samsung", model: "SM-S918B", connected_at: "2026-10-01T08:00:00.000Z", last_sync_at: "2026-10-16T07:30:00.000Z" },
  ],
};

const renderCard = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <HealthAppsCard />
    </QueryClientProvider>,
  );

afterEach(() => vi.restoreAllMocks());

describe("connected health apps card", () => {
  it("shows nothing to someone health import isn't offered to and who never connected", async () => {
    const config = vi.spyOn(healthDataService, "getConfig").mockReturnValue(ok({ enabled: false, types: [] }));
    vi.spyOn(healthDataService, "getConnection").mockReturnValue(ok(state()));
    const { container } = renderCard();
    await waitFor(() => expect(config).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("shows nothing when the reads fail", async () => {
    vi.spyOn(healthDataService, "getConfig").mockResolvedValue({ success: false, message: "boom" });
    const conn = vi.spyOn(healthDataService, "getConnection").mockResolvedValue({ success: false, message: "boom" });
    const { container } = renderCard();
    await waitFor(() => expect(conn).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("tells an offered member where to connect, and links the policy", async () => {
    vi.spyOn(healthDataService, "getConfig").mockReturnValue(ok({ enabled: true, types: ["steps"] }));
    vi.spyOn(healthDataService, "getConnection").mockReturnValue(ok(state()));
    renderCard();
    expect(await screen.findByRole("heading", { name: "Connected health apps" })).toBeInTheDocument();
    expect(screen.getByText(/Not connected\. In the Binectics app on Android, Settings → Connected apps/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "How we use your health data" })).toHaveAttribute("href", HEALTH_PRIVACY_HREF);
  });

  it("says what is connected, whether tasks use it, and what providers see", async () => {
    vi.spyOn(healthDataService, "getConfig").mockReturnValue(ok({ enabled: true, types: ["steps"] }));
    vi.spyOn(healthDataService, "getConnection").mockReturnValue(
      ok(state({ connection: connected, health_sharing: { ...noSharing, steps: true, workouts: true } })),
    );
    renderCard();
    expect(await screen.findByText(/Health Connect is connected on Samsung SM-S918B\./)).toBeInTheDocument();
    expect(screen.getByText(/Last synced Oct 16, 2026\./)).toBeInTheDocument();
    expect(screen.getByText("Ticked from your health data")).toBeInTheDocument();
    expect(screen.getByText("Steps, Workouts")).toBeInTheDocument();
    expect(screen.getByText(/or disconnect, in the app/)).toBeInTheDocument();
  });

  it("still shows a connection after import was switched off for the member", async () => {
    vi.spyOn(healthDataService, "getConfig").mockReturnValue(ok({ enabled: false, types: [] }));
    vi.spyOn(healthDataService, "getConnection").mockReturnValue(ok(state({ connection: connected })));
    renderCard();
    expect(await screen.findByText(/Health Connect is connected/)).toBeInTheDocument();
    expect(screen.getByText("Nothing")).toBeInTheDocument();
  });

  it("shares nothing while 'Share my progress with my providers' is off", () => {
    expect(
      sharedWithProviders({ share_progress_with_providers: false, health_sharing: { ...noSharing, steps: true } }),
    ).toBeNull();
    expect(
      sharedWithProviders({ share_progress_with_providers: true, health_sharing: { ...noSharing, heart_rate: true, weight: true } }),
    ).toBe("Resting heart rate, Weight");
  });
});
