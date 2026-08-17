import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

/** A div with the soft-elevated ".blueprint" surface — used for cards, KPI tiles, unit/job cards. */
export function BlueprintBox({ children, className = "", ...rest }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  return (
    <div className={`blueprint ${className}`} {...rest}>
      {children}
    </div>
  );
}

/** Same surface, but as a clickable button — used for unit/job/deal cards that open a detail page. */
export function BlueprintButton({ children, className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { children?: ReactNode }) {
  return (
    <button
      type="button"
      className={`blueprint ${className}`}
      style={{ padding: 0, background: "none", border: 0, cursor: "pointer", textAlign: "left", font: "inherit", ...(rest.style as object) }}
      {...rest}
    >
      {children}
    </button>
  );
}
