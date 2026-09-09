"use client";

import { useEffect, useState } from "react";

import { Sheet } from "./Sheet";
import { useSheet } from "./sheet-controller";
import { Avatar } from "@/components/ui/Avatar";
import { PillButton } from "@/components/ui/PillButton";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useUpdateMe } from "@/lib/hooks/use-update-me";

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

/** Mirror of the server's initials derivation for live preview. */
function deriveInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return initials.slice(0, 4) || "·";
}

export function EditProfileSheet() {
  const { state, close } = useSheet();
  const open = state.name === "editProfile";

  const { data: me } = useCurrentUser();
  const updateMut = useUpdateMe();

  const [name, setName] = useState("");
  const [color, setColor] = useState("#FF6B4A");

  // Hydrate from the current user each time the sheet opens.
  useEffect(() => {
    if (open && me) {
      setName(me.name);
      setColor(me.color.toUpperCase());
      updateMut.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, me?.id]);

  const canSave = name.trim().length > 0 && !updateMut.isPending;

  const save = () => {
    if (!canSave) return;
    updateMut.mutate(
      { name: name.trim(), color },
      { onSuccess: () => close() }
    );
  };

  return (
    <Sheet open={open} onClose={close} title="Edit profile">
      {!me ? (
        <div className="text-[14px] text-ink/55 text-center py-12">Loading…</div>
      ) : (
        <>
          <div
            className="rounded-[28px] px-6 py-7 flex flex-col items-center gap-4"
            style={{ background: `${color}18` }}
          >
            <Avatar
              member={{ initials: deriveInitials(name), color }}
              size={84}
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="bg-transparent text-center outline-none w-full font-serif text-[32px] text-ink tracking-tight"
            />
          </div>

          <div className="mt-3 text-[12px] font-medium text-ink/45 text-center">
            {me.email}
          </div>

          <div className="mt-4 text-[12px] font-bold uppercase tracking-wider text-ink/50">
            Avatar color
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
        </>
      )}
    </Sheet>
  );
}
