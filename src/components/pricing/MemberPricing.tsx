import Link from "next/link";

/**
 * What members pay. There is no member subscription: joining is free, and a
 * member pays a provider directly, at that provider's own price and in the
 * provider's currency. No tier or amount is shown because none exists.
 */
export function MemberPricing() {
  return (
    <div
      className="rounded-(--r-3) grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 lg:gap-12 mt-8 sm:mt-10"
      style={{ padding: "clamp(24px, 5vw, 40px)", border: "1px solid var(--border)", background: "var(--bg)" }}
    >
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>For members</div>
        <h3 className="text-[28px] sm:text-[36px] font-medium mt-2 leading-[1.05]" style={{ letterSpacing: "-0.03em", color: "var(--ink)" }}>
          Joining is free.
        </h3>
        <p className="text-[15px] leading-[1.55] mt-4 max-w-[52ch]" style={{ color: "var(--fg-2)" }}>
          There is no member plan to buy. When you book a session or join a membership, you pay the provider directly, at the price they set, in their currency. You see the full amount before you confirm.
        </p>
        <Link href="/login?mode=signup" className="btn-ghost-v2 md mt-6 min-h-11 justify-center w-full sm:w-auto">
          Create account
        </Link>
      </div>
      <ul className="flex flex-col gap-2.5 list-none p-0 m-0 self-center">
        {[
          "Free account, no subscription",
          "Pay each provider at their own prices",
          "Prices in the provider's currency",
          "Bookings, check-ins and messages included",
        ].map((b) => (
          <li key={b} className="flex gap-2.5 items-start text-[14px] leading-normal" style={{ color: "var(--fg-2)" }}>
            <span className="w-2.5 h-1.5 border-l-[1.5px] border-b-[1.5px] -rotate-45 shrink-0 mt-[6px]" style={{ borderColor: "var(--ink)" }} />
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}
