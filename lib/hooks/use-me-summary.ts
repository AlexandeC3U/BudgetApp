"use client";

import { useQuery } from "@tanstack/react-query";

import { apiJson } from "@/lib/api/client";
import {
  MeSummaryResponseSchema,
  type MeSummaryResponse,
} from "@/lib/schemas/user";

import { meSummaryQueryKey } from "@/lib/query-keys";
export { meSummaryQueryKey };

export function useMeSummary() {
  return useQuery<MeSummaryResponse>({
    queryKey: meSummaryQueryKey,
    queryFn: async () => {
      const raw = await apiJson<unknown>("/api/me/summary");
      return MeSummaryResponseSchema.parse(raw);
    },
    staleTime: 60_000, // counts don't churn fast
  });
}
