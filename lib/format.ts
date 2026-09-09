export const fmt = (n: number, cur = "€") => `${cur}${n.toFixed(2)}`;

export const fmtShort = (n: number, cur = "€") =>
  `${cur}${Math.abs(n) >= 1000 ? (n / 1000).toFixed(1) + "k" : n.toFixed(0)}`;

export function dateLabel(iso: string): string {
  // Parse as a local date (not UTC) so "YYYY-MM-DD" doesn't shift a day in
  // negative-offset timezones.
  const [y, m, dd] = iso.split("-").map(Number);
  const d = new Date(y, (m ?? 1) - 1, dd ?? 1);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);

  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff > 1 && diff < 7) return `${diff}d ago`;
  // Older — or any future date — show an absolute label.
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
