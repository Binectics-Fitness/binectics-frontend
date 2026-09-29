import { describe, it, expect, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DietStep5 } from "@/app/onboarding/_dietitian";
import { dietitianSessionPatch } from "@/app/onboarding/_config";

/** What the page's step data holds, written from setField like the page does. */
const latest: Record<string, unknown> = {};

function Harness({ initial = {} }: { initial?: Record<string, unknown> }) {
  const [data, setData] = useState<Record<string, unknown>>(initial);
  const setField = (k: string, v: unknown) => {
    latest[k] = v;
    setData((d) => ({ ...d, [k]: v }));
  };
  return <DietStep5 data={data} setField={setField} />;
}

beforeEach(() => {
  for (const k of Object.keys(latest)) delete latest[k];
});

describe("dietitian consultation step", () => {
  it("prices in the step 1 country's currency and says what a price saves", async () => {
    latest.country = "South Africa";
    render(<Harness initial={{ country: "South Africa" }} />);
    expect(screen.getByText("Price per session (ZAR)")).toBeInTheDocument();
    await userEvent.type(screen.getByRole("textbox"), "450");
    expect(latest.sessionPriceMinor).toBe(45000);
    expect(screen.getByText(/Clients pay .*450 for a 60 min consultation\./)).toBeInTheDocument();
    expect(dietitianSessionPatch(latest)).toMatchObject({ priceMinor: 45000, currency: "ZAR" });
  });

  it("leaves nothing to save when untouched, and says it can be set up later", () => {
    render(<Harness />);
    expect(screen.getByText("Price per session (NGN)")).toBeInTheDocument();
    expect(screen.getByText("Enter a price, or choose Free. Leave both empty to set it up later.")).toBeInTheDocument();
    expect(dietitianSessionPatch(latest)).toBeNull();
  });

  it("makes Free an explicit choice that disables the price and saves 0", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("switch", { name: "Free consultation" }));
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByText("Clients book a 60 min consultation with you for free.")).toBeInTheDocument();
    expect(dietitianSessionPatch(latest)).toMatchObject({ priceMinor: 0, currency: "NGN" });
  });
});
