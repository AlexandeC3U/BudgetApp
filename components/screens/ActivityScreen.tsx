"use client";

import { useEffect, useMemo, useRef } from "react";

import { TxnRow } from "@/components/TxnRow";
import { BottomNav } from "@/components/BottomNav";
import { useSheet } from "@/components/sheets/sheet-controller";
import { useTabs } from "@/lib/hooks/use-tabs";
import { useInfiniteTransactions } from "@/lib/hooks/use-infinite-transactions";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { dateLabel } from "@/lib/format";
import type { TransactionDto } from "@/lib/schemas/transaction";

const FILTERS = ["All", "You paid", "Owed"] as const;

export function ActivityScreen() {
  const { open } = useSheet();
  const { data: tabs = [] } = useTabs();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteTransactions();
  const { data: me } = useCurrentUser();

  const txns = useMemo<TransactionDto[]>(
    () => data?.pages.flatMap((p) => p.transactions) ?? [],
    [data]
  );

  const tabsById = useMemo(() => new Map(tabs.map((t) => [t.id, t])), [tabs]);

  // Infinite-scroll sentinel: fetch the next page when it scrolls into view.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "240px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const groups = useMemo(() => {
    const out: Record<string, TransactionDto[]> = {};
    for (const t of txns) {
      const k = dateLabel(t.date);
      (out[k] ??= []).push(t);
    }
    return out;
  }, [txns]);

  // Show one chip per active tab (using real names) plus the standard filters.
  const filterChips = ["All", ...tabs.map((t) => t.name), ...FILTERS.slice(1)];

  return (
    <div className="pb-32">
      <div className="px-6 pt-5 pb-2">
        <div className="text-[13px] font-semibold uppercase tracking-wide text-ink/50">
          All activity
        </div>
        <div
          className="font-serif text-[44px] text-ink leading-[1.05] mt-1.5"
          style={{ letterSpacing: "-0.03em" }}
        >
          Every <em className="italic text-violet">cent</em> tracked
        </div>
      </div>

      <div className="flex gap-2 px-6 pt-3 pb-1 overflow-x-auto no-scrollbar">
        {filterChips.map((f, i) => (
          <div
            key={`${f}-${i}`}
            className="shrink-0 px-3.5 py-2 rounded-full text-[13px] font-semibold"
            style={{
              background: i === 0 ? "#1A1714" : "#FFFDF8",
              color: i === 0 ? "#FAF6EE" : "#1A1714",
              border: i === 0 ? "none" : "0.5px solid rgba(26,23,20,0.1)",
            }}
          >
            {f}
          </div>
        ))}
      </div>

      <div className="px-6 pt-3">
        {Object.entries(groups).map(([day, items]) => (
          <div key={day} className="mt-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink/45 mb-1">
              {day}
            </div>
            {items.map((t) => {
              const tab = tabsById.get(t.tab);
              if (!tab) return null;
              return (
                <TxnRow
                  key={t.id}
                  txn={t}
                  tab={tab}
                  currentUserId={me?.id}
                  onClick={() => open("editTxn", { txnId: t.id })}
                />
              );
            })}
          </div>
        ))}

        {!isLoading && txns.length === 0 && (
          <div className="text-center text-[13px] text-ink/55 py-16">
            No activity yet.
          </div>
        )}

        {/* Infinite-scroll sentinel + loading footer */}
        <div ref={sentinelRef} />
        {(isLoading || isFetchingNextPage) && (
          <div className="text-center text-[12px] font-medium text-ink/40 py-5">
            Loading…
          </div>
        )}
        {!hasNextPage && txns.length > 0 && (
          <div className="text-center text-[11px] font-medium text-ink/30 py-5">
            That&apos;s everything
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
