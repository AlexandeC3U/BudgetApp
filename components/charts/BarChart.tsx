export type Bar = { label: string; value: number; highlight?: boolean };

type Props = {
  data: Bar[];
  height?: number;
  color?: string;
};

export function BarChart({ data, height = 90, color = "#1A1714" }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center gap-1.5"
        >
          <div
            className="w-full rounded-md transition-[height] duration-500"
            style={{
              height: `${(d.value / max) * (height - 22)}px`,
              minHeight: 4,
              background: d.highlight ? "#FF6B4A" : color,
              opacity: d.highlight ? 1 : 0.18,
            }}
          />
          <div className="text-[10px] font-semibold uppercase tracking-wider text-ink/50">
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}
