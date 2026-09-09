"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { apiJson } from "@/lib/api/client";
import { transactionsFeedQueryKey } from "@/lib/query-keys";
import {
  TransactionsResponseSchema,
  type TransactionsResponse,
} from "@/lib/schemas/transaction";

const PAGE_SIZE = 30;

/**
 * Cursor-paginated cross-tab activity feed for the Activity screen. Pages are
 * kept in a single infinite-query cache under `transactionsFeedQueryKey`.
 */
export function useInfiniteTransactions() {
  return useInfiniteQuery<TransactionsResponse, Error>({
    queryKey: transactionsFeedQueryKey,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (pageParam) params.set("cursor", pageParam as string);
      const raw = await apiJson<unknown>(`/api/transactions?${params}`);
      return TransactionsResponseSchema.parse(raw);
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}
