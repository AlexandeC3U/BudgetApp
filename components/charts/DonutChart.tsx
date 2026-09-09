type Slice = { value: number; color: string };

type Props = {
  data: Slice[];
  size?: number;
  thickness?: number;
  total?: number;
};

export function DonutChart({
  data,
  size = 200,
  thickness = 28,
  total,
}: Props) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const sum = total || data.reduce((s, d) => s + d.value, 0);
  let offset = 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(26,23,20,0.06)"
        strokeWidth={thickness}
      />
      {data.map((d, i) => {
        const len = (d.value / sum) * circumference;
        const seg = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={d.color}
            strokeWidth={thickness}
            strokeDasharray={`${len - 4} ${circumference - len + 4}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.5s ease" }}
          />
        );
        offset += len;
        return seg;
      })}
    </svg>
  );
}
