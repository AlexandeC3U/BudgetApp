"use client";

import { useEffect, useState } from "react";

import { Sheet } from "./Sheet";
import { useSheet } from "./sheet-controller";
import { PillButton } from "@/components/ui/PillButton";
import { useCreateTab } from "@/lib/hooks/use-create-tab";

const PALETTE = ["#FF6B4A", "#FFB627", "#3DD68C", "#7C5CFF", "#2D7BF4", "#EC4899"];
const EMOJIS = ["🚀", "🏡", "🌴", "🍻", "💼", "🎓", "🎂", "🏔️", "🐶", "💍"];

export function NewTabSheet() {
  const { state, close } = useSheet();
  const open = state.name === "newTab";

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🚀");
  const [color, setColor] = useState("#7C5CFF");
  const [budget, setBudget] = useState(500);

  const createMut = useCreateTab();

  // Reset the form (and any stale error) whenever the sheet is reopened.
  useEffect(() => {
    if (open) {
      setName("");
      setEmoji("🚀");
      setColor("#7C5CFF");
      setBudget(500);
      createMut.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const canCreate = name.trim().length > 0 && !createMut.isPending;

  const create = () => {
    if (!canCreate) return;
    createMut.mutate(
      {
        name: name.trim(),
        emoji,
        color,
        budget: Number.isFinite(budget) ? Math.max(0, budget) : 0,
        currency: "EUR",
      },
      { onSuccess: () => close() }
    );
  };

  return (
    <Sheet open={open} onClose={close} title="New tab">
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
              boxShadow: color === c ? `0 0 0 3px #FFFDF8, 0 0 0 5px ${c}` : "none",
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

      {createMut.isError && (
        <div className="mt-3 text-[12px] font-semibold text-rust text-center">
          {createMut.error.message}
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
        <PillButton onClick={create} disabled={!canCreate} style={{ flex: 2 }}>
          {createMut.isPending ? "Creating…" : "Create tab"}
        </PillButton>
      </div>
    </Sheet>
  );
}
