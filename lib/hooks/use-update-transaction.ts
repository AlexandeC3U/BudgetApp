"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiJson } from "@/lib/api/client";
import { categoriesQueryKey, meSummaryQueryKey } from "@/lib/query-keys";
import type { CategoriesResponse } from "@/lib/schemas/category";
import {
  TransactionResponseSchema,
  UpdateTransactionInputSchema,
  type TransactionDto,
  type UpdateTransactionInput,
} from "@/lib/schemas/transaction";
import {
  optimisticUpdateTxn,
  restoreTxnCaches,
  snapshotTxnCaches,
  type TxnCacheSnapshot,
} from "./optimistic-transactions";

type Variables = { id: string; input: UpdateTransactionInput };
type Ctx = { snapshot: TxnCacheSnapshot };

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation<TransactionDto, Error, Variables, Ctx>({
    mutationFn: async ({ id, input }) => {
      const validated = UpdateTransactionInputSchema.parse(input);
      const raw = await apiJson<unknown>(
        `/api/transactions/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: JSON.stringify(validated),
        }
      );
      return TransactionResponseSchema.parse(raw).transaction;
    },
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: ["transactions"] });
      await qc.cancelQueries({ queryKey: ["transaction", id] });
      const snapshot = snapshotTxnCaches(qc);

      const patch: Partial<TransactionDto> = {};
      if (input.title !== undefined) patch.title = input.title;
      if (input.amount !== undefined) patch.amount = input.amount;
      if (input.date !== undefined) patch.date = input.date;
      if (input.splitUserIds !== undefined)
        patch.split = [...new Set(input.splitUserIds)];
      if (input.categoryId !== undefined) {
        const cats =
          qc.getQueryData<CategoriesResponse>(categoriesQueryKey)
            ?.categories ?? [];
        patch.category = input.categoryId
          ? cats.find((c) => c.id === input.categoryId) ?? null
          : null;
      }

      optimisticUpdateTxn(qc, id, patch);
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) restoreTxnCaches(qc, ctx.snapshot);
    },
    onSettled: (updated, _err, { id }) => {
      qc.invalidateQueries({ queryKey: ["tabs"] });
      if (updated) {
        qc.invalidateQueries({ queryKey: ["tab", updated.tab] });
        qc.invalidateQueries({ queryKey: ["balances", updated.tab] });
      }
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["transaction", id] });
      // Editing a date can move a txn in/out of the current month.
      qc.invalidateQueries({ queryKey: meSummaryQueryKey });
    },
  });
}
