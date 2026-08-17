import type { ReactNode } from "react";
import { Btn, Input } from "@stolpi/ui";

export interface PageHeaderProps {
  kicker: string;
  title: string;
  note?: string;
  search?: { value: string; onChange: (v: string) => void };
  primary?: { label: string; onClick: () => void };
  extra?: ReactNode;
}

/** Sticky page header — kicker/H1/note left, search + primary action right. README.md "Desktop app — screens" shell. */
export function PageHeader({ kicker, title, note, search, primary, extra }: PageHeaderProps) {
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--color-bg)", borderBottom: "1px solid var(--color-divider)", padding: "20px 28px 16px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
      <div>
        <div style={{ fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>{kicker}</div>
        <h1 style={{ fontSize: 32, margin: "3px 0 0", lineHeight: 1, letterSpacing: ".01em" }}>{title}</h1>
        {note ? <div style={{ fontSize: 12.5, opacity: 0.6, marginTop: 5 }}>{note}</div> : null}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {extra}
        {search ? (
          <Input style={{ width: 230 }} placeholder="Leita…" value={search.value} onChange={(e) => search.onChange(e.target.value)} />
        ) : null}
        {primary ? (
          <Btn variant="primary" onClick={primary.onClick}>
            + {primary.label}
          </Btn>
        ) : null}
      </div>
    </header>
  );
}
