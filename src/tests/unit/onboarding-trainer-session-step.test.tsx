import { describe, it, expect, beforeEach, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrainerStep1, TrainerStep4, TrainerStep6 } from "@/app/onboarding/_trainer";
import { trainerSessionPatch } from "@/app/onboarding/_config";
import { SEEDED_CURRENCIES } from "../setup/currencyFixtures";

// NGN is the only currency prices can be set in (the seeded state).
vi.mock("@/lib/queries/currencies", () => ({
  useCurrencies: () => ({ data: SEEDED_CURRENCIES, all: SEEDED_CURRENCIES, isError: false }),
}));

const latest: Record<string, unknown> = {};

function Harness({ initial = {}, Step }: { initial?: Record<string, unknown>; Step: typeof TrainerStep4 }) {
  const [data, setData] = useState<Record<string, unknown>>(initial);
  const setField = (k: string, v: unknown) => {
    latest[k] = v;
    setData((d) => ({ ...d, [k]: v }));
  };
  return <Step data={data} setField={setField} />;
}

beforeEach(() => {
  for (const k of Object.keys(latest)) delete latest[k];
});

describe("trainer pricing step", () => {
  it("names the 1:1 price field and offers Free and Set up later", async () => {
    render(<Harness Step={TrainerStep4} initial={{ country: "Nigeria" }} />);
    await userEvent.click(screen.getByRole("switch", { name: "Set up later" }));
    expect(screen.getByLabelText("1:1 session")).toBeDisabled();
    expect(screen.getByText(/Members book the standard session until you set your own\./)).toBeInTheDocument();
    expect(trainerSessionPatch({ ...latest, price1on1Minor: 8000000 })).toBeNull();
  });
});

describe("trainer preview", () => {
  it("shows no price the trainer did not set", () => {
    render(<Harness Step={TrainerStep6} initial={{ firstName: "Tunde", lastName: "Bello", city: "Lagos" }} />);
    expect(screen.queryByText(/session/)).toBeNull();
    expect(screen.queryByText(/80,000/)).toBeNull();
  });

  it("shows the price the trainer set, or Free", () => {
    const { unmount } = render(<Harness Step={TrainerStep6} initial={{ city: "Lagos", price1on1: "₦45,000", price1on1Minor: 4500000 }} />);
    expect(screen.getByText(/₦45,000\/session/)).toBeInTheDocument();
    unmount();
    render(<Harness Step={TrainerStep6} initial={{ city: "Lagos", price1on1Free: true }} />);
    expect(screen.getByText(/Free sessions/)).toBeInTheDocument();
  });
});

describe("trainer basics step", () => {
  it("clears prices typed in the old currency when the country changes", async () => {
    render(<Harness Step={TrainerStep1} initial={{ country: "Nigeria", currency: "NGN", price1on1: "₦45,000", price1on1Minor: 4500000 }} />);
    expect(screen.getByLabelText("City")).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Country"));
    await userEvent.click(await screen.findByText("Kenya"));
    expect(latest.country).toBe("Kenya");
    // KES can't be charged yet, so there is no suggestion and no fallback.
    expect(latest.currency).toBe("");
    expect(latest.price1on1Minor).toBeNull();
    expect(latest.price1on1).toBe("");
  });

  it("suggests the country's currency when it can be charged", () => {
    render(<Harness Step={TrainerStep1} initial={{ country: "Nigeria" }} />);
    expect(latest.currency).toBe("NGN");
  });

  it("offers only currencies prices can be set in, and keeps a pick across country changes", async () => {
    render(<Harness Step={TrainerStep1} initial={{ country: "Kenya" }} />);
    expect(latest.currency).toBeFalsy();
    await userEvent.click(screen.getByLabelText("Currency you charge in"));
    expect(screen.queryByText(/KES/)).toBeNull();
    expect(screen.queryByText(/USD/)).toBeNull();
    await userEvent.click(await screen.findByText(/NGN/));
    expect(latest.currency).toBe("NGN");
    expect(latest.currencyPicked).toBe(true);
    await userEvent.click(screen.getByLabelText("Country"));
    await userEvent.click(await screen.findByText("United States"));
    expect(latest.currency).toBe("NGN");
  });
});
