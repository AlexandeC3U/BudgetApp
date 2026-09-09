// Plain module (no "use client") so both Server Components doing SSR
// prefetching and client hooks can share the same query-key shape.

export const tabsQueryKey = ["tabs"] as const;
export const tabQueryKey = (id: string) => ["tab", id] as const;

export const transactionsQueryKey = (tabId?: string) =>
  ["transactions", tabId ?? null] as const;
// The Activity feed is a separate, infinite (cursor-paginated) cache so it
// doesn't collide in shape with the flat lists Dashboard/per-tab views use.
// Shares the "transactions" prefix so list invalidations/optimistic writes
// reach it too.
export const transactionsFeedQueryKey = ["transactions", "feed"] as const;
export const transactionQueryKey = (id: string) =>
  ["transaction", id] as const;

export const categoriesQueryKey = ["categories"] as const;

export const balancesQueryKey = (tabId: string) =>
  ["balances", tabId] as const;

export const settlementsQueryKey = (tabId: string) =>
  ["settlements", tabId] as const;

export const currentUserQueryKey = ["me"] as const;
export const meSummaryQueryKey = ["me", "summary"] as const;
