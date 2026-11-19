import { ActivityClient } from "./ActivityClient";
import type { Metadata } from "next";
import { ACTIVITY_META_DESCRIPTION, ACTIVITY_META_TITLE } from "@/lib/checkins/visitsCopy";

export const metadata: Metadata = {
  title: ACTIVITY_META_TITLE,
  description: ACTIVITY_META_DESCRIPTION,
};

export default function ActivityPage() {
  return <ActivityClient />;
}
