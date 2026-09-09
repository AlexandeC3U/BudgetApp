import type { ReactNode } from "react";

/**
 * Shared layout chrome for the auth screens — keeps the bold/playful look
 * (cream field, big serif headline, warm paper card) consistent with the app.
 */
export function AuthShell({
  eyebrow = "Budget",
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col justify-center px-6 py-12 bg-warm-radial">
      <div className="mb-7">
        <div className="text-[13px] font-semibold uppercase tracking-wide text-ink/50">
          {eyebrow}
        </div>
        <h1
          className="font-serif text-[44px] leading-[1.05] text-ink mt-1.5"
          style={{ letterSpacing: "-0.03em" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-[14px] text-ink/55 mt-2.5 leading-snug">
            {subtitle}
          </p>
        )}
      </div>

      <div className="bg-paper rounded-hero border-[0.5px] border-ink/[0.06] p-6 shadow-[0_12px_40px_rgba(26,23,20,0.06)]">
        {children}
      </div>
    </div>
  );
}
