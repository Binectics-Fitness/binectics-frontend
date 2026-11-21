/**
 * Nigerian phone numbers, as people type them: 0803 123 4567,
 * +234 803 123 4567, 234-803-123-4567 or (0803) 123 4567.
 *
 * A Nigerian mobile or landline number is 10 digits after the country code
 * (11 with the leading 0 used inside Nigeria). Mobile numbers start
 * 7, 8 or 9 after the code (070x, 080x, 081x, 090x, 091x...).
 *
 * normaliseNgPhone returns the E.164 form (+2348031234567) or null.
 */
const SEPARATORS = /[\s().-]/g;

export function normaliseNgPhone(input: string): string | null {
  const raw = input.trim().replace(SEPARATORS, "");
  let national: string;
  if (/^\+234\d{10}$/.test(raw)) national = raw.slice(4);
  else if (/^234\d{10}$/.test(raw)) national = raw.slice(3);
  else if (/^0\d{10}$/.test(raw)) national = raw.slice(1);
  else return null;
  // +234 0803... is a common mistake: the 0 is dropped after the code.
  if (national.startsWith("0")) return null;
  return `+234${national}`;
}

/** True for a Nigerian mobile number (070x, 080x, 081x, 090x, 091x...). */
export function isNgMobile(input: string): boolean {
  const e164 = normaliseNgPhone(input);
  return e164 !== null && /^\+234[789][01]\d{8}$/.test(e164);
}

export const NG_PHONE_HINT = "Use a Nigerian number, e.g. 0803 123 4567 or +234 803 123 4567";
