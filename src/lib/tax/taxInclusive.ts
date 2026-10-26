/**
 * Whether a workspace's amounts already include tax, from its saved
 * `tax_inclusive`. An organization that never saved the flag is INCLUSIVE:
 * that is what the Settings screens show (the switch starts ON), so every
 * place that reads the flag goes through here and shows the same answer.
 */
export const TAX_INCLUSIVE_DEFAULT = true;

export function taxIsInclusive(org: { tax_inclusive?: boolean | null } | null | undefined): boolean {
  return org?.tax_inclusive ?? TAX_INCLUSIVE_DEFAULT;
}
