import type { Metadata } from "next";
import { DiscountCodesClient } from "./DiscountCodesClient";

export const metadata: Metadata = {
  title: "Discount codes",
  description: "Create discount codes for your memberships and sessions, see who used them, and switch them off.",
};

export default function DiscountCodesPage() {
  return <DiscountCodesClient />;
}
