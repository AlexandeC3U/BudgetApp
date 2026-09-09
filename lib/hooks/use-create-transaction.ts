"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiJson } from "@/lib/api/client";
import { categoriesQueryKey, meSummaryQueryKey } from "@/lib/query-keys";
import type { CategoriesResponse } from "@/lib/schemas/category";
import {
  CreateTransactionInputSchema,
  CreateTransactionResponseSchema,
  type CreateTransactionInput,
  type TransactionDto,
} from "@/lib/schemas/transaction";
import {
  optimisticInsertTxn,
  restoreTxnCaches,
  snapshotTxnCaches,
  type TxnCacheSnapshot,
} from "./optimistic-transactions";

type Ctx = { snapshot: TxnCacheSnapshot };

export function useCreateTransaction() {
  const qc = useQueryClient();

  return useMutation<TransactionDto, Error, CreateTransactionInput, Ctx>({
    mutationFn: async (input) => {
      const validated = CreateTransactionInputSchema.parse(input);
      const raw = await apiJson<unknown>("/api/transactions", {
        method: "POST",
        body: JSON.stringify(validated),
      });
      return CreateTransactionResponseSchema.parse(raw).transaction;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["transactions"] });
      const snapshot = snapshotTxnCaches(qc);

      // Resolve the category object from cache so the optimistic row renders
      // its chip immediately.
      const cats =
        qc.getQueryData<CategoriesResponse>(categoriesQueryKey)?.categories ??
        [];
      const category = input.categoryId
        ? cats.find((c) => c.id === input.categoryId) ?? null
        : null;

      const temp: TransactionDto = {
        id: `optimistic-${Date.now()}`,
        tab: input.tabId,
        category,
        title: input.title,
        amount: input.amount,
        date: input.date,
        payer: input.payerId,
        split: [...new Set(input.splitUserIds)],
      };
      optimisticInsertTxn(qc, temp);
      return { snapshot };
    },
    onError: (_err, _input, ctx) => {
      if (ctx) restoreTxnCaches(qc, ctx.snapshot);
    },
    onSettled: (created) => {
      // Reconcile with the server (replaces the temp row, refreshes the
      // server-computed tab spent + balances).
      qc.invalidateQueries({ queryKey: ["tabs"] });
      if (created) qc.invalidateQueries({ queryKey: ["tab", created.tab] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      if (created)
        qc.invalidateQueries({ queryKey: ["balances", created.tab] });
      // Profile's "transactions this month" count is now stale.
      qc.invalidateQueries({ queryKey: meSummaryQueryKey });
    },
  });
}
