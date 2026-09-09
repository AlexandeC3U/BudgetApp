"use client";

import { CategoryChip } from "./ui/CategoryChip";
import { dateLabel } from "@/lib/format";
import type { TabDto } from "@/lib/schemas/tab";
import type { TransactionDto } from "@/lib/schemas/transaction";

type Props = {
  txn: TransactionDto;
  tab: TabDto;
  /** UUID of the current user — used to label "You paid" / "you owe" / "+€..." */
  currentUserId?: string;
  onClick?: () => void;
};

const FALLBACK_CATEGORY = {
  emoji: "🏷️",
  color: "#7C5CFF",
};

export function TxnRow({ txn, tab, currentUserId, onClick }: Props) {
  const member = tab.members.find((m) => m.id === txn.payer);
  const cat = txn.category ?? FALLBACK_CATEGORY;

  const isYou = !!currentUserId && txn.payer === currentUserId;
  const youInSplit = !!currentUserId && txn.split.includes(currentUserId);
  const share = txn.amount / Math.max(txn.split.length, 1);
  const youOwe = !isYou && youInSplit;
  const theyOwe = isYou && txn.split.length > 1;

  const payerLabel = !member
    ? "Someone paid"
    : isYou
      ? "You paid"
      : `${member.name} paid`;

  return (
    <button
      onClick={onClick}
      className="text-left w-full flex items-center gap-3.5 py-3"
    >
      <CategoryChip cat={cat} size={44} />
      <div className="flex-1 min-w-0">
        <div className="text-[16px] font-semibold tracking-tight text-ink truncate">
          {txn.title}
        </div>
        <div className="text-[12px] font-medium text-ink/55 mt-0.5 flex items-center gap-1.5">
          <span>{payerLabel}</span>
          {txn.split.length > 1 && (
            <>
              <span className="opacity-50">·</span>
              <span>split {txn.split.length}</span>
            </>
          )}
          <span className="opacity-50">·</span>
          <span>{dateLabel(txn.date)}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="font-serif text-[22px] leading-none tracking-tight text-ink">
          €{txn.amount.toFixed(2)}
        </div>
        {youOwe && (
          <div className="text-[11px] font-semibold text-rust mt-1">
            you owe €{share.toFixed(2)}
          </div>
        )}
        {theyOwe && (
          <div className="text-[11px] font-semibold text-success mt-1">
            +€{(txn.amount - share).toFixed(2)}
          </div>
        )}
      </div>
    </button>
  );
}
