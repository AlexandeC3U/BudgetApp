"use client";

import { useEffect, useMemo, useState } from "react";

import { Sheet } from "./Sheet";
import { FieldChip } from "./FieldChip";
import { DateField } from "./DateField";
import { useSheet } from "./sheet-controller";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import { PillButton } from "@/components/ui/PillButton";
import { useTabs } from "@/lib/hooks/use-tabs";
import { useCategories } from "@/lib/hooks/use-categories";
import { useTransaction } from "@/lib/hooks/use-transaction";
import { useUpdateTransaction } from "@/lib/hooks/use-update-transaction";
import { useDeleteTransaction } from "@/lib/hooks/use-delete-transaction";
import type { UpdateTransactionInput } from "@/lib/schemas/transaction";

const NUMPAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

export function EditTxnSheet() {
  const { state, close, triggerCelebrate } = useSheet();
  const open = state.name === "editTxn";
  const txnId = state.params?.txnId;

  const { data: original } = useTransaction(open ? txnId : undefined);
  const { data: tabs = [] } = useTabs();
  const { data: cats = [] } = useCategories();
  const updateMut = useUpdateTransaction();
  const deleteMut = useDeleteTransaction();

  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [catId, setCatId] = useState<string | null>(null);
  const [splitWith, setSplitWith] = useState<string[]>([]);
  const [splitOpen, setSplitOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  // Hydrate state when sheet opens with a fresh transaction.
  useEffect(() => {
    if (open && original) {
      setAmount(original.amount.toFixed(2));
      setTitle(original.title);
      setDate(original.date);
      setCatId(original.category?.id ?? null);
      setSplitWith(original.split);
      setConfirmDel(false);
      updateMut.reset();
      deleteMut.reset();
    }
    // we deliberately ignore changes to the mutation refs here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, original?.id]);

  const activeTab = useMemo(
    () => (original ? tabs.find((t) => t.id === original.tab) : undefined),
    [tabs, original]
  );
  const activeCat = useMemo(
    () => cats.find((c) => c.id === catId),
    [cats, catId]
  );
  const payer = useMemo(
    () =>
      original && activeTab
        ? activeTab.members.find((m) => m.id === original.payer)
        : undefined,
    [activeTab, original]
  );

  if (!open) return null;
  if (!original || !activeTab) {
    return (
      <Sheet open={open} onClose={close} title="Edit expense">
        <div className="text-[14px] text-ink/55 text-center py-12">
          Loading…
        </div>
      </Sheet>
    );
  }

  const onKey = (k: string) => {
    if (k === "⌫") return setAmount((a) => a.slice(0, -1));
    if (k === "." && amount.includes(".")) return;
    if ((amount.split(".")[1]?.length ?? 0) >= 2) return;
    setAmount((a) => (a + k).replace(/^0(\d)/, "$1"));
  };

  const numericAmount = parseFloat(amount || "0");
  const dirty =
    title.trim() !== original.title ||
    Math.abs(numericAmount - original.amount) > 0.001 ||
    date !== original.date ||
    catId !== (original.category?.id ?? null) ||
    !arraysEqual(splitWith, original.split);

  const canSave =
    dirty &&
    numericAmount > 0 &&
    title.trim().length > 0 &&
    splitWith.length > 0 &&
    !updateMut.isPending;

  const save = () => {
    if (!canSave) return;
    const input: UpdateTransactionInput = {};
    if (title.trim() !== original.title) input.title = title.trim();
    if (Math.abs(numericAmount - original.amount) > 0.001)
      input.amount = numericAmount;
    if (date !== original.date) input.date = date;
    if (catId !== (original.category?.id ?? null)) input.categoryId = catId;
    if (!arraysEqual(splitWith, original.split)) input.splitUserIds = splitWith;

    updateMut.mutate(
      { id: original.id, input },
      {
        onSuccess: () => {
          close();
          setTimeout(triggerCelebrate, 200);
        },
      }
    );
  };

  const del = () => {
    deleteMut.mutate(
      { id: original.id, tabId: original.tab },
      { onSuccess: close }
    );
  };

  const fallbackCatColor = activeCat?.color ?? "#7C5CFF";

  return (
    <Sheet open={open} onClose={close} title="Edit expense">
      {/* Payer chip */}
      {payer && (
        <div className="flex items-center gap-2.5 mb-3 bg-bone rounded-full pl-1.5 pr-3 py-1.5 w-fit">
          <Avatar member={payer} size={28} />
          <span className="text-[12px] font-semibold text-ink/70">
            {payer.name === "You" ? "You paid" : `${payer.name} paid`}
          </span>
        </div>
      )}

      {/* Amount + title */}
      <div
        className="rounded-[24px] px-5 py-6 flex flex-col items-center"
        style={{ background: `${fallbackCatColor}15` }}
      >
        <div
          className="font-serif text-ink flex items-start"
          style={{ fontSize: 64, letterSpacing: "-0.04em", lineHeight: 1 }}
        >
          <span
            className="opacity-50"
            style={{ fontSize: 36, marginTop: 12, marginRight: 4 }}
          >
            €
          </span>
          <span>{amount || "0"}</span>
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What was it for?"
          className="mt-3 bg-transparent text-center outline-none text-[14px] font-medium text-ink w-full"
        />
      </div>

      <div className="flex flex-wrap gap-2 mt-3.5">
        <FieldChip
          icon={<span className="text-base">{activeTab.emoji}</span>}
          label={activeTab.name}
        />
        {activeCat && (
          <FieldChip
            icon={
              <div
                className="flex items-center justify-center text-[13px]"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: activeCat.color,
                }}
              >
                {activeCat.emoji}
              </div>
            }
            label={activeCat.name}
          />
        )}
        <DateField value={date} onChange={setDate} />
        <FieldChip
          icon={
            <AvatarStack
              members={activeTab.members.filter((m) => splitWith.includes(m.id))}
              size={18}
              max={3}
            />
          }
          label={splitWith.length > 1 ? `Split ${splitWith.length}` : "Just me"}
          onClick={() => setSplitOpen(true)}
        />
      </div>

      {/* Category picker */}
      <div className="grid grid-cols-4 gap-2.5 mt-[18px]">
        {cats.slice(0, 8).map((c) => {
          const active = catId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCatId(c.id)}
              className="rounded-2xl py-3 px-1.5 flex flex-col items-center gap-1"
              style={{ background: active ? c.color : `${c.color}18` }}
            >
              <div className="text-[22px]">{c.emoji}</div>
              <div
                className="text-[11px] font-semibold"
                style={{ color: active ? "#1A1714" : "rgba(26,23,20,0.7)" }}
              >
                {c.name}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-5">
        {NUMPAD.map((k) => (
          <button
            key={k}
            onClick={() => onKey(k)}
            className="bg-bone rounded-2xl h-[52px] font-serif text-[28px] text-ink"
            style={{ letterSpacing: "-0.02em" }}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setConfirmDel(true)}
          disabled={deleteMut.isPending}
          className="rounded-full px-4 py-3.5 inline-flex items-center gap-2 text-[15px] font-semibold disabled:opacity-50"
          style={{ background: "#FFE4DD", color: "#C2410C" }}
        >
          <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
            <path
              d="M2 4h10M5 4V2.5a1 1 0 011-1h2a1 1 0 011 1V4M3 4l.7 9.5a1.5 1.5 0 001.5 1.4h3.6a1.5 1.5 0 001.5-1.4L11 4M6 7v5M8 7v5"
              stroke="#C2410C"
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Delete
        </button>
        <PillButton
          onClick={save}
          disabled={!canSave}
          style={{ flex: 1 }}
          icon={
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 7l3 3 5-7"
                stroke="#FAF6EE"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        >
          {updateMut.isPending ? "Saving…" : "Save changes"}
        </PillButton>
      </div>

      {(updateMut.isError || deleteMut.isError) && (
        <div className="mt-2 text-[12px] font-semibold text-rust text-center">
          {updateMut.error?.message ?? deleteMut.error?.message}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDel && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6 mx-auto max-w-md"
          style={{ background: "rgba(26,23,20,0.5)" }}
          onClick={() => setConfirmDel(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-paper rounded-[28px] px-6 py-6 max-w-[320px] w-full animate-pop-in"
            style={{ boxShadow: "0 20px 60px rgba(26,23,20,0.3)" }}
          >
            <div className="text-[40px] text-center">🗑️</div>
            <div className="font-serif text-[28px] text-center text-ink tracking-tight mt-2">
              Delete this expense?
            </div>
            <div className="text-[13px] font-medium text-ink/60 text-center mt-1.5 leading-snug">
              &quot;{title}&quot; — €{amount}. This can&apos;t be undone.
            </div>
            <div className="mt-4 flex gap-2">
              <PillButton
                color="#FAF6EE"
                textColor="#1A1714"
                onClick={() => setConfirmDel(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </PillButton>
              <PillButton
                color="#C2410C"
                onClick={del}
                disabled={deleteMut.isPending}
                style={{ flex: 1 }}
              >
                {deleteMut.isPending ? "Deleting…" : "Delete"}
              </PillButton>
            </div>
          </div>
        </div>
      )}

      {/* Split sheet */}
      {splitOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end mx-auto max-w-md"
          style={{ background: "rgba(26,23,20,0.4)" }}
          onClick={() => setSplitOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-paper rounded-t-[32px] px-6 pt-6 pb-8"
          >
            <div className="font-serif text-[28px] text-ink tracking-tight mb-3">
              Split with
            </div>
            {activeTab.members.map((m) => {
              const sel = splitWith.includes(m.id);
              const share =
                sel && splitWith.length
                  ? numericAmount / splitWith.length
                  : 0;
              return (
                <button
                  key={m.id}
                  onClick={() =>
                    setSplitWith((prev) =>
                      sel ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                    )
                  }
                  className="w-full flex items-center gap-3 py-3 px-1"
                >
                  <Avatar member={m} size={36} />
                  <div className="flex-1 text-left">
                    <div className="text-[15px] font-semibold text-ink">{m.name}</div>
                    {sel && (
                      <div className="text-[12px] text-ink/55 mt-0.5">
                        owes €{share.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{
                      background: sel ? "#FF6B4A" : "transparent",
                      border: sel ? "none" : "1.5px solid rgba(26,23,20,0.2)",
                    }}
                  >
                    {sel && (
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                        <path
                          d="M2 5l3 3 5-7"
                          stroke="#fff"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
            <div className="mt-4">
              <PillButton fullWidth onClick={() => setSplitOpen(false)}>
                Done
              </PillButton>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}
