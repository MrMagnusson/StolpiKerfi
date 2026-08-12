import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="input" {...props} />;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "placeholder"> {
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ options, placeholder = "— veldu —", ...rest }: SelectProps) {
  return (
    <select className="input" {...rest}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Toggle chip — used for the equipment multi-select on Unit/Project detail forms. */
export function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "4px 10px",
        border: `1px solid ${active ? "var(--color-accent)" : "var(--color-divider)"}`,
        background: active ? "var(--color-accent)" : "none",
        color: active ? "var(--color-bg)" : "var(--color-text)",
        cursor: "pointer",
        font: "inherit",
        fontSize: 12,
      }}
    >
      {label}
    </button>
  );
}

/** Pill filter row — Einingar status filters, Vettvangur "Í dag / Allar opnar / Lokið". */
export function FilterPill({ label, count, active, onClick }: { label: string; count?: number | string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 13px",
        border: `1px solid ${active ? "var(--color-accent)" : "var(--color-divider)"}`,
        background: active ? "var(--color-accent)" : "none",
        color: active ? "var(--color-bg)" : "var(--color-text)",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13,
        whiteSpace: "nowrap",
      }}
    >
      {label} {count !== undefined ? <span style={{ opacity: 0.6 }}>{count}</span> : null}
    </button>
  );
}
