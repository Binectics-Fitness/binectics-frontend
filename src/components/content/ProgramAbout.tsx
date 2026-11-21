import { Info } from "lucide-react";
import { PROGRAM_ABOUT_COPY as C } from "@/lib/programs/aboutCopy";

/**
 * The coach's description and cautions for a program (D4; board
 * web-cautions.html). The description is plain body text, keeping the
 * coach's line breaks; `clampDescription` cuts it to three lines where cards
 * share a grid. Cautions are safety text: always shown in full, in a calm,
 * neutral block with a small icon, never alarm red. Each part is left out
 * when its field is empty; with both empty nothing renders, so callers can
 * drop it in unconditionally.
 */
export function ProgramAbout({
  description,
  cautions,
  clampDescription = false,
  className = "",
}: {
  description?: string | null;
  cautions?: string | null;
  clampDescription?: boolean;
  className?: string;
}) {
  const desc = description?.trim();
  const caut = cautions?.trim();
  if (!desc && !caut) return null;
  return (
    <div className={`flex flex-col gap-3 ${className}`} data-testid="program-about">
      {desc && (
        <p
          className={`text-[13.5px] whitespace-pre-line ${clampDescription ? "line-clamp-3" : ""}`}
          style={{ color: "var(--fg-2)", lineHeight: 1.55 }}
          data-testid="program-about-description"
        >
          {desc}
        </p>
      )}
      {caut && (
        <div
          className="flex items-start gap-2.5 rounded-(--r-2) p-3"
          style={{ background: "var(--bg-2)" }}
          data-testid="program-about-cautions"
        >
          <Info aria-hidden="true" size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" style={{ color: "var(--fg-2)" }} />
          <div className="min-w-0">
            <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
              {C.cautionsTitle}
            </div>
            <p className="text-[13px] whitespace-pre-line" style={{ color: "var(--fg-2)", lineHeight: 1.5 }}>
              {caut}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
