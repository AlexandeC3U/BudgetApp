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
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useCreateTransaction } from "@/lib/hooks/use-create-transaction";

const NUMPAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AddTxnSheet() {
  // `open` below is this sheet's own visibility flag, so the context's
  // sheet-opener is aliased to keep both available.
  const { state, close, triggerCelebrate, open: openSheet } = useSheet();
  const open = state.name === "addTxn";

  const tabsQuery = useTabs();
  const catsQuery = useCategories();
  const meQuery = useCurrentUser();
  const { data: tabs = [] } = tabsQuery;
  const { data: cats = [] } = catsQuery;
  const { data: me } = meQuery;
  const createTxn = useCreateTransaction();

  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayIso);
  const [tabId, setTabId] = useState<string | null>(null);
  const [catId, setCatId] = useState<string | null>(null);
  const [splitOpen, setSplitOpen] = useState(false);
  const [splitWith, setSplitWith] = useState<string[]>([]);

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === tabId),
    [tabs, tabId]
  );
  const activeCat = useMemo(
    () => cats.find((c) => c.id === catId),
    [cats, catId]
  );

  // Default tab → first tab once tabs land.
  useEffect(() => {
    if (!tabId && tabs[0]) setTabId(tabs[0].id);
  }, [tabs, tabId]);

  // Default category → first one.
  useEffect(() => {
    if (!catId && cats[0]) setCatId(cats[0].id);
  }, [cats, catId]);

  // When the tab changes (or we get the current user), reset splitWith to just "me".
  useEffect(() => {
    if (me?.id) setSplitWith([me.id]);
  }, [tabId, me?.id]);

  // Reset transient fields when the sheet closes.
  // `createTxn` is a fresh object every render, so we deliberately exclude it
  // from deps — including it caused an infinite useEffect loop. `reset()` is
  // safe to call whether or not the mutation is active.
  useEffect(() => {
    if (!open) {
      setAmount("");
      setTitle("");
      setDate(todayIso());
      setSplitOpen(false);
      createTxn.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onKey = (k: string) => {
    if (k === "⌫") return setAmount((a) => a.slice(0, -1));
    if (k === "." && amount.includes(".")) return;
    if ((amount.split(".")[1]?.length ?? 0) >= 2) return;
    setAmount((a) => (a + k).replace(/^0(\d)/, "$1"));
  };

  const numericAmount = parseFloat(amount || "0");
  // Title is optional — fall back to the category name (e.g. "Food") so a quick
  // amount-only entry still saves.
  const canSubmit =
    !!me &&
    !!activeTab &&
    !!activeCat &&
    numericAmount > 0 &&
    splitWith.length > 0 &&
    !createTxn.isPending;

  const submit = () => {
    if (!canSubmit || !me || !activeTab || !activeCat) return;
    createTxn.mutate(
      {
        tabId: activeTab.id,
        categoryId: activeCat.id,
        title: title.trim() || activeCat.name,
        amount: numericAmount,
        date,
        payerId: me.id,
        splitUserIds: splitWith,
      },
      {
        onSuccess: () => {
          close();
          setTimeout(triggerCelebrate, 200);
        },
      }
    );
  };

  // The three queries this sheet needs before it can render a form. Each one
  // can be loading, failed, or successful-but-empty — collapsing all of those
  // into "Loading…" leaves the sheet stuck forever with nothing to act on, so
  // handle them separately.
  const loadError = meQuery.error ?? tabsQuery.error ?? catsQuery.error;
  const isFetching =
    meQuery.isFetching || tabsQuery.isFetching || catsQuery.isFetching;

  if (loadError) {
    return (
      <Sheet open={open} onClose={close} title="Add expense">
        <div className="py-10 text-center">
          <div className="text-[40px]">⚠️</div>
          <div className="mt-2 text-[15px] font-semibold text-ink">
            Couldn&apos;t load your data
          </div>
          <div className="mt-1.5 text-[13px] font-medium text-ink/55 leading-snug">
            {loadError.message}
          </div>
          <div className="mt-4">
            <PillButton
              fullWidth
              disabled={isFetching}
              onClick={() => {
                void meQuery.refetch();
                void tabsQuery.refetch();
                void catsQuery.refetch();
              }}
            >
              {isFetching ? "Retrying…" : "Try again"}
            </PillButton>
          </div>
        </div>
      </Sheet>
    );
  }

  // Nothing to attribute an expense to yet — point at the action that fixes it
  // rather than spinning.
  if (!isFetching && me && tabs.length === 0) {
    return (
      <Sheet open={open} onClose={close} title="Add expense">
        <div className="py-10 text-center">
          <div className="text-[40px]">🏷️</div>
          <div className="mt-2 text-[15px] font-semibold text-ink">
            Create a tab first
          </div>
          <div className="mt-1.5 text-[13px] font-medium text-ink/55 leading-snug">
            Expenses live inside a tab — like Home or a trip.
          </div>
          <div className="mt-4">
            <PillButton fullWidth onClick={() => openSheet("newTab")}>
              New tab
            </PillButton>
          </div>
        </div>
      </Sheet>
    );
  }

  if (!isFetching && me && cats.length === 0) {
    return (
      <Sheet open={open} onClose={close} title="Add expense">
        <div className="py-10 text-center">
          <div className="text-[40px]">🍔</div>
          <div className="mt-2 text-[15px] font-semibold text-ink">
            No categories yet
          </div>
          <div className="mt-1.5 text-[13px] font-medium text-ink/55 leading-snug">
            Add one — Food, Rent, Transport — and you can start logging.
          </div>
          <div className="mt-4">
            <PillButton fullWidth onClick={() => openSheet("categories")}>
              Manage categories
            </PillButton>
          </div>
        </div>
      </Sheet>
    );
  }

  // Genuinely still in flight.
  if (!activeTab || !activeCat || !me) {
    return (
      <Sheet open={open} onClose={close} title="Add expense">
        <div className="text-[14px] text-ink/55 text-center py-12">
          Loading…
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onClose={close} title="Add expense">
      {/* Amount + title display */}
      <div
        className="rounded-[24px] px-5 py-6 flex flex-col items-center"
        style={{ background: `${activeCat.color}15` }}
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

      {/* Quick fields */}
      <div className="flex flex-wrap gap-2 mt-3.5">
        <FieldChip
          icon={<span className="text-base">{activeTab.emoji}</span>}
          label={activeTab.name}
        />
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

      {/* Tab switcher */}
      <div className="grid grid-cols-3 gap-2 mt-3.5">
        {tabs.map((t) => {
          const active = tabId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTabId(t.id)}
              className="rounded-2xl py-2 px-2 flex items-center gap-2"
              style={{
                background: active ? t.color : `${t.color}18`,
                color: "#1A1714",
              }}
            >
              <span className="text-base">{t.emoji}</span>
              <span className="text-[12px] font-semibold">{t.name}</span>
            </button>
          );
        })}
      </div>

      {/* Category quick picker */}
      <div className="grid grid-cols-4 gap-2.5 mt-[18px]">
        {cats.slice(0, 8).map((c) => {
          const active = catId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCatId(c.id)}
              className="rounded-2xl py-3 px-1.5 flex flex-col items-center gap-1 transition-colors"
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

      {/* Numpad */}
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

      {/* Submit */}
      <div className="mt-4">
        <PillButton
          fullWidth
          onClick={submit}
          disabled={!canSubmit}
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
          {createTxn.isPending ? "Saving…" : "Save expense"}
        </PillButton>
        {createTxn.isError && (
          <div className="mt-2 text-[12px] font-semibold text-rust text-center">
            {createTxn.error.message}
          </div>
        )}
      </div>

      {/* Nested split-with sheet */}
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
                    <div className="text-[15px] font-semibold text-ink">
                      {m.name}
                    </div>
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
