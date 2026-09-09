"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiJson } from "@/lib/api/client";
import { meSummaryQueryKey, tabsQueryKey } from "@/lib/query-keys";
import {
  CreateTabInputSchema,
  TabResponseSchema,
  type CreateTabInput,
  type TabDto,
} from "@/lib/schemas/tab";

export function useCreateTab() {
  const qc = useQueryClient();
  return useMutation<TabDto, Error, CreateTabInput>({
    mutationFn: async (input) => {
      const validated = CreateTabInputSchema.parse(input);
      const raw = await apiJson<unknown>("/api/tabs", {
        method: "POST",
        body: JSON.stringify(validated),
      });
      return TabResponseSchema.parse(raw).tab;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tabsQueryKey });
      // Profile's tab count.
      qc.invalidateQueries({ queryKey: meSummaryQueryKey });
    },
  });
}
