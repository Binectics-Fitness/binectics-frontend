import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CheckInScanPage from "@/app/check-in/[gymId]/page";
import { checkinsService } from "@/lib/api/checkins";

const push = vi.fn();
let token: string | null = "fresh";

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ gymId: "g1" }),
  useSearchParams: () => ({ get: () => token }),
  useRouter: () => ({ push }),
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { first_name: "Yemi" } }) }));
vi.mock("@/components/BinecticsLogo", () => ({ BinecticsLockup: () => <span>Binectics</span> }));

const CHECKED_IN_AT = new Date(2026, 9, 7, 14, 42).toISOString();
const clock = new Date(CHECKED_IN_AT).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

describe("check-in success takeover", () => {
  beforeEach(() => {
    token = "fresh";
    push.mockReset();
    vi.spyOn(checkinsService, "getGymInfo").mockResolvedValue({ success: true, data: { name: "Dapo Fitness Hub", listing_id: null } });
    vi.spyOn(checkinsService, "scan").mockResolvedValue({
      success: true,
      data: { _id: "x", organization_id: "g1", member_user_id: "u", checked_in_at: CHECKED_IN_AT, created_at: "", updated_at: "" },
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it("is the dark takeover with the API's time, the member's name, the gym and the real streak", async () => {
    vi.spyOn(checkinsService, "getMyDashboardStats").mockResolvedValue({
      success: true,
      data: { has_checked_in_today: true, current_streak_days: 6, total_check_ins: 15, longest_streak_days: 6 } as never,
    });
    render(<CheckInScanPage />);
    // jsdom's name computation pads the <em> with a space; browsers don't.
    const dialog = await screen.findByRole("dialog", { name: /^You’re in ?, Yemi\.$/ });
    // The takeover IS the screen (the page behind is inert): its title is the h1.
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("You’re in, Yemi.");
    expect(dialog.style.background).toBe("var(--ink)");
    expect(dialog).toHaveAccessibleDescription(`Checked in · ${clock}`);
    expect(dialog.querySelector("em")?.textContent).toBe("in");
    expect(screen.getByText("Dapo Fitness Hub · welcome back")).toBeInTheDocument();
    const card = dialog.querySelector("[data-surface='raised']") as HTMLElement;
    expect(card).toHaveAttribute("data-align", "center");
    expect(card.textContent).toContain("6");
    expect(card.textContent).toContain("Personal best");

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(push).toHaveBeenCalledWith("/dashboard/member");
  });

  it("leaves out the best line against an API without longest_streak_days", async () => {
    vi.spyOn(checkinsService, "getMyDashboardStats").mockResolvedValue({
      success: true,
      data: { has_checked_in_today: true, current_streak_days: 3, total_check_ins: 15 },
    });
    render(<CheckInScanPage />);
    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("Streak");
    expect(dialog.textContent).not.toMatch(/Personal best|Longest/);
  });

  it("still celebrates, without a streak card, if the stats read fails", async () => {
    vi.spyOn(checkinsService, "getMyDashboardStats").mockRejectedValue(new Error("offline"));
    render(<CheckInScanPage />);
    const dialog = await screen.findByRole("dialog");
    expect(dialog.querySelector("[data-surface='raised']")).toBeNull();
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    // Unknown history: neither "welcome back" nor "first check-in", just the gym.
    expect(screen.getByText("Dapo Fitness Hub")).toBeInTheDocument();
    expect(dialog.textContent).not.toMatch(/welcome back|first check-in/);
  });

  it("says it is the first check-in when it is", async () => {
    vi.spyOn(checkinsService, "getMyDashboardStats").mockResolvedValue({
      success: true,
      data: { has_checked_in_today: true, current_streak_days: 1, total_check_ins: 1, longest_streak_days: 1 },
    });
    render(<CheckInScanPage />);
    const dialog = await screen.findByRole("dialog");
    expect(screen.getByText("Dapo Fitness Hub · your first check-in")).toBeInTheDocument();
    // 1 day, longest 1: no footnote that only repeats the streak.
    expect(dialog.textContent).not.toMatch(/Longest|Personal best/);
  });
});
