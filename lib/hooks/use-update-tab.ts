"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiJson } from "@/lib/api/client";
import { tabQueryKey, tabsQueryKey } from "@/lib/query-keys";
import {
  TabResponseSchema,
  UpdateTabInputSchema,
  type TabDto,
  type UpdateTabInput,
} from "@/lib/schemas/tab";

export function useUpdateTab(tabId: string) {
  const qc = useQueryClient();
  return useMutation<TabDto, Error, UpdateTabInput>({
    mutationFn: async (input) => {
      const validated = UpdateTabInputSchema.parse(input);
      const raw = await apiJson<unknown>(
        `/api/tabs/${encodeURIComponent(tabId)}`,
        { method: "PATCH", body: JSON.stringify(validated) }
      );
      return TabResponseSchema.parse(raw).tab;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tabsQueryKey });
      qc.invalidateQueries({ queryKey: tabQueryKey(tabId) });
    },
  });
}
