import type { Metadata } from "next";
import { BookingReceiptClient } from "./BookingReceiptClient";

export const metadata: Metadata = {
  title: "Booking Receipt",
  description: "Your Binectics booking receipt.",
};

/**
 * A booking's receipt, read live from the API by the client component.
 * Proto: booking-receipt.html. Dynamic route: params is a Promise in Next 16.
 */
export default async function BookingReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BookingReceiptClient bookingId={id} />;
}
