import { programsService, type ProgramTemplate, type StartClientResult } from "@/lib/api/programs";
import type { ApiResponse } from "@/lib/types";

/** Unpublished changes: publish_state (api #361); a response without it (restore) reads the version numbers. */
export function draftAhead(t: Pick<ProgramTemplate, "status" | "latest_version_no" | "latest_published_version_no" | "publish_state">): boolean {
  if (t.status === "archived") return false;
  return t.publish_state ? t.publish_state.has_unpublished_changes : t.latest_version_no > t.latest_published_version_no;
}

/**
 * "Start a client" (P1-1, D1): one call, POST /programs/:id/assign with
 * publish_latest (api #361). It publishes the latest draft if it is ahead and
 * assigns it, all or nothing. A sold or listed program with unpublished
 * edits (publish_state.needs_publish) is refused; the page asks for
 * "Publish changes" first instead of calling this.
 */
export function startClient(
  templateId: string,
  body: { client_profile_id: string; start_date?: string; timezone?: string },
): Promise<ApiResponse<StartClientResult>> {
  return programsService.startClient(templateId, body);
}

/** YYYY-MM-DD in the coach's local calendar. */
function ymd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export type StartChoice = "today" | "tomorrow" | "monday" | "date";

/** The start_date a choice sends; today sends none (the API starts today). */
export function startDate(choice: StartChoice, picked: string, now = new Date()): string | undefined {
  if (choice === "today") return undefined;
  if (choice === "date") return picked || undefined;
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (choice === "tomorrow") d.setDate(d.getDate() + 1);
  else d.setDate(d.getDate() + (((8 - d.getDay()) % 7) || 7));
  return ymd(d);
}
