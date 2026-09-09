"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiJson } from "@/lib/api/client";
import { meSummaryQueryKey } from "@/lib/query-keys";
import {
  optimisticRemoveTxn,
  restoreTxnCaches,
  snapshotTxnCaches,
  type TxnCacheSnapshot,
} from "./optimistic-transactions";

type Variables = { id: string; tabId: string };
type Ctx = { snapshot: TxnCacheSnapshot };

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation<{ ok: true }, Error, Variables, Ctx>({
    mutationFn: async ({ id }) => {
      return apiJson<{ ok: true }>(
        `/api/transactions/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
    },
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ["transactions"] });
      const snapshot = snapshotTxnCaches(qc);
      optimisticRemoveTxn(qc, id);
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) restoreTxnCaches(qc, ctx.snapshot);
    },
    onSettled: (_data, _err, { id, tabId }) => {
      qc.invalidateQueries({ queryKey: ["tabs"] });
      qc.invalidateQueries({ queryKey: ["tab", tabId] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["balances", tabId] });
      qc.invalidateQueries({ queryKey: meSummaryQueryKey });
      qc.removeQueries({ queryKey: ["transaction", id] });
    },
  });
}
