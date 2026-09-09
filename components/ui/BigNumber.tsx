type Props = {
  value: number;
  currency?: string;
  size?: number;
  color?: string;
};

export function BigNumber({
  value,
  currency = "€",
  size = 64,
  color = "#1A1714",
}: Props) {
  const [whole, frac = "00"] = Math.abs(value).toFixed(2).split(".");
  return (
    <div
      className="font-serif flex items-start"
      style={{
        fontSize: size,
        color,
        lineHeight: 0.95,
        letterSpacing: "-0.04em",
      }}
    >
      {value < 0 && <span>−</span>}
      <span
        style={{
          fontSize: size * 0.55,
          marginTop: size * 0.12,
          marginRight: 2,
        }}
      >
        {currency}
      </span>
      <span>{whole}</span>
      <span
        style={{
          fontSize: size * 0.4,
          marginTop: size * 0.18,
          opacity: 0.5,
        }}
      >
        .{frac}
      </span>
    </div>
  );
}
