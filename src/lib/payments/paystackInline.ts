/**
 * Opens a Paystack checkout the API already started.
 *
 * The server calls Paystack's transaction/initialize with the amount and
 * currency it holds for the booking or plan, and hands back an
 * `access_code`. The browser only resumes that transaction: it never tells
 * Paystack an amount, a currency, a reference or a key, so nothing it sends
 * can change what is charged.
 *
 * The popup's success callback means the checkout closed after the gateway
 * accepted the charge. It is not proof the money landed; callers ask the
 * API afterwards.
 */

export interface PaystackCheckoutResult {
  /** "callback": the checkout reported success; "dismissed": closed without paying. */
  closed: "callback" | "dismissed";
  /** Paystack's reference, when the checkout reported one. */
  reference?: string;
}

/**
 * The popup script could not load (blocked, offline). The caller can fall
 * back to the hosted checkout (`authorization_url`), which returns to
 * /payments/return.
 */
export class PaystackUnavailableError extends Error {
  constructor() {
    super("Could not load Paystack");
    this.name = "PaystackUnavailableError";
  }
}

/**
 * Resume the server-initialised transaction in Paystack's popup. Rejects
 * when the popup cannot load or Paystack refuses the access code.
 */
export async function openPaystackCheckout(accessCode: string): Promise<PaystackCheckoutResult> {
  if (typeof window === "undefined") throw new Error("Paystack needs a browser");
  if (!accessCode) throw new Error("The payment could not be started.");
  let PaystackPop: typeof import("@paystack/inline-js").default;
  try {
    PaystackPop = (await import("@paystack/inline-js")).default;
  } catch {
    throw new PaystackUnavailableError();
  }
  return new Promise((resolve, reject) => {
    const popup = new PaystackPop();
    popup.resumeTransaction(accessCode, {
      onSuccess: (transaction) =>
        resolve({ closed: "callback", reference: transaction?.reference }),
      onCancel: () => resolve({ closed: "dismissed" }),
      onError: (error) => {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message: unknown }).message)
            : "";
        reject(new Error(message || "Paystack could not open this payment."));
      },
    });
  });
}
