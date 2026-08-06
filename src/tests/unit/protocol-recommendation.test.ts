import { describe, it, expect } from "vitest";
import { buildProtocolRecommendation } from "@/app/dashboard/dietitian/protocols/protocol-recommendation";
import { RecommendationCategory } from "@/lib/types";

// "Apply to client" maps a nutrition protocol onto the recommendation
// DTO ({title, content, category}) — the only shape the progress API
// accepts. These tests pin that mapping: name → title, description +
// duration + numbered steps flattened into content, category NUTRITION.

describe("buildProtocolRecommendation", () => {
  it("maps the protocol name to the title and always tags NUTRITION", () => {
    const req = buildProtocolRecommendation({
      name: "Gut reset",
      description: undefined,
      duration_weeks: undefined,
      steps: [],
    });
    expect(req.title).toBe("Gut reset");
    expect(req.category).toBe(RecommendationCategory.NUTRITION);
  });

  it("falls back to the name for content when there is nothing else, content is required", () => {
    const req = buildProtocolRecommendation({
      name: "Gut reset",
      description: "  ",
      duration_weeks: undefined,
      steps: [],
    });
    expect(req.content).toBe("Gut reset");
  });

  it("flattens steps into a numbered list, joining title and detail", () => {
    const req = buildProtocolRecommendation({
      name: "Gut reset",
      description: undefined,
      duration_weeks: undefined,
      steps: [
        { title: "Eliminate", detail: "Remove trigger foods for 2 weeks" },
        { title: "Reintroduce" },
      ],
    });
    expect(req.content).toBe(
      "Steps:\n1. Eliminate, Remove trigger foods for 2 weeks\n2. Reintroduce",
    );
  });

  it("includes description and duration ahead of the steps", () => {
    const req = buildProtocolRecommendation({
      name: "Gut reset",
      description: "A staged elimination protocol.",
      duration_weeks: 6,
      steps: [{ title: "Eliminate" }],
    });
    expect(req.content).toBe(
      "A staged elimination protocol.\nDuration: 6 weeks\n\nSteps:\n1. Eliminate",
    );
  });

  it("uses the singular for a one-week duration", () => {
    const req = buildProtocolRecommendation({
      name: "Reset",
      description: undefined,
      duration_weeks: 1,
      steps: [],
    });
    expect(req.content).toBe("Duration: 1 week");
  });

  it("skips steps whose title is blank instead of emitting empty bullets", () => {
    const req = buildProtocolRecommendation({
      name: "Reset",
      description: undefined,
      duration_weeks: undefined,
      steps: [{ title: "   " }, { title: "Hydrate", detail: "  " }],
    });
    expect(req.content).toBe("Steps:\n1. Hydrate");
  });

  it("does not attach plan linkage fields, a protocol is not a stored plan", () => {
    const req = buildProtocolRecommendation({
      name: "Reset",
      description: undefined,
      duration_weeks: undefined,
      steps: [],
    });
    expect(req.plan_id).toBeUndefined();
    expect(req.plan_type).toBeUndefined();
  });
});
