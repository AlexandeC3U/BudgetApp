"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiJson } from "@/lib/api/client";
import {
  balancesQueryKey,
  settlementsQueryKey,
  tabQueryKey,
  tabsQueryKey,
} from "@/lib/query-keys";
import {
  RecordSettlementInputSchema,
  type RecordSettlementInput,
} from "@/lib/schemas/settlement";

type RecordResult = { ok: true; recorded: number };

export function useRecordSettlement(tabId: string) {
  const qc = useQueryClient();
  return useMutation<RecordResult, Error, RecordSettlementInput>({
    mutationFn: async (input) => {
      const validated = RecordSettlementInputSchema.parse(input);
      return apiJson<RecordResult>(
        `/api/tabs/${encodeURIComponent(tabId)}/settlements`,
        { method: "POST", body: JSON.stringify(validated) }
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: balancesQueryKey(tabId) });
      qc.invalidateQueries({ queryKey: settlementsQueryKey(tabId) });
      qc.invalidateQueries({ queryKey: tabQueryKey(tabId) });
      qc.invalidateQueries({ queryKey: tabsQueryKey });
    },
  });
}
