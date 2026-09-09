import type { Category } from "@/lib/types";

type Props = {
  cat: Pick<Category, "color" | "emoji">;
  size?: number;
};

export function CategoryChip({ cat, size = 44 }: Props) {
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        background: cat.color,
        fontSize: size * 0.5,
        boxShadow: `0 4px 12px ${cat.color}40`,
      }}
    >
      <span style={{ filter: "saturate(1.1)" }}>{cat.emoji}</span>
    </div>
  );
}
