/**
 * Paystack's hosted popup (`inline.js`), the way the membership checkout
 * already opens it. The popup's callback means the checkout closed after
 * the gateway accepted the charge; it is not proof the money landed, so
 * the caller re-reads the booking from the API afterwards.
 */

const INLINE_SRC = "https://js.paystack.co/v1/inline.js";

interface PaystackHandler {
  openIframe: () => void;
}

interface PaystackPopStatic {
  setup: (config: {
    key: string;
    email: string;
    amount: number;
    currency: string;
    ref: string;
    callback: (response: { reference: string }) => void;
    onClose: () => void;
  }) => PaystackHandler;
}

/** `window.PaystackPop` once inline.js has run. */
function installed(): PaystackPopStatic | undefined {
  return (window as unknown as { PaystackPop?: PaystackPopStatic }).PaystackPop;
}

/** The platform's public key; bookings settle into the platform account. */
export function paystackPublicKey(): string | null {
  const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  return key && /^pk_(test|live)_[A-Za-z0-9]+$/.test(key) ? key : null;
}

let loading: Promise<PaystackPopStatic> | null = null;

export function loadPaystackInline(): Promise<PaystackPopStatic> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Paystack needs a browser"));
  }
  const present = installed();
  if (present) return Promise.resolve(present);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = INLINE_SRC;
    script.async = true;
    script.onload = () => {
      const pop = installed();
      if (pop) resolve(pop);
      else reject(new Error("Paystack did not load"));
    };
    script.onerror = () => {
      loading = null;
      reject(new Error("Could not load Paystack"));
    };
    document.body.appendChild(script);
  });
  return loading;
}

export interface OpenPaystackInput {
  email: string;
  /** Minor units, exactly as the API quoted them. */
  amountMinor: number;
  currency: string;
  /** The API's reference; the webhook resolves the booking by it. */
  reference: string;
  /**
   * A public key other than the platform's. The membership checkout charges
   * into the gym's own Paystack account with the key its payment config
   * returns; bookings always use the platform key.
   */
  key?: string;
}

/**
 * Opens the popup. Resolves `{ closed: "callback" }` when the checkout
 * completed, `{ closed: "dismissed" }` when the person closed it, and
 * rejects when Paystack is not configured or cannot load.
 */
export async function openPaystack(
  input: OpenPaystackInput,
): Promise<{ closed: "callback" | "dismissed"; reference: string }> {
  const key = input.key || paystackPublicKey();
  if (!key) throw new Error("Payments are not configured");
  const pop = await loadPaystackInline();
  return new Promise((resolve) => {
    const handler = pop.setup({
      key,
      email: input.email,
      amount: input.amountMinor,
      currency: input.currency,
      ref: input.reference,
      callback: (response) =>
        resolve({ closed: "callback", reference: response.reference }),
      onClose: () => resolve({ closed: "dismissed", reference: input.reference }),
    });
    handler.openIframe();
  });
}
