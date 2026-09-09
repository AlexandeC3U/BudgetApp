"use client";

import { useRouter } from "next/navigation";

import { TabCard } from "@/components/TabCard";
import { BottomNav } from "@/components/BottomNav";
import { useSheet } from "@/components/sheets/sheet-controller";
import { useTabs } from "@/lib/hooks/use-tabs";

export function TabsListScreen() {
  const router = useRouter();
  const { open } = useSheet();
  const { data: tabs = [] } = useTabs();

  return (
    <div className="pb-32">
      <div className="px-6 pt-5 pb-2">
        <div className="text-[13px] font-semibold uppercase tracking-wide text-ink/50">
          Your tabs
        </div>
        <div
          className="font-serif text-[44px] text-ink leading-[1.05] mt-1.5"
          style={{ letterSpacing: "-0.03em" }}
        >
          Spaces &amp; <em className="italic text-amber">groups</em>
        </div>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3">
        {tabs.map((t) => (
          <TabCard
            key={t.id}
            tab={t}
            onClick={() => router.push(`/tabs/${t.id}`)}
          />
        ))}
        <button
          onClick={() => open("newTab")}
          className="w-full text-ink rounded-[28px] px-5 py-7 flex flex-col items-center gap-2"
          style={{ border: "2px dashed rgba(26,23,20,0.18)" }}
        >
          <div className="w-11 h-11 rounded-full bg-ink text-bone flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="#FAF6EE"
                strokeWidth={2.4}
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="text-[15px] font-bold">Create new tab</div>
          <div className="text-[12px] font-medium text-ink/50">
            Trip, household, project, anything
          </div>
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
