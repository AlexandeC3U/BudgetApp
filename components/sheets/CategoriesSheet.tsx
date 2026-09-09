"use client";

import { useEffect, useState } from "react";

import { Sheet } from "./Sheet";
import { useSheet } from "./sheet-controller";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { PillButton } from "@/components/ui/PillButton";
import { useCategories } from "@/lib/hooks/use-categories";
import { useCreateCategory } from "@/lib/hooks/use-create-category";
import { useUpdateCategory } from "@/lib/hooks/use-update-category";
import { useDeleteCategory } from "@/lib/hooks/use-delete-category";

const PALETTE = [
  "#FF6B4A",
  "#FFB627",
  "#3DD68C",
  "#7C5CFF",
  "#2D7BF4",
  "#EC4899",
  "#0EA5E9",
  "#C2410C",
];
const EMOJIS = [
  "🍜",
  "🏠",
  "✈️",
  "🎉",
  "🛒",
  "☕",
  "🚌",
  "💊",
  "🌟",
  "🎁",
  "📚",
  "🏋️",
  "🎬",
  "💄",
  "🐾",
  "⛽",
];

type Editor =
  | { mode: "create" }
  | { mode: "edit"; id: string }
  | null;

export function CategoriesSheet() {
  const { state, close } = useSheet();
  const open = state.name === "categories";

  const { data: categories = [] } = useCategories();
  const createMut = useCreateCategory();
  const updateMut = useUpdateCategory();
  const deleteMut = useDeleteCategory();

  const [editor, setEditor] = useState<Editor>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🌟");
  const [color, setColor] = useState("#FF6B4A");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Reset everything when the sheet closes or returns to the list view.
  useEffect(() => {
    if (!open || !editor) {
      setName("");
      setEmoji("🌟");
      setColor("#FF6B4A");
      setConfirmingDelete(false);
      createMut.reset();
      updateMut.reset();
      deleteMut.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editor]);

  const startCreate = () => {
    setName("");
    setEmoji("🌟");
    setColor("#FF6B4A");
    setEditor({ mode: "create" });
  };

  const startEdit = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    setName(cat.name);
    setEmoji(cat.emoji);
    setColor(cat.color.toUpperCase());
    setEditor({ mode: "edit", id });
  };

  const busy = createMut.isPending || updateMut.isPending || deleteMut.isPending;
  const canSave = name.trim().length > 0 && !busy;
  const error = createMut.error ?? updateMut.error ?? deleteMut.error;

  const save = () => {
    if (!canSave || !editor) return;
    const payload = { name: name.trim(), emoji, color };
    if (editor.mode === "create") {
      createMut.mutate(payload, { onSuccess: () => setEditor(null) });
    } else {
      updateMut.mutate(
        { id: editor.id, input: payload },
        { onSuccess: () => setEditor(null) }
      );
    }
  };

  const remove = () => {
    if (!editor || editor.mode !== "edit") return;
    deleteMut.mutate(editor.id, { onSuccess: () => setEditor(null) });
  };

  return (
    <Sheet open={open} onClose={close} title="Categories">
      {!editor && (
        <>
          <div className="grid grid-cols-2 gap-2.5 mt-1">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => startEdit(c.id)}
                className="rounded-[20px] p-3.5 flex items-center gap-2.5 text-left"
                style={{ background: `${c.color}18` }}
              >
                <CategoryChip cat={c} size={40} />
                <div>
                  <div className="text-[14px] font-bold text-ink">{c.name}</div>
                  <div className="text-[11px] font-medium text-ink/55">
                    Tap to edit
                  </div>
                </div>
              </button>
            ))}
            {categories.length === 0 && (
              <div className="col-span-2 text-center text-[13px] text-ink/55 py-10">
                No categories yet — add your first one below.
              </div>
            )}
          </div>
          <div className="mt-4">
            <PillButton
              fullWidth
              onClick={startCreate}
              icon={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M7 2v10M2 7h10"
                    stroke="#FAF6EE"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </svg>
              }
            >
              New category
            </PillButton>
          </div>
        </>
      )}

      {editor && (
        <div>
          {/* Preview */}
          <div
            className="rounded-[24px] p-6 flex flex-col items-center gap-2.5"
            style={{ background: `${color}18` }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                background: color,
                fontSize: 38,
                boxShadow: `0 8px 24px ${color}50`,
              }}
            >
              {emoji}
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
              className="bg-transparent text-center outline-none w-full font-serif text-[28px] text-ink tracking-tight"
            />
          </div>

          <div className="mt-4 text-[12px] font-bold uppercase tracking-wider text-ink/50">
            Color
          </div>
          <div className="flex flex-wrap gap-2.5 mt-2">
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
            Icon
          </div>
          <div className="grid grid-cols-8 gap-1.5 mt-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className="rounded-xl text-[20px]"
                style={{
                  height: 40,
                  background: emoji === e ? "#1A1714" : "#FAF6EE",
                }}
              >
                {e}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-3 text-[12px] font-semibold text-rust text-center">
              {error.message}
            </div>
          )}

          <div className="mt-5 flex gap-2">
            <PillButton
              color="#FAF6EE"
              textColor="#1A1714"
              onClick={() => setEditor(null)}
              style={{ flex: 1 }}
            >
              Cancel
            </PillButton>
            <PillButton onClick={save} disabled={!canSave} style={{ flex: 2 }}>
              {createMut.isPending || updateMut.isPending
                ? "Saving…"
                : editor.mode === "create"
                  ? "Create category"
                  : "Save changes"}
            </PillButton>
          </div>

          {/* Delete — edit mode only */}
          {editor.mode === "edit" && (
            <div className="mt-5 pt-4 border-t border-ink/[0.08]">
              {!confirmingDelete ? (
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="w-full text-[14px] font-bold text-rust py-2"
                >
                  Delete category
                </button>
              ) : (
                <div>
                  <div className="text-[13px] text-ink/70 text-center mb-3">
                    Delete this category? Past transactions stay but become
                    uncategorized.
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
        </div>
      )}
    </Sheet>
  );
}
