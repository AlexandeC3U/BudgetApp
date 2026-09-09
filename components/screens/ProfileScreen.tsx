"use client";

import { Avatar } from "@/components/ui/Avatar";
import { BottomNav } from "@/components/BottomNav";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { useSheet } from "@/components/sheets/sheet-controller";
import type { SheetName } from "@/components/sheets/sheet-controller";
import { useMeSummary } from "@/lib/hooks/use-me-summary";

const HAS_CLERK_KEY = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

type Item = {
  icon: string;
  label: string;
  sub?: string;
  sheet?: SheetName;
};

export function ProfileScreen() {
  const { open } = useSheet();
  const { data: summary } = useMeSummary();
  const me = summary?.user;
  const counts = summary?.counts;

  const items: Item[] = [
    {
      icon: "🏷️",
      label: "Categories",
      sub: counts
        ? `${counts.categories} categor${counts.categories === 1 ? "y" : "ies"}`
        : undefined,
      sheet: "categories",
    },
    { icon: "🔔", label: "Notifications", sub: "Push, email" },
    { icon: "💱", label: "Currency", sub: "EUR (€)" },
    { icon: "🎨", label: "Appearance", sub: "Light · Coral" },
    { icon: "🔒", label: "Privacy & data" },
  ];

  return (
    <div className="pb-32">
      <div className="px-6 pt-5 pb-2">
        <div className="text-[13px] font-semibold uppercase tracking-wide text-ink/50">
          Profile
        </div>
      </div>

      <button
        onClick={() => open("editProfile")}
        className="w-full px-6 pt-2 pb-5 flex items-center gap-4 text-left"
        aria-label="Edit profile"
      >
        <Avatar
          member={{
            initials: me?.initials ?? "··",
            color: me?.color ?? "#FF6B4A",
          }}
          size={72}
        />
        <div className="flex-1">
          <div className="font-serif text-[32px] text-ink leading-none tracking-tight">
            {me?.name ?? "…"}
          </div>
          {counts && (
            <div className="text-[13px] font-medium text-ink/55 mt-1">
              {counts.tabs} active tab{counts.tabs === 1 ? "" : "s"} ·{" "}
              {counts.transactionsThisMonth} transaction
              {counts.transactionsThisMonth === 1 ? "" : "s"} this month
            </div>
          )}
        </div>
        <span className="rounded-full px-3 py-1.5 text-[12px] font-bold text-ink bg-bone shrink-0">
          Edit
        </span>
      </button>

      <div className="px-4 flex flex-col gap-2.5">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => item.sheet && open(item.sheet)}
            className="w-full bg-paper rounded-[22px] px-4 py-4 flex items-center gap-3.5 text-left"
            style={{ border: "0.5px solid rgba(26,23,20,0.06)" }}
          >
            <div
              className="flex items-center justify-center text-[20px] bg-bone"
              style={{ width: 40, height: 40, borderRadius: 12 }}
            >
              {item.icon}
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-semibold text-ink">
                {item.label}
              </div>
              {item.sub && (
                <div className="text-[12px] font-medium text-ink/50 mt-0.5">
                  {item.sub}
                </div>
              )}
            </div>
            <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
              <path
                d="M2 1l6 6-6 6"
                stroke="rgba(26,23,20,0.3)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ))}

        {HAS_CLERK_KEY && <SignOutButton />}
      </div>

      <BottomNav />
    </div>
  );
}
