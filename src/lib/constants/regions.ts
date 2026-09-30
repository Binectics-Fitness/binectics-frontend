/**
 * Visitor region cookies.
 *
 * Which currencies exist and what they can be used for is the API's
 * (GET /currencies, see lib/queries/currencies). Nothing here decides a
 * currency for a price, a payment or an organization, and there is no
 * gateway per currency: the API picks the gateway. Marketing prices come
 * from the plan catalogue (GET /provider-billing/plans), never from here.
 */

/** The visitor's detected country (ISO 3166 alpha-2), for display only. */
export const REGION_COOKIE = "binectics-region";
/** A country the visitor chose in the region selector. */
export const REGION_OVERRIDE_COOKIE = "binectics-region-override";
/** A display currency the visitor chose; honoured only while it is listed. */
export const CURRENCY_OVERRIDE_COOKIE = "binectics-currency-override";
