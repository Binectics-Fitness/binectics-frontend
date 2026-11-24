"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import { adminRoleKeys, adminRolesService, type AdminRoleHistoryPage } from "@/lib/api/adminRoles";
import { describeRoleChange, historyActor } from "@/lib/admin/roleHelpers";
import { absoluteTime, relativeTime } from "@/lib/featureFlags/helpers";

const PAGE = 25;

/** A role's change history (GET /admin/roles/:roleId/history), newest first. */
export function RoleHistory({ roleId, label }: { roleId: string; label: (key: string) => string }) {
  const query = useInfiniteQuery<AdminRoleHistoryPage, Error>({
    queryKey: adminRoleKeys.history(roleId),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await adminRolesService.roleHistory(roleId, pageParam as number, PAGE);
      if (!res.success || !res.data) throw new Error(res.message || "We couldn't load this role's history.");
      return res.data;
    },
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
  });

  if (query.isLoading) return <AsyncSpinner label="Loading history" />;
  if (query.error) {
    return (
      <div role="alert" className="flex items-center justify-between gap-3 text-[13px]" style={{ color: "var(--danger-ink)" }}>
        <span>{query.error.message}</span>
        <button type="button" className="btn-ghost-v2 sm min-h-11" onClick={() => void query.refetch()}>
          Retry
        </button>
      </div>
    );
  }
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  if (items.length === 0) return <EmptySlate message="No changes yet" hint="Edits to this role will show here." />;

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col" aria-label="Role history">
        {items.map((item, idx) => {
          const { title, lines } = describeRoleChange(item, label);
          return (
            <li
              key={item.id}
              className="py-3 flex flex-col gap-1"
              style={idx > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[13.5px]" style={{ color: "var(--ink)" }}>
                  <strong className="font-medium">{historyActor(item)}</strong> · {title.toLowerCase()}
                </span>
                <time
                  dateTime={item.created_at}
                  title={absoluteTime(item.created_at)}
                  className="font-mono text-[11px]"
                  style={{ color: "var(--fg-3)" }}
                >
                  {relativeTime(item.created_at)}
                </time>
              </div>
              {lines.map((l) => (
                <p key={l} className="text-[12.5px] leading-snug" style={{ color: "var(--fg-2)" }}>
                  {l}
                </p>
              ))}
              {item.reason && (
                <p className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                  Reason: {item.reason}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      {query.hasNextPage && (
        <button
          type="button"
          className="btn-ghost-v2 sm min-h-11 self-start"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? "Loading..." : "Show older changes"}
        </button>
      )}
    </div>
  );
}
