import { Building2 } from "lucide-react";
import { IconTile } from "@/components/ds/IconTile";
import { ListRow } from "@/components/ds/ListRow";
import type { VisitsRow as VisitsRowData } from "@/lib/checkins/visits";

/**
 * The gym visits row (board web-visits H1-H4, A1; mobile V1/V2): a gym tile,
 * "Checked in today" or "Last visit Tue 17 Nov", and this week's count in the
 * mono meta line. It replaced the check-in streak (owner 19 Nov 2026).
 */
export function VisitsRow({ row, href }: { row: VisitsRowData; href?: string }) {
  return (
    <div data-testid="visits-row">
      <ListRow
        href={href}
        leading={<IconTile icon={Building2} tone="gym" />}
        title={row.title}
        meta={row.meta}
      />
    </div>
  );
}
