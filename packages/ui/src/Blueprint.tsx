import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

const CORNERS = ["tl", "tr", "bl", "br"] as const;

function Corners() {
  return (
    <>
      {CORNERS.map((c) => (
        <i key={c} className={`corner ${c}`} />
      ))}
    </>
  );
}

/** A div with the four `+` registration marks — the wireframe "instrument" frame used for cards, KPI tiles, unit/job cards. */
export function BlueprintBox({ children, className = "", ...rest }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  return (
    <div className={`blueprint ${className}`} {...rest}>
      <Corners />
      {children}
    </div>
  );
}

/** Same frame, but as a clickable button — used for unit/job/deal cards that open a detail page. */
export function BlueprintButton({ children, className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { children?: ReactNode }) {
  return (
    <button
      type="button"
      className={`blueprint ${className}`}
      style={{ padding: 0, background: "none", border: "1px solid var(--color-divider)", cursor: "pointer", textAlign: "left", font: "inherit", ...(rest.style as object) }}
      {...rest}
    >
      <Corners />
      {children}
    </button>
  );
}
