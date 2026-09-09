"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiJson } from "@/lib/api/client";
import {
  balancesQueryKey,
  meSummaryQueryKey,
  settlementsQueryKey,
  tabQueryKey,
  tabsQueryKey,
} from "@/lib/query-keys";

export function useDeleteTab() {
  const qc = useQueryClient();
  return useMutation<{ ok: true }, Error, string>({
    mutationFn: async (tabId) => {
      return apiJson<{ ok: true }>(
        `/api/tabs/${encodeURIComponent(tabId)}`,
        { method: "DELETE" }
      );
    },
    onSuccess: (_data, tabId) => {
      qc.removeQueries({ queryKey: tabQueryKey(tabId) });
      qc.invalidateQueries({ queryKey: tabsQueryKey });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      // Drop now-orphaned per-tab caches and refresh the profile tab count.
      qc.removeQueries({ queryKey: balancesQueryKey(tabId) });
      qc.removeQueries({ queryKey: settlementsQueryKey(tabId) });
      qc.invalidateQueries({ queryKey: meSummaryQueryKey });
    },
  });
}
