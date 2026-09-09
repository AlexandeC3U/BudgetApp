"use client";

import { useQuery } from "@tanstack/react-query";

import { apiJson } from "@/lib/api/client";
import {
  BalancesResponseSchema,
  type BalancesResponse,
} from "@/lib/schemas/balance";

import { balancesQueryKey } from "@/lib/query-keys";
export { balancesQueryKey };

export function useBalances(tabId: string | undefined) {
  return useQuery<BalancesResponse>({
    queryKey: balancesQueryKey(tabId ?? ""),
    enabled: !!tabId,
    queryFn: async () => {
      const raw = await apiJson<unknown>(
        `/api/tabs/${encodeURIComponent(tabId!)}/balances`
      );
      return BalancesResponseSchema.parse(raw);
    },
  });
}
