import { ScheduleClient } from "./ScheduleClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schedule",
  description: "Manage your gym's weekly class timetable.",
};

export default function GymSchedulePage() {
  return <ScheduleClient />;
}
