"use client";

import { useState } from "react";
import {
  AVAILABLE_FIGURE_TONES,
  FIGURE_BODIES,
  SKIN_TONES,
  figureName,
  figurePreviewCandidates,
  type ExerciseFigure,
  type FigureBody,
} from "@/lib/exerciseFigure";

/**
 * Two figures and a row of skin tones. Each figure card is the live preview:
 * it draws the body in the tone chosen below it. Radios throughout; no text on
 * the swatches (each has a name for screen readers). A card whose image is
 * missing falls back to the default figure's image, then to a plain tile.
 */
export function ExerciseFigurePicker({
  value,
  onChange,
  tones = AVAILABLE_FIGURE_TONES,
}: {
  value: ExerciseFigure;
  onChange: (next: ExerciseFigure) => void;
  tones?: readonly number[];
}) {
  return (
    <div>
      <div role="radiogroup" aria-label="Figure" className="grid grid-cols-2 gap-3" style={{ maxWidth: 360 }}>
        {FIGURE_BODIES.map((body) => (
          <FigureCard key={body} body={body} tone={value.tone} selected={value.body === body} onSelect={() => onChange({ ...value, body })} />
        ))}
      </div>
      <div role="radiogroup" aria-label="Skin tone" className="mt-4 flex gap-3">
        {tones.map((tone) => {
          const on = value.tone === tone;
          const meta = SKIN_TONES[tone];
          return (
            <button
              key={tone}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${meta.name} skin tone`}
              onClick={() => onChange({ ...value, tone })}
              className="flex items-center justify-center rounded-full"
              style={{ width: 44, height: 44, border: on ? "2px solid var(--ink)" : "2px solid transparent", background: "transparent", cursor: "pointer" }}
            >
              <span className="rounded-full" style={{ width: 34, height: 34, background: meta.swatch, border: "1px solid var(--border)" }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FigureCard({ body, tone, selected, onSelect }: { body: FigureBody; tone: number; selected: boolean; onSelect: () => void }) {
  const urls = figurePreviewCandidates({ body, tone });
  const key = urls.join("|");
  // Which candidate failed last, for this key: a new tone or body starts again from the variant.
  const [failed, setFailed] = useState<{ key: string; count: number }>({ key, count: 0 });
  const index = failed.key === key ? failed.count : 0;
  const src = urls[index];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={figureName(body)}
      onClick={onSelect}
      className="overflow-hidden rounded-(--r-3)"
      style={{
        aspectRatio: "4 / 5",
        background: "var(--bg)",
        border: selected ? "1.5px solid var(--ink)" : "1px solid var(--border)",
        cursor: "pointer",
        padding: 0,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="h-full w-full object-contain"
          onError={() => setFailed({ key, count: Math.min(index + 1, urls.length) })}
        />
      ) : null}
    </button>
  );
}
