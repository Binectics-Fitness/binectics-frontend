/**
 * WhatsApp deep-link helpers.
 *
 * Builds a `https://wa.me/<phone>?text=...` URL that opens WhatsApp
 * (web, mobile, or desktop) with a pre-filled message — no API,
 * no real-time infrastructure required.
 *
 * Spec: https://faq.whatsapp.com/5913398998672934
 */

/**
 * Strip everything except digits from a phone number.
 * `wa.me` requires the country code with NO leading "+" or separators.
 */
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

/**
 * Build a `wa.me` deep-link. Returns `null` if the phone is unusable
 * (too short to be a valid international number).
 */
export function buildWhatsAppUrl(
  phone: string | null | undefined,
  message?: string,
): string | null {
  if (!phone) return null;
  const cleaned = normalizePhone(phone);
  if (cleaned.length < 7) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${cleaned}${text}`;
}

/**
 * Build a `tel:` link (always safe — browsers/OSes simply ignore
 * it if no dialer is registered).
 */
export function buildTelUrl(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[^0-9+]/g, "");
  if (cleaned.replace(/\+/g, "").length < 7) return null;
  return `tel:${cleaned}`;
}

/**
 * Build a `mailto:` link with optional subject + body.
 */
export function buildMailtoUrl(
  email: string | null | undefined,
  subject?: string,
  body?: string,
): string | null {
  if (!email) return null;
  const params: string[] = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${email}${params.length ? `?${params.join("&")}` : ""}`;
}
