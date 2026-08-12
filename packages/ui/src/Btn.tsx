import type { ButtonHTMLAttributes, ReactNode } from "react";
import { BlueprintButton } from "./Blueprint.js";

type Variant = "primary" | "secondary" | "ghost";

export interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Adds the four `+` registration marks — used for primary actions in page headers ("+ Ný eining" etc.). */
  blueprint?: boolean;
  children?: ReactNode;
}

/** btn / btn-primary / btn-secondary / btn-ghost, optionally with blueprint registration marks. */
export function Btn({ variant = "secondary", blueprint = false, className = "", children, style, ...rest }: BtnProps) {
  const cls = `btn btn-${variant} ${className}`.trim();
  if (blueprint) {
    return (
      <BlueprintButton className={cls} style={{ padding: "var(--space-2) calc(var(--space-3) * 1.2)", ...style }} {...rest}>
        {children}
      </BlueprintButton>
    );
  }
  return (
    <button type="button" className={cls} style={style} {...rest}>
      {children}
    </button>
  );
}
