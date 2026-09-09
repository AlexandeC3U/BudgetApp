"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSheet } from "@/components/sheets/sheet-controller";

type IconName = "home" | "list" | "grid" | "user";

function Icon({ name, active }: { name: IconName; active: boolean }) {
  const c = active ? "#1A1714" : "rgba(26,23,20,0.42)";
  const s = 22;
  if (name === "home")
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path
          d="M4 11l8-7 8 7v9a2 2 0 0 1-2 2h-3v-6h-6v6H6a2 2 0 0 1-2-2v-9z"
          stroke={c}
          strokeWidth={1.8}
          strokeLinejoin="round"
          fill={active ? c : "none"}
          fillOpacity={active ? 0.12 : 0}
        />
      </svg>
    );
  if (name === "list")
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <circle cx={5} cy={6} r={1.5} fill={c} />
        <circle cx={5} cy={12} r={1.5} fill={c} />
        <circle cx={5} cy={18} r={1.5} fill={c} />
        <path
          d="M10 6h10M10 12h10M10 18h10"
          stroke={c}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </svg>
    );
  if (name === "grid")
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect
          x={3.5}
          y={3.5}
          width={7}
          height={7}
          rx={2}
          stroke={c}
          strokeWidth={1.8}
          fill={active ? c : "none"}
          fillOpacity={active ? 0.12 : 0}
        />
        <rect x={13.5} y={3.5} width={7} height={7} rx={2} stroke={c} strokeWidth={1.8} />
        <rect x={3.5} y={13.5} width={7} height={7} rx={2} stroke={c} strokeWidth={1.8} />
        <rect x={13.5} y={13.5} width={7} height={7} rx={2} stroke={c} strokeWidth={1.8} />
      </svg>
    );
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle
        cx={12}
        cy={8}
        r={3.5}
        stroke={c}
        strokeWidth={1.8}
        fill={active ? c : "none"}
        fillOpacity={active ? 0.12 : 0}
      />
      <path
        d="M5 20c1-4 4-6 7-6s6 2 7 6"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

type NavItem = {
  id: string;
  label: string;
  icon: IconName;
  href: string;
};

const ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: "home", href: "/" },
  { id: "activity", label: "Activity", icon: "list", href: "/activity" },
  { id: "tabs", label: "Tabs", icon: "grid", href: "/tabs" },
  { id: "profile", label: "You", icon: "user", href: "/profile" },
];

export function BottomNav({ onAdd }: { onAdd?: () => void } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { open } = useSheet();
  const handleAdd = onAdd ?? (() => open("addTxn"));

  const activeId =
    pathname === "/"
      ? "home"
      : pathname.startsWith("/activity")
        ? "activity"
        : pathname.startsWith("/tabs")
          ? "tabs"
          : pathname.startsWith("/profile")
            ? "profile"
            : "home";

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 px-4 pt-2 pb-6 pointer-events-none mx-auto max-w-md"
    >
      <div
        className="flex items-center justify-around h-16 px-2 rounded-[32px] pointer-events-auto"
        style={{
          background: "rgba(255,253,248,0.88)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "0.5px solid rgba(26,23,20,0.08)",
          boxShadow: "0 8px 24px rgba(26,23,20,0.08)",
        }}
      >
        {ITEMS.slice(0, 2).map((it) => (
          <NavButton
            key={it.id}
            item={it}
            active={activeId === it.id}
            onClick={() => router.push(it.href)}
          />
        ))}

        <button
          onClick={handleAdd}
          className="w-[52px] h-[52px] rounded-full bg-coral text-white flex items-center justify-center -translate-y-2"
          style={{ boxShadow: "0 6px 16px rgba(255,107,74,0.45)" }}
          aria-label="Add transaction"
        >
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="#fff"
              strokeWidth={2.6}
              strokeLinecap="round"
            />
          </svg>
        </button>

        {ITEMS.slice(2).map((it) => (
          <NavButton
            key={it.id}
            item={it}
            active={activeId === it.id}
            onClick={() => router.push(it.href)}
          />
        ))}
      </div>
    </div>
  );
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 px-3 py-2 min-w-[56px]"
    >
      <Icon name={item.icon} active={active} />
      <span
        className="text-[10px] font-semibold tracking-wide"
        style={{ color: active ? "#1A1714" : "rgba(26,23,20,0.42)" }}
      >
        {item.label}
      </span>
    </button>
  );
}
