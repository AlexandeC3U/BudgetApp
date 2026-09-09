"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiJson } from "@/lib/api/client";
import { balancesQueryKey, tabQueryKey, tabsQueryKey } from "@/lib/query-keys";
import {
  AddMemberInputSchema,
  TabResponseSchema,
  type AddMemberInput,
  type TabDto,
} from "@/lib/schemas/tab";

export function useAddMember(tabId: string) {
  const qc = useQueryClient();
  return useMutation<TabDto, Error, AddMemberInput>({
    mutationFn: async (input) => {
      const validated = AddMemberInputSchema.parse(input);
      const raw = await apiJson<unknown>(
        `/api/tabs/${encodeURIComponent(tabId)}/members`,
        { method: "POST", body: JSON.stringify(validated) }
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
