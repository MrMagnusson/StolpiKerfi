import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

export interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children?: ReactNode;
}

/** btn / btn-primary / btn-secondary / btn-ghost. */
export function Btn({ variant = "secondary", className = "", children, style, ...rest }: BtnProps) {
  const cls = `btn btn-${variant} ${className}`.trim();
  return (
    <button type="button" className={cls} style={style} {...rest}>
      {children}
    </button>
  );
}
