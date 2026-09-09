"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { AvatarStack } from "@/components/ui/Avatar";
import { BigNumber } from "@/components/ui/BigNumber";
import { TxnRow } from "@/components/TxnRow";
import { BottomNav } from "@/components/BottomNav";
import { useSheet } from "@/components/sheets/sheet-controller";
import { useTab } from "@/lib/hooks/use-tab";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { spendByCategory } from "@/lib/compute";

export function TabDetailScreen({ tabId }: { tabId: string }) {
  const router = useRouter();
  const { open } = useSheet();

  const { data: tab, isLoading: tabLoading } = useTab(tabId);
  const { data: txns = [] } = useTransactions(tabId);
  const { data: me } = useCurrentUser();

  const cats = useMemo(() => spendByCategory(txns), [txns]);
  // Sum locally from the per-tab list we already hold rather than reading the
  // server's SUM(amount) again — also keeps the meter optimistic-accurate when
  // a transaction is added/edited. (tab.spent still backs views without the
  // full list, e.g. TabCard and the invite sheet.)
  const spent = useMemo(() => txns.reduce((s, t) => s + t.amount, 0), [txns]);

  if (tabLoading) return null;
  if (!tab) {
    return (
      <div className="pb-32 px-6 pt-12 text-center">
        <div className="font-serif text-[28px] text-ink tracking-tight">
          Tab not found
        </div>
        <button
          onClick={() => router.push("/tabs")}
          className="mt-4 text-coral font-semibold"
        >
          Back to tabs
        </button>
        <BottomNav />
      </div>
    );
  }

  const pct = tab.budget > 0 ? Math.min(100, (spent / tab.budget) * 100) : 0;
  const remaining = tab.budget - spent;

  return (
    <div className="pb-32 min-h-full" style={{ background: tab.color }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(26,23,20,0.08)" }}
          aria-label="Back"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 3l-5 5 5 5"
              stroke="#1A1714"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          onClick={() => open("editTab", { tabId: tab.id })}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(26,23,20,0.08)" }}
          aria-label="Tab options"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx={6} cy={12} r={1.6} fill="#1A1714" />
            <circle cx={12} cy={12} r={1.6} fill="#1A1714" />
            <circle cx={18} cy={12} r={1.6} fill="#1A1714" />
          </svg>
        </button>
      </div>

      <div className="px-6 pb-6">
        <div className="text-[56px] leading-none">{tab.emoji}</div>
        <div
          className="font-serif text-[52px] text-ink mt-2 leading-none"
          style={{ letterSpacing: "-0.03em" }}
        >
          {tab.name}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <AvatarStack members={tab.members} size={26} max={5} />
          <button
            onClick={() => open("invite", { tabId: tab.id })}
            className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-ink"
            style={{
              border: "1px dashed rgba(26,23,20,0.4)",
              background: "transparent",
            }}
          >
            + Invite
          </button>
        </div>
      </div>

      {/* White content card */}
      <div className="bg-paper rounded-t-[32px] px-5 pt-6 pb-8 min-h-[400px]">
        {/* Budget meter */}
        <div className="flex justify-between items-end">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink/50">
              Remaining
            </div>
            <div className="mt-1">
              <BigNumber value={remaining} size={48} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink/50">
              Spent
            </div>
            <div
              className="font-serif text-[24px] text-ink mt-1 tracking-tight"
            >
              €{spent.toFixed(0)}{" "}
              <span className="opacity-40">/ €{tab.budget}</span>
            </div>
          </div>
        </div>
        <div className="mt-3.5 h-2.5 rounded-full overflow-hidden bg-ink/10">
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: tab.color }}
          />
        </div>

        {/* Category chips */}
        <div className="flex gap-2 mt-5 overflow-x-auto pb-1 -ml-0.5 -mr-5 no-scrollbar">
          {cats.map((c) => (
            <div
              key={c.cat}
              className="shrink-0 flex items-center gap-2 rounded-full pl-2 pr-3.5 py-2"
              style={{ background: `${c.color}20` }}
            >
              <div
                className="flex items-center justify-center text-base"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: c.color,
                }}
              >
                {c.emoji}
              </div>
              <div>
                <div className="text-[11px] font-semibold text-ink/60 leading-none">
                  {c.name}
                </div>
                <div className="text-[14px] font-bold text-ink leading-tight">
                  €{c.total.toFixed(0)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Settle up CTA */}
        {tab.members.length > 1 && (
          <button
            onClick={() => open("settle", { tabId: tab.id })}
            className="w-full bg-ink text-bone rounded-[22px] px-4 py-3.5 mt-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-center text-base"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#FF6B4A",
                }}
              >
                💸
              </div>
              <div className="text-left">
                <div className="text-[14px] font-bold">Settle up</div>
                <div className="text-[11px] font-medium text-bone/60">
                  2 balances pending
                </div>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M5 2l5 5-5 5"
                stroke="#FAF6EE"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {/* Transactions */}
        <div className="font-serif text-[24px] text-ink mt-6 mb-1 tracking-tight">
          Transactions
        </div>
        <div>
          {txns.map((t) => (
            <TxnRow
              key={t.id}
              txn={t}
              tab={tab}
              currentUserId={me?.id}
              onClick={() => open("editTxn", { txnId: t.id })}
            />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
