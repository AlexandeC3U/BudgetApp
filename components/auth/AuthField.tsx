import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string };

export function AuthField({ label, ...props }: Props) {
  return (
    <label className="block">
      <span className="text-[12px] font-bold uppercase tracking-wider text-ink/50">
        {label}
      </span>
      <input
        {...props}
        className="mt-1.5 w-full bg-bone rounded-2xl px-4 py-3.5 text-[15px] text-ink placeholder:text-ink/35 outline-none focus:ring-2 focus:ring-coral/40 transition-shadow"
      />
    </label>
  );
}
