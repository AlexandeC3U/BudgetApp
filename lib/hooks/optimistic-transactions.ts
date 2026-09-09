"use client";

import type { QueryClient, QueryKey } from "@tanstack/react-query";

import { transactionQueryKey } from "@/lib/query-keys";
import type {
  TransactionDto,
  TransactionResponse,
} from "@/lib/schemas/transaction";

// The two shapes a transaction-list cache can take: a flat list (Dashboard,
// per-tab, SSR) or an infinite-query page set (the Activity feed).
type ListPage = { transactions: TransactionDto[]; nextCursor?: string | null };
type InfiniteList = { pages: ListPage[]; pageParams: unknown[] };
type ListData = ListPage | InfiniteList;

export type TxnCacheSnapshot = Array<[QueryKey, unknown]>;

function isInfinite(d: ListData): d is InfiniteList {
  return Array.isArray((d as InfiniteList).pages);
}

function mapTxns(
  data: ListData,
  fn: (list: TransactionDto[]) => TransactionDto[]
): ListData {
  if (isInfinite(data)) {
    return {
      ...data,
      pages: data.pages.map((p) => ({ ...p, transactions: fn(p.transactions) })),
    };
  }
  return { ...data, transactions: fn(data.transactions) };
}

/** Prepend to the flat list, or to the first page of an infinite list. */
function prependTxn(data: ListData, txn: TransactionDto): ListData {
  if (isInfinite(data)) {
    const [first, ...rest] = data.pages;
    if (!first) return data;
    return {
      ...data,
      pages: [
        { ...first, transactions: [txn, ...first.transactions] },
        ...rest,
      ],
    };
  }
  return { ...data, transactions: [txn, ...data.transactions] };
}

function eachListCache(
  qc: QueryClient,
  cb: (scope: string | null, data: ListData) => ListData
) {
  const queries = qc.getQueryCache().findAll({ queryKey: ["transactions"] });
  for (const q of queries) {
    const scope = (q.queryKey[1] ?? null) as string | null;
    qc.setQueryData(q.queryKey, (old: ListData | undefined) =>
      old == null ? old : cb(scope, old)
    );
  }
}

/** Snapshot every transaction-list + single-transaction cache for rollback. */
export function snapshotTxnCaches(qc: QueryClient): TxnCacheSnapshot {
  const queries = [
    ...qc.getQueryCache().findAll({ queryKey: ["transactions"] }),
    ...qc.getQueryCache().findAll({ queryKey: ["transaction"] }),
  ];
  return queries.map((q) => [q.queryKey, q.state.data]);
}

export function restoreTxnCaches(qc: QueryClient, snap: TxnCacheSnapshot) {
  for (const [key, data] of snap) qc.setQueryData(key, data);
}

/** Insert into the global feeds (scope null/"feed") and the txn's own tab list. */
export function optimisticInsertTxn(qc: QueryClient, txn: TransactionDto) {
  eachListCache(qc, (scope, data) => {
    const belongs = scope === null || scope === "feed" || scope === txn.tab;
    return belongs ? prependTxn(data, txn) : data;
  });
}

export function optimisticUpdateTxn(
  qc: QueryClient,
  id: string,
  patch: Partial<TransactionDto>
) {
  eachListCache(qc, (_scope, data) =>
    mapTxns(data, (list) =>
      list.map((t) => (t.id === id ? { ...t, ...patch } : t))
    )
  );
  qc.setQueryData(
    transactionQueryKey(id),
    (old: TransactionResponse | undefined) =>
      old ? { transaction: { ...old.transaction, ...patch } } : old
  );
}

export function optimisticRemoveTxn(qc: QueryClient, id: string) {
  eachListCache(qc, (_scope, data) =>
    mapTxns(data, (list) => list.filter((t) => t.id !== id))
  );
}
