import type { ReactNode } from "react";
import { BlueprintBox } from "./Blueprint.js";

export interface Column<T> {
  header: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
}

/** Blueprint-framed table — used for Verkefni, Samningar, Notendur, Tengiliðir, Verðskrá, Reikningagerð. */
export function DataTable<T extends { id: string }>({ columns, rows, emptyText }: { columns: Column<T>[]; rows: T[]; emptyText?: string }) {
  return (
    <BlueprintBox style={{ padding: 0, overflowX: "auto" }}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i} style={{ textAlign: c.align === "right" ? "right" : "left", fontFamily: "var(--font-heading)", fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase" }}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((c, i) => (
                <td key={i} style={{ textAlign: c.align === "right" ? "right" : "left" }}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && emptyText ? <div style={{ padding: 26, textAlign: "center", fontSize: 13, opacity: 0.6 }}>{emptyText}</div> : null}
    </BlueprintBox>
  );
}
