import type { Metadata } from "next";
import ProgramsClient from "./ProgramsClient";

export const metadata: Metadata = {
  title: "Programs",
  description: "Build versioned program templates and assign them to clients",
};

/**
 * Provider Programs (Protocols) manager. `?new=1` opens the builder
 * immediately (used by the New launcher).
 */
export default async function DietitianProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const sp = await searchParams;
  return <ProgramsClient initialCreateOpen={sp?.new === "1"} />;
}
