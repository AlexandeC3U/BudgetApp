"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { apiJson } from "@/lib/api/client";
import {
  TransactionResponseSchema,
  TransactionsResponseSchema,
  type TransactionDto,
  type TransactionResponse,
  type TransactionsResponse,
} from "@/lib/schemas/transaction";

import { transactionQueryKey } from "@/lib/query-keys";
export { transactionQueryKey };

/**
 * Fetch a single transaction. To avoid a wasted round-trip when opening the
 * EditTxnSheet from a screen that already has the txn in `useTransactions()`,
 * we seed `placeholderData` from the most recent cached list. The query still
 * refetches in the background so the form sees the latest server-side state.
 */
export function useTransaction(id: string | undefined) {
  const qc = useQueryClient();

  return useQuery<TransactionResponse, Error, TransactionDto>({
    queryKey: transactionQueryKey(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const raw = await apiJson<unknown>(
        `/api/transactions/${encodeURIComponent(id!)}`
      );
      return TransactionResponseSchema.parse(raw);
    },
    placeholderData: () => {
      if (!id) return undefined;
      const cachedLists = qc.getQueriesData<TransactionsResponse>({
        queryKey: ["transactions"],
      });
      for (const [, value] of cachedLists) {
        const found = value?.transactions.find((t) => t.id === id);
        if (found) return { transaction: found };
      }
      return undefined;
    },
    select: (data) => data.transaction,
  });
}
