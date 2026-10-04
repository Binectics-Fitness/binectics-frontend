import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Bell } from "lucide-react";
import { IconTile } from "@/components/ds/IconTile";
import { StatusPill } from "@/components/ds/StatusPill";
import { BookingStatusBadge } from "@/components/ds/BookingStatusBadge";
import { ConsultationBookingStatus } from "@/lib/api/consultations";

describe("IconTile", () => {
  it("draws the tone's soft fill and ink", () => {
    const { container } = render(<IconTile icon={Bell} tone="warn" />);
    const tile = container.firstElementChild as HTMLElement;
    expect(tile.dataset.tone).toBe("warn");
    expect(tile.style.background).toBe("var(--warn-soft)");
    expect(tile.style.color).toBe("var(--warn-ink)");
    expect(tile.querySelector("svg")).not.toBeNull();
  });

  it("is neutral and decorative by default", () => {
    const { container } = render(<IconTile icon={Bell} />);
    const tile = container.firstElementChild as HTMLElement;
    expect(tile.dataset.tone).toBe("neutral");
    expect(tile.getAttribute("aria-hidden")).toBe("true");
  });

  it("is labelled when it stands alone", () => {
    render(<IconTile icon={Bell} tone="danger" label="Payment failed" />);
    expect(screen.getByRole("img", { name: "Payment failed" })).toBeInTheDocument();
  });

  it("keeps a fixed box per size so rows line up", () => {
    const { container } = render(
      <>
        <IconTile icon={Bell} size="sm" />
        <IconTile initials="ada lovelace" size="md" tone="trainer" />
        <IconTile icon={Bell} size="lg" />
      </>,
    );
    const [sm, md, lg] = Array.from(container.children) as HTMLElement[];
    expect(sm.style.width).toBe("28px");
    expect(md.style.width).toBe("36px");
    expect(md.textContent).toBe("AD");
    expect(md.style.color).toBe("var(--trainer-ink)");
    expect(lg.style.width).toBe("56px");
  });
});

describe("StatusPill", () => {
  it("draws its label on the tone's colours", () => {
    render(<StatusPill tone="success" label="Paid" />);
    const pill = screen.getByText("Paid");
    expect(pill.dataset.tone).toBe("success");
    expect(pill.style.background).toBe("var(--signal-soft)");
    expect(pill.style.color).toBe("var(--signal-ink)");
  });

  it("defaults to neutral", () => {
    render(<StatusPill label="Draft" />);
    expect(screen.getByText("Draft").dataset.tone).toBe("neutral");
  });
});

describe("BookingStatusBadge", () => {
  it("reads a no-show as warn and a cancellation as neutral, not red", () => {
    render(
      <>
        <BookingStatusBadge status={ConsultationBookingStatus.NO_SHOW} />
        <BookingStatusBadge status={ConsultationBookingStatus.CANCELLED} />
        <BookingStatusBadge status={ConsultationBookingStatus.CONFIRMED} />
      </>,
    );
    expect(screen.getByText("No-show").dataset.tone).toBe("warn");
    expect(screen.getByText("Cancelled").dataset.tone).toBe("neutral");
    expect(screen.getByText("Confirmed").dataset.tone).toBe("success");
  });

  it("says when a held slot is waiting on payment", () => {
    render(<BookingStatusBadge status={ConsultationBookingStatus.PENDING} awaitingPayment />);
    expect(screen.getByText("Awaiting payment").dataset.tone).toBe("warn");
  });
});
