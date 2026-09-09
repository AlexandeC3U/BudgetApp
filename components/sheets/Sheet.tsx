"use client";

import type { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export function Sheet({ open, onClose, title, children }: Props) {
  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 transition-opacity duration-[250ms]"
        style={{
          background: "rgba(26,23,20,0.4)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />
      <div
        className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md rounded-t-[32px] flex flex-col"
        style={{
          background: "#FFFDF8",
          maxHeight: "92%",
          transform: open ? "translateY(0)" : "translateY(100%)",
          // `visibility` keeps a closed sheet from painting its upward shadow
          // over the bottom of the screen. It interpolates discretely — held at
          // `visible` for the whole duration — so the close animation still
          // plays and only then does the sheet go hidden.
          visibility: open ? "visible" : "hidden",
          transition:
            "transform 0.32s cubic-bezier(0.32, 0.72, 0.3, 1), visibility 0.32s",
          boxShadow: "0 -12px 40px rgba(26,23,20,0.18)",
        }}
      >
        <div className="w-9 h-[5px] rounded-full bg-ink/[0.18] mx-auto mt-2.5" />
        {title && (
          <div className="px-6 pt-3.5 pb-2 font-serif text-[30px] tracking-tight text-ink">
            {title}
          </div>
        )}
        <div className="flex-1 overflow-auto px-6 pb-8 pt-2">{children}</div>
      </div>
    </>
  );
}
