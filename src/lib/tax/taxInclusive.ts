/**
 * Whether a workspace's amounts already include tax, from its saved
 * `tax_inclusive`. This is an EXPLICIT choice the owner makes when they first
 * save a tax rate ("Do your prices already include tax?"): an organization
 * that never saved the flag has not answered, so this returns `undefined`
 * rather than guessing. Callers show a prompt to choose, never an assumed
 * answer (a wrong guess misstates the tax estimate by the whole rate).
 */
export function taxIsInclusive(
  org: { tax_inclusive?: boolean | null } | null | undefined,
): boolean | undefined {
  const v = org?.tax_inclusive;
  return typeof v === "boolean" ? v : undefined;
}
