import type { CreateRecommendationRequest } from "@/lib/api/progress";
import type { Protocol } from "@/lib/api/nutrition";
import { RecommendationCategory } from "@/lib/types";

/**
 * Map a nutrition protocol onto the recommendation DTO the progress API
 * actually supports ({title, content, category}) — the protocol's steps
 * are flattened into the content field as a numbered list. Pure function
 * so the mapping is unit-testable.
 */
export function buildProtocolRecommendation(
  protocol: Pick<Protocol, "name" | "description" | "duration_weeks" | "steps">,
): CreateRecommendationRequest {
  const lines: string[] = [];

  const description = protocol.description?.trim();
  if (description) lines.push(description);

  if (protocol.duration_weeks) {
    lines.push(`Duration: ${protocol.duration_weeks} week${protocol.duration_weeks === 1 ? "" : "s"}`);
  }

  const steps = protocol.steps.filter((s) => s.title.trim());
  if (steps.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("Steps:");
    steps.forEach((step, i) => {
      const title = step.title.trim();
      const detail = step.detail?.trim();
      lines.push(`${i + 1}. ${detail ? `${title}, ${detail}` : title}`);
    });
  }

  return {
    title: protocol.name,
    content: lines.length > 0 ? lines.join("\n") : protocol.name,
    category: RecommendationCategory.NUTRITION,
  };
}
