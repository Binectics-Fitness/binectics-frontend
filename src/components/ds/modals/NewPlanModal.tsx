"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ActionModal } from "@/components/ds/ActionModal";

interface NewPlanModalProps {
  open: boolean;
  onClose: () => void;
}

interface PlanDestination {
  value: string;
  label: string;
  description: string;
  href: string;
}

/**
 * Launcher for creating a plan. It used to fake creation with a success
 * toast and no API call; now it routes to the real creation surface for
 * the chosen plan type (each destination has actual CRUD behind it).
 */
function destinationsFor(pathname: string): PlanDestination[] {
  if (pathname.startsWith("/dashboard/dietitian")) {
    return [
      {
        value: "meal",
        label: "Meal plan",
        description: "Reusable nutrition plan you can assign to clients",
        href: "/dashboard/dietitian/meal-plans?new=1",
      },
      {
        value: "membership",
        label: "Membership plan",
        description: "Recurring or one-time plan clients subscribe to",
        href: "/dashboard/dietitian/plans",
      },
    ];
  }
  if (pathname.startsWith("/dashboard/gym-owner")) {
    return [
      {
        value: "membership",
        label: "Membership plan",
        description: "Recurring gym membership with tiers",
        href: "/dashboard/gym-owner/plans",
      },
    ];
  }
  return [];
}

export function NewPlanModal({ open, onClose }: NewPlanModalProps) {
  const pathname = usePathname();
  const router = useRouter();
  const destinations = destinationsFor(pathname ?? "");
  const [selected, setSelected] = useState(destinations.length === 1 ? destinations[0].value : "");

  const handleContinue = () => {
    const dest = destinations.find((d) => d.value === selected);
    if (!dest) return;
    onClose();
    router.push(dest.href);
  };

  return (
    <ActionModal
      open={open}
      onClose={onClose}
      title="New plan"
      description="Choose the type of plan you want to create."
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost-v2">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!selected}
            className="btn-signal-v2 disabled:opacity-40"
          >
            Continue
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {destinations.map((type) => (
          <label
            key={type.value}
            className={`flex cursor-pointer items-start gap-3 rounded-(--r-2) border p-3 transition-colors ${
              selected === type.value ? "border-ink bg-bg-2" : "border-border hover:border-border-2"
            }`}
            style={{ transitionDuration: "var(--motion-fast)" }}
          >
            <input
              type="radio"
              name="plan-type"
              value={type.value}
              checked={selected === type.value}
              onChange={(e) => setSelected(e.target.value)}
              className="mt-0.5 accent-ink"
            />
            <div>
              <span className="text-[13.5px] font-medium text-ink">{type.label}</span>
              <p className="mt-0.5 text-[12.5px] text-fg-3">{type.description}</p>
            </div>
          </label>
        ))}
      </div>
    </ActionModal>
  );
}
