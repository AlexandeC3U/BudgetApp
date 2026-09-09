"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiJson } from "@/lib/api/client";
import { balancesQueryKey, tabQueryKey, tabsQueryKey } from "@/lib/query-keys";
import { TabResponseSchema, type TabDto } from "@/lib/schemas/tab";

export function useRemoveMember(tabId: string) {
  const qc = useQueryClient();
  return useMutation<TabDto, Error, string>({
    mutationFn: async (userId) => {
      const raw = await apiJson<unknown>(
        `/api/tabs/${encodeURIComponent(tabId)}/members/${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      );
      return TabResponseSchema.parse(raw).tab;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tabQueryKey(tabId) });
      qc.invalidateQueries({ queryKey: tabsQueryKey });
      qc.invalidateQueries({ queryKey: balancesQueryKey(tabId) });
    },
  });
}
