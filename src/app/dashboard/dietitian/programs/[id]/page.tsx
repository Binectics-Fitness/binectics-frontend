import type { Metadata } from "next";
import ProgramClient from "./ProgramClient";

export const metadata: Metadata = {
  title: "Program",
  description: "Build a program and start clients on it",
};

/** One program: the plan, the selected task, and Start a client. */
export default async function DietitianProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProgramClient id={id} />;
}
