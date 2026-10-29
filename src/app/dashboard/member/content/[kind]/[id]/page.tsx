import type { Metadata } from "next";
import ContentOfferClient from "./ContentOfferClient";

export const metadata: Metadata = {
  title: "Shared with you",
  description: "A program or meal plan: buy it, start it, or see how to renew",
};

export default async function ContentOfferPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const { kind, id } = await params;
  return <ContentOfferClient kindSegment={kind} itemId={id} />;
}
