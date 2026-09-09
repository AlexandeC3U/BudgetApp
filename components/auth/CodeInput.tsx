"use client";

import { useId, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  label?: string;
};

/**
 * Segmented one-time-code input. A single real <input> sits transparently over
 * the boxes so native paste, mobile numeric keyboard, and iOS SMS autofill all
 * keep working — the boxes are purely a visual presentation of its value.
 */
export function CodeInput({
  value,
  onChange,
  onComplete,
  length = 6,
  autoFocus,
  disabled,
  label,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const labelId = useId();

  const handleChange = (raw: string) => {
    const next = raw.replace(/\D/g, "").slice(0, length);
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  return (
    <div>
      {label && (
        <span
          id={labelId}
          className="text-[12px] font-bold uppercase tracking-wider text-ink/50"
        >
          {label}
        </span>
      )}
      <div
        className={label ? "relative mt-1.5" : "relative"}
        onClick={() => inputRef.current?.focus()}
      >
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={length}
          autoFocus={autoFocus}
          disabled={disabled}
          aria-label={label ?? "Verification code"}
          aria-labelledby={label ? labelId : undefined}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="flex gap-2 justify-between" aria-hidden="true">
          {Array.from({ length }).map((_, i) => {
            const char = value[i] ?? "";
            const isActive =
              focused &&
              (i === value.length ||
                (value.length === length && i === length - 1));
            return (
              <div
                key={i}
                className="flex-1 h-14 rounded-2xl flex items-center justify-center font-serif text-[26px] text-ink transition-shadow"
                style={{
                  background: char ? "#FFFDF8" : "#FAF6EE",
                  boxShadow: isActive
                    ? "0 0 0 2px rgba(255,107,74,0.55)"
                    : "inset 0 0 0 0.5px rgba(26,23,20,0.08)",
                }}
              >
                {char || (isActive ? (
                  <span className="w-[2px] h-6 bg-coral/70 rounded-full animate-pulse" />
                ) : null)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
