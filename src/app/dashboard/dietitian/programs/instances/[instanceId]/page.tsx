import type { Metadata } from "next";
import InstanceClient from "./InstanceClient";

export const metadata: Metadata = {
  title: "Program progress",
  description: "A client's program with a live adherence summary",
};

export default async function ProgramInstancePage({
  params,
}: {
  params: Promise<{ instanceId: string }>;
}) {
  const { instanceId } = await params;
  return <InstanceClient instanceId={instanceId} />;
}
