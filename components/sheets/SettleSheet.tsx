"use client";

import { useEffect, useState } from "react";

import { Sheet } from "./Sheet";
import { useSheet } from "./sheet-controller";
import { Avatar } from "@/components/ui/Avatar";
import { PillButton } from "@/components/ui/PillButton";
import { useBalances } from "@/lib/hooks/use-balances";
import { useTabs } from "@/lib/hooks/use-tabs";
import { useRecordSettlement } from "@/lib/hooks/use-record-settlement";

export function SettleSheet() {
  const { state, close, triggerCelebrate } = useSheet();
  const open = state.name === "settle";

  const { data: tabs = [] } = useTabs();
  const tabId = state.params?.tabId ?? tabs[0]?.id;
  const tabName = tabs.find((t) => t.id === tabId)?.name;

  const { data: balances, isLoading } = useBalances(open ? tabId : undefined);
  const recordMut = useRecordSettlement(tabId ?? "");

  // Tracks which single transfer is being recorded, for per-row feedback.
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPendingKey(null);
      recordMut.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const markPaid = (
    key: string,
    fromUserId: string,
    toUserId: string,
    amount: number
  ) => {
    if (!tabId || recordMut.isPending) return;
    setPendingKey(key);
    recordMut.mutate(
      { fromUserId, toUserId, amount },
      { onSettled: () => setPendingKey(null) }
    );
  };

  const markAllPaid = () => {
    if (!tabId || recordMut.isPending) return;
    recordMut.mutate(
      { all: true },
      {
        onSuccess: () => {
          close();
          triggerCelebrate();
        },
      }
    );
  };

  return (
    <Sheet
      open={open}
      onClose={close}
      title={tabName ? `Settle up · ${tabName}` : "Settle up"}
    >
      {isLoading || !balances ? (
        <div className="text-[14px] text-ink/55 text-center py-12">
          Crunching balances…
        </div>
      ) : balances.settlements.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-[40px]">🎯</div>
          <div className="font-serif text-[24px] text-ink tracking-tight mt-2">
            All settled
          </div>
          <div className="text-[13px] text-ink/55 mt-1">
            Nobody owes anybody anything in this tab.
          </div>
        </div>
      ) : (
        <>
          <div className="text-[13px] text-ink/60 mb-4">
            Smart-balanced — fewest transfers possible.
          </div>

          <div className="flex flex-col gap-3">
            {balances.settlements.map((s, i) => {
              const key = `${s.from.id}-${s.to.id}-${i}`;
              const rowPending = pendingKey === key;
              return (
                <div
                  key={key}
                  className="bg-paper rounded-[22px] p-4 flex items-center gap-2.5 border-[0.5px] border-ink/[0.06]"
                >
                  <Avatar member={s.from} size={40} />
                  <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                    <path
                      d="M2 7h16m0 0l-5-5m5 5l-5 5"
                      stroke="rgba(26,23,20,0.4)"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <Avatar member={s.to} size={40} />
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-ink">
                      {s.from.name} → {s.to.name}
                    </div>
                    <div className="font-serif text-[22px] text-ink leading-none mt-0.5 tracking-tight">
                      €{s.amount.toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      markPaid(key, s.from.id, s.to.id, s.amount)
                    }
                    disabled={recordMut.isPending}
                    className="rounded-full px-3.5 py-2 text-[12px] font-bold text-ink disabled:opacity-50"
                    style={{ background: "#3DD68C" }}
                  >
                    {rowPending ? "…" : "Mark paid"}
                  </button>
                </div>
              );
            })}
          </div>

          {recordMut.isError && (
            <div className="mt-3 text-[12px] font-semibold text-rust text-center">
              {recordMut.error.message}
            </div>
          )}

          <div className="mt-4">
            <PillButton
              fullWidth
              onClick={markAllPaid}
              disabled={recordMut.isPending}
            >
              {recordMut.isPending ? "Recording…" : "Mark all paid"}
            </PillButton>
          </div>
        </>
      )}
    </Sheet>
  );
}
