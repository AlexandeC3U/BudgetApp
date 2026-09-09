"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { useTabs } from "@/lib/hooks/use-tabs";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useMeSummary } from "@/lib/hooks/use-me-summary";
import { spendByCategory } from "@/lib/compute";
import { BigNumber } from "@/components/ui/BigNumber";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarChart, type Bar } from "@/components/charts/BarChart";
import { TabCard } from "@/components/TabCard";
import { TxnRow } from "@/components/TxnRow";
import { BottomNav } from "@/components/BottomNav";
import { useSheet } from "@/components/sheets/sheet-controller";

const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
/** Local-time YYYY-MM-DD to compare against transaction `date` strings. */
function localIso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parseLocalDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
/** Monday that starts the week containing `ref`. */
function startOfWeek(ref: Date) {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export function DashboardScreen() {
  const router = useRouter();
  const { open } = useSheet();
  const { data: tabs = [] } = useTabs();
  // Windowed list: recent + this month, not the full account history.
  const { data: txns = [] } = useTransactions();
  const { data: me } = useCurrentUser();
  const { data: summary } = useMeSummary();

  const tabsById = useMemo(() => new Map(tabs.map((t) => [t.id, t])), [tabs]);

  const now = useMemo(() => new Date(), []);

  // Transactions in the current calendar month — drives the "spent this month"
  // hero, the budget donut, and the category breakdown.
  const monthTxns = useMemo(() => {
    return txns.filter((t) => {
      const d = parseLocalDate(t.date);
      return (
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      );
    });
  }, [txns, now]);

  // All-time owed/owe is aggregated server-side so the dashboard doesn't need
  // the full history; falls back to zeros until the summary loads.
  const balance = summary?.balance ?? { owed: 0, owe: 0, net: 0 };
  const totalSpent = useMemo(
    () => monthTxns.reduce((s, t) => s + t.amount, 0),
    [monthTxns]
  );
  const totalBudget = useMemo(() => tabs.reduce((s, t) => s + t.budget, 0), [tabs]);
  const recentTxns = useMemo(() => txns.slice(0, 4), [txns]);
  const catData = useMemo(() => spendByCategory(monthTxns).slice(0, 6), [monthTxns]);

  // Real spend for the current week (Mon–Sun), one bar per day, today highlighted.
  const weekly = useMemo<Bar[]>(() => {
    const weekStart = startOfWeek(now);
    const todayIso = localIso(now);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      const iso = localIso(day);
      const value = txns
        .filter((t) => t.date === iso)
        .reduce((s, t) => s + t.amount, 0);
      return { label: WEEK_LABELS[i], value, highlight: iso === todayIso };
    });
  }, [txns, now]);
  const weekTotal = useMemo(
    () => weekly.reduce((s, b) => s + b.value, 0),
    [weekly]
  );

  const greetingName = me?.name?.split(" ")[0] ?? "You";
  const monthLabel = now.toLocaleDateString("en-GB", { month: "long" });
  const weekdayLabel = now.toLocaleDateString("en-GB", { weekday: "long" });

  return (
    <div className="pb-32">
      {/* Greeting */}
      <div className="px-6 pt-5 pb-3.5 flex justify-between items-center">
        <div>
          <div className="text-[13px] font-semibold uppercase tracking-wide text-ink/50">
            {monthLabel} · {weekdayLabel}
          </div>
          <div className="font-serif text-[38px] leading-[1.05] tracking-tight text-ink mt-1">
            Hey, <em className="text-coral italic">{greetingName}</em>
          </div>
        </div>
        <div className="w-11 h-11 rounded-full bg-ink flex items-center justify-center">
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4"
              stroke="#FAF6EE"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <circle cx={12} cy={12} r={3.5} stroke="#FAF6EE" strokeWidth={2} />
          </svg>
        </div>
      </div>

      {/* Hero balance card */}
      <div className="mx-4 bg-ink text-bone rounded-hero px-5 py-6 relative overflow-hidden">
        <div
          className="absolute -right-16 -top-16 w-[180px] h-[180px] rounded-full"
          style={{ background: "#FF6B4A" }}
        />
        <div className="relative flex justify-between items-start">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wide text-bone/55">
              Spent this month
            </div>
            <div className="mt-1.5">
              <BigNumber value={totalSpent} size={56} color="#FAF6EE" />
            </div>
            <div className="text-[13px] font-medium text-bone/60 mt-2">
              of €{totalBudget.toFixed(0)} budget
            </div>
          </div>
          <div className="w-[92px] h-[92px] mt-1">
            <DonutChart
              data={catData.map((c) => ({ value: c.total, color: c.color }))}
              size={92}
              thickness={14}
              total={totalBudget}
            />
          </div>
        </div>

        {/* progress segments */}
        <div className="flex gap-1 mt-[18px] relative">
          {catData.map((c) => (
            <div
              key={c.cat}
              className="h-2 rounded"
              style={{ flex: c.total, background: c.color }}
            />
          ))}
          <div
            className="h-2 rounded"
            style={{
              flex: Math.max(0, totalBudget - totalSpent),
              background: "rgba(250,246,238,0.12)",
            }}
          />
        </div>
        <div className="flex flex-wrap gap-3 mt-3.5">
          {catData.slice(0, 4).map((c) => (
            <div key={c.cat} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-sm"
                style={{ background: c.color }}
              />
              <span className="text-[12px] font-medium text-bone/70">
                {c.name}{" "}
                <span className="text-bone font-semibold">
                  €{c.total.toFixed(0)}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Balance summary strip */}
      <div className="mx-4 mt-3.5 flex gap-2.5">
        <div className="flex-1 bg-paper rounded-[22px] px-4 py-3.5 border-[0.5px] border-ink/[0.06]">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink/50">
            Owed to you
          </div>
          <div className="font-serif text-[30px] text-success tracking-tight leading-none mt-1.5">
            +€{balance.owed.toFixed(0)}
          </div>
        </div>
        <div className="flex-1 bg-paper rounded-[22px] px-4 py-3.5 border-[0.5px] border-ink/[0.06]">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink/50">
            You owe
          </div>
          <div className="font-serif text-[30px] text-rust tracking-tight leading-none mt-1.5">
            −€{balance.owe.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Tabs section */}
      <div className="flex justify-between items-baseline px-6 pt-6 pb-3">
        <div className="font-serif text-[26px] tracking-tight">Your tabs</div>
        <button
          onClick={() => open("newTab")}
          className="text-[13px] font-semibold text-coral"
        >
          + New tab
        </button>
      </div>
      <div className="px-4 flex flex-col gap-2.5">
        {tabs.map((t) => (
          <TabCard
            key={t.id}
            tab={t}
            onClick={() => router.push(`/tabs/${t.id}`)}
          />
        ))}
      </div>

      {/* This week */}
      <div className="mx-4 mt-6 bg-paper rounded-[28px] px-5 py-5 border-[0.5px] border-ink/[0.06]">
        <div className="flex items-center justify-between">
          <div className="font-serif text-[22px] tracking-tight">This week</div>
          <div className="text-[13px] font-semibold text-ink/50">
            €{weekTotal.toFixed(0)}
          </div>
        </div>
        <div className="mt-3.5">
          <BarChart data={weekly} />
        </div>
      </div>

      {/* Recent activity */}
      <div className="flex justify-between items-baseline px-6 pt-6 pb-2">
        <div className="font-serif text-[26px] tracking-tight">Recent</div>
        <button
          className="text-[13px] font-semibold text-coral"
          onClick={() => router.push("/activity")}
        >
          See all
        </button>
      </div>
      <div className="px-6">
        {recentTxns.map((t) => {
          const tab = tabsById.get(t.tab);
          if (!tab) return null;
          return (
            <TxnRow
              key={t.id}
              txn={t}
              tab={tab}
              currentUserId={me?.id}
              onClick={() => open("editTxn", { txnId: t.id })}
            />
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
