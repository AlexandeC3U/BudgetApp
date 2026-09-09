"use client";

import { useQuery } from "@tanstack/react-query";

import { apiJson } from "@/lib/api/client";
import { transactionsQueryKey } from "@/lib/query-keys";
import {
  TransactionsResponseSchema,
  type TransactionDto,
  type TransactionsResponse,
} from "@/lib/schemas/transaction";

export { transactionsQueryKey };

const EMPTY_TXNS: readonly TransactionDto[] = [] as const;
const EMPTY_TXNS_RESPONSE: TransactionsResponse = { transactions: [] } as const;

export function useTransactions(tabId?: string) {
  return useQuery<TransactionsResponse, Error, TransactionDto[]>({
    queryKey: transactionsQueryKey(tabId),
    queryFn: async () => {
      const url = tabId
        ? `/api/transactions?tabId=${encodeURIComponent(tabId)}`
        : "/api/transactions";
      const raw = await apiJson<unknown>(url);
      return TransactionsResponseSchema.parse(raw);
    },
    placeholderData: EMPTY_TXNS_RESPONSE,
    select: (data) =>
      data.transactions.length === 0
        ? (EMPTY_TXNS as TransactionDto[])
        : data.transactions,
  });
}
