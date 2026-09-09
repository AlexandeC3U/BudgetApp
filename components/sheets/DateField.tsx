"use client";

import { useEffect, useMemo, useState } from "react";

import { FieldChip } from "./FieldChip";
import { PillButton } from "@/components/ui/PillButton";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
/** Local-time YYYY-MM-DD (avoids the UTC shift `toISOString()` can cause). */
function isoOf(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function todayIso() {
  return isoOf(new Date());
}
function parseIso(iso: string) {
  const [y, m, d] = (iso || "").split("-").map(Number);
  // Fall back to today for empty/invalid input (e.g. a not-yet-hydrated edit
  // form) so the calendar never renders an Invalid Date.
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

type Props = {
  value: string; // YYYY-MM-DD
  onChange: (iso: string) => void;
};

/**
 * Styled date chip + custom calendar (cream/coral). Presented as a bottom sheet
 * so it always fits the mobile layout, matching the app's other nested sheets.
 */
export function DateField({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  // The month currently shown in the grid: { year, month(0-based) }.
  const [view, setView] = useState(() => {
    const d = parseIso(value);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // Re-center on the selected date each time the sheet opens.
  useEffect(() => {
    if (open) {
      const d = parseIso(value);
      setView({ year: d.getFullYear(), month: d.getMonth() });
    }
  }, [open, value]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const label = useMemo(() => {
    if (value === todayIso()) return "Today";
    return parseIso(value).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  }, [value]);

  // A 42-cell (6 week) grid starting on the Monday on/before the 1st.
  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const startOffset = (first.getDay() + 6) % 7; // 0 = Monday
    const gridStart = new Date(view.year, view.month, 1 - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [view]);

  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString(
    "en-GB",
    { month: "long", year: "numeric" }
  );

  const shiftMonth = (delta: number) =>
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const pick = (d: Date) => {
    onChange(isoOf(d));
    setOpen(false);
  };

  const today = todayIso();

  return (
    <div className="inline-flex">
      <FieldChip icon="📅" label={label} onClick={() => setOpen(true)} />

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end mx-auto max-w-md"
          style={{ background: "rgba(26,23,20,0.4)" }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-paper rounded-t-[32px] px-6 pt-6 pb-8 shadow-sheet"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="font-serif text-[26px] text-ink tracking-tight">
                {monthLabel}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => shiftMonth(-1)}
                  aria-label="Previous month"
                  className="w-9 h-9 rounded-full bg-bone flex items-center justify-center"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M10 3l-5 5 5 5"
                      stroke="#1A1714"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => shiftMonth(1)}
                  aria-label="Next month"
                  className="w-9 h-9 rounded-full bg-bone flex items-center justify-center"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M6 3l5 5-5 5"
                      stroke="#1A1714"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((w) => (
                <div
                  key={w}
                  className="text-center text-[11px] font-bold uppercase tracking-wider text-ink/40 py-1"
                >
                  {w}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d) => {
                const iso = isoOf(d);
                const inMonth = d.getMonth() === view.month;
                const selected = iso === value;
                const isToday = iso === today;
                return (
                  <button
                    key={iso}
                    onClick={() => pick(d)}
                    className="h-10 rounded-full flex items-center justify-center text-[14px] font-semibold transition-colors"
                    style={{
                      background: selected ? "#FF6B4A" : "transparent",
                      color: selected
                        ? "#FFFDF8"
                        : inMonth
                          ? "#1A1714"
                          : "rgba(26,23,20,0.28)",
                      boxShadow:
                        isToday && !selected
                          ? "inset 0 0 0 1.5px rgba(255,107,74,0.5)"
                          : "none",
                    }}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <PillButton fullWidth onClick={() => pick(new Date())}>
                Today
              </PillButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
