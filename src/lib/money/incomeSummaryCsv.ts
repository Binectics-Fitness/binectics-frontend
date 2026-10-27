import type { IncomeSummary } from "@/lib/api/earnings";
import { currencyExponent, minorPerMajor } from "./currencyUnits";

/** A minor-unit integer as a plain decimal in the currency's own exponent ("12345" NGN -> "123.45"; JPY -> "12345"). */
export function minorToDecimalString(minor: number, currency: string): string {
  const exp = currencyExponent(currency);
  const per = minorPerMajor(currency);
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / per);
  const sign = minor < 0 ? "-" : "";
  if (exp === 0) return `${sign}${whole}`;
  return `${sign}${whole}.${String(abs % per).padStart(exp, "0")}`;
}

function cell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** One sentence saying exactly how an estimate was made. Shown on the page and in the CSV. */
export function incomeTaxNote(tax: NonNullable<IncomeSummary["tax"]>): string {
  return (
    `Estimate only, not tax advice. ${tax.label} at ${tax.rate_percent}%, ` +
    `${tax.inclusive ? "taken as already included in amounts" : "added on top of amounts"}, ` +
    `worked out on each month's net amount after refunds and adjustments and rounded to the nearest minor unit.`
  );
}

/** The monthly table as CSV text: one row per currency and month. */
export function incomeSummaryCsv(summary: IncomeSummary): string {
  const rows: (string | number)[][] = [
    [
      "Year", "Month", "Currency", "Payments received", "Refunds", "Adjustments", "Net",
      ...(summary.tax ? [`Estimated ${summary.tax.label}`] : []),
      "Transactions",
    ],
  ];
  for (const c of summary.currencies) {
    for (const m of c.months) {
      rows.push([
        summary.year,
        m.month,
        c.currency,
        minorToDecimalString(m.gross_minor, c.currency),
        minorToDecimalString(m.refunds_minor, c.currency),
        minorToDecimalString(m.adjustments_minor, c.currency),
        minorToDecimalString(m.net_minor, c.currency),
        ...(summary.tax ? [minorToDecimalString(m.estimated_tax_minor ?? 0, c.currency)] : []),
        m.transaction_count,
      ]);
    }
  }
  if (summary.tax) rows.push([], [incomeTaxNote(summary.tax)]);
  return rows.map((r) => r.map(cell).join(",")).join("\n") + "\n";
}
