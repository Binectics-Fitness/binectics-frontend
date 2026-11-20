"use client";

import { Drawer } from "@/components/ds/Drawer";
import { BUILDER_COPY } from "./copy";
import { metaStyle } from "./controls";

const C = BUILDER_COPY.sheet;

/** Where each builder lives; the sheet shows it so the program stays open (P3-2). */
export const NEW_CONTENT_URL = {
  form: "/dashboard/forms",
  meal: "/dashboard/dietitian/meal-plans?new=1",
} as const;

/**
 * "+ New form / + New meal plan": the existing builder in a side sheet, over
 * the program. Closing it reloads the choices and picks what was just made.
 */
export function NewContentSheet({ kind, onClose }: { kind: "form" | "meal" | null; onClose: () => void }) {
  return (
    <Drawer open={kind !== null} onClose={onClose} title={kind === "meal" ? C.mealTitle : C.formTitle} width={720}>
      {kind && (
        <div className="flex flex-col gap-3 h-full">
          <p className="text-[13px]" style={metaStyle}>{kind === "meal" ? C.mealHint : C.formHint}</p>
          <iframe
            title={kind === "meal" ? C.mealTitle : C.formTitle}
            src={NEW_CONTENT_URL[kind]}
            className="w-full flex-1 rounded-(--r-2)"
            style={{ minHeight: "70vh", border: "1px solid var(--border)", background: "var(--bg)" }}
          />
        </div>
      )}
    </Drawer>
  );
}
