"use client";

import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
};

export function FieldChip({ icon, label, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full bg-bone py-2 pl-2 pr-3.5"
    >
      {typeof icon === "string" ? <span className="text-base">{icon}</span> : icon}
      <span className="text-[13px] font-semibold text-ink">{label}</span>
    </button>
  );
}
