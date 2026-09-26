import type { ProtocolConversion } from "@/lib/api/nutrition";

/**
 * Copy for moving retired protocols over to Programs. Pure, so each case is
 * tested (src/tests/unit/protocol-retirement.test.ts).
 */

/** What happened when a protocol was opened as a program. */
export function conversionMessage(protocolName: string, conversion: ProtocolConversion): string {
  if (conversion.created) {
    return `"${protocolName}" is now a draft program. Check the schedule, then publish it.`;
  }
  switch (conversion.template.status) {
    case "published":
      return `"${protocolName}" was already converted, and that program is published. Opening it.`;
    case "archived":
      return `"${protocolName}" was already converted, but that program is archived. Opening it.`;
    default:
      return `"${protocolName}" was already converted. Opening the draft.`;
  }
}

/** The Programs page notice, or null when nothing is left to convert. */
export function leftoverProtocolsText(count: number): string | null {
  if (count <= 0) return null;
  return count === 1
    ? "You have 1 protocol from before Programs. Open it as a program to keep using it."
    : `You have ${count} protocols from before Programs. Open them as programs to keep using them.`;
}
