"use client";

import dynamic from "next/dynamic";
import DashboardLoading from "@/components/DashboardLoading";

const CheckoutClient = dynamic(() => import("./CheckoutClient"), {
  ssr: false,
  loading: () => <DashboardLoading />,
});

export default function CheckoutPage() {
  return <CheckoutClient />;
}
