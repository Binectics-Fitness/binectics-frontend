"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { marketplaceService } from "@/lib/api/marketplace";
import type { MarketplaceSearchParams } from "@/lib/types";
import type { ExploreListing } from "./ExploreCard";

export type ExploreListStatus = "loading" | "ready" | "failed";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * One page of GET /marketplace/listings for the given request. An answer
 * to an older request never overwrites a newer one, and a failure is a real
 * failed state (with retry), never an empty list.
 */
export function useExploreList(params: MarketplaceSearchParams, enabled: boolean) {
  const key = JSON.stringify(params);
  const [items, setItems] = useState<ExploreListing[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [status, setStatus] = useState<ExploreListStatus>("loading");
  const [nonce, setNonce] = useState(0);
  const latest = useRef(0);

  // A new request starts from a clean slate, set while rendering so old
  // results never show under new filters.
  const [shownFor, setShownFor] = useState(key);
  if (shownFor !== key) {
    setShownFor(key);
    setStatus("loading");
  }

  useEffect(() => {
    if (!enabled) return;
    const id = ++latest.current;
    marketplaceService
      .searchListings(JSON.parse(key) as MarketplaceSearchParams)
      .then((res) => {
        if (id !== latest.current) return;
        if (res.success && res.data) {
          const data = res.data as unknown as { listings?: ExploreListing[]; pagination?: Pagination };
          setItems(data.listings ?? []);
          setPagination(data.pagination ?? null);
          setStatus("ready");
        } else {
          setStatus("failed");
        }
      })
      .catch(() => {
        if (id === latest.current) setStatus("failed");
      });
  }, [key, nonce, enabled]);

  const retry = useCallback(() => {
    setStatus("loading");
    setNonce((n) => n + 1);
  }, []);

  return {
    items: status === "ready" ? items : [],
    total: status === "ready" ? (pagination?.total ?? items.length) : null,
    totalPages: status === "ready" ? (pagination?.total_pages ?? 1) : 0,
    status,
    retry,
  };
}
