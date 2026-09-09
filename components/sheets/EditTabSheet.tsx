"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Sheet } from "./Sheet";
import { useSheet } from "./sheet-controller";
import { PillButton } from "@/components/ui/PillButton";
import { useTab } from "@/lib/hooks/use-tab";
import { useTabs } from "@/lib/hooks/use-tabs";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useUpdateTab } from "@/lib/hooks/use-update-tab";
import { useDeleteTab } from "@/lib/hooks/use-delete-tab";

const PALETTE = ["#FF6B4A", "#FFB627", "#3DD68C", "#7C5CFF", "#2D7BF4", "#EC4899"];
const EMOJIS = ["🚀", "🏡", "🌴", "🍻", "💼", "🎓", "🎂", "🏔️", "🐶", "💍"];

export function EditTabSheet() {
  const { state, close } = useSheet();
  const router = useRouter();
  const open = state.name === "editTab";

  const { data: tabs = [] } = useTabs();
  const tabId = state.params?.tabId ?? tabs[0]?.id;
  const { data: tab } = useTab(open ? tabId : undefined);
  const { data: me } = useCurrentUser();

  const updateMut = useUpdateTab(tabId ?? "");
  const deleteMut = useDeleteTab();

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🚀");
  const [color, setColor] = useState("#7C5CFF");
  const [budget, setBudget] = useState(0);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Hydrate the form from the tab once it loads / the sheet (re)opens.
  useEffect(() => {
    if (open && tab) {
      setName(tab.name);
      setEmoji(tab.emoji);
      // tab.color comes back uppercased from the DB; the palette is uppercase too.
      setColor(tab.color);
      setBudget(tab.budget);
      setConfirmingDelete(false);
      updateMut.reset();
      deleteMut.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab?.id]);

  const isOwner =
    tab?.members.find((m) => m.id === me?.id)?.role === "owner";
  const canSave = !!tab && name.trim().length > 0 && !updateMut.isPending;

  const save = () => {
    if (!canSave) return;
    updateMut.mutate(
      {
        name: name.trim(),
        emoji,
        color,
        budget: Number.isFinite(budget) ? Math.max(0, budget) : 0,
      },
      { onSuccess: () => close() }
    );
  };

  const remove = () => {
    if (!tabId) return;
    deleteMut.mutate(tabId, {
      onSuccess: () => {
        close();
        router.push("/tabs");
      },
    });
  };

  return (
    <Sheet open={open} onClose={close} title="Edit tab">
      {!tab ? (
        <div className="text-[14px] text-ink/55 text-center py-12">Loading…</div>
      ) : (
        <>
          <div
            className="rounded-[28px] px-6 py-7 flex flex-col items-center gap-3 relative overflow-hidden"
            style={{ background: `${color}18` }}
          >
            <div
              className="absolute -right-10 -top-10 rounded-full"
              style={{ width: 140, height: 140, background: `${color}30` }}
            />
            <div className="text-[56px] relative">{emoji}</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name your tab"
              className="bg-transparent text-center outline-none w-full font-serif text-[32px] text-ink tracking-tight relative"
            />
          </div>

          <div className="mt-4 text-[12px] font-bold uppercase tracking-wider text-ink/50">
            Icon
          </div>
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 no-scrollbar">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className="rounded-2xl shrink-0 text-[22px]"
                style={{
                  width: 48,
                  height: 48,
                  background: emoji === e ? "#1A1714" : "#FAF6EE",
                }}
              >
                {e}
              </button>
            ))}
          </div>

          <div className="mt-4 text-[12px] font-bold uppercase tracking-wider text-ink/50">
            Color
          </div>
          <div className="flex gap-2.5 mt-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="rounded-full"
                style={{
                  width: 38,
                  height: 38,
                  background: c,
                  boxShadow:
                    color.toUpperCase() === c
                      ? `0 0 0 3px #FFFDF8, 0 0 0 5px ${c}`
                      : "none",
                }}
              />
            ))}
          </div>

          <div className="mt-4 text-[12px] font-bold uppercase tracking-wider text-ink/50">
            Monthly budget
          </div>
          <div className="mt-2 bg-bone rounded-2xl px-4 py-3 flex items-center gap-2">
            <span className="font-serif text-[28px] text-ink/50">€</span>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="flex-1 bg-transparent outline-none font-serif text-[28px] text-ink tracking-tight"
            />
          </div>

          {updateMut.isError && (
            <div className="mt-3 text-[12px] font-semibold text-rust text-center">
              {updateMut.error.message}
            </div>
          )}

          <div className="mt-5 flex gap-2">
            <PillButton
              color="#FAF6EE"
              textColor="#1A1714"
              onClick={close}
              style={{ flex: 1 }}
            >
              Cancel
            </PillButton>
            <PillButton onClick={save} disabled={!canSave} style={{ flex: 2 }}>
              {updateMut.isPending ? "Saving…" : "Save changes"}
            </PillButton>
          </div>

          {/* Danger zone — owner only */}
          {isOwner && (
            <div className="mt-6 pt-5 border-t border-ink/[0.08]">
              {deleteMut.isError && (
                <div className="mb-3 text-[12px] font-semibold text-rust text-center">
                  {deleteMut.error.message}
                </div>
              )}
              {!confirmingDelete ? (
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="w-full text-[14px] font-bold text-rust py-2"
                >
                  Delete tab
                </button>
              ) : (
                <div>
                  <div className="text-[13px] text-ink/70 text-center mb-3">
                    Delete <span className="font-bold">{tab.name}</span> and all
                    its transactions? This can&apos;t be undone.
                  </div>
                  <div className="flex gap-2">
                    <PillButton
                      color="#FAF6EE"
                      textColor="#1A1714"
                      onClick={() => setConfirmingDelete(false)}
                      style={{ flex: 1 }}
                    >
                      Keep
                    </PillButton>
                    <PillButton
                      color="#C2410C"
                      onClick={remove}
                      disabled={deleteMut.isPending}
                      style={{ flex: 1 }}
                    >
                      {deleteMut.isPending ? "Deleting…" : "Delete"}
                    </PillButton>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Sheet>
  );
}
