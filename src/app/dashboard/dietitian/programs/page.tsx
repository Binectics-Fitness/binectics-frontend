import type { Metadata } from "next";
import ProgramsClient from "./ProgramsClient";

export const metadata: Metadata = {
  title: "Programs",
  description: "Build versioned program templates and assign them to clients",
};

/**
 * Provider Programs manager. `?new=1` opens the builder immediately (used by
 * the New launcher); `?edit=<id>` opens that program in the builder (where a
 * protocol lands once it has been opened as a program).
 */
export default async function DietitianProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; edit?: string }>;
}) {
  const sp = await searchParams;
  return <ProgramsClient initialCreateOpen={sp?.new === "1"} initialEditId={sp?.edit} />;
}
