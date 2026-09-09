"use client";

import type { Tab } from "@/lib/types";
import { AvatarStack } from "./ui/Avatar";

type Props = {
  tab: Tab;
  onClick?: () => void;
  compact?: boolean;
};

export function TabCard({ tab, onClick, compact = false }: Props) {
  const pct = Math.min(100, (tab.spent / tab.budget) * 100);
  return (
    <button
      onClick={onClick}
      className="text-left text-ink rounded-bubble w-full flex flex-col gap-3.5 relative overflow-hidden"
      style={{
        background: tab.color,
        padding: compact ? "18px 20px" : "22px 22px",
        boxShadow: `0 8px 24px ${tab.color}30`,
      }}
    >
      {/* decorative blob */}
      <div
        className="absolute -right-8 -top-8 w-[120px] h-[120px] rounded-full"
        style={{ background: "rgba(255,255,255,0.18)" }}
      />
      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-2.5">
          <span className="text-[26px]">{tab.emoji}</span>
          <span className="text-[17px] font-bold tracking-tight">
            {tab.name}
          </span>
        </div>
        <AvatarStack members={tab.members} size={22} max={3} />
      </div>
      <div className="relative">
        <div className="font-serif text-[38px] leading-none tracking-tight">
          {tab.currency}
          {tab.spent.toFixed(0)}
          <span className="opacity-45 text-[22px]">
            {" "}
            / {tab.currency}
            {tab.budget}
          </span>
        </div>
        <div className="mt-2.5 h-1.5 rounded-full overflow-hidden bg-ink/10">
          <div
            className="h-full bg-ink rounded-full transition-[width] duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </button>
  );
}
