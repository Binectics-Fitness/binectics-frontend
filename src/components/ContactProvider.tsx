"use client";

import {
  buildMailtoUrl,
  buildTelUrl,
  buildWhatsAppUrl,
} from "@/utils/whatsapp";

interface ContactProviderProps {
  /** Public phone (E.164). Used for both WhatsApp and tel: links. */
  phone?: string | null;
  /** Public email address. */
  email?: string | null;
  /** Display label for analytics / aria. */
  providerName?: string;
  /** Pre-filled WhatsApp message. */
  whatsappMessage?: string;
  /** Pre-filled email subject. */
  emailSubject?: string;
  /**
   * Visual variant. `compact` is a horizontal row of small buttons,
   * `full` is a stacked block with labels.
   */
  variant?: "compact" | "full";
  className?: string;
}

/**
 * Renders direct-contact buttons (WhatsApp / Call / Email) for a provider.
 * Each button is a deep-link — no backend round-trips, no realtime infra.
 *
 * Buttons are only rendered for the channels the provider has filled in.
 * Returns `null` if the provider has provided no contact details at all.
 */
export function ContactProvider({
  phone,
  email,
  providerName,
  whatsappMessage,
  emailSubject,
  variant = "compact",
  className = "",
}: ContactProviderProps) {
  const defaultMessage =
    whatsappMessage ??
    `Hi${providerName ? ` ${providerName}` : ""}, I found your profile on Binectics and I'd like to learn more.`;
  const defaultSubject =
    emailSubject ?? `Inquiry from Binectics${providerName ? ` — ${providerName}` : ""}`;

  const waUrl = buildWhatsAppUrl(phone, defaultMessage);
  const telUrl = buildTelUrl(phone);
  const mailUrl = buildMailtoUrl(email, defaultSubject);

  if (!waUrl && !telUrl && !mailUrl) return null;

  const isFull = variant === "full";
  const baseBtn =
    "inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-50";
  const sizing = isFull
    ? "w-full px-4 py-3 text-sm sm:text-base"
    : "flex-1 px-3 py-2 text-xs sm:text-sm";

  return (
    <div
      className={`flex ${isFull ? "flex-col" : "flex-row"} gap-2 ${className}`}
    >
      {waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Message ${providerName ?? "provider"} on WhatsApp`}
          className={`${baseBtn} ${sizing} bg-[#25D366] text-white hover:bg-[#1da851]`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l.46.733-.999 3.648 3.518-.34zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
          </svg>
          {isFull ? "Message on WhatsApp" : "WhatsApp"}
        </a>
      )}
      {telUrl && (
        <a
          href={telUrl}
          aria-label={`Call ${providerName ?? "provider"}`}
          className={`${baseBtn} ${sizing} bg-signal text-bg hover:bg-signal/90`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          {isFull ? "Call" : "Call"}
        </a>
      )}
      {mailUrl && (
        <a
          href={mailUrl}
          aria-label={`Email ${providerName ?? "provider"}`}
          className={`${baseBtn} ${sizing} border-2 border-border-2 bg-bg text-fg hover:border-fg`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          {isFull ? "Email" : "Email"}
        </a>
      )}
    </div>
  );
}

export default ContactProvider;
