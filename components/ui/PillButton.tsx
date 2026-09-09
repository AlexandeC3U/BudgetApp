"use client";

import type { CSSProperties, ReactNode } from "react";

type Props = {
  children: ReactNode;
  onClick?: () => void;
  color?: string;
  textColor?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
  style?: CSSProperties;
  disabled?: boolean;
};

export function PillButton({
  children,
  onClick,
  color = "#1A1714",
  textColor = "#FAF6EE",
  icon,
  fullWidth = false,
  style,
  disabled,
}: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-[15px] font-semibold tracking-tight disabled:opacity-50"
      style={{
        background: color,
        color: textColor,
        width: fullWidth ? "100%" : undefined,
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
}
