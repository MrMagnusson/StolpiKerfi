import { BlueprintBox } from "./Blueprint.js";

export interface StatCardProps {
  label: string;
  value: string;
  note?: string;
  valueSize?: number;
}

/** KPI tile — 5-across grid on Yfirlit/Sölukerfi/Samningar/Reikningagerð. */
export function StatCard({ label, value, note, valueSize = 34 }: StatCardProps) {
  return (
    <BlueprintBox style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", opacity: 0.6 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: valueSize, lineHeight: 1.05 }}>{value}</div>
      {note ? <div style={{ fontSize: 12, opacity: 0.6 }}>{note}</div> : null}
    </BlueprintBox>
  );
}
